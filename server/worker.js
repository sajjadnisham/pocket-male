/* Pocket Malé AI — a Cloudflare Worker between the app and OpenAI.
 *
 * Why it exists: the app is a static site and a mobile wrapper, so an OpenAI
 * key shipped inside it would be readable by anyone. The key lives here as a
 * secret, and this worker decides who may ask:
 *
 *   - every device gets FREE_QUESTIONS free questions (default 1)
 *   - a Plus licence (bought through Gumroad or Lemon Squeezy) unlocks more,
 *     up to PLUS_MONTHLY_LIMIT a month per licence, on up to MAX_DEVICES devices
 *   - FREE_PER_IP_PER_DAY and FREE_TOTAL_PER_DAY stop someone clearing their
 *     storage in a loop to run up the OpenAI bill
 *
 * Endpoints (all POST, JSON):
 *   /status    {device, license?}                      -> {plan}
 *   /activate  {device, license}                       -> {plan} or 400
 *   /ask       {device, license?, situation, question} -> {phrases, tip, model, plan} or 402 {error:'upgrade', plan}
 *
 * Bindings (see wrangler.toml): KV namespace PM; secret OPENAI_API_KEY.
 */

const J = (body, status, cors) => new Response(JSON.stringify(body), {status: status || 200, headers: {'Content-Type': 'application/json', ...cors}});
const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const today = () => new Date().toISOString().slice(0, 10);
const month = () => new Date().toISOString().slice(0, 7);
const DAY = 86400;

async function sha(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
async function incr(kv, key, ttl){
  // KV has no atomic increment; a lost update under a race only ever lets one extra question through
  const n = int(await kv.get(key), 0) + 1;
  await kv.put(key, String(n), ttl ? {expirationTtl: ttl} : undefined);
  return n;
}

function corsFor(req, env){
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes('*') || allowed.includes(origin);
  return ok ? {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin'} : null;
}

/* ---------- licences ---------- */
async function verifyWithProvider(license, env){
  const provider = String(env.LICENSE_PROVIDER || 'gumroad').toLowerCase();
  if (provider === 'lemonsqueezy'){
    const r = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST', headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({license_key: license})
    });
    const j = await r.json().catch(() => ({}));
    const meta = j.meta || {};
    const productOk = !env.LEMONSQUEEZY_PRODUCT_ID || String(meta.product_id) === String(env.LEMONSQUEEZY_PRODUCT_ID);
    return !!(j.valid && productOk && (!j.license_key || ['active', 'inactive'].includes(j.license_key.status)));
  }
  // Gumroad: enable "Generate a unique license key per sale" on the product
  const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({product_id: env.GUMROAD_PRODUCT_ID || '', license_key: license, increment_uses_count: 'false'})
  });
  const j = await r.json().catch(() => ({}));
  const p = j.purchase || {};
  return !!(j.success && !p.refunded && !p.chargebacked && !p.disputed && !p.subscription_ended_at && !p.subscription_cancelled_at && !p.subscription_failed_at);
}

async function licenseState(license, device, env, activate){
  if (!license || typeof license !== 'string' || license.length > 100) return null;
  const id = await sha('lic:' + license.trim());
  const cacheKey = 'lic:' + id;
  let cached = await env.PM.get(cacheKey, 'json');
  if (!cached || activate){
    const ok = await verifyWithProvider(license.trim(), env);
    cached = {ok, at: Date.now()};
    await env.PM.put(cacheKey, JSON.stringify(cached), {expirationTtl: ok ? DAY : 600});   // re-check daily, so refunds lapse
  }
  if (!cached.ok) return {id, ok: false};
  const devKey = 'licdev:' + id;
  const devices = (await env.PM.get(devKey, 'json')) || [];
  if (!devices.includes(device)){
    if (!activate) return {id, ok: false, reason: 'not-activated'};
    if (devices.length >= int(env.MAX_DEVICES, 3)) return {id, ok: false, reason: 'too-many-devices'};
    devices.push(device); await env.PM.put(devKey, JSON.stringify(devices));
  }
  return {id, ok: true};
}

async function plan(device, license, env, activate){
  const free = int(env.FREE_QUESTIONS, 1);
  const lic = await licenseState(license, device, env, activate);
  if (lic && lic.ok){
    const used = int(await env.PM.get('plus:' + lic.id + ':' + month()), 0);
    const limit = int(env.PLUS_MONTHLY_LIMIT, 300);
    return {plus: true, used, limit, left: Math.max(0, limit - used), licId: lic.id};
  }
  const used = int(await env.PM.get('free:' + device), 0);
  return {plus: false, free, used, left: Math.max(0, free - used), licenseError: lic ? (lic.reason || 'invalid') : null};
}
const publicPlan = p => { const {licId, ...rest} = p; return rest; };

