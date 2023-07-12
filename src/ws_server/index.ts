//import { httpServer } from '../http_server/index.js';
import { WebSocketServer } from 'ws';

import handler from './handler';

const color = {
  default: '\x1b[0m',
  bold: '\x1b[1m',
  error: '\x1b[31m',
  system: '\x1b[32m',
  user: '\x1b[33m',
};

//run server UI
// const HTTP_PORT = 8181;
// console.log(`Start static http server on the ${HTTP_PORT} port!`);
// httpServer.listen(8181);

console.log('Start websocket server on the 3000 port');
const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('connection', (socket) => {
  console.log('connection');
  socket.on('message', (message) => {
    //console.log(message.toString());
    try {
      handler.process(socket, message);
    } catch (error) {
      console.log(color.error + 'Server error - ' + (error as Error).message);
      console.log(message.toString() + color.default);
    }
  });

  socket.on('error', (error) => {
    console.log('error ' + error);
  });

  socket.on('close', () => {
    console.log('close');
    handler.close(socket);
    socket.close();
  });
});
