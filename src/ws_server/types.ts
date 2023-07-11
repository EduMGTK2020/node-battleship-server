import { WebSocket } from 'ws';

export const NoId = -1;

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
  roomId: number; // -1 if not in room
};

export type Room = {
  id: number;
  users: User[];
};

export type Game = {
  id: number;
  players: User[];
  fields: Map<number, string>;
  currentPlayerIndex: number;
};

export type Ships = {
  id: number;
};

export type Position = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  type: string;
  length: number;
};

export type AddShipsDataPacket = {
  ships: Position[];
};
