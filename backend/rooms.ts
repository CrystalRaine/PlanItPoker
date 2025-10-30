import { WebSocket } from 'ws'

export class Options {
    roomID?: string;
    hostCanVote?: boolean;
    hostCanReveal?: boolean;
    voteAfterReveal?: boolean;
    voteOptions?: string[];
    voteValues?: number[];
    currentURL?: string;
}

export class LogItem {
    username: string;
    action: string;
    timestamp: Date;

    public constructor(username: string, action: string){
        this.timestamp = new Date(Date.now());
        this.action = action;
        this.username = username;
    }

    value(){
        return `${this.timestamp.toISOString()}: ${this.username} ${this.action}`
    }
}

export class RoomConfiguration {
    roomID: string = "";
    hostCanVote: boolean = true;
    hostCanReveal: boolean = true;
    voteAfterReveal: boolean = false;
    voteOptions: string[] = ["0", "1/2", "1", "2", "3", "5", "8", "13"];
    voteValues: number[] = [0,0.5,1,2,3,5,8,13];

    public constructor(roomID: string){
        this.roomID = roomID;
    }

    value(){
        return {
            roomID: this.roomID,
            hostCanVote: this.hostCanVote,
            hostCanReveal: this.hostCanReveal,
            voteOptions: this.voteOptions,
            voteValues: this.voteValues,
            voteAfterReveal: this.voteAfterReveal
        }
    }
}

export class Member {
    name: string;
    ws: WebSocket;
    currentChoice: string | undefined;
    role: "member" | "host";

    public constructor(name: string, ws: WebSocket){
        this.name = name;
        this.ws = ws;
        this.currentChoice = undefined;
        this.role = "member";
    }
    
    makeHost(){
        this.role = "host";
    }

    setVote(vote: string){
        this.currentChoice = vote;
    }

    value(ws: WebSocket, revealed: boolean){
        let choice = revealed || ws === this.ws ? this.currentChoice : null;
        
        return {
            name: this.name,
            currentChoice: choice ? choice : null,
            voted: !(!this.currentChoice), 
            role: this.role
        }
    }
}

export class Room {
    members: Member[] = [];
    config: RoomConfiguration;
    currentURL: string = "";
    logs: LogItem[] = [];
    cardsRevealed: boolean = false;

    public constructor(roomID: string){
        this.members = [];
        this.config = new RoomConfiguration(roomID);
    }

    logAction(ws: WebSocket, action:string){
        const member = this.getMember(ws);
        this.logs.push(new LogItem(member!.name, action));
    }

    applyOptions(ws: WebSocket, options: Options | undefined) {
        if(!(this.getMember(ws)?.role === "host")) {
            return;
        }

        if(options?.hostCanReveal !== undefined) {
            this.config.hostCanReveal = options.hostCanReveal;
        }

        if(options?.hostCanVote !== undefined) {
            this.config.hostCanVote = options.hostCanVote;
        }

        if(options?.voteAfterReveal !== undefined) {
            this.config.voteAfterReveal = options.voteAfterReveal;
        }

        if(options?.voteOptions) {
            this.config.voteOptions = options.voteOptions;
        }

        if(options?.voteValues) {
            this.config.voteValues = options.voteValues;
        }

        if(options?.currentURL !== undefined) {
            this.currentURL = options.currentURL;
        }

        this.broadcastRoomStatus();
    }

    applyVote(ws: WebSocket, vote?: string){
        if(!vote) {
            return;
        }
        if(!this.config.hostCanVote && this.getMember(ws)?.role === "host"){
            console.log("host cannot vote");
            return;
        }
        if(!(!this.cardsRevealed || (this.cardsRevealed && this.config.voteAfterReveal))) {
            console.log("cannot vote when cards are revealed");
            return;
        }
        if(!this.config.voteOptions.find((opt)=>opt === vote)){
            console.log("invalid vote option");
            return
        }
     
        this.logAction(ws, "voted");
        this.getMember(ws)?.setVote(vote);
        this.broadcastRoomStatus();
    }

    revealChoices(ws: WebSocket){
        if(!this.config.hostCanReveal && this.getMember(ws)?.role === "host"){
            console.log("host cannot reveal");
            return;
        }
        this.logAction(ws, "revealed cards");
        this.cardsRevealed = true;
        this.broadcastRoomStatus();
    }

    addMember(name: string, ws: WebSocket){
        let member = new Member(name, ws);
        if(this.members.length === 0) {
            member.makeHost();
        }
        this.members.push(member);
        this.logAction(ws, "joined");
        this.broadcastRoomStatus();
    }

    removeMember(ws: WebSocket){
        this.logAction(ws, "left");
        let member = this.getMember(ws);
        this.members = this.members.filter(member => {return (member.ws !== ws)})
        if(member?.role === "host" && this.members.length > 0){
            this.members[0].makeHost();
        }
        this.broadcastRoomStatus();
    }

    getMember(ws: WebSocket){
        return this.members.find((member) => member.ws === ws);
    }

    listMembers(){
        return this.members.map((member)=>member.name);
    }

    broadcast(message:any){
        this.members.forEach(member => member.ws.send(JSON.stringify(message)));
    }

    resetChoices(ws: WebSocket){
        if(!(this.getMember(ws)?.role === "host") && !this.cardsRevealed){
            return;
        }
        this.members.forEach((member: Member)=>{
            member.currentChoice = undefined;
        })
        this.logAction(ws, "reset voting");
        this.cardsRevealed = false;
        this.broadcastRoomStatus();
    }

    roomStatus(ws: WebSocket){
        return {
            type: "roomStatus",
            cardsRevealed: this.cardsRevealed,
            logs: this.logs.map((logItem)=>logItem.value()),
            config: this.config.value(),
            currentURL: this.currentURL,
            members: this.members.map(member => member.value(ws, this.cardsRevealed)),
            client: this.getMember(ws)?.value(ws, this.cardsRevealed),
        }
    }

    broadcastRoomStatus(){
        this.members.forEach(member => member.ws.send(JSON.stringify(this.roomStatus(member.ws))));
    }
}