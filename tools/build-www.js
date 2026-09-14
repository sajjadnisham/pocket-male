/* Copies the site into www/ for the Android and iOS app shells (Capacitor).
 *
 *   node tools/build-www.js
 *
 * three.js is downloaded into www/vendor/ so the 3D city works without a
 * connection; the pages' CDN <script> tags are rewritten to the local copy. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const FILES = ['index.html', 'city.html', 'about.html', 'data.js', 'config.js', 'manifest.json', 'icon.svg', 'city-data.json'];
const DIRS = ['icons', 'audio'];

fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(path.join(out, 'vendor'), {recursive: true});
for (const f of FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of DIRS) fs.cpSync(path.join(root, d), path.join(out, d), {recursive: true});

(async () => {
  const r = await fetch(THREE_URL);
  if (!r.ok) throw new Error('three.js download failed: ' + r.status);
  fs.writeFileSync(path.join(out, 'vendor', 'three.min.js'), Buffer.from(await r.arrayBuffer()));
  for (const f of ['index.html', 'city.html', 'about.html']){
    const p = path.join(out, f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(THREE_URL).join('./vendor/three.min.js'));
  }
  const audio = fs.readdirSync(path.join(out, 'audio')).filter(f => f.endsWith('.mp3')).length;
  console.log('www/ ready ·', audio, 'audio clips · three.js bundled');
})().catch(e => { console.error(e); process.exit(1); });
