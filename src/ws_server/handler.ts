import { RawData, WebSocket } from 'ws';
import { Packet, User } from './types';
import db from './db';

const getRequest = (message: RawData) => {
  const packet = JSON.parse(message.toString());

  return {
    type: packet.type,
    data: packet.data,
    id: 0,
  } as Packet;
};

const putResponce = (socket: WebSocket, data: string) => {
  socket.send('' + data);
};

const handleReg = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  if (db.users.userExist(reqData.name)) {
    putResponce(
      socket,
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: reqData.name,
          index: 0,
          error: true,
          errorText: `User <${reqData.name}> already exist`,
        }),
        id: 0,
      }),
    );
  } else {
    const newUser = db.users.addUser(reqData.name, reqData.password, socket);
    putResponce(
      socket,
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: newUser.name,
          index: newUser.id,
          error: false,
          errorText: '',
        }),
        id: 0,
      }),
    );
    updateRoom();
    updateWinners();
  }
};

const handleCreateRoom = (socket: WebSocket) => {
  db.rooms.createRoom(socket);
  updateRoom();
};

const handleAddUserToRoom = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const room = db.rooms.getRoomById(reqData.indexRoom);
  const roomUser = room.users[0];
  const user = db.users.getUserByConnection(socket);

  if (roomUser.id !== user.id) {
    db.rooms.removeRoomById(room.id);
    updateRoom();
    const gameId = db.games.createGame(roomUser, user);

    [roomUser, user].map((user) => {
      putResponce(
        user.connection,
        JSON.stringify({
          type: 'create_game',
          data: JSON.stringify({
            idGame: gameId,
            idPlayer: user.id,
          }),
          id: 0,
        }),
      );
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
    putResponce(
      user.connection,
      JSON.stringify({
        type: 'update_room',
        data: JSON.stringify(roomsList),
        id: 0,
      }),
    );
  });
};

const updateWinners = () => {
  const users = db.users.getAllUsers();
  const winners = db.users.getWinners();

  users.map((user) => {
    putResponce(
      user.connection,
      JSON.stringify({
        type: 'update_winners',
        data: JSON.stringify(winners),
        id: 0,
      }),
    );
  });
};

const finishOnClose = (socket: WebSocket) => {
  const user = db.users.getUserByConnection(socket);
  if (user && user.gameId != -1) {
    const game = db.games.getGameById(user.gameId);
    game.players.forEach((player) => {
      if (player !== user) {
        db.games.finishGame(game.id, player.id, user.id);
        putResponce(
          player.connection,
          JSON.stringify({
            type: 'finish',
            data: JSON.stringify({
              winPlayer: player.id,
            }),
            id: 0,
          }),
        );
        updateWinners();
      }
    });
  }
};

const handleAddShips = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const game = db.games.getGameById(reqData.gameId);
  game.fields.push('' + reqData.indexPlayer);

  if (game.fields.length == 2) {
    game.players.map((player) => {
      putResponce(
        player.connection,
        JSON.stringify({
          type: 'start_game',
          data: request,
          id: 0,
        }),
      );
      player.gameId = game.id;
    });

    putResponce(
      game.players[0].connection,
      JSON.stringify({
        type: 'turn',
        data: JSON.stringify({
          currentPlayer: game.players[0].id,
        }),
        id: 0,
      }),
    );
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
