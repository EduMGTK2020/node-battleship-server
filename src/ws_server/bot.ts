import { RawData, WebSocket } from 'ws';
import { getRequest, sendResponse, printBot, printError } from './helpers';
import { User, NoId } from './types';
import db from './db';
import { getShips } from './ships';

export const startBot = (user: User) => {
  const client = new WebSocket('ws://localhost:3000');

  let userBotId = NoId;

  client.on('open', () => {
    printBot('Start bot for ' + user.name);
    sendResponse(client, 'reg', {
      name: 'BOT for ' + user.name,
      password: 'BOT',
    });
  });

  client.on('message', (message: RawData) => {
    const request = getRequest(message);

    printBot('Handle message - ' + request.type);

    if (request.type == 'reg') {
      const reqData = JSON.parse(request.data);
      const userBot = db.users.getUserById(reqData.index);
      userBotId = reqData.index;

      const gameId = db.games.createGame(user, userBot);
      [user, userBot].map((user) => {
        sendResponse(user.connection, 'create_game', {
          idGame: gameId,
          idPlayer: user.id,
        });
      });
    }
    if (request.type == 'create_game') {
      const reqData = JSON.parse(request.data);
      sendResponse(client, 'add_ships', {
        gameId: reqData.idGame,
        ships: JSON.parse(getShips()),
        indexPlayer: reqData.idPlayer,
      });
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
