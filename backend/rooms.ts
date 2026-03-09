import { WebSocket } from 'ws'

export class Options {
    [key: string]: any;
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

    // Setting Defaults
    roomID: string = "";
    currentURL: string = "";
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
    timerEnabled: boolean = false;
    timerStartOnReset: boolean = false;
    revealOnTimerFinish: boolean = false;
    timerStartTimestamp: number = 0;
    timerLength: number = 30;
    primaryColor: string = "#165fa7";
    secondaryColor: string = "#828282";
    notVotedColor: string = "#bb2828";
    votedColor: string = "#8a9216";
    revealedColor: string = "#44714a";
    showAvg: boolean = true;
    showBar: boolean = false;
    showCards: boolean = true;
    showVoteCount: boolean = false;
    showBarLive: boolean = false;
    showLiveCards: boolean = false;

    public constructor(roomID: string){
        this.roomID = roomID;
    }

    value(){
        return {
            roomID: this.roomID,
            currentURL: this.currentURL,

            // roles
            hostCanVote: this.hostCanVote,
            hostCanReveal: this.hostCanReveal,
            membersCanReset: this.membersCanReset,
            membersCanReveal: this.membersCanReveal,

            // voting
            voteOptions: this.voteOptions,
            voteValues: this.voteValues,
            voteAfterReveal: this.voteAfterReveal,
            hostAnonVoting: this.hostAnonVoting,
            memberAnonVoting: this.memberAnonVoting,
            showLiveCards: this.showLiveCards,
            resetBeforeReveal: this.resetBeforeReveal,
            nonVoteReveal: this.nonVoteReveal,

            // timer
            timerEnabled: this.timerEnabled,
            timerStartTimestamp: this.timerStartTimestamp,
            timerStartOnReset: this.timerStartOnReset,
            revealOnTimerFinish: this.revealOnTimerFinish,
            timerLength: this.timerLength,

            // styling
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            notVotedColor: this.notVotedColor,
            votedColor: this.votedColor,
            revealedColor: this.revealedColor,

            // vote modes
            showBar: this.showBar,
            showAvg: this.showAvg,
            showCards: this.showCards,
            showBarLive: this.showBarLive,
            showVoteCount: this.showVoteCount,
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
        let choice = (revealed || ws === this.ws) ? this.currentChoice : null;
        
        return {
            name: this.name,
            currentChoice: choice,
            voted: !(!this.currentChoice),
            role: this.role
        }
    }
}

export class Room {
    members: Member[] = [];
    config: RoomConfiguration;
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
        if(!(!this.cardsRevealed || (this.cardsRevealed && (this.config.voteAfterReveal && !(this.config.showBarLive && this.config.showBar))))) {
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
        this.config.timerStartTimestamp = 0;
        this.broadcastRoomStatus();
    }

    addMember(name: string, ws: WebSocket | null, asAdmin: boolean){

        if(this.members.find(member => member.ws === ws)) {
            return;
        }

        // if it's the host joining or re-joining, attach to host member
        // this bypasses the as admin check so a host can 'join' a room they created
        let host:Member|undefined = this.members.find(member => member.role === 'host');
        if(host && !host.ws && host.name === name) {
            host.ws = ws;
            this.broadcastRoomStatus();
            return;
        }

        let member = new Member(name, ws);
        if(asAdmin && !host) {
            member.makeHost();
            this.logAction(null, "host joined");
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
        if(!this.cardsRevealed && !(this.config.resetBeforeReveal || (this.config.showBarLive && this.config.showBar))){
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
                return member.value(ws, (this.cardsRevealed || this.config.showLiveCards || (this.config.showBarLive && this.config.showBar)))
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
            members: memberList,
            client: clientMember?.value(ws, this.cardsRevealed),
        }
    }

    broadcastRoomStatus(){
        this.members.filter(member => member.ws).forEach(member => member.ws!.send(JSON.stringify(this.roomStatus(member.ws!))));
    }
}