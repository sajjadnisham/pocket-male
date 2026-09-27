// Two players join a room and see each other.  node test-rooms.mjs  (needs dev-rooms.mjs running)
import assert from 'node:assert/strict';
import WebSocket from 'ws';

const open = name => new Promise((res, rej) => {
  const ws = new WebSocket('ws://localhost:8788/room/TEST42', {origin:'http://localhost:8150'}), inbox = [];
  ws.on('message', d => inbox.push(JSON.parse(String(d))));
  ws.on('open', () => { ws.send(JSON.stringify({t:'hello', name, color:'#c0392b'})); res({ws, inbox}); });
  ws.on('error', rej);
});
const wait = ms => new Promise(r => setTimeout(r, ms));

const a = await open('Aishath'); await wait(150);
const b = await open('Ibrahim'); await wait(200);
assert.equal(a.inbox[0].t, 'welcome'); assert.equal(a.inbox[0].peers.length, 0);
assert.equal(b.inbox[0].t, 'welcome'); assert.equal(b.inbox[0].peers[0].name, 'Aishath');
assert.ok(a.inbox.some(m => m.t === 'join' && m.name === 'Ibrahim'), 'first player hears the second join');

a.ws.send(JSON.stringify({t:'pos', x:12.5, z:-40, yaw:1, isl:'male', inside:'', place:''}));
b.ws.send(JSON.stringify({t:'say', dv:'ކިހިނެއް؟', en:'How are you?'}));
a.ws.send(JSON.stringify({t:'act', kind:'meet', place:'Scoop', key:'u123', x:10, z:5}));
a.ws.send(JSON.stringify({t:'act', kind:'hack', place:'x'}));
b.ws.send(JSON.stringify({t:'say', dv:'<script>', en:'x'.repeat(500)}));
await wait(250);
assert.ok(b.inbox.some(m => m.t === 'pos' && m.x === 12.5 && m.z === -40), 'position relayed');
assert.ok(a.inbox.some(m => m.t === 'say' && m.dv === 'ކިހިނެއް؟'), 'speech relayed');
assert.ok(b.inbox.some(m => m.t === 'act' && m.kind === 'meet' && m.place === 'Scoop'), 'meet-up relayed');
assert.ok(!b.inbox.some(m => m.t === 'act' && m.kind === 'hack'), 'unknown actions dropped');
const sanitized = a.inbox.find(m => m.t === 'say' && m.en.length === 120);
assert.ok(sanitized && !sanitized.dv.includes('<'), 'text is trimmed and stripped of markup');

b.ws.close(); await wait(250);
assert.ok(a.inbox.some(m => m.t === 'leave'), 'leaving is announced');
a.ws.close();
console.log('room tests passed');
