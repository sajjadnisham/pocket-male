// Offline test of worker.js: fake KV, fake OpenAI and fake Gumroad.  node server/test.mjs
import assert from 'node:assert/strict';
import worker from './worker.js';

const kv = new Map();
const PM = {
  async get(k, type){ const v = kv.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
  async put(k, v){ kv.set(k, v); }
};
const env = {PM, OPENAI_API_KEY: 'test', MODEL: 'gpt-4o-mini', ALLOWED_ORIGINS: 'https://sajjadnisham.github.io,capacitor://localhost',
  FREE_QUESTIONS: '1', FREE_PER_IP_PER_DAY: '3', FREE_TOTAL_PER_DAY: '300', PLUS_MONTHLY_LIMIT: '2', MAX_DEVICES: '2', LICENSE_PROVIDER: 'gumroad', GUMROAD_PRODUCT_ID: 'prod'};

let openaiCalls = 0;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('openai.com')){
    openaiCalls++;
    return new Response(JSON.stringify({choices: [{message: {content: JSON.stringify({phrases: [{dhivehi: 'ސައި', romanisation: 'sai', english: 'tea'}], tip: 'ok'})}}]}), {status: 200});
  }
  if (String(url).includes('gumroad.com')){
    const key = new URLSearchParams(init.body).get('license_key');
    return new Response(JSON.stringify(key === 'GOOD-KEY' ? {success: true, purchase: {refunded: false}} : {success: false}), {status: key === 'GOOD-KEY' ? 200 : 404});
  }
  throw new Error('unexpected fetch ' + url);
};

const call = async (path, body, origin = 'https://sajjadnisham.github.io', ip = '1.1.1.1') => {
  const r = await worker.fetch(new Request('https://w.example' + path, {method: 'POST', headers: {Origin: origin, 'CF-Connecting-IP': ip, 'Content-Type': 'application/json'}, body: JSON.stringify(body)}), env);
  return {status: r.status, cors: r.headers.get('Access-Control-Allow-Origin'), data: await r.json()};
};
const sit = {en: 'Tea shop', rom: 'sai hotaa', note: 'n', turns: [{rom: 'a', en: 'b'}]};
const A = 'device-aaaaaaaaaaaaaaaa', B = 'device-bbbbbbbbbbbbbbbb', C = 'device-cccccccccccccccc', D = 'device-dddddddddddddddd';

// origin allowlist
assert.equal((await call('/status', {device: A}, 'https://evil.example')).status, 403);
// first question free, second needs upgrade
let r = await call('/status', {device: A}); assert.equal(r.data.plan.left, 1); assert.equal(r.cors, 'https://sajjadnisham.github.io');
r = await call('/ask', {device: A, question: 'how do I ask for less sugar?', situation: sit}); assert.equal(r.status, 200); assert.equal(r.data.phrases[0].dhivehi, 'ސައި'); assert.equal(r.data.plan.left, 0);
r = await call('/ask', {device: A, question: 'again?', situation: sit}); assert.equal(r.status, 402); assert.equal(r.data.error, 'upgrade');
assert.equal(openaiCalls, 1);
// a bad licence is refused, a good one activates Plus
r = await call('/activate', {device: A, license: 'BAD'}); assert.equal(r.status, 400);
r = await call('/activate', {device: A, license: 'GOOD-KEY'}); assert.equal(r.status, 200); assert.equal(r.data.plan.plus, true);
assert.equal(r.data.plan.licId, undefined, 'internal licence id must not leak');
r = await call('/ask', {device: A, license: 'GOOD-KEY', question: 'q2', situation: sit}); assert.equal(r.status, 200); assert.equal(r.data.plan.left, 1);
r = await call('/ask', {device: A, license: 'GOOD-KEY', question: 'q3', situation: sit}); assert.equal(r.status, 200); assert.equal(r.data.plan.left, 0);
r = await call('/ask', {device: A, license: 'GOOD-KEY', question: 'q4', situation: sit}); assert.equal(r.status, 429, 'monthly Plus limit');
// licence without activation on another device is not Plus; device cap enforced
r = await call('/status', {device: B, license: 'GOOD-KEY'}); assert.equal(r.data.plan.plus, false);
r = await call('/activate', {device: B, license: 'GOOD-KEY'}); assert.equal(r.status, 200);
r = await call('/activate', {device: C, license: 'GOOD-KEY'}); assert.equal(r.status, 400); assert.equal(r.data.reason, 'too-many-devices');
// clearing storage (new device ids) from one network stops at the per-IP cap
for (const [dev, want] of [[C, 200], [D, 200], ['device-eeeeeeeeeeeeeeee', 200], ['device-ffffffffffffffff', 402]]){
  r = await call('/ask', {device: dev, question: 'q', situation: sit}, undefined, '9.9.9.9'); assert.equal(r.status, want, dev);
}
// bad input
assert.equal((await call('/ask', {device: 'x', question: 'q'})).status, 400);
assert.equal((await call('/ask', {device: D + 'z', question: '   ', situation: sit})).status, 400);
console.log('worker tests passed ·', openaiCalls, 'OpenAI calls');
