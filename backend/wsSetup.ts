import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { Options, Room } from './rooms.ts';

let clients = new Map<WebSocket, string>();
let rooms = new Map<string, Room>()

type Message = {
    type: string, 
    input?: string,
    username?: string,
    options?: Options,
}

let memberi = 0;

function removeMemberFromRoom(ws: WebSocket){
    if(clients.has(ws)){
        // remove from previous room if necessary
        console.log(`removing member from room ${clients.get(ws)}`);

        let roomId = getRoomId(ws)!;
        let room = getRoom(ws);
        room?.removeMember(ws);
        if(room?.members.length === 0){
            console.log("deleting empty room");
            rooms.delete(roomId);
        }
        clients.delete(ws);
    }
}

function getRoom(ws: WebSocket){
    const roomId = getRoomId(ws);
    if(roomId){
        return rooms.get(roomId);
    }
    return undefined;
}

function getRoomId(ws: WebSocket){
    return clients.get(ws);
}

export default function SetupWSS(server:http.Server) {
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws:WebSocket) => {
        ws.on('message', (message: string) => {
            const messageData:Message = JSON.parse(message);
            console.log(`Recieved ${messageData.type}`)

            switch(messageData.type){
                case "updateConfig": 
                    let optionsRoom = getRoom(ws);
                    optionsRoom?.applyOptions(ws, messageData.options);
                case "vote": 
                    let roomVote = getRoom(ws);
                    roomVote?.applyVote(ws, messageData.input);
                    break; 
                case "reveal": 
                    let roomRev = getRoom(ws);
                    roomRev?.revealChoices(ws)
                    break;
                case "clear": 
                    let roomClear = getRoom(ws);
                    roomClear?.resetChoices(ws)
                    break;
                case "join":
                    if(!messageData.username){
                        console.log("must join with a username");
                        break;
                    }

                    if(!messageData.input) {
                        break;
                    }

                    removeMemberFromRoom(ws);
                    if(rooms.has(messageData.input)){
                        const roomNum = messageData.input;
                        const memberName = `${messageData.username}`;
                        rooms.get(roomNum)!.addMember(memberName, ws);
                        clients.set(ws, roomNum);
                        console.log(`joined room ${roomNum} as ${memberName}`)
                    }
                    break;
                case "create":
                    if(!messageData.username){
                        console.log("must create with a username");
                        break;
                    }

                    if(!messageData.input) {
                        break;
                    }

                    removeMemberFromRoom(ws);
                    if(!rooms.has(messageData.input)) {
                        const roomNum = messageData.input;
                        const memberName = `${messageData.username}`;
                        let room = new Room(roomNum);
                        room.addMember(memberName, ws);
                        rooms.set(roomNum, room);
                        clients.set(ws, roomNum);
                        console.log(`created new room ${roomNum} as ${memberName}`)
                    }
                    break;
                default: 
            }
        })

        ws.on('close', () => {
            removeMemberFromRoom(ws);
        })
    });
}