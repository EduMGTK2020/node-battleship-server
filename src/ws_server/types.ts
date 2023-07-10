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
  isAuth: boolean;

  wins: number;
  gameId: number; // -1 if not in game
};

export type Room = {
  id: number;
  users: User[];
};

export type Game = {
  id: number;
  players: User[];
  fields: string[];
};
