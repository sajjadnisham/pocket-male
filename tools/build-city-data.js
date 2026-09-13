/* Builds city-data.json for city.html from OpenStreetMap (Overpass API).
 *
 *   node tools/build-city-data.js           (uses tools/.osm-cache if present)
 *   node tools/build-city-data.js --fresh   (re-download from Overpass)
 *
 * Output is in local metres around an origin on Majeedhee Magu:
 *   x = east, z = south (so three.js "forward" -z points north).
 * Numbers are stored as integers in decimetres to keep the file small.
 *
 * Map data © OpenStreetMap contributors, ODbL. */
const fs = require('fs');
const path = require('path');

const BBOX = '(4.1660,73.4970,4.1830,73.5230)';
const LAT0 = 4.1754959, LON0 = 73.5093474;           // Majeedhee Magu photosphere
const MX = 111320 * Math.cos(LAT0 * Math.PI / 180), MZ = 110574;
const toXZ = (lat, lon) => [(lon - LON0) * MX, -(lat - LAT0) * MZ];
const dm = v => Math.round(v * 10);

let seed = 7101;
const rand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const CACHE = path.join(__dirname, '.osm-cache');
async function overpass(q){
  const key = require('crypto').createHash('sha1').update(q).digest('hex').slice(0, 16);
  const cf = path.join(CACHE, key + '.json');
  if (fs.existsSync(cf) && !process.argv.includes('--fresh')) return JSON.parse(fs.readFileSync(cf, 'utf8'));
  const els = await overpassLive(q);
  fs.mkdirSync(CACHE, {recursive:true}); fs.writeFileSync(cf, JSON.stringify(els));
  return els;
}
async function overpassLive(q){
  for (let attempt = 1; attempt <= 4; attempt++){
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'pocket-male/1.0 (city-data build)'},
      body:'data=' + encodeURIComponent('[out:json][timeout:180];' + q)
    });
    const t = await r.text();
    if (t.trim().startsWith('{')) return JSON.parse(t).elements;
    console.warn('  overpass attempt', attempt, 'returned', r.status, '— retrying');
    await new Promise(res => setTimeout(res, 4000 * attempt));
  }
  throw new Error('Overpass kept failing');
}