/* ---------- the question ---------- */
function clip(s, n){ return String(s == null ? '' : s).slice(0, n); }
function buildPrompt(sit){
  const turns = Array.isArray(sit.turns) ? sit.turns.slice(0, 12) : [];
  return 'You help people who live in Malé, Maldives, speak everyday Dhivehi. '
    + 'Use the spoken Malé register (for example "ahuren", not the formal "alhugandu"), written in Thaana script with correct fili. '
    + 'Situation: ' + clip(sit.en, 60) + ' (' + clip(sit.rom, 60) + ').\n'
    + 'Lines the learner already has:\n' + turns.map(t => '- ' + clip(t.rom, 120) + ' — ' + clip(t.en, 120)).join('\n') + '\n'
    + 'Local context: ' + clip(sit.note, 600) + '\n'
    + 'Answer the learner\'s question with 1 to 3 short, natural phrases they could actually say or hear in this situation. '
    + 'Only answer questions about speaking Dhivehi or everyday life in the Maldives; for anything else, reply with no phrases and a short tip saying so. '
    + 'Reply ONLY with JSON in exactly this shape: {"phrases":[{"dhivehi":"Thaana script","romanisation":"latin letters","english":"meaning"}],"tip":"one or two sentences of practical Malé context"}. '
    + 'If you are not confident about the Dhivehi, say so plainly in "tip" instead of sounding certain.';
}

async function ask(body, req, env, cors){
  const device = body.device, question = clip(body.question, 300).trim();
  if (!question) return J({error: 'empty', message: 'Type a question first.'}, 400, cors);
  const p = await plan(device, body.license, env, false);
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const ipKey = 'ip:' + today() + ':' + await sha(ip), totalKey = 'total:' + today();

  if (p.plus){
    if (p.left <= 0) return J({error: 'limit', message: 'You’ve reached this month’s Plus limit. It resets on the 1st.', plan: publicPlan(p)}, 429, cors);
  } else {
    if (p.left <= 0) return J({error: 'upgrade', plan: publicPlan(p)}, 402, cors);
    if (int(await env.PM.get(ipKey), 0) >= int(env.FREE_PER_IP_PER_DAY, 5)) return J({error: 'upgrade', plan: publicPlan({...p, left: 0}), message: 'Free questions from this network are used up for today.'}, 402, cors);
    if (int(await env.PM.get(totalKey), 0) >= int(env.FREE_TOTAL_PER_DAY, 300)) return J({error: 'busy', message: 'Free questions are used up for today. Try again tomorrow, or upgrade.', plan: publicPlan(p)}, 429, cors);
  }

  const model = env.MODEL || 'gpt-4o-mini';
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OPENAI_API_KEY},
    body: JSON.stringify({
      model, temperature: .3, max_tokens: 450, response_format: {type: 'json_object'},
      messages: [{role: 'system', content: buildPrompt(body.situation || {})}, {role: 'user', content: question}]
    })
  });
  if (!r.ok){
    const detail = await r.text().catch(() => '');
    console.log('openai error', r.status, detail.slice(0, 300));
    return J({error: 'openai', message: r.status === 429 ? 'ChatGPT is busy right now. Try again in a minute.' : 'ChatGPT couldn’t answer just now. Try again.'}, 502, cors);
  }
  const j = await r.json();
  let data;
  try { data = JSON.parse((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '{}'); }
  catch (e) { return J({error: 'format', message: 'ChatGPT replied in an unexpected format. Try asking again.'}, 502, cors); }
  const phrases = (Array.isArray(data.phrases) ? data.phrases : []).filter(x => x && x.dhivehi).slice(0, 3)
    .map(x => ({dhivehi: clip(x.dhivehi, 200), romanisation: clip(x.romanisation, 200), english: clip(x.english, 200)}));

  // count only answered questions
  if (p.plus){ p.used = await incr(env.PM, 'plus:' + p.licId + ':' + month(), 40 * DAY); p.left = Math.max(0, p.limit - p.used); }
  else {
    p.used = await incr(env.PM, 'free:' + device); p.left = Math.max(0, p.free - p.used);
    await incr(env.PM, ipKey, DAY); await incr(env.PM, totalKey, DAY);
  }
  return J({phrases, tip: clip(data.tip, 500), model, plan: publicPlan(p)}, 200, cors);
}

export default {
  async fetch(req, env){
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, {status: cors ? 204 : 403, headers: cors || {}});
    if (!cors) return J({error: 'origin'}, 403, {});
    if (req.method !== 'POST') return J({error: 'method'}, 405, cors);
    let body; try { body = await req.json(); } catch (e) { return J({error: 'json'}, 400, cors); }
    if (!body || typeof body.device !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.device)) return J({error: 'device'}, 400, cors);
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    try {
      if (path === '/status') return J({plan: publicPlan(await plan(body.device, body.license, env, false))}, 200, cors);
      if (path === '/activate'){
        const p = await plan(body.device, body.license, env, true);
        if (!p.plus) return J({error: 'license', reason: p.licenseError || 'invalid', plan: publicPlan(p)}, 400, cors);
        return J({plan: publicPlan(p)}, 200, cors);
      }
      if (path === '/ask') return await ask(body, req, env, cors);
      return J({error: 'not-found'}, 404, cors);
    } catch (e) {
      console.log('worker error', e && e.stack);
      return J({error: 'server', message: 'Something went wrong on our side. Try again.'}, 500, cors);
    }
  }
};
