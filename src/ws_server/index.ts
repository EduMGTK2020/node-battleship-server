import { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({ port: 3000 });

console.log('Start websocket server on the 3000 port');

wsServer.on('connection', (socket) => {
  console.log('connection');
  socket.on('message', (message) => {
    console.log('received: %s', message);
    socket.send('' + message);
  });

  socket.on('error', (error) => {
    console.log(error);
  });

  socket.on('close', () => {
    console.log('closed');
  });
});
