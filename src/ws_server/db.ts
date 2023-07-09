import { User, Room, Game } from './types';
import { WebSocket } from 'ws';

let nextUserId = 0;
let nextRoomId = 0;
let nextGameId = 0;

const usersData: User[] = [];
const roomsData: Room[] = [];
const gamesData: Game[] = [];

const userExist = (name: string) => {
  return usersData.find((user) => user.name === name) != undefined;
};

const getUserByConnection = (socket: WebSocket) => {
  return usersData.find((user) => user.connection === socket) as User;
};

const addUser = (name: string, password: string, socket: WebSocket) => {
  const userId = nextUserId;
  nextUserId++;

  const newUser = {
    name: name,
    connection: socket,
    id: userId,
    password: password,
    wins: 0,
    gameId: -1,
  } as User;

  usersData.push(newUser);

  return newUser;
};

const removeUserById = (id: number) => {
  const index = usersData.findIndex((user) => user.id === id);
  usersData.splice(index, 1);
};

const getAllUsers = () => {
  return usersData;
};

const addUserWins = (id: number) => {
  const user = usersData.find((user) => user.id === id) as User;
  user.gameId = -1;
  user.wins++;
};

const getRoomsWithOnePlayer = () => {
  return roomsData.filter((room) => room.users.length == 1);
};

const createRoom = (socket: WebSocket) => {
  const user = usersData.find((user) => user.connection === socket);
  const newRoom = {
    id: nextRoomId,
    users: [user],
  } as Room;
  roomsData.push(newRoom);
  nextRoomId++;
};

const getRoomById = (id: number) => {
  return roomsData.find((room) => room.id === id) as Room;
};

const removeRoomById = (id: number) => {
  const index = roomsData.findIndex((room) => room.id === id);
  roomsData.splice(index, 1);
};

const getWinners = () => {
  return usersData.map((user) => {
    return { name: user.name, wins: user.wins };
  });
};

const createGame = (player1: User, player2: User) => {
  const gameId = nextGameId;
  nextGameId++;
  const newGame = {
    id: gameId,
    players: [player1, player2],
    fields: [],
  } as Game;
  gamesData.push(newGame);
  return gameId;
};

const getGameById = (id: number) => {
  return gamesData.find((game) => game.id === id) as Game;
};

const removeGameById = (id: number) => {
  const index = gamesData.findIndex((game) => game.id === id);
  gamesData.splice(index, 1);
};

const finishGame = (gameId: number, winnerId: number, loserId: number) => {
  removeGameById(gameId);
  addUserWins(winnerId);
  removeUserById(loserId);
};

export default {
  users: {
    userExist,
    addUser,
    removeUserById,
    getAllUsers,
    getUserByConnection,
    getWinners,
    addUserWins,
  },
  rooms: { createRoom, getRoomsWithOnePlayer, getRoomById, removeRoomById },
  games: { createGame, getGameById, removeGameById, finishGame },
};
