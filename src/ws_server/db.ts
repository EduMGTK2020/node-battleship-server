import { User, Room } from './types';
import { WebSocket } from 'ws';

let nextUserId = 0;
let nextRoomId = 0;

const usersData: User[] = [];
const roomsData: Room[] = [];

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
  } as User;

  usersData.push(newUser);

  return newUser;
};

const getAllUsers = () => {
  return usersData;
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

export default {
  users: {
    userExist,
    addUser,
    getAllUsers,
    getUserByConnection,
    getWinners,
  },
  rooms: { createRoom, getRoomsWithOnePlayer, getRoomById, removeRoomById },
};
