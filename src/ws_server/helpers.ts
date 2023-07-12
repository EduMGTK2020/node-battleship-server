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

export const consoleLog = (type: string, message: string) => {
  let colorType = '';
  switch (type) {
    case 'server':
      colorType = color.system;
      break;
    case 'bot':
      colorType = color.user;
      break;
    case 'error':
      colorType = color.error;
      break;
    default:
      colorType = color.default;
  }
  console.log(colorType + message + color.default);
};
