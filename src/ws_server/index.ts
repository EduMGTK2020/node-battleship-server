import { httpServer } from '../http_server/index.js';
import { WebSocketServer } from 'ws';

import { printError, printServer } from './helpers';
import handler from './handler';

//run server UI
const HTTP_PORT = 8181;
printServer(`Start static http server on the ${HTTP_PORT} port`);
httpServer.listen(8181);

printServer(
  'Start websocket server on the 3000 port, to start game open http://localhost:8181 in browser',
);
const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on('connection', (socket) => {
  printServer('client connected');
  socket.on('message', (message) => {
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

process.on('SIGINT', function () {
  process.exit();
});

process.on('exit', function () {
  printServer(
    'Stopped websocket server (port 3000) and static http server (port 8181)',
  );
  httpServer.close();
  wsServer.clients.forEach((connection) => {
    connection.terminate();
  });
  wsServer.close();
});
