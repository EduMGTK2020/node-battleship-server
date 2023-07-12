import { RawData, WebSocket } from 'ws';
import { Packet } from './types';

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
