// Local stand-in for the Play-together rooms, using the same Room class as the Worker.
//   cd server && npm install && node dev-rooms.mjs      →  ws://localhost:8788/room/<code>
// Point a local config.js at it with  roomsEndpoint: 'http://localhost:8788'.
import http from 'node:http';
import {WebSocketServer} from 'ws';
import {Room} from './room.js';

const rooms = new Map();
const server = http.createServer((req, res) => { res.writeHead(404); res.end('Play-together rooms: connect with a WebSocket to /room/<code>'); });
const wss = new WebSocketServer({noServer: true});
server.on('upgrade', (req, socket, head) => {
  const m = (req.url || '').match(/^\/room\/([A-Za-z0-9]{4,12})$/);
  if (!m){ socket.destroy(); return; }
  const code = m[1].toUpperCase();
  wss.handleUpgrade(req, socket, head, ws => {
    let room = rooms.get(code); if (!room){ room = new Room({}); rooms.set(code, room); }
    if (room.players.size >= 8){ ws.close(1013, 'full'); return; }
    room.attach(ws);
    ws.on('close', () => { if (!room.players.size) rooms.delete(code); });
  });
});
server.listen(8788, () => console.log('play-together rooms on ws://localhost:8788/room/<code>'));
