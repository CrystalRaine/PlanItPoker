# About

This is a Poker-planning web server + frontend application. many of these already exist, though they did not meet all needs my team had, so I built my own. 
The frontend of this project is written in TS/React with Bootstrap styling, and websockets for primary interaction to backend.
The backend is written in JS/TS with an express server and websockets (ws library). 

(while you are free to fork this project, if this isn't a good base for what you need, https://poker-planning.net/ is a decent alternative, and is another open source codebase for modification as well)

## Running the project

in /frontend/, run 
> npm run dev -- --host 0.0.0.0

and in /backend/ run 
> npm start

both should be accessable from LAN, backend by default, and frontend by run arguments. if you do not need network access, the frontend can be started in local mode only by omitting "-- --host 0.0.0.0"

## Frontend 

written in react, (Vite, see project config [here](frontend/vite.config.ts), or the documentation [here](https://vite.dev/guide/)) 

- [App.tsx](frontend/src/App.tsx)
	- sets up page routing with react-router-dom
	- some basic html page framing
- [Default.tsx](frontend/src/Default.tsx)
	- default example page. 
	- exists, but for testing only
- [main.tsx](frontend/src/main.tsx)
	- app root
- [websocket.tsx](frontend/src/utilities/websocket.tsx)
	- defines useWebsocket hook for use across pages.
- [Pages Folder](frontend/src/Pages/)
	- folders in this directory each define a page (called in App.tsx)
	- each folder contains it's 'namesake' .tsx file, alongside the .css file for the page specifically. 
	- folders may contain additional .tsx files for supporting React components that are re-used

## Backend 

written with express and ws websockets.

- [room.ts](backend/room.ts)
	- data structures
	- room management
- [server.js](/backend/server.js)
	- creates express server
	- sets up middleware
		- proxy planned for future developemnt
	- calls setup for websockets
- [wsSetup.ts](backend/wsSetup.ts)
	- sets up websocket
	- sets up message types for interaction with room.ts management
	- keeps track of clients
	- keeps track of rooms





