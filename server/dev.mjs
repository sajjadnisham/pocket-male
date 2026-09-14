// Local stand-in for the worker, with fake OpenAI and fake licence checks, for trying the app's
// ChatGPT and upgrade flow without any accounts:  node server/dev.mjs  (port 8787)
// The licence key DEMO-PLUS-KEY activates Plus. Set aiEndpoint to http://localhost:8787 in a local config.js.
import http from 'node:http';
import worker from './worker.js';

const kv = new Map();
const env = {
  PM: {async get(k, t){ const v = kv.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v){ kv.set(k, v); }},
  OPENAI_API_KEY: 'dev', MODEL: 'fake-gpt (local dev)', ALLOWED_ORIGINS: '*', FREE_QUESTIONS: '1', FREE_PER_IP_PER_DAY: '50',
  FREE_TOTAL_PER_DAY: '500', PLUS_MONTHLY_LIMIT: '300', MAX_DEVICES: '3', LICENSE_PROVIDER: 'gumroad', GUMROAD_PRODUCT_ID: 'dev'
};
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('openai.com')){
    const q = JSON.parse(init.body).messages[1].content;
    return new Response(JSON.stringify({choices: [{message: {content: JSON.stringify({
      phrases: [{dhivehi: 'ހަކުރު ކުޑަކޮށް ލާދީބަލަ', romanisation: 'hakuru kudakoh laadheebala', english: 'Please put in less sugar.'}],
      tip: 'Local test answer for: ' + q
    })}}]}), {status: 200});
  }
  if (String(url).includes('gumroad.com')){
    const ok = new URLSearchParams(init.body).get('license_key') === 'DEMO-PLUS-KEY';
    return new Response(JSON.stringify({success: ok, purchase: {}}), {status: ok ? 200 : 404});
  }
  return realFetch(url, init);
};
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request('http://localhost:8787' + req.url, {method: req.method, headers: {...req.headers, origin: req.headers.origin || 'http://localhost'},
    body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks)}), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('dev worker on http://localhost:8787'));
