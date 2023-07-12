import { RawData, WebSocket } from 'ws';
import { getRequest, sendResponse } from './helpers';
import { User, NoId } from './types';
import db from './db';

export const startBot = (user: User) => {
  const client = new WebSocket('ws://localhost:3000');

  let userBotId = NoId;

  client.on('open', () => {
    console.log('BOT CONNECT');
    sendResponse(client, 'reg', {
      name: 'BOT for ' + user.name,
      password: 'BOT',
    });
  });

  client.on('message', (message: RawData) => {
    const request = getRequest(message);
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
        ships: [
          {
            position: { x: 2, y: 3 },
            direction: false,
            type: 'huge',
            length: 4,
          },
        ],
        indexPlayer: reqData.idPlayer,
      });
    }
    if (request.type == 'turn') {
      console.log('TURN');
      console.log(request);
      console.log(client.readyState);

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
      client.close();
    }
  });

  client.on('close', () => {
    client.close();
  });

  client.on('error', (error: Error) => {
    console.log('Error: ' + error.message);
  });

  client.on('connectFailed', (error: Error) => {
    console.log('Connect Error: ' + error.message);
  });
};
