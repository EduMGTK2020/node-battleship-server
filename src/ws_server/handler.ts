import { RawData, WebSocket } from 'ws';
import { Packet, NoId, AddShipsDataPacket } from './types';
import {
  getRequest,
  sendResponse,
  printCommand,
  printResult,
  printServer,
} from './helpers';
import db from './db';
import { startBot } from './bot';

const handleReg = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const user = db.users.getUserByName(reqData.name);

  if (user) {
    if (user.password !== reqData.password) {
      printResult('user ' + reqData.name + ' - wrong password');
      sendResponse(socket, 'reg', {
        name: reqData.name,
        index: 0,
        error: true,
        errorText: `Wrong password`,
      });
    } else {
      if (user.isAuth && user.password != 'BOT') {
        printResult('user ' + reqData.name + ' already auth');
        sendResponse(socket, 'reg', {
          name: reqData.name,
          index: 0,
          error: true,
          errorText: `User already auth`,
        });
      } else {
        printResult('user ' + reqData.name + ' login');
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
    printResult('add new user ' + reqData.name);
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
    db.rooms.removePlayersRooms(roomCreator, user);

    updateRoom();

    const gameId = db.games.createGame(roomCreator, user);
    [roomCreator, user].map((user) => {
      sendResponse(user.connection, 'create_game', {
        idGame: gameId,
        idPlayer: user.id,
      });
    });

    printResult('user ' + user.name + ' added to room');
    printServer('send create_game for players');
  } else {
    printResult('user ' + user.name + ' is room creator and already in');
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
      game?.players.forEach((player) => {
        if (player !== user) {
          db.games.finishGame(game.id, player.id);
          sendResponse(player.connection, 'finish', {
            winPlayer: player.id,
          });
          printServer(
            'game over, winner ' + db.users.getUserById(player.id).name,
          );
          updateWinners();
        }
      });
    }
  }
};

const handleAddShips = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const game = db.games.getGameById(reqData.gameId);
  const user = db.users.getUserByConnection(socket);

  const addShipsData = JSON.parse(request.data) as AddShipsDataPacket;
  db.games.addShips(game.id, addShipsData);
  db.rooms.removePlayersRooms(game.players[0], game.players[1]);
  updateRoom();

  printResult('ships add to game for user ' + user.name);

  if (game.fields.size == 2) {
    game.players.map((player) => {
      sendResponse(player.connection, 'start_game', reqData);
      player.gameId = game.id;

      sendResponse(player.connection, 'turn', {
        currentPlayer: game.players[game.currentPlayerIndex].id,
      });
    });
    printServer('send start_game, turn for players');
  }
};

const handleAttack = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  const game = db.games.getGameById(reqData.gameId);
  const player = db.users.getUserByConnection(socket);

  if (game.players[game.currentPlayerIndex] == player) {
    const result = db.games.checkAttack(game.id, reqData.x, reqData.y);

    printResult(
      `game ${game.id} x=${reqData.x} y=${reqData.y} => ${result.attack}`,
    );

    game.players.map((p) => {
      sendResponse(p.connection, 'attack', {
        position: {
          x: reqData.x,
          y: reqData.y,
        },
        currentPlayer: player.id,
        status: result.attack,
      });
    });

    if (result.gameOver) {
      db.games.finishGame(game.id, player.id);
      game.players.map((p) => {
        sendResponse(p.connection, 'finish', {
          winPlayer: player.id,
        });
      });
      printServer('game over, winner ' + db.users.getUserById(player.id).name);
      updateWinners();
      return;
    }

    if (result.attack == 'miss') {
      game.currentPlayerIndex = 1 - game.currentPlayerIndex;
    }

    if (result.attack == 'killed') {
      const pointsToClean = db.games.getPointsToClean(game.id);

      pointsToClean.around.map((point) => {
        const pointToOpen = JSON.parse(point);
        game.players.map((p) => {
          sendResponse(p.connection, 'attack', {
            position: {
              x: pointToOpen.x,
              y: pointToOpen.y,
            },
            currentPlayer: player.id,
            status: 'miss',
          });
        });
      });
      pointsToClean.dead.map((point) => {
        const pointToKill = JSON.parse(point);
        game.players.map((p) => {
          sendResponse(p.connection, 'attack', {
            position: {
              x: pointToKill.x,
              y: pointToKill.y,
            },
            currentPlayer: player.id,
            status: 'killed',
          });
        });
      });
    }

    game.players.map((p) => {
      sendResponse(p.connection, 'turn', {
        currentPlayer: game.players[game.currentPlayerIndex].id,
      });
    });

    printServer('next move ' + game.players[game.currentPlayerIndex].name);
  } else {
    printResult('skip - other player turn');
  }
};

const handleRandomAttack = (socket: WebSocket, request: Packet) => {
  const reqData = JSON.parse(request.data);
  reqData.x = Math.round(Math.random() * 10);
  reqData.y = Math.round(Math.random() * 10);
  request.data = JSON.stringify(reqData);
  handleAttack(socket, request);
};

const handleSinglePlay = (socket: WebSocket) => {
  const user = db.users.getUserByConnection(socket);
  printServer('run bot for single play');
  startBot(user);
};

const process = (socket: WebSocket, message: RawData) => {
  const request = getRequest(message);

  printCommand(request.type);

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
  if (request.type == 'attack') {
    return handleAttack(socket, request);
  }
  if (request.type == 'randomAttack') {
    return handleRandomAttack(socket, request);
  }
  if (request.type == 'single_play') {
    return handleSinglePlay(socket);
  }
  throw new Error('Unknown message type - ' + request.type);
};

const close = (socket: WebSocket) => {
  finishOnClose(socket);
};

export default {
  process,
  close,
};
