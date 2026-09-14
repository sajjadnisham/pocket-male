/* Builds city-data.json for city.html from OpenStreetMap (Overpass API).
 *
 *   node tools/build-city-data.js           (uses tools/.osm-cache if present)
 *   node tools/build-city-data.js --fresh   (re-download from Overpass)
 *
 * Covers Malé and Hulhumalé (with the airport island it is joined to) and the
 * Sinamalé Bridge between them. Local frame in metres around Majeedhee Magu:
 * x = east, z = south. Coordinates are stored as integer decimetres.
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
  for (let attempt = 1; attempt <= 8; attempt++){
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
    await new Promise(res => setTimeout(res, 6000 * attempt));
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
const polyLen = pts => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);

const ROAD_W = {motorway:12, trunk:12, primary:11, primary_link:8, secondary:10, secondary_link:7, tertiary:8, tertiary_link:6, residential:6, unclassified:6, living_street:5,
                service:4, pedestrian:5, footway:2.5, path:2.5, steps:2.5, cycleway:2.5, track:4};
const DRIVABLE = new Set(['trunk', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential', 'unclassified', 'living_street', 'service']);
// Only the outer ring roads and main avenues are tarred; the rest of Malé is interlocking pavers.
const TAR_NAME = /boduthakurufaanu|midhili|airport main|nirolhu magu$|sinamal|ސިނަމާލެ/i;
const SIGN_COUNT = 24, AWNING_COUNT = 8, SCOOTER_COLORS = 8;

(async () => {
  console.log('fetching coastline…');  const coast = await overpass('way["natural"="coastline"]' + BBOX + ';out geom;');
  console.log('fetching roads…');      const roadsRaw = await overpass('way["highway"]' + BBOX + ';out geom tags;');
  console.log('fetching buildings…');  const bldRaw = await overpass('way["building"]' + BBOX + ';out geom tags;');
  console.log('fetching parks…');      const parkRaw = await overpass('(way["leisure"~"^(park|playground|pitch|garden)$"]' + BBOX + ';way["landuse"~"^(grass|recreation_ground)$"]' + BBOX + ';);out geom;');
  console.log('fetching airport…');    const aeroRaw = await overpass('way["aeroway"~"^(aerodrome|runway|taxiway|apron)$"]' + BBOX + ';out geom tags;');
  console.log('fetching businesses…'); const poiRaw = await overpass(
    '(nwr["amenity"~"^(marketplace|ferry_terminal|pharmacy|bank|hospital|clinic|doctors|bus_station|cafe|restaurant|fast_food|taxi|place_of_worship)$"]' + BBOX +
    ';nwr["shop"~"^(convenience|supermarket|general|mobile_phone|electronics|hairdresser|beauty|bakery|tailor|clothes|laundry|dry_cleaning|motorcycle|motorcycle_repair|car_repair)$"]' + BBOX +
    ';nwr["office"]' + BBOX + ';nwr["craft"~"^(tailor|dressmaker)$"]' + BBOX + ';nwr["tourism"~"^(guest_house|hotel)$"]' + BBOX +
    ';nwr["highway"="bus_stop"]' + BBOX + ';);out tags center;');

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

  /* ---------- aeroways ---------- */
  const aerodromes = [], runways = [];
  for (const w of aeroRaw){
    const pts = w.geometry.map(g => toXZ(g.lat, g.lon)), kind = w.tags.aeroway;
    if (kind === 'aerodrome' || kind === 'apron'){ if (pts.length > 3) aerodromes.push({kind, pts}); }
    else runways.push({w:parseFloat(w.tags.width) || (kind === 'runway' ? 45 : 22), pts:simplify(pts, 1)});
  }
  const inAerodrome = (x, z) => aerodromes.some(a => a.kind === 'aerodrome' && pointInPoly(x, z, a.pts));

  /* ---------- roads: surface, bridge, labels ---------- */
  const roads = [], segs = [], named = {}, byName = {};
  const keptWays = [];
  let bridgeWay = null;
  for (const w of roadsRaw){
    const hw = w.tags.highway, width = ROAD_W[hw]; if (!width) continue;
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    const nm = w.tags['name:en'] || w.tags.name || '';
    const isMainBridge = !!w.tags.bridge && w.tags.bridge !== 'no' && /sinamal/i.test((w.tags['name:en'] || '') + (w.tags.old_name || '') + (w.tags['name:de'] || ''));
    const isl = pts.map(p => islandOf(p[0], p[1])).find(Boolean);
    if (!isl && !isMainBridge) continue;
    const tar = isMainBridge || TAR_NAME.test(nm) || hw === 'trunk' || hw === 'primary' || hw === 'primary_link';
    keptWays.push({w, pts, width, tar, bridge:isMainBridge, isl, hw});
    if (isMainBridge && (!bridgeWay || polyLen(pts) > polyLen(bridgeWay))) bridgeWay = pts;
    const sp = simplify(pts, .5);
    roads.push([dm(width), (isMainBridge ? 1 : 0) | (tar ? 2 : 0), ...sp.flatMap(p => [dm(p[0]), dm(p[1])])]);
    for (let i = 1; i < sp.length; i++) segs.push({ax:sp[i - 1][0], az:sp[i - 1][1], bx:sp[i][0], bz:sp[i][1], w:width});
    if (nm && width >= 5 && !isMainBridge){
      (byName[nm] = byName[nm] || {isl, parts:[]}).parts.push(sp);
      let best = null;
      for (let i = 1; i < sp.length; i++){ const L = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); if (!best || L > best.L) best = {L, x:(sp[i][0] + sp[i - 1][0]) / 2, z:(sp[i][1] + sp[i - 1][1]) / 2, a:Math.atan2(sp[i][1] - sp[i - 1][1], sp[i][0] - sp[i - 1][0])}; }
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

  /* ---------- drivable network for traffic (split at shared OSM nodes) ---------- */
  const nodeUse = new Map();
  const drive = keptWays.filter(k => DRIVABLE.has(k.hw) && !/parking_aisle|driveway/.test(k.w.tags.service || ''));
  for (const k of drive) k.ids = k.w.geometry.map(g => g.lat.toFixed(7) + ',' + g.lon.toFixed(7));
  for (const k of drive) k.ids.forEach((n, i) => nodeUse.set(n, (nodeUse.get(n) || 0) + (i === 0 || i === k.ids.length - 1 ? 2 : 1)));
  const nodeIdx = new Map(), gNodes = [], gEdges = [];
  const nIndex = (id, p) => { if (!nodeIdx.has(id)){ nodeIdx.set(id, gNodes.length); gNodes.push(p); } return nodeIdx.get(id); };
  for (const k of drive){
    const ids = k.ids; let start = 0;
    const oneway = k.w.tags.oneway === 'yes';
    for (let i = 1; i < ids.length; i++){
      if (i === ids.length - 1 || nodeUse.get(ids[i]) >= 2){
        const pts = simplify(k.pts.slice(start, i + 1), .6);
        if (polyLen(pts) > 1){
          const a = nIndex(ids[start], k.pts[start]), b = nIndex(ids[i], k.pts[i]);
          gEdges.push([a, b, dm(k.width), (k.bridge ? 1 : 0) | (k.tar ? 2 : 0) | (oneway ? 4 : 0), ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
        }
        start = i;
      }
    }
  }

  /* ---------- mapped buildings ---------- */
  const buildings = [], solids = [];
  const solidGrid = grid(25);
  for (const w of bldRaw){
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    const [cx, cz] = centroid(pts), isl = islandOf(cx, cz);
    if (pts.length < 3 || !isl) continue;
    pts = simplify(pts.concat([pts[0]]), .3); pts.pop();
    if (pts.length < 3 || Math.abs(area(pts)) < 12) continue;
    let lv = parseFloat(w.tags['building:levels']); if (!(lv > 0)) lv = parseFloat(w.tags.height) / 3.2;
    const tagged = lv > 0, kind = w.tags.building;
    if (!tagged) lv = (kind === 'roof' || kind === 'shed' || kind === 'hangar') ? 1 : (isl === 'hulhumale' ? 4 + ri(9) : 3 + ri(7));
    lv = Math.max(1, Math.min(30, Math.round(lv)));
    const idx = solids.length;
    solids.push({pts, cx, cz, lv, isl, shops: lv >= 3 && kind !== 'roof' && kind !== 'hangar' && kind !== 'mosque'});
    buildings.push([lv, tagged ? 1 : 0, ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    solidGrid.add(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), idx);
  }
  const mappedCount = solids.length;
  const inSolid = (x, z) => { for (const i of solidGrid.near(x, z, 0)){ if (pointInPoly(x, z, solids[i].pts)) return true; } return false; };
  const nearMapped = (x, z, r) => { for (const i of solidGrid.near(x, z, Math.ceil(r / 25))){ const s = solids[i]; if (i < mappedCount && Math.hypot(s.cx - x, s.cz - z) < r) return true; } return false; };
  const parks = parkRaw.map(w => w.geometry.map(g => toXZ(g.lat, g.lon))).filter(p => p.length > 3 && p.some(q => islandOf(q[0], q[1])));
  const inPark = (x, z) => parks.some(p => pointInPoly(x, z, p));

  /* ---------- filler blocks inside built-up areas ---------- */
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
        if (ok && !nearMapped(cx, cz, I.id === 'male' ? 90 : 32)) ok = false;
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
  const units = [], scooters = [];
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
      if (inSolid(px, pz)) continue;
      const r = nearRoad(px, pz, 1, 4);
      if (!isFinite(r.d) || r.clear > 7) continue;
      const sl = Math.hypot(r.sdx, r.sdz) || 1;
      if (Math.abs((dx * r.sdx + dz * r.sdz) / (len * sl)) < .75) continue;
      const count = Math.max(1, Math.floor(len / 5.2)), uw = len / count;
      for (let k = 0; k < count; k++){
        const t = (k + .5) / count, ux = ax + dx * t, uz = az + dz * t;
        units.push({x:ux, z:uz, nx, nz, w:uw, sign:ri(SIGN_COUNT), awn:ri(AWNING_COUNT), road:r, isl:s.isl});
        if (r.w >= 5 && rand() < .28){
          const vx = px - r.cx, vz = pz - r.cz, vl = Math.hypot(vx, vz) || 1;
          const kerbX = r.cx + vx / vl * (r.w / 2 - .75), kerbZ = r.cz + vz / vl * (r.w / 2 - .75);
          const ang = Math.atan2(vz, vx), along = [r.sdx / sl, r.sdz / sl], rows = 2 + ri(3);
          for (let q = 0; q < rows; q++){
            const off = (q - (rows - 1) / 2) * .82;
            scooters.push([dm(kerbX + along[0] * off), dm(kerbZ + along[1] * off), Math.round((ang + (rand() - .5) * .25) * 1000), ri(SCOOTER_COLORS)]);
          }
        }
      }
    }
  }
  const unitGrid = grid(30);
  units.forEach((u, i) => unitGrid.add(u.x, u.z, u.x, u.z, i));

  /* ---------- situations: every mapped business becomes an enterable shop ---------- */
  const SIT_OF = t => {
    const a = t.amenity, s = t.shop, o = t.office, c = t.craft, tr = t.tourism, h = t.highway;
    if (a === 'cafe') return 'teashop';
    if (a === 'restaurant' || a === 'fast_food') return 'restaurant';
    if (/^(convenience|supermarket|general)$/.test(s || '')) return 'shop';
    if (/^(mobile_phone|electronics)$/.test(s || '')) return 'phone';
    if (/^(hairdresser|beauty)$/.test(s || '')) return 'barber';
    if (s === 'bakery') return 'bakery';
    if (/^(tailor|clothes)$/.test(s || '') || /^(tailor|dressmaker)$/.test(c || '')) return 'tailor';
    if (/^(laundry|dry_cleaning)$/.test(s || '')) return 'laundry';
    if (/^(motorcycle|motorcycle_repair|car_repair)$/.test(s || '')) return 'garage';
    if (a === 'bank') return 'bank';
    if (a === 'pharmacy') return 'pharmacy';
    if (/^(hospital|clinic|doctors)$/.test(a || '')) return 'clinic';
    if (a === 'place_of_worship') return 'mosque';
    if (a === 'marketplace') return /fish/i.test(t.name || '') ? 'market' : 'kurumba';
    if (a === 'ferry_terminal') return 'ferry';
    if (a === 'bus_station' || h === 'bus_stop') return 'bus';
    if (a === 'taxi') return 'taxi';
    if (tr === 'guest_house' || tr === 'hotel') return 'guesthouse';
    if (o) return 'office';
    return null;
  };
  const PUBLIC = new Set(['mosque', 'market', 'kurumba', 'ferry', 'bus', 'clinic']);   // names shown; businesses stay unnamed
  const usedUnits = new Set(), places = [];
  const pois = poiRaw.map(e => {
    const lat = e.lat != null ? e.lat : e.center && e.center.lat, lon = e.lon != null ? e.lon : e.center && e.center.lon;
    if (lat == null) return null;
    const [x, z] = toXZ(lat, lon), isl = islandOf(x, z), sit = SIT_OF(e.tags);
    return isl && sit ? {x, z, isl, sit, tags:e.tags} : null;
  }).filter(Boolean);
  const nameOf = t => t['name:en'] || t.name || null;

  function placeAtUnit(i, sit, realName, isl){
    usedUnits.add(i);
    const u = units[i], ex = u.x + u.nx * 2.6, ez = u.z + u.nz * 2.6;
    places.push({sit, isl:isl || u.isl, kind:'shop', ux:+u.x.toFixed(2), uz:+u.z.toFixed(2), nx:+u.nx.toFixed(3), nz:+u.nz.toFixed(3), uw:+u.w.toFixed(2),
                 ex:+ex.toFixed(2), ez:+ez.toFixed(2), yaw:+Math.atan2(u.nx, u.nz).toFixed(3), name:realName || null, unit:i});
  }
  function nearestFreeUnit(x, z, isl, maxD){
    let best = null, bd = maxD;
    for (const i of unitGrid.near(x, z, Math.ceil(maxD / 30))){
      if (usedUnits.has(i) || units[i].isl !== isl) continue;
      const d = Math.hypot(units[i].x - x, units[i].z - z); if (d < bd){ bd = d; best = i; }
    }
    return best;
  }
  // mosques stand in their own buildings: the entrance is the nearest street in front
  const mosqueSeen = [];
  for (const p of pois.filter(q => q.sit === 'mosque')){
    if (mosqueSeen.some(m => Math.hypot(m[0] - p.x, m[1] - p.z) < 25)) continue;
    mosqueSeen.push([p.x, p.z]);
    const r = nearRoad(p.x, p.z, 3, 4); if (!isFinite(r.d)) continue;
    const d = r.d || 1, nx = (r.cx - p.x) / d, nz = (r.cz - p.z) / d;
    const ex = r.cx - nx * Math.min(r.w / 2 - .5, 2), ez = r.cz - nz * Math.min(r.w / 2 - .5, 2);
    places.push({sit:'mosque', isl:p.isl, kind:'building', ux:+p.x.toFixed(2), uz:+p.z.toFixed(2), nx:+nx.toFixed(3), nz:+nz.toFixed(3), uw:4,
                 ex:+ex.toFixed(2), ez:+ez.toFixed(2), yaw:+Math.atan2(nx, nz).toFixed(3), name:nameOf(p.tags), big:/auzam|islamic cent|grand friday|hukuru/i.test(nameOf(p.tags) || '') ? 1 : 0});
  }
  for (const p of pois){
    if (p.sit === 'mosque') continue;
    if (p.tags.highway === 'bus_stop' && places.some(q => q.sit === 'bus' && Math.hypot(q.ux - p.x, q.uz - p.z) < 350)) continue;
    const i = nearestFreeUnit(p.x, p.z, p.isl, p.sit === 'bus' || p.sit === 'ferry' ? 120 : 70);
    if (i == null) continue;
    placeAtUnit(i, p.sit, PUBLIC.has(p.sit) ? nameOf(p.tags) : null);
  }
  // make sure every situation exists on both islands, spread across town
  const MIN = {male:{laundry:10, tailor:10, garage:12, bakery:8, office:10, guesthouse:4, landlord:8, taxi:4, phone:8, barber:8, bank:5, pharmacy:6, shop:25, teashop:20, restaurant:15, clinic:3, kurumba:3, market:1, ferry:1, bus:2},
               hulhumale:{laundry:5, tailor:5, garage:6, bakery:5, office:6, guesthouse:12, landlord:6, taxi:3, phone:5, barber:5, bank:3, pharmacy:4, shop:15, teashop:12, restaurant:12, clinic:2, kurumba:2, market:1, ferry:1, bus:4}};
  for (const isl of Object.keys(MIN)){
    const pool = units.map((u, i) => i).filter(i => units[i].isl === isl && !usedUnits.has(i) && units[i].road.w >= 5);
    for (let k = pool.length - 1; k > 0; k--){ const j = ri(k + 1); [pool[k], pool[j]] = [pool[j], pool[k]]; }
    for (const [sit, n] of Object.entries(MIN[isl])){
      let have = places.filter(p => p.isl === isl && p.sit === sit).length;
      while (have < n && pool.length){
        const i = pool.pop();
        if (places.some(p => Math.hypot(p.ux - units[i].x, p.uz - units[i].z) < 12)) continue;
        placeAtUnit(i, sit, null, isl); have++;
      }
    }
  }

  /* ---------- bus routes on main streets ---------- */
  function chainParts(parts){
    let lines = parts.map(p => p.slice()), joined = true;
    while (joined){
      joined = false;
      outer: for (let i = 0; i < lines.length; i++) for (let j = 0; j < lines.length; j++){
        if (i === j) continue;
        const a = lines[i], b = lines[j], close = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 4;
        let nl = null;
        if (close(a[a.length - 1], b[0])) nl = a.concat(b.slice(1));
        else if (close(a[a.length - 1], b[b.length - 1])) nl = a.concat(b.slice().reverse().slice(1));
        else if (close(a[0], b[b.length - 1])) nl = b.concat(a.slice(1));
        else if (close(a[0], b[0])) nl = b.slice().reverse().concat(a.slice(1));
        if (nl){ lines[i] = nl; lines.splice(j, 1); joined = true; break outer; }
      }
    }
    return lines.map(l => ({pts:l, L:polyLen(l)})).sort((a, b) => b.L - a.L)[0];
  }
  const routes = [];
  for (const I of islands){
    const cands = Object.entries(byName).filter(([, v]) => v.isl === I.id).map(([name, v]) => Object.assign({name}, chainParts(v.parts))).filter(c => c.L > 350).sort((a, b) => b.L - a.L);
    for (const c of cands.slice(0, 2)) routes.push({name:c.name, isl:I.id, L:Math.round(c.L), pts:simplify(c.pts, 1).flatMap(p => [dm(p[0]), dm(p[1])])});
  }
  const bridge = bridgeWay ? {pts:simplify(bridgeWay, .5).flatMap(p => [dm(p[0]), dm(p[1])]), L:Math.round(polyLen(bridgeWay))} : null;

  const labels = Object.entries(named).filter(([, v]) => v.L > 40).map(([n, v]) => [n, dm(v.x), dm(v.z), +v.a.toFixed(3)]);
  const out = {
    about:'Malé and Hulhumalé, Maldives, with the Sinamalé Bridge. OpenStreetMap coastline, streets (tar or interlocking pavers), buildings and businesses in local decimetres (x east, z south) around ' + LAT0 + ',' + LON0 + '. Unmapped blocks are filled with generic buildings; shopfronts, parked scooters and bus routes are generated from the street layout.',
    attribution:'© OpenStreetMap contributors, ODbL', built:new Date().toISOString().slice(0, 10),
    origin:[LAT0, LON0], scale:[MX, MZ],
    islands: islands.map(I => ({id:I.id, name:I.name, ring:I.ring.flatMap(p => [dm(p[0]), dm(p[1])]), seed:[+I.seed[0].toFixed(1), +I.seed[1].toFixed(1)]})),
    roads, buildings,
    fill: fill.map(r => [dm(r.x + .5), dm(r.z + .5), dm(r.n * CELL - 1), dm(CELL - 1), r.lv]),
    parks: parks.map(p => simplify(p, .5).flatMap(q => [dm(q[0]), dm(q[1])])),
    runways: runways.map(r => [dm(r.w), ...r.pts.flatMap(p => [dm(p[0]), dm(p[1])])]),
    units: units.map(u => [dm(u.x), dm(u.z), Math.round(u.nx * 1000), Math.round(u.nz * 1000), dm(u.w), u.sign, u.awn]),
    net:{nodes:gNodes.flatMap(p => [dm(p[0]), dm(p[1])]), edges:gEdges},
    bridge, scooters, routes, places, labels
  };
  const file = path.join(__dirname, '..', 'city-data.json');
  fs.writeFileSync(file, JSON.stringify(out));
  const count = {}; places.forEach(p => { const k = p.sit; count[k] = count[k] || {male:0, hulhumale:0}; count[k][p.isl]++; });
  console.log('\nroads', roads.length, '(tar', roads.filter(r => r[1] & 2).length + ', bridge', roads.filter(r => r[1] & 1).length + ')',
              '| buildings', buildings.length, '| filler', fill.length, '| shop units', units.length, '| parked scooters', scooters.length);
  console.log('traffic network:', gNodes.length, 'nodes,', gEdges.length, 'edges | bridge', bridge ? bridge.L + ' m' : 'NOT FOUND', '| bus routes', routes.map(r => r.name).join(', '));
  console.log('situations:', places.length);
  Object.entries(count).sort((a, b) => (b[1].male + b[1].hulhumale) - (a[1].male + a[1].hulhumale)).forEach(([k, v]) => console.log('  ', k.padEnd(11), 'Malé', String(v.male).padStart(3), '  Hulhumalé', String(v.hulhumale).padStart(3)));
  console.log('\nwrote city-data.json', (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
