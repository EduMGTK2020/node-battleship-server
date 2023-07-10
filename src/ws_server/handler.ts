import { RawData, WebSocket } from 'ws';
import { Packet, NoId } from './types';
import db from './db';

const getRequest = (message: RawData) => {
  const packet = JSON.parse(message.toString());

  return {
    type: packet.type,
    data: packet.data,
    id: 0,
  } as Packet;
};

const sendResponse = (socket: WebSocket, type: string, data: object) => {
  const response = JSON.stringify({
    type: type,
    data: JSON.stringify(data),
    id: 0,
  });
  socket.send('' + response);
};

const handleReg = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const user = db.users.getUserByName(reqData.name);
  if (user) {
    if (user.password !== reqData.password) {
      sendResponse(socket, 'reg', {
        name: reqData.name,
        index: 0,
        error: true,
        errorText: `Wrong password`,
      });
    } else {
      if (user.isAuth) {
        sendResponse(socket, 'reg', {
          name: reqData.name,
          index: 0,
          error: true,
          errorText: `User already auth`,
        });
      } else {
        db.users.setAuthStatus(user.id, true);
        db.users.setUserConnection(socket, user.id);
        sendResponse(socket, 'reg', {
          name: user.name,
          index: user.id,
          error: false,
          errorText: '',
        });
      }
    }
  } else {
    const newUser = db.users.addUser(socket, reqData.name, reqData.password);

    sendResponse(socket, 'reg', {
      name: newUser.name,
      index: newUser.id,
      error: false,
      errorText: '',
    });
  }
  updateRoom();
  updateWinners();
};

const handleCreateRoom = (socket: WebSocket) => {
  db.rooms.createRoom(socket);
  updateRoom();
};

const handleAddUserToRoom = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const room = db.rooms.getRoomById(reqData.indexRoom);
  const roomCreator = room.users[0];
  const user = db.users.getUserByConnection(socket);

  if (roomCreator.id !== user.id) {
    db.rooms.removeRoomById(room.id);

    const openRooms = db.rooms.getRoomsWithOnePlayer();
    const roomIdToRemove: number[] = [];
    openRooms.map((room) => {
      const creator = room.users[0];
      if (creator == roomCreator || creator == user) {
        roomIdToRemove.push(room.id);
      }
    });
    roomIdToRemove.map((roomId) => {
      db.rooms.removeRoomById(roomId);
    });

    updateRoom();

    const gameId = db.games.createGame(roomCreator, user);
    [roomCreator, user].map((user) => {
      sendResponse(user.connection, 'create_game', {
        idGame: gameId,
        idPlayer: user.id,
      });
    });
  }
};

const updateRoom = () => {
  const roomsWithOnePlayer = db.rooms.getRoomsWithOnePlayer();

  const roomsList = roomsWithOnePlayer.map((room) => {
    return {
      roomId: room.id,
      roomUsers: [
        {
          name: room.users[0].name,
          index: room.users[0].id,
        },
      ],
    };
  });

  const users = db.users.getAllUsers();

  users.map((user) => {
    sendResponse(user.connection, 'update_room', roomsList);
  });
};

const updateWinners = () => {
  const users = db.users.getAllUsers();
  const winners = db.users.getWinners();

  users.map((user) => {
    sendResponse(user.connection, 'update_winners', winners);
  });
};

const finishOnClose = (socket: WebSocket) => {
  const user = db.users.getUserByConnection(socket);
  if (user != undefined) {
    db.users.setAuthStatus(user.id, false);
    if (user.gameId != NoId) {
      const game = db.games.getGameById(user.gameId);
      console.log(game);
      game.players.forEach((player) => {
        if (player !== user) {
          db.games.finishGame(game.id, player.id);
          console.log(player);
          sendResponse(player.connection, 'finish', {
            winPlayer: player.id,
          });
          updateWinners();
        }
      });
    }
  }
};

const handleAddShips = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const game = db.games.getGameById(reqData.gameId);

  // add ships
  console.log(request);

  game.fields.push('' + reqData.indexPlayer);

  if (game.fields.length == 2) {
    game.players.map((player) => {
      sendResponse(player.connection, 'start_game', request);
      player.gameId = game.id;

      sendResponse(player.connection, 'turn', {
        currentPlayer: game.players[0].id,
      });
    });
  }
};

const process = (socket: WebSocket, message: RawData) => {
  const request = getRequest(message);

  if (request.type == 'reg') {
    return handleReg(socket, request);
  }
  if (request.type == 'create_room') {
    return handleCreateRoom(socket);
  }
  if (request.type == 'add_user_to_room') {
    return handleAddUserToRoom(socket, request);
  }
  if (request.type == 'add_ships') {
    return handleAddShips(socket, request);
  }
};

const close = (socket: WebSocket) => {
  finishOnClose(socket);
};

export default {
  process,
  close,
};
