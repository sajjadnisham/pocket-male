/* Builds city-data.json for city.html from OpenStreetMap (Overpass API).
 *
 *   node tools/build-city-data.js           (uses tools/.osm-cache if present)
 *   node tools/build-city-data.js --fresh   (re-download from Overpass)
 *
 * Covers Malé and Hulhumalé (with the airport island it is joined to).
 * Local frame in metres around Majeedhee Magu: x = east, z = south.
 * Numbers are stored as integers in decimetres to keep the file small.
 *
 * Map data © OpenStreetMap contributors, ODbL. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BBOX = '(4.1580,73.4940,4.2520,73.5620)';
const LAT0 = 4.1754959, LON0 = 73.5093474;
const MX = 111320 * Math.cos(LAT0 * Math.PI / 180), MZ = 110574;
const toXZ = (lat, lon) => [(lon - LON0) * MX, -(lat - LAT0) * MZ];
const dm = v => Math.round(v * 10);
const ISLANDS = [
  {id:'male',      name:'Malé',      seed:toXZ(4.1754959, 73.5093474)},
  {id:'hulhumale', name:'Hulhumalé', seed:toXZ(4.2114331, 73.5399576)}
];

let seed = 7101;
const rand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ri = n => (rand() * n) | 0;

const CACHE = path.join(__dirname, '.osm-cache');
async function overpass(q){
  const key = crypto.createHash('sha1').update(q).digest('hex').slice(0, 16);
  const cf = path.join(CACHE, key + '.json');
  if (fs.existsSync(cf) && !process.argv.includes('--fresh')) return JSON.parse(fs.readFileSync(cf, 'utf8'));
  for (let attempt = 1; attempt <= 6; attempt++){
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'pocket-male/1.0 (city-data build)'},
      body:'data=' + encodeURIComponent('[out:json][timeout:180];' + q)
    });
    const t = await r.text();
    if (t.trim().startsWith('{')){
      const els = JSON.parse(t).elements;
      fs.mkdirSync(CACHE, {recursive:true}); fs.writeFileSync(cf, JSON.stringify(els));
      return els;
    }
    console.warn('  overpass attempt', attempt, 'returned', r.status, '— retrying');
    await new Promise(res => setTimeout(res, 5000 * attempt));
  }
  throw new Error('Overpass kept failing');
}

/* ---------- geometry ---------- */
function pointInPoly(x, z, pts){ let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside; } return inside; }
function segDist(px, pz, ax, az, bx, bz){ const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / L; t = Math.max(0, Math.min(1, t)); const cx = ax + t * dx, cz = az + t * dz; return [Math.hypot(px - cx, pz - cz), cx, cz]; }
function area(pts){ let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; }
function centroid(pts){ let x = 0, z = 0; for (const p of pts){ x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; }
function simplify(pts, eps){
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  (function rec(a, b){ let idx = -1, max = 0; for (let i = a + 1; i < b; i++){ const d = segDist(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1])[0]; if (d > max){ max = d; idx = i; } } if (max > eps){ keep[idx] = 1; rec(a, idx); rec(idx, b); } })(0, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}
function grid(cell){
  const g = new Map();
  return {
    add(x0, z0, x1, z1, v){ for (let gx = Math.floor(x0 / cell); gx <= Math.floor(x1 / cell); gx++) for (let gz = Math.floor(z0 / cell); gz <= Math.floor(z1 / cell); gz++){ const k = gx + ',' + gz; (g.get(k) || g.set(k, []).get(k)).push(v); } },
    near(x, z, reach){ const out = new Set(), gx = Math.floor(x / cell), gz = Math.floor(z / cell); for (let ox = -reach; ox <= reach; ox++) for (let oz = -reach; oz <= reach; oz++) for (const v of g.get((gx + ox) + ',' + (gz + oz)) || []) out.add(v); return out; }
  };
}

const ROAD_W = {motorway:12, trunk:12, primary:11, secondary:10, tertiary:8, residential:6, unclassified:6, living_street:5,
                service:4, pedestrian:5, footway:2.5, path:2.5, steps:2.5, cycleway:2.5, track:4};
const SIGN_COUNT = 24, AWNING_COUNT = 8, SCOOTER_COLORS = 8;

(async () => {
  console.log('fetching coastline…');  const coast = await overpass('way["natural"="coastline"]' + BBOX + ';out geom;');
  console.log('fetching roads…');      const roadsRaw = await overpass('way["highway"]' + BBOX + ';out geom tags;');
  console.log('fetching buildings…');  const bldRaw = await overpass('way["building"]' + BBOX + ';out geom tags;');
  console.log('fetching parks…');      const parkRaw = await overpass('(way["leisure"~"^(park|playground|pitch|garden)$"]' + BBOX + ';way["landuse"~"^(grass|recreation_ground)$"]' + BBOX + ';);out geom;');
  console.log('fetching airport…');    const aeroRaw = await overpass('way["aeroway"~"^(aerodrome|runway|taxiway|apron)$"]' + BBOX + ';out geom tags;');
  console.log('fetching places…');     const poiRaw = await overpass('(nwr["amenity"~"^(marketplace|ferry_terminal|pharmacy|bank|hospital|bus_station|cafe|restaurant|taxi|place_of_worship)$"]' + BBOX
    + ';nwr["shop"~"^(convenience|supermarket|mobile_phone|hairdresser)$"]' + BBOX + ';nwr["highway"="bus_stop"]' + BBOX + ';);out tags center;');

  /* ---------- island rings ---------- */
  const chains = coast.map(w => ({nodes:w.nodes.slice(), pts:w.geometry.map(g => toXZ(g.lat, g.lon))}));
  let merged = true;
  while (merged){
    merged = false;
    outer: for (const a of chains){
      if (!a.nodes.length || a.nodes[0] === a.nodes[a.nodes.length - 1]) continue;
      for (const b of chains){
        if (a === b || !b.nodes.length) continue;
        if (a.nodes[a.nodes.length - 1] === b.nodes[0]){ a.nodes = a.nodes.concat(b.nodes.slice(1)); a.pts = a.pts.concat(b.pts.slice(1)); b.nodes = []; b.pts = []; merged = true; break outer; }
      }
    }
  }
  const rings = chains.filter(c => c.pts.length > 10);
  const islands = ISLANDS.map(I => {
    const r = rings.find(rr => pointInPoly(I.seed[0], I.seed[1], rr.pts));
    if (!r) throw new Error('no coastline ring for ' + I.id);
    return Object.assign({}, I, {ring:simplify(r.pts, .8)});
  });
  const islandOf = (x, z) => { for (const I of islands) if (pointInPoly(x, z, I.ring)) return I.id; return null; };
  islands.forEach(I => console.log('  ring', I.id, I.ring.length, 'points'));

  /* ---------- aeroways ---------- */
  const aerodromes = [], runways = [];
  for (const w of aeroRaw){
    const pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    const kind = w.tags.aeroway;
    if (kind === 'aerodrome' || kind === 'apron'){ if (pts.length > 3) aerodromes.push({kind, pts}); }
    else runways.push({w:parseFloat(w.tags.width) || (kind === 'runway' ? 45 : 22), pts:simplify(pts, 1)});
  }
  const inAerodrome = (x, z) => aerodromes.some(a => a.kind === 'aerodrome' && pointInPoly(x, z, a.pts));

  /* ---------- roads (island roads + bridges) ---------- */
  const roads = [], segs = [], named = {}, byName = {};
  for (const w of roadsRaw){
    const hw = w.tags.highway, width = ROAD_W[hw]; if (!width) continue;
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    const bridge = w.tags.bridge === 'yes' && width >= 6;
    const isl = pts.map(p => islandOf(p[0], p[1])).find(Boolean);
    if (!isl && !bridge) continue;
    pts = simplify(pts, .5);
    roads.push([dm(width), bridge ? 1 : 0, ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
    for (let i = 1; i < pts.length; i++) segs.push({ax:pts[i - 1][0], az:pts[i - 1][1], bx:pts[i][0], bz:pts[i][1], w:width, bridge});
    const nm = w.tags['name:en'] || w.tags.name;
    if (nm && width >= 5){
      (byName[nm] = byName[nm] || {isl, parts:[]}).parts.push(pts);
      let best = null;
      for (let i = 1; i < pts.length; i++){ const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (!best || L > best.L) best = {L, x:(pts[i][0] + pts[i - 1][0]) / 2, z:(pts[i][1] + pts[i - 1][1]) / 2, a:Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])}; }
      if (best && best.L > 25 && (!named[nm] || named[nm].L < best.L)) named[nm] = best;
    }
  }
  const segGrid = grid(20);
  segs.forEach((s, i) => segGrid.add(Math.min(s.ax, s.bx) - 8, Math.min(s.az, s.bz) - 8, Math.max(s.ax, s.bx) + 8, Math.max(s.az, s.bz) + 8, i));
  function nearRoad(x, z, reach, minW){
    let best = {d:Infinity, clear:Infinity};
    for (const i of segGrid.near(x, z, reach || 0)){
      const s = segs[i]; if (minW && s.w < minW) continue;
      const [d, cx, cz] = segDist(x, z, s.ax, s.az, s.bx, s.bz), clear = d - s.w / 2;
      if (clear < best.clear) best = {d, cx, cz, clear, w:s.w, sdx:s.bx - s.ax, sdz:s.bz - s.az};
    }
    return best;
  }

  /* ---------- mapped buildings ---------- */
  const buildings = [], solids = [];
  const solidGrid = grid(25);
  for (const w of bldRaw){
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    const [cx, cz] = centroid(pts);
    const isl = islandOf(cx, cz);
    if (pts.length < 3 || !isl) continue;
    pts = simplify(pts.concat([pts[0]]), .3); pts.pop();
    if (pts.length < 3 || Math.abs(area(pts)) < 12) continue;
    let lv = parseFloat(w.tags['building:levels']); if (!(lv > 0)) lv = parseFloat(w.tags.height) / 3.2;
    const tagged = lv > 0;
    const kind = w.tags.building;
    if (!tagged) lv = (kind === 'roof' || kind === 'shed' || kind === 'hangar') ? 1 : (isl === 'hulhumale' ? 4 + ri(9) : 3 + ri(7));
    lv = Math.max(1, Math.min(30, Math.round(lv)));
    const idx = solids.length;
    solids.push({pts, cx, cz, lv, isl, shops: lv >= 3 && kind !== 'roof' && kind !== 'hangar'});
    buildings.push([lv, tagged ? 1 : 0, ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    solidGrid.add(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), idx);
  }
  const mappedCount = solids.length;
  const inSolid = (x, z) => { for (const i of solidGrid.near(x, z, 0)){ const s = solids[i]; if (pointInPoly(x, z, s.pts)) return true; } return false; };
  const nearMapped = (x, z, r) => { for (const i of solidGrid.near(x, z, Math.ceil(r / 25))){ const s = solids[i]; if (i < mappedCount && Math.hypot(s.cx - x, s.cz - z) < r) return true; } return false; };
  const parks = parkRaw.map(w => w.geometry.map(g => toXZ(g.lat, g.lon))).filter(p => p.length > 3 && p.some(q => islandOf(q[0], q[1])));
  const inPark = (x, z) => parks.some(p => pointInPoly(x, z, p));

  /* ---------- filler blocks, only inside built-up areas ---------- */
  const CELL = 9, fill = [];
  for (const I of islands){
    const xs = I.ring.map(p => p[0]), zs = I.ring.map(p => p[1]);
    for (let z = Math.min(...zs); z < Math.max(...zs); z += CELL){
      let run = null;
      for (let x = Math.min(...xs); x < Math.max(...xs); x += CELL){
        const cx = x + CELL / 2, cz = z + CELL / 2;
        let ok = pointInPoly(cx, cz, I.ring);
        if (ok) for (const [ox, oz] of [[-12, 0], [12, 0], [0, -12], [0, 12]]) if (!pointInPoly(cx + ox, cz + oz, I.ring)){ ok = false; break; }
        if (ok && nearRoad(cx, cz, 1).clear < CELL / 2 + 3.2) ok = false;
        if (ok && (inSolid(cx, cz) || inSolid(x + 1, z + 1) || inSolid(x + CELL - 1, z + 1) || inSolid(x + 1, z + CELL - 1) || inSolid(x + CELL - 1, z + CELL - 1))) ok = false;
        if (ok && (inPark(cx, cz) || inAerodrome(cx, cz))) ok = false;
        if (ok && !nearMapped(cx, cz, I.id === 'male' ? 90 : 32)) ok = false;   // Hulhumalé still has open reclaimed land
        if (ok){
          if (run && run.n < 1 + ri(3)) run.n++;
          else { if (run) fill.push(run); run = {x, z, n:1, lv: rand() < .1 ? 10 + ri(5) : 3 + ri(7), isl:I.id}; }
        } else if (run){ fill.push(run); run = null; }
      }
      if (run) fill.push(run);
    }
  }
  for (const r of fill){
    const w = r.n * CELL - 1, d = CELL - 1, pts = [[r.x + .5, r.z + .5], [r.x + .5 + w, r.z + .5], [r.x + .5 + w, r.z + .5 + d], [r.x + .5, r.z + .5 + d]];
    const idx = solids.length;
    solids.push({pts, cx:r.x + .5 + w / 2, cz:r.z + .5 + d / 2, lv:r.lv, isl:r.isl, shops:true});
    solidGrid.add(pts[0][0], pts[0][1], pts[2][0], pts[2][1], idx);
  }

  /* ---------- ground-floor shop units on street-facing walls ---------- */
  const units = [];
  const scooters = [];
  for (const s of solids){
    if (!s.shops) continue;
    const n = s.pts.length;
    for (let i = 0; i < n; i++){
      const [ax, az] = s.pts[i], [bx, bz] = s.pts[(i + 1) % n];
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      if (len < 4) continue;
      let nx = -dz / len, nz = dx / len;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (nx * (mx - s.cx) + nz * (mz - s.cz) < 0){ nx = -nx; nz = -nz; }
      const px = mx + nx * 3, pz = mz + nz * 3;
      if (inSolid(px, pz)) continue;                          // wall faces another building
      const r = nearRoad(px, pz, 1, 4);
      if (!isFinite(r.d) || r.clear > 7) continue;             // no street in front
      const sl = Math.hypot(r.sdx, r.sdz) || 1;
      if (Math.abs((dx * r.sdx + dz * r.sdz) / (len * sl)) < .75) continue;   // wall not parallel to the street
      const count = Math.max(1, Math.floor(len / 5.2)), uw = len / count;
      for (let k = 0; k < count; k++){
        const t = (k + .5) / count, ux = ax + dx * t, uz = az + dz * t;
        units.push({x:ux, z:uz, nx, nz, w:uw, sign:ri(SIGN_COUNT), awn:ri(AWNING_COUNT), road:r, isl:s.isl});
        // a short row of scooters on the kerb in front of about half the shops
        if (r.w >= 5 && rand() < .3){
          const ucx = r.cx, ucz = r.cz, vx = px - ucx, vz = pz - ucz, vl = Math.hypot(vx, vz) || 1;
          const kerbX = ucx + vx / vl * (r.w / 2 - .75), kerbZ = ucz + vz / vl * (r.w / 2 - .75);
          const ang = Math.atan2(vz, vx), along = [r.sdx / sl, r.sdz / sl], rows = 2 + ri(3);
          for (let q = 0; q < rows; q++){
            const off = (q - (rows - 1) / 2) * .82;
            scooters.push([dm(kerbX + along[0] * off), dm(kerbZ + along[1] * off), Math.round((ang + (rand() - .5) * .25) * 1000), ri(SCOOTER_COLORS)]);
          }
        }
      }
    }
  }

  /* ---------- places for the situations, snapped to a real shopfront ---------- */
  const pois = poiRaw.map(e => {
    const lat = e.lat != null ? e.lat : e.center && e.center.lat, lon = e.lon != null ? e.lon : e.center && e.center.lon;
    if (lat == null) return null;
    const [x, z] = toXZ(lat, lon), isl = islandOf(x, z);
    return isl ? {x, z, isl, tags:e.tags, kind:e.tags.amenity || e.tags.shop || e.tags.highway} : null;
  }).filter(Boolean);
  const usedUnits = new Set(), usedPoi = new Set();
  const near = (arr, x, z) => arr.slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const kindIn = (isl, ...k) => pois.filter(p => p.isl === isl && k.includes(p.kind));
  const named1 = (isl, k, re) => kindIn(isl, k).find(p => re.test(p.tags.name || '') || re.test(p.tags['name:en'] || ''));
  const pick = (cands, x, z) => { const c = cands.filter(p => !usedPoi.has(p)); const p = near(c.length ? c : cands, x, z); if (p) usedPoi.add(p); return p; };
  function snap(key, sit, p, realName){
    if (!p){ console.warn('  no OSM place for', key); return null; }
    let best = null, bd = Infinity;
    for (let i = 0; i < units.length; i++){
      if (usedUnits.has(i)) continue;
      const u = units[i]; if (u.isl !== p.isl) continue;
      const d = Math.hypot(u.x - p.x, u.z - p.z); if (d < bd){ bd = d; best = i; }
    }
    if (best == null || bd > 160){ console.warn('  no shopfront near', key); return null; }
    usedUnits.add(best);
    const u = units[best];
    const ex = u.x + u.nx * 2.6, ez = u.z + u.nz * 2.6;
    return {key, sit, isl:p.isl, ux:+u.x.toFixed(2), uz:+u.z.toFixed(2), nx:+u.nx.toFixed(3), nz:+u.nz.toFixed(3), uw:+u.w.toFixed(2),
            ex:+ex.toFixed(2), ez:+ez.toFixed(2), yaw:+Math.atan2(u.nx, u.nz).toFixed(3), snapped:Math.round(bd), realName:realName || null, unit:best};
  }
  const places = [];
  const add = pl => { if (pl) places.push(pl); };
  const M = 'male', H = 'hulhumale';
  const locMarket = named1(M, 'marketplace', /local market/i), fishMarket = named1(M, 'marketplace', /fish market/i);
  const igmh = named1(M, 'hospital', /indira gandhi/i) || kindIn(M, 'hospital')[0];
  const busT = named1(M, 'bus_station', /terminal/i) || kindIn(M, 'bus_station')[0];
  const ferry = named1(M, 'ferry_terminal', /hulhum|vili|villing/i) || near(kindIn(M, 'ferry_terminal'), 0, 0);
  const bml = near(kindIn(M, 'bank').filter(p => /bank of maldives/i.test(p.tags.name || '')), locMarket ? locMarket.x : 0, locMarket ? locMarket.z : 0);
  add(snap('market', 'market', fishMarket, 'Fish Market'));
  add(snap('kurumba', 'kurumba', locMarket, 'Local Market'));
  add(snap('clinic', 'clinic', igmh, 'IGMH'));
  add(snap('bus', 'bus', busT, 'Bus terminal'));
  add(snap('ferry', 'ferry', ferry, 'Ferry terminal'));
  add(snap('bank', 'bank', bml));
  add(snap('pharmacy', 'pharmacy', igmh && pick(kindIn(M, 'pharmacy'), igmh.x, igmh.z)));
  add(snap('teashop', 'teashop', pick(kindIn(M, 'cafe'), 0, 0)));
  add(snap('restaurant', 'restaurant', pick(kindIn(M, 'restaurant'), 40, 10)));
  add(snap('shop', 'shop', pick(kindIn(M, 'convenience', 'supermarket'), -30, 20)));
  add(snap('phone', 'phone', pick(kindIn(M, 'mobile_phone'), 10, 0)));
  add(snap('barber', 'barber', pick(kindIn(M, 'hairdresser'), -20, -10)));
  add(snap('taxi', 'taxi', pick(kindIn(M, 'taxi'), 0, 0) || {x:-60, z:10, isl:M, tags:{}}));
  add(snap('landlord', 'landlord', {x:toXZ(4.1745498, 73.5108431)[0] + 18, z:toXZ(4.1745498, 73.5108431)[1] + 22, isl:M, tags:{}}));
  // Hulhumalé
  const hc = islands[1].seed;
  add(snap('h-teashop', 'teashop', pick(kindIn(H, 'cafe'), hc[0], hc[1]) || {x:hc[0], z:hc[1], isl:H, tags:{}}));
  add(snap('h-restaurant', 'restaurant', pick(kindIn(H, 'restaurant'), hc[0] + 60, hc[1]) || {x:hc[0] + 60, z:hc[1], isl:H, tags:{}}));
  add(snap('h-shop', 'shop', pick(kindIn(H, 'convenience', 'supermarket'), hc[0], hc[1] + 80) || {x:hc[0], z:hc[1] + 80, isl:H, tags:{}}));
  add(snap('h-pharmacy', 'pharmacy', pick(kindIn(H, 'pharmacy'), hc[0], hc[1]) || {x:hc[0] - 50, z:hc[1], isl:H, tags:{}}));
  add(snap('h-bus', 'bus', pick(kindIn(H, 'bus_stop', 'bus_station'), hc[0], hc[1]) || {x:hc[0] + 30, z:hc[1] + 30, isl:H, tags:{}}, 'Bus stop'));

  /* ---------- bus routes: the longest named main streets on each island ---------- */
  function chainParts(parts){
    let lines = parts.map(p => p.slice());
    let joined = true;
    while (joined){
      joined = false;
      outer: for (let i = 0; i < lines.length; i++) for (let j = 0; j < lines.length; j++){
        if (i === j) continue;
        const a = lines[i], b = lines[j], ae = a[a.length - 1], as = a[0], bs = b[0], be = b[b.length - 1];
        const close = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 4;
        let nl = null;
        if (close(ae, bs)) nl = a.concat(b.slice(1));
        else if (close(ae, be)) nl = a.concat(b.slice().reverse().slice(1));
        else if (close(as, be)) nl = b.concat(a.slice(1));
        else if (close(as, bs)) nl = b.slice().reverse().concat(a.slice(1));
        if (nl){ lines[i] = nl; lines.splice(j, 1); joined = true; break outer; }
      }
    }
    const len = l => l.reduce((s, p, k) => k ? s + Math.hypot(p[0] - l[k - 1][0], p[1] - l[k - 1][1]) : 0, 0);
    return lines.map(l => ({pts:l, L:len(l)})).sort((a, b) => b.L - a.L)[0];
  }
  const routes = [];
  for (const I of islands){
    const cands = Object.entries(byName).filter(([, v]) => v.isl === I.id).map(([name, v]) => Object.assign({name}, chainParts(v.parts))).filter(c => c.L > 350).sort((a, b) => b.L - a.L);
    for (const c of cands.slice(0, 2)) routes.push({name:c.name, isl:I.id, L:Math.round(c.L), pts:simplify(c.pts, 1).flatMap(p => [dm(p[0]), dm(p[1])])});
  }

  const mosques = kindIn(M, 'place_of_worship').concat(kindIn(H, 'place_of_worship')).map(p => ({x:dm(p.x) / 10, z:dm(p.z) / 10, big:/auzam|islamic cent|grand friday/i.test((p.tags.name || '') + (p.tags['name:en'] || '')) ? 1 : 0}));
  const labels = Object.entries(named).filter(([, v]) => v.L > 40).map(([n, v]) => [n, dm(v.x), dm(v.z), +v.a.toFixed(3)]);

  const out = {
    about:'Malé and Hulhumalé, Maldives. OpenStreetMap coastline, streets, buildings and places in local decimetres (x east, z south) around ' + LAT0 + ',' + LON0 + '. Blocks OSM does not map are filled with generic buildings; shopfronts, scooters and bus routes are generated from the street layout.',
    attribution:'© OpenStreetMap contributors, ODbL', built:new Date().toISOString().slice(0, 10),
    origin:[LAT0, LON0], scale:[MX, MZ],
    islands: islands.map(I => ({id:I.id, name:I.name, ring:I.ring.flatMap(p => [dm(p[0]), dm(p[1])]), seed:[+I.seed[0].toFixed(1), +I.seed[1].toFixed(1)]})),
    roads, buildings,
    fill: fill.map(r => [dm(r.x + .5), dm(r.z + .5), dm(r.n * CELL - 1), dm(CELL - 1), r.lv]),
    parks: parks.map(p => simplify(p, .5).flatMap(q => [dm(q[0]), dm(q[1])])),
    runways: runways.map(r => [dm(r.w), ...r.pts.flatMap(p => [dm(p[0]), dm(p[1])])]),
    units: units.map(u => [dm(u.x), dm(u.z), Math.round(u.nx * 1000), Math.round(u.nz * 1000), dm(u.w), u.sign, u.awn]),
    scooters, routes, places, mosques, labels
  };
  const file = path.join(__dirname, '..', 'city-data.json');
  fs.writeFileSync(file, JSON.stringify(out));
  const perIsl = id => ({b:solids.filter(s => s.isl === id).length, u:units.filter(u => u.isl === id).length});
  console.log('\nroads', roads.length, '(bridges', roads.filter(r => r[1]).length + ')', '| mapped buildings', buildings.length, '| filler', fill.length, '| shop units', units.length, '| scooters', scooters.length, '| routes', routes.length, '| mosques', mosques.length);
  for (const I of islands){ const s = perIsl(I.id); console.log('  ', I.id.padEnd(10), 'buildings+filler', s.b, '| shop units', s.u); }
  console.log('routes:', routes.map(r => r.isl + ':' + r.name + ' ' + r.L + 'm').join(' · '));
  console.log('places:'); places.forEach(p => console.log('  ', p.key.padEnd(13), p.isl.padEnd(10), 'snapped', String(p.snapped).padStart(3) + 'm', p.realName ? '— ' + p.realName : ''));
  console.log('\nwrote city-data.json', (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