/* ---------- geometry helpers ---------- */
function pointInPoly(x, z, pts){            // pts: [[x,z],...]
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function segDist(px, pz, ax, az, bx, bz){
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / L; t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cz = az + t * dz;
  return [Math.hypot(px - cx, pz - cz), cx, cz];
}
function area(pts){ let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; }
function centroid(pts){ let x = 0, z = 0; for (const p of pts){ x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; }
function simplify(pts, eps){
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  (function rec(a, b){
    let idx = -1, max = 0;
    for (let i = a + 1; i < b; i++){ const d = segDist(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1])[0]; if (d > max){ max = d; idx = i; } }
    if (max > eps){ keep[idx] = 1; rec(a, idx); rec(idx, b); }
  })(0, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}

const ROAD_W = {motorway:12, trunk:12, primary:11, secondary:10, tertiary:8, residential:6, unclassified:6, living_street:5,
                service:4, pedestrian:5, footway:2.5, path:2.5, steps:2.5, cycleway:2.5, track:4};

(async () => {
  console.log('fetching coastline…');
  const coast = await overpass('way["natural"="coastline"]' + BBOX + ';out geom;');
  console.log('fetching roads…');
  const roadsRaw = await overpass('way["highway"]' + BBOX + ';out geom tags;');
  console.log('fetching buildings…');
  const bldRaw = await overpass('way["building"]' + BBOX + ';out geom tags;');
  console.log('fetching parks…');
  const parkRaw = await overpass('(way["leisure"~"^(park|playground|pitch|garden)$"]' + BBOX + ';way["landuse"~"^(grass|recreation_ground)$"]' + BBOX + ';);out geom;');
  console.log('fetching places…');
  const poiRaw = await overpass('(nwr["amenity"~"^(marketplace|ferry_terminal|pharmacy|bank|hospital|bus_station|cafe|restaurant|taxi|place_of_worship)$"]' + BBOX
    + ';nwr["shop"~"^(convenience|supermarket|mobile_phone|hairdresser)$"]' + BBOX + ';);out tags center;');

  /* ---------- island ring (Malé) from coastline ways, chained by node id ---------- */
  const chains = coast.map(w => ({nodes:w.nodes.slice(), pts:w.geometry.map(g => toXZ(g.lat, g.lon))}));
  let merged = true;
  while (merged){
    merged = false;
    outer: for (const a of chains){
      if (!a.nodes.length || a.nodes[0] === a.nodes[a.nodes.length - 1]) continue;
      for (const b of chains){
        if (a === b || !b.nodes.length) continue;
        if (a.nodes[a.nodes.length - 1] === b.nodes[0]){
          a.nodes = a.nodes.concat(b.nodes.slice(1)); a.pts = a.pts.concat(b.pts.slice(1));
          b.nodes = []; b.pts = []; merged = true; break outer;
        }
      }
    }
  }
  const rings = chains.filter(c => c.pts.length > 10);
  const male = rings.find(r => pointInPoly(0, 0, r.pts)) || rings.sort((a, b) => Math.abs(area(b.pts)) - Math.abs(area(a.pts)))[0];
  const island = simplify(male.pts, .8);
  console.log('island ring points:', island.length);
  const onIsland = (x, z) => pointInPoly(x, z, island);

  /* ---------- roads ---------- */
  const roads = [];
  const segs = [];                      // for distance queries
  const named = {};
  for (const w of roadsRaw){
    const hw = w.tags.highway; const width = ROAD_W[hw]; if (!width) continue;
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    if (!pts.some(p => onIsland(p[0], p[1]))) continue;
    pts = simplify(pts, .5);
    roads.push([dm(width), ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], width]);
    const nm = w.tags['name:en'] || w.tags.name;
    if (nm && width >= 5){
      let best = null;
      for (let i = 1; i < pts.length; i++){
        const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (!best || L > best.L) best = {L, x:(pts[i][0] + pts[i - 1][0]) / 2, z:(pts[i][1] + pts[i - 1][1]) / 2, a:Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])};
      }
      if (best && best.L > 25 && (!named[nm] || named[nm].L < best.L)) named[nm] = best;
    }
  }
  const SEG_CELL = 20, segGrid = new Map();
  segs.forEach((s, i) => {
    const x0 = Math.floor((Math.min(s[0], s[2]) - 8) / SEG_CELL), x1 = Math.floor((Math.max(s[0], s[2]) + 8) / SEG_CELL);
    const z0 = Math.floor((Math.min(s[1], s[3]) - 8) / SEG_CELL), z1 = Math.floor((Math.max(s[1], s[3]) + 8) / SEG_CELL);
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++){ const k = gx + ',' + gz; (segGrid.get(k) || segGrid.set(k, []).get(k)).push(i); }
  });
  function nearRoad(x, z, reach){  // {d, cx, cz, clear}; clear = distance beyond the road edge
    const gx = Math.floor(x / SEG_CELL), gz = Math.floor(z / SEG_CELL), R = reach || 0;
    let best = {d:Infinity, clear:Infinity};
    for (let ox = -R; ox <= R; ox++) for (let oz = -R; oz <= R; oz++){
      for (const i of segGrid.get((gx + ox) + ',' + (gz + oz)) || []){
        const s = segs[i]; const [d, cx, cz] = segDist(x, z, s[0], s[1], s[2], s[3]);
        const clear = d - s[4] / 2;
        if (clear < best.clear) best = {d, cx, cz, clear, w:s[4]};
      }
    }
    return best;
  }

  /* ---------- mapped buildings ---------- */
  const buildings = [];
  const bPolys = [];
  for (const w of bldRaw){
    let pts = w.geometry.map(g => toXZ(g.lat, g.lon));
    if (pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    const [cx, cz] = centroid(pts);
    if (pts.length < 3 || !onIsland(cx, cz)) continue;
    pts = simplify(pts.concat([pts[0]]), .3); pts.pop();
    if (pts.length < 3 || Math.abs(area(pts)) < 12) continue;
    let lv = parseFloat(w.tags['building:levels']);
    if (!(lv > 0)) lv = parseFloat(w.tags.height) / 3.2;
    const tagged = lv > 0;
    if (!tagged) lv = w.tags.building === 'roof' ? 1 : 3 + Math.floor(rand() * 7);
    lv = Math.max(1, Math.min(25, Math.round(lv)));
    buildings.push([lv, tagged ? 1 : 0, ...pts.flatMap(p => [dm(p[0]), dm(p[1])])]);
    bPolys.push(pts);
  }
  const B_CELL = 25, bGrid = new Map();
  bPolys.forEach((pts, i) => {
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    for (let gx = Math.floor(Math.min(...xs) / B_CELL); gx <= Math.floor(Math.max(...xs) / B_CELL); gx++)
      for (let gz = Math.floor(Math.min(...zs) / B_CELL); gz <= Math.floor(Math.max(...zs) / B_CELL); gz++){
        const k = gx + ',' + gz; (bGrid.get(k) || bGrid.set(k, []).get(k)).push(i);
      }
  });
  const inBuilding = (x, z) => (bGrid.get(Math.floor(x / B_CELL) + ',' + Math.floor(z / B_CELL)) || []).some(i => pointInPoly(x, z, bPolys[i]));

  const parks = parkRaw.map(w => w.geometry.map(g => toXZ(g.lat, g.lon))).filter(p => p.length > 3 && p.some(q => onIsland(q[0], q[1])));
  const inPark = (x, z) => parks.some(p => pointInPoly(x, z, p));

  /* ---------- filler blocks where OSM has no buildings ---------- */
  const CELL = 9;
  const xs = island.map(p => p[0]), zs = island.map(p => p[1]);
  const fillers = [];
  for (let z = Math.min(...zs); z < Math.max(...zs); z += CELL){
    let run = null;
    for (let x = Math.min(...xs); x < Math.max(...xs); x += CELL){
      const cx = x + CELL / 2, cz = z + CELL / 2;
      let ok = onIsland(cx, cz);
      if (ok){
        // keep away from the shoreline road ring
        for (const [ox, oz] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) if (!onIsland(cx + ox * 1.5, cz + oz * 1.5)){ ok = false; break; }
      }
      if (ok && nearRoad(cx, cz).clear < CELL / 2 + 1.2) ok = false;
      if (ok && (inBuilding(cx, cz) || inBuilding(x + 1, z + 1) || inBuilding(x + CELL - 1, z + 1) || inBuilding(x + 1, z + CELL - 1) || inBuilding(x + CELL - 1, z + CELL - 1))) ok = false;
      if (ok && inPark(cx, cz)) ok = false;
      if (ok){
        if (run && run.n < 1 + Math.floor(rand() * 3)){ run.n++; }
        else { if (run) fillers.push(run); run = {x, z, n:1, lv: rand() < .1 ? 10 + Math.floor(rand() * 5) : 3 + Math.floor(rand() * 7)}; }
      } else if (run){ fillers.push(run); run = null; }
    }
    if (run) fillers.push(run);
  }
  const fill = fillers.map(r => [dm(r.x + .5), dm(r.z + .5), dm(r.n * CELL - 1), dm(CELL - 1), r.lv]);

  /* ---------- places for the situations ---------- */
  const pois = poiRaw.map(e => {
    const lat = e.lat != null ? e.lat : e.center && e.center.lat, lon = e.lon != null ? e.lon : e.center && e.center.lon;
    if (lat == null) return null;
    const [x, z] = toXZ(lat, lon);
    return {x, z, lat, lon, tags:e.tags, kind:e.tags.amenity || e.tags.shop};
  }).filter(p => p && onIsland(p.x, p.z));
  const near = (arr, x, z) => arr.slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const byKind = k => pois.filter(p => p.kind === k);
  const named1 = (k, re) => byKind(k).find(p => re.test(p.tags.name || '') || re.test(p.tags['name:en'] || ''));
  const used = new Set();
  const pick = (cands, x, z) => { const c = cands.filter(p => !used.has(p)); const p = near(c.length ? c : cands, x, z); if (p) used.add(p); return p; };

  const marketLocal = named1('marketplace', /local market/i), marketFish = named1('marketplace', /fish market/i);
  const hospital = named1('hospital', /indira gandhi/i) || byKind('hospital')[0];
  const busTerm = named1('bus_station', /terminal/i) || byKind('bus_station')[0];
  const ferryT = named1('ferry_terminal', /hulhum|vili|villing/i) || near(byKind('ferry_terminal'), 0, 0);
  const bml = near(pois.filter(p => p.kind === 'bank' && /bank of maldives/i.test(p.tags.name || '')), marketLocal ? marketLocal.x : 0, marketLocal ? marketLocal.z : 0);
  const southPoint = toXZ(4.1745498, 73.5108431);

  const SPOTS_XZ = {majeedhee:toXZ(4.1754959, 73.5093474), market:toXZ(4.1784198, 73.5107529), 'sultan-park':toXZ(4.177195, 73.510573), 'male-south':toXZ(4.1745498, 73.5108431)};
  const plan = [
    ['market',     marketFish,  'Fish Market',   true],
    ['kurumba',    marketLocal, 'Local Market',  true],
    ['clinic',     hospital,    'Indira Gandhi Memorial Hospital', true],
    ['bus',        busTerm,     "Greater Malé Bus Terminal", true],
    ['ferry',      ferryT,      ferryT && (ferryT.tags['name:en'] || ferryT.tags.name) || 'Ferry terminal', true],
    ['bank',       bml,         null, false],
    ['pharmacy',   hospital && pick(byKind('pharmacy'), hospital.x, hospital.z), null, false],
    ['teashop',    pick(byKind('cafe'), 0, 0), null, false],
    ['restaurant', pick(byKind('restaurant'), 40, 10), null, false],
    ['shop',       pick(byKind('convenience').concat(byKind('supermarket')), -30, 20), null, false],
    ['phone',      pick(byKind('mobile_phone'), 10, 0), null, false],
    ['barber',     pick(byKind('hairdresser'), -20, -10), null, false],
    ['taxi',       pick(byKind('taxi'), 0, 0), null, false]
  ];
  const places = [];
  for (const [id, p, realName, isPublic] of plan){
    if (!p){ console.warn('  no OSM place for', id); continue; }
    places.push(mkPlace(id, p.x, p.z, isPublic ? realName : null));
  }
  // landlord: a residential spot in southern Malé (no business to name)
  places.push(mkPlace('landlord', southPoint[0] + 18, southPoint[1] + 22, null));

  function mkPlace(id, x, z, realName){
    const r = nearRoad(x, z, 5);                     // search up to ~100 m for a street to stand on
    if (!isFinite(r.d)) throw new Error('no street near ' + id);
    let ex = r.cx, ez = r.cz;
    if (isFinite(r.d) && r.d > 0.5){                 // step back from the road centre toward the building
      const ux = (x - r.cx) / r.d, uz = (z - r.cz) / r.d;
      const off = Math.min(r.w / 2 - .6, r.d - 2); ex = r.cx + ux * Math.max(0, off); ez = r.cz + uz * Math.max(0, off);
    }
    const yaw = Math.atan2(-(x - ex), -(z - ez));
    const [lat, lon] = [LAT0 - ez / MZ, LON0 + ex / MX];
    return {id, x:dm(x) / 10, z:dm(z) / 10, ex:dm(ex) / 10, ez:dm(ez) / 10, yaw:+yaw.toFixed(3), lat:+lat.toFixed(6), lng:+lon.toFixed(6), realName};
  }

  const mosques = byKind('place_of_worship').map(p => ({x:dm(p.x) / 10, z:dm(p.z) / 10, big:/auzam|islamic cent|grand friday/i.test((p.tags.name || '') + (p.tags['name:en'] || '')) ? 1 : 0}));
  const labels = Object.entries(named).filter(([, v]) => v.L > 40).map(([n, v]) => [n, dm(v.x), dm(v.z), +v.a.toFixed(3)]);

  const out = {
    about:'Malé, Maldives. OpenStreetMap buildings, roads and coastline in local decimetres (x east, z south) around ' + LAT0 + ',' + LON0 + '. Unmapped blocks are filled with generic buildings.',
    attribution:'© OpenStreetMap contributors, ODbL',
    built: new Date().toISOString().slice(0, 10),
    origin:[LAT0, LON0], scale:[MX, MZ],
    island: island.flatMap(p => [dm(p[0]), dm(p[1])]),
    roads, buildings, fill, parks: parks.map(p => simplify(p, .5).flatMap(q => [dm(q[0]), dm(q[1])])),
    places, mosques, labels,
    spots: Object.fromEntries(Object.entries(SPOTS_XZ).map(([k, v]) => [k, [dm(v[0]) / 10, dm(v[1]) / 10]]))
  };
  const file = path.join(__dirname, '..', 'city-data.json');
  fs.writeFileSync(file, JSON.stringify(out));
  const stat = fs.statSync(file).size;
  console.log('\nroads', roads.length, '| mapped buildings', buildings.length, '(tagged', buildings.filter(b => b[1]).length + ')',
              '| filler blocks', fill.length, '| parks', parks.length, '| mosques', mosques.length, '| street labels', labels.length);
  console.log('places:'); places.forEach(p => console.log('  ', p.id.padEnd(11), 'entrance', p.ex, p.ez, p.realName ? '— ' + p.realName : ''));
  console.log('\nwrote city-data.json', (stat / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
