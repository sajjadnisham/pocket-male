/* Play together: a room that two to eight people join with the same code.
 *
 * One Durable Object per room code. It keeps no history and stores nothing:
 * it relays where each player is, what they say (a Dhivehi line from the app),
 * and shared actions — meeting at a café, ordering together, booking a taxi —
 * to everyone else in the room, and forgets the room when the last person leaves.
 *
 * Messages are small JSON objects with a `t` (type):
 *   client → room   hello {name, color} · pos {x, z, yaw, isl, inside} · say {dv, en} · act {kind, ...}
 *   room → client   welcome {id, peers} · join {id, name, color} · leave {id} · pos/say/act {id, ...}
 */
const MAX_PLAYERS = 8;
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
const num = (v, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : 0; };
const ACTIONS = new Set(['meet', 'order', 'taxi', 'taxi-arrive', 'ride', 'wave', 'cancel']);

export class Room {
  constructor(state){
    this.state = state;
    this.players = new Map();          // WebSocket -> {id, name, color, last, count, window}
    this.nextId = 1;
  }

  async fetch(req){
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', {status: 426});
    if (this.players.size >= MAX_PLAYERS) return new Response('This room is full', {status: 409});
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    this.attach(server);
    return new Response(null, {status: 101, webSocket: client});
  }

  // also used by dev-rooms.mjs, which hands in a Node WebSocket
  attach(ws){
    const me = {id: this.nextId++, name: '', color: '#1d5fd1', window: Date.now(), count: 0, ready: false};
    this.players.set(ws, me);
    ws.addEventListener('message', ev => this.onMessage(ws, me, typeof ev.data === 'string' ? ev.data : String(ev.data)));
    const bye = () => this.leave(ws, me);
    ws.addEventListener('close', bye);
    ws.addEventListener('error', bye);
  }

  send(ws, msg){ try { ws.send(JSON.stringify(msg)); } catch (e) { this.leave(ws, this.players.get(ws)); } }
  broadcast(from, msg){ for (const [ws, p] of this.players) if (ws !== from && p.ready) this.send(ws, msg); }

  onMessage(ws, me, raw){
    // at most 30 messages a second per player; anything beyond is dropped
    const now = Date.now();
    if (now - me.window > 1000){ me.window = now; me.count = 0; }
    if (++me.count > 30) return;
    if (typeof raw !== 'string' || raw.length > 2000) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'hello'){
      me.name = clean(m.name, 24) || 'Player ' + me.id;
      me.color = /^#[0-9a-f]{6}$/i.test(m.color || '') ? m.color : '#1d5fd1';
      me.ready = true;
      const peers = [...this.players.values()].filter(p => p !== me && p.ready).map(p => ({id: p.id, name: p.name, color: p.color, pos: p.pos || null}));
      this.send(ws, {t: 'welcome', id: me.id, peers});
      this.broadcast(ws, {t: 'join', id: me.id, name: me.name, color: me.color});
      return;
    }
    if (!me.ready) return;
    if (m.t === 'pos'){
      me.pos = {x: num(m.x, -20000, 20000), z: num(m.z, -20000, 20000), yaw: num(m.yaw, -100, 100), isl: clean(m.isl, 16), inside: clean(m.inside, 16), place: clean(m.place, 48)};
      this.broadcast(ws, Object.assign({t: 'pos', id: me.id}, me.pos));
      return;
    }
    if (m.t === 'say'){
      this.broadcast(ws, {t: 'say', id: me.id, dv: clean(m.dv, 120), en: clean(m.en, 120)});
      return;
    }
    if (m.t === 'act' && ACTIONS.has(m.kind)){
      this.broadcast(ws, {t: 'act', id: me.id, kind: m.kind, place: clean(m.place, 48), key: clean(m.key, 16),
                          x: num(m.x, -20000, 20000), z: num(m.z, -20000, 20000), yaw: num(m.yaw, -100, 100), dest: clean(m.dest, 48)});
    }
  }

  leave(ws, me){
    if (!me || !this.players.has(ws)) return;
    this.players.delete(ws);
    try { ws.close(1000, 'bye'); } catch (e) {}
    if (me.ready) this.broadcast(null, {t: 'leave', id: me.id});
  }
}

/* Route GET /room/<code> (a WebSocket upgrade) to that room's Durable Object. */
export function roomRequest(req, env){
  const url = new URL(req.url), m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4,12})$/);
  if (!m) return new Response('Not found', {status: 404});
  if (!env.ROOMS) return new Response('Play together is not set up on this server', {status: 501});
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allowed.includes('*') && !allowed.includes(origin)) return new Response('Origin not allowed', {status: 403});
  const code = m[1].toUpperCase();
  return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
}
