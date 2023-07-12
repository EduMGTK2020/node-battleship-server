import { User, Room, Game, NoId, AddShipsDataPacket, Ship } from './types';
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
    fields: new Map(),
    currentPlayerIndex: 0,
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

const checkAttack = (gameId: number, x: number, y: number) => {
  const game = getGameById(gameId);
  const userToAttack = game.players[1 - game.currentPlayerIndex];
  const fieldToAttack = game.fields.get(userToAttack.id) as Ship[];
  const pointToSearch = JSON.stringify({ x, y });

  const result = {
    gameOver: true,
    attack: '',
  };
  result.attack = 'miss';

  fieldToAttack.forEach((ship) => {
    if (ship.points.alive.includes(pointToSearch)) {
      result.attack = 'shot';
      ship.points.alive = ship.points.alive.replace(pointToSearch, '');
      ship.points.dead.push(pointToSearch);
      if (ship.points.alive.length == 0) {
        ship.alive = false;
        result.attack = 'killed';
      }
    }
    result.gameOver = result.gameOver && !ship.alive;
  });
  return result;
};

const addShips = (gameId: number, addShipsData: AddShipsDataPacket) => {
  const game = getGameById(gameId);
  const ships: Ship[] = [];
  addShipsData.ships.map((ship) => {
    const kx = ship.direction ? 0 : 1;
    const ky = 1 - kx;
    const x = ship.position.x;
    const y = ship.position.y;
    const len = ship.length - 1;
    let str = '';
    for (let ax = x; ax <= x + len * kx; ax++) {
      for (let ay = y; ay <= y + len * ky; ay++) {
        str += JSON.stringify({
          x: ax,
          y: ay,
        });
      }
    }

    //around cell
    const xa = ship.position.x - 1 >= 0 ? ship.position.x - 1 : 0;
    const ya = ship.position.y - 1 >= 0 ? ship.position.y - 1 : 0;
    const lena = ship.length;

    const stra: string[] = [];
    let around;
    for (let ax = xa; ax <= x + ky + lena * kx && ax < 10; ax++) {
      for (let ay = ya; ay <= y + kx + lena * ky && ay < 10; ay++) {
        around = JSON.stringify({
          x: ax,
          y: ay,
        });
        if (!str.includes(around)) {
          stra.push(around);
        }
      }
    }

    ships.push({ points: { alive: str, dead: [], around: stra }, alive: true });
  });
  game.fields.set(addShipsData.indexPlayer, ships);
};

const getPointsToClean = (
  gameId: number,
): { dead: string[]; around: string[] } => {
  const game = getGameById(gameId);
  const user = game.players[1 - game.currentPlayerIndex];
  const ships = game.fields.get(user.id) as Ship[];

  let dead: string[] = [];
  let around: string[] = [];

  ships.map((ship) => {
    console.log(ship);
    if (!ship.alive && ship.points.around.length != 0) {
      dead = ship.points.dead.slice(0);
      around = ship.points.around.slice(0);
      ship.points.dead = [];
      ship.points.around = [];
    }
  });
  return { dead, around };
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
  games: {
    createGame,
    getGameById,
    removeGameById,
    finishGame,
    checkAttack,
    addShips,
    getPointsToClean,
  },
};
