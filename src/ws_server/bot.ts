import { RawData, WebSocket } from 'ws';
import { getRequest, sendResponse, printBot, printError } from './helpers';
import { User, NoId } from './types';
import db from './db';
import { getShips } from './ships';

export const startBot = (user: User) => {
  printBot('Start bot for ' + user.name);
  const client = new WebSocket('ws://localhost:3000');

  let userBotId = NoId;

  client.on('open', () => {
    sendResponse(client, 'reg', {
      name: 'BOT for ' + user.name,
      password: 'BOT',
    });
    printBot('login for bot');
  });

  client.on('message', (message: RawData) => {
    const request = getRequest(message);

    if (request.type == 'reg') {
      const reqData = JSON.parse(request.data);
      const userBot = db.users.getUserById(reqData.index);
      userBotId = reqData.index;

      const gameId = db.games.createGame(user, userBot);

      db.rooms.removePlayersRooms(userBot, user);

      [user, userBot].map((user) => {
        sendResponse(user.connection, 'create_game', {
          idGame: gameId,
          idPlayer: user.id,
        });
      });

      printBot('create game with bot');
    }
    if (request.type == 'create_game') {
      const reqData = JSON.parse(request.data);
      sendResponse(client, 'add_ships', {
        gameId: reqData.idGame,
        ships: JSON.parse(getShips()),
        indexPlayer: reqData.idPlayer,
      });
      printBot("add bot's ships");
    }
    if (request.type == 'turn') {
      const userBot = db.users.getUserById(userBotId);
      const reqData = JSON.parse(request.data);
      if (userBot.id == reqData.currentPlayer) {
        setTimeout(() => {
          sendResponse(client, 'randomAttack', {
            gameId: userBot.gameId,
            indexPlayer: userBot.id,
          });
          printBot('random bot turn');
        }, 2000);
      }
    }
    if (request.type == 'finish') {
      printBot('Finish bot for ' + user.name);
      client.close();
    }
  });

  client.on('close', () => {
    printBot('Close bot for ' + user.name);
    client.close();
  });

  client.on('error', (error: Error) => {
    printError('Error: ' + error.message);
  });

  client.on('connectFailed', (error: Error) => {
    printError('Connect Error: ' + error.message);
  });
};
