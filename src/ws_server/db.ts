import { User, Room, Game, NoId } from './types';
import { WebSocket } from 'ws';

let nextUserId = 0;
let nextRoomId = 0;
let nextGameId = 0;

const usersData: User[] = [];
const roomsData: Room[] = [];
const gamesData: Game[] = [];

const getUserByName = (name: string) => {
  return usersData.find((user) => user.name === name) as User;
};

const getUserById = (id: number) => {
  return usersData.find((user) => user.id === id) as User;
};

const getUserByConnection = (socket: WebSocket) => {
  return usersData.find((user) => user.connection === socket) as User;
};

const addUser = (socket: WebSocket, name: string, password: string) => {
  const userId = nextUserId;
  nextUserId++;

  const newUser = {
    name: name,
    connection: socket,
    id: userId,
    password: password,
    wins: 0,
    gameId: NoId,
    roomId: NoId,
    isAuth: true,
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
  const user = getUserById(id);
  user.gameId = NoId;
  user.wins++;
};

const setAuthStatus = (id: number, status: boolean) => {
  const user = getUserById(id);
  user.isAuth = status;
};

const setUserConnection = (socket: WebSocket, id: number) => {
  const user = getUserById(id);
  user.connection = socket;
  user.gameId = NoId;
  user.roomId = NoId;
};

const getRoomsWithOnePlayer = () => {
  return roomsData.filter((room) => room.users.length == 1);
};

const createRoom = (socket: WebSocket) => {
  const user = getUserByConnection(socket);
  if (user.roomId == NoId) {
    const newRoom = {
      id: nextRoomId,
      users: [user],
    } as Room;
    user.roomId = nextRoomId;
    roomsData.push(newRoom);
    nextRoomId++;
  }
};

const getRoomById = (id: number) => {
  return roomsData.find((room) => room.id === id) as Room;
};

const removeRoomById = (id: number) => {
  const room = getRoomById(id);
  room.users[0].roomId = NoId;

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

const finishGame = (gameId: number, winnerId: number) => {
  removeGameById(gameId);
  addUserWins(winnerId);
};

export default {
  users: {
    addUser,
    getUserById,
    getUserByName,
    getUserByConnection,
    setUserConnection,
    removeUserById,
    getAllUsers,

    getWinners,
    addUserWins,
    setAuthStatus,
  },
  rooms: { createRoom, getRoomsWithOnePlayer, getRoomById, removeRoomById },
  games: { createGame, getGameById, removeGameById, finishGame },
};
