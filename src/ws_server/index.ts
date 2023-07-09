import { httpServer } from '../http_server/index.js';
import { WebSocketServer } from 'ws';

import handler from './handler';

//run server UI
const HTTP_PORT = 8181;
console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(8181);

console.log('Start websocket server on the 3000 port');
const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('connection', (socket) => {
  console.log('connection');
  socket.on('message', (message) => {
    console.log('message');
    handler.process(socket, message);
  });

  socket.on('error', (error) => {
    console.log('error ' + error);
  });

  socket.on('close', () => {
    console.log('close');
    handler.close(socket);
  });
});
