# RSSchool NodeJS websocket task template
> Static http server and base task packages. 
> By default WebSocket client tries to connect to the 3000 port.

## Installation
1. Clone/download repo
2. `npm install`

## Usage
**Development**

`npm run start:dev`

* App served @ `http://localhost:8181` with nodemon

**Production**

`npm run start`

* App served @ `http://localhost:8181` without nodemon

---

**A few important notes**

- the server for Player interface is started automatically when websocket server is started  
- at one moment of time user can create only one game room and wait for another player in it
- after the second player is added to the room, the game room created by him (if it exists) is deleted.
- the choice of player for the first move is random  
- if one of the players left the game for any reason (e.g. reloaded the page) the other player becomes the winner.  

- a separate bot is created for each user
- the bot's playing field is selected for each game randomly from predefined 10 variants.
- the bot thinks about its move for about 2 seconds
- the bot is not very smart so it always attacks randomly :)

**Message colors**
 
- green - server  
- blue - bot
- white - server (commands and their results)
- red - errors


