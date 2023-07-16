import { RawData, WebSocket } from 'ws';
import { Packet, color } from './types';

export const getRequest = (message: RawData) => {
  const packet = JSON.parse(message.toString());

  return {
    type: packet.type,
    data: packet.data,
    id: 0,
  } as Packet;
};

export const sendResponse = (socket: WebSocket, type: string, data: object) => {
  const response = JSON.stringify({
    type: type,
    data: JSON.stringify(data),
    id: 0,
  });
  socket.send('' + response);
};

export const printServer = (message: string) => {
  console.log(color.server + '[server] ' + message + color.default);
};

export const printBot = (message: string) => {
  console.log(color.bot + '[bot] ' + message + color.default);
};

export const printError = (message: string) => {
  console.log(color.error + '[error] ' + message + color.default);
};

export const print = (message: string) => {
  console.log('[handler] ' + message);
};
