// import { httpServer } from '../http_server/index.js';
import { WebSocketServer } from 'ws';
import handler from './handler';
import { printError, printServer } from './helpers';

//run server UI
// const HTTP_PORT = 8181;
// console.log(`Start static http server on the ${HTTP_PORT} port!`);
// httpServer.listen(8181);

printServer(
  'Start websocket server on the 3000 port, to start game open http://localhost:8181 in browser',
);
const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('connection', (socket) => {
  printServer('client connected');
  socket.on('message', (message) => {
    //console.log(message.toString());
    try {
      handler.process(socket, message);
    } catch (error) {
      printError('error (on message): ' + (error as Error).message);
    }
  });

  socket.on('error', (error) => {
    printError('error (on error): ' + (error as Error).message);
  });

  socket.on('close', () => {
    printServer('client disconnected');
    handler.close(socket);
    socket.close();
  });
});
