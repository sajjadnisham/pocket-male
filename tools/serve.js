/* A small local web server for testing, close to how GitHub Pages serves the site.
 *
 *   node tools/serve.js            →  http://localhost:8150
 *   node tools/serve.js 8080       →  another port
 *
 * It gzips HTML, JS and JSON, which matters: city-data.json is about 2 MB
 * uncompressed, and some security software cuts off large plain HTTP responses.
 * (python -m http.server works too, but sends everything uncompressed.) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.argv[2], 10) || 8150;
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json',
               '.mp3':'audio/mpeg', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json'};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('Not found'); }
  const type = TYPES[path.extname(file)] || 'application/octet-stream', body = fs.readFileSync(file);
  const gzip = /json|html|javascript|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '');
  res.writeHead(200, Object.assign({'Content-Type':type, 'Cache-Control':'no-store'}, gzip ? {'Content-Encoding':'gzip'} : {}));
  res.end(gzip ? zlib.gzipSync(body) : body);
}).listen(PORT, () => console.log('Pocket Malé on http://localhost:' + PORT));
