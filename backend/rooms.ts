import { WebSocket } from 'ws'

export class Options {
    [key: string]: any;
    roomID?: string;
    hostCanVote?: boolean;
    hostCanReveal?: boolean;
    voteAfterReveal?: boolean;
    voteOptions?: string[];
    voteValues?: number[];
    currentURL?: string;
    hostAnonVoting?: boolean;
    memberAnonVoting?: boolean;
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
    [key: string]: any;
    // Defaults
    roomID: string = "";
    hostCanVote: boolean = true;
    hostCanReveal: boolean = true;
    membersCanReveal: boolean = false;
    voteAfterReveal: boolean = false;
    voteOptions: string[] = ["0", "1/2", "1", "2", "3", "5", "8", "13"];
    voteValues: number[] = [0,0.5,1,2,3,5,8,13];
    hostAnonVoting: boolean = true;
    memberAnonVoting: boolean = true;
    resetBeforeReveal: boolean = false;
    membersCanReset: boolean = false;
    nonVoteReveal: boolean = false;

    public constructor(roomID: string){
        this.roomID = roomID;
    }

    value(){
        return {
            roomID: this.roomID,
            hostCanVote: this.hostCanVote,
            hostCanReveal: this.hostCanReveal,
            membersCanReset: this.membersCanReset,
            membersCanReveal: this.membersCanReveal,
            voteOptions: this.voteOptions,
            voteValues: this.voteValues,
            voteAfterReveal: this.voteAfterReveal,
            hostAnonVoting: this.hostAnonVoting,
            memberAnonVoting: this.memberAnonVoting,
            resetBeforeReveal: this.resetBeforeReveal,
            nonVoteReveal: this.nonVoteReveal,
        }
    }
}

export class Member {
    name: string;
    ws: WebSocket | null;
    currentChoice: string | undefined;
    role: "member" | "host";

    public constructor(name: string, ws: WebSocket | null){
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

    logAction(ws: WebSocket | null, action:string){
        if(ws){
            const member = this.getMember(ws);
            this.logs.push(new LogItem(member!.name, action));
        } else {
            this.logs.push(new LogItem("host", action));
        }
    }

    applyOptions(ws: WebSocket, options: Options | undefined) {
        if(!(this.getMember(ws)?.role === "host") || !options) {
            return;
        }

        const keys = Object.keys(options)

        keys.forEach((value)=>{
            this.config[value] = options[value];            
        });

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
        if(!this.config.membersCanReveal && this.getMember(ws)?.role !== "host"){
            console.log("members cannot reveal");
            return;
        }
        this.logAction(ws, "revealed cards");
        this.cardsRevealed = true;
        this.broadcastRoomStatus();
    }

    addMember(name: string, ws: WebSocket | null){

        // if it's the host joining or re-joining, attach to host member
        let host:Member|undefined = this.members.find(member => member.role === 'host');
        if(host && !host.ws && host.name === name) {
            host.ws = ws;
            this.broadcastRoomStatus();
            return;
        }

        let member = new Member(name, ws);
        if(this.members.length === 0) {
            member.makeHost();
            this.logAction(null, "created the room");
        }

        this.members.push(member);
        this.logAction(ws, "Joined");

        this.broadcastRoomStatus();
    }

    removeMember(ws: WebSocket){
        this.logAction(ws, "left");
        let member = this.getMember(ws);

        // hosts don't actually get removed, just disjointed from the member.
        if(member?.role === 'host') {
            member.ws = null;
        } else {
            this.members = this.members.filter(member => {return (member.ws !== ws)})
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
        this.members.filter(member => member.ws).forEach(member => member.ws!.send(JSON.stringify(message)));
    }

    resetChoices(ws: WebSocket){
        if(!this.cardsRevealed && !this.config.resetBeforeReveal){
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

        const clientMember = this.getMember(ws);
        let memberList = this.members
            .filter((member) => member.ws !== ws)
            .map(member => {
                return member.value(ws, this.cardsRevealed)
            });
        
        if(clientMember?.role === 'host' && !this.config.hostAnonVoting) {
            memberList = memberList.map((member)=>{
                member.name = "";
                return member;
            });
        }

        if(clientMember?.role !== 'host' && !this.config.memberAnonVoting) {
            memberList = memberList.map((member)=>{
                member.name = "";
                return member;
            });
        }

        return {
            type: "roomStatus",
            cardsRevealed: this.cardsRevealed,
            logs: this.logs.map((logItem)=>`${logItem.value()}`),
            config: this.config.value(),
            currentURL: this.currentURL,
            members: memberList,
            client: clientMember?.value(ws, this.cardsRevealed),
        }
    }

    broadcastRoomStatus(){
        this.members.filter(member => member.ws).forEach(member => member.ws!.send(JSON.stringify(this.roomStatus(member.ws!))));
    }
}