import { WebSocket } from 'ws';

export const NoId = -1;

export const color = {
  default: '\x1b[0m',
  error: '\x1b[31m',
  server: '\x1b[32m',
  bot: '\x1b[34m',
};

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
  fields: Map<number, Ship[]>;
  currentPlayerIndex: number;
};

export type Ship = {
  points: {
    alive: string;
    dead: string[];
    around: string[];
  };
  alive: boolean;
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
  indexPlayer: number;
  ships: Position[];
};
