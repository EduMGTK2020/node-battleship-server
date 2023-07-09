import { WebSocket } from 'ws';

export type Packet = {
  type: string;
  data: string;
  id: number;
};

export type User = {
  connection: WebSocket;
  id: number;
  name: string;
  password: string;

  wins: number;
  inGame: boolean;
};

export type Room = {
  id: number;
  users: User[];
};
