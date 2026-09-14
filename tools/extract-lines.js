/* Collects every Dhivehi line the site can speak into tools/lines.json.
 *
 *   node tools/extract-lines.js
 *
 * Sources: situation turns and titles (data.js), the SOS set (index.html),
 * and the tappable words in city.html. Each line gets a role
 * so the generator can give learners and shopkeepers different voices. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const SITUATIONS = new Function(read('data.js') + ';return SITUATIONS')();
const lines = new Map();
const add = (dv, role) => {
  dv = String(dv).trim();
  if (!/[ހ-ޱ]/.test(dv) || lines.has(dv)) return;
  lines.set(dv, {dv, role});
};

SITUATIONS.forEach(s => s.turns.forEach(t => add(t.dv, t.s)));
const sos = read('index.html').match(/const SOS = \{[\s\S]*?\n\};/);
if (sos) [...sos[0].matchAll(/dv:'([^']+)'/g)].slice(1).forEach(m => add(m[1], 'you'));
for (const f of ['city.html'].filter(f => fs.existsSync(path.join(root, f)))){
  const w = read(f).match(/const WORDS = \{[\s\S]*?\n\};/);
  if (w) [...w[0].matchAll(/dv:'([^']+)'/g)].forEach(m => add(m[1], 'word'));
}
SITUATIONS.forEach(s => add(s.dv, 'word'));

const out = [...lines.values()];
fs.writeFileSync(path.join(__dirname, 'lines.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote tools/lines.json:', out.length, 'lines');
