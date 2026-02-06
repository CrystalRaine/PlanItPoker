import './room.css';
import { useParams } from "react-router";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useState } from "react";
import { Col, Container, Row } from 'react-bootstrap';
import Host from './Host';
import Member from './Member';



export type Member = {
    name: string,
    role: "member" | "host",
    currentChoice: string | undefined,
    voted: boolean,
}

export type RoomConfig = {
    [key: string]: any;
    roomID?: string,
    hostCanVote?: boolean,
    hostCanReveal?: boolean,
    membersCanReveal?: boolean,
    hostAnonVoting?: boolean,
    memberAnonVoting?: boolean,
    voteAfterReveal?: boolean,
    nonVoteReveal?: boolean,
    voteOptions?: string[],
    voteValues?: number[],
    resetBeforeReveal?: boolean,
    membersCanReset?: boolean,
}

export type RoomData = {
    [key: string]: any;
    type: 'roomStatus',
    cardsRevealed: any,
    logs: any,
    config: RoomConfig,
    currentURL: string,
    members: Member[],
    client: Member
}

export default function Room(){
    const { lastMessage, sendMessage, register } = useWebSocket();
    const {roomID, userID} = useParams()
    const [roomstatus, setRoomStatus] = useState<RoomData | undefined>(undefined);

    const handleMessage = (message: any) =>{

        if(!message) return;
        if(message.type === 'open' || message.type === 'close') return;
        if(message.type === 'error') return;
        // alert(JSON.stringify(message));
        setRoomStatus(JSON.parse(message.data));
    }

    useEffect(()=>{

        sendMessage(
            JSON.stringify({
                type: "join",
                input: roomID,
                username: userID,
            })
        );
        
        register((message:any)=>{
            handleMessage(message);
        })
        handleMessage(lastMessage);
    }, []);

    let userComponent; 

    if(!roomstatus) {
        userComponent = null;
    } else if(roomstatus.client.role === 'host') {
        userComponent = <Host roomstatus={roomstatus}/>;
    } else if(roomstatus.client.role === 'member') {
        userComponent = <Member roomstatus={roomstatus}/>;
    }

    return [
        <Row className='text-bg-primary'>
            <Col>
                <a href={`http://${window.location.host}/join/${roomID}`} onClick={() => { copyURL(roomID) }}>
                    <h2 className='px-3 text-bg-primary'>
                        Room ID: {roomID}
                    </h2>
                </a>
            </Col>
            <Col>
                <h2 className='px-3 text-end'>
                    {roomstatus?.client.name}
                </h2>
            </Col>
        </Row>,
        <Row className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
            <Col>
                <Container className="my-2 text-bg-secondary">
                    {userComponent}
                </Container>
            </Col>
            {roomstatus?.currentURL ? (
                <Col>
                    <Container
                        className="m-0 my-2 p-0 text-bg-secondary d-flex flex-column h-100"
                        style={{ minHeight: 0 }}
                    >
                        <iframe
                        src={roomstatus?.currentURL}
                        title="Embedded External Page"
                        width="100%"
                        style={{ flexGrow: 1, height: "100%", border: "none", minHeight: 0 }}
                        />
                    </Container>
                </Col>
            ) : null}
        </Row>
    ]
} 

export function copyURL(url: string|undefined) {
    if(!url) return;
    const baseUrl = `${window.location.protocol}//${window.location.host}` // http://address:port
    navigator.clipboard.writeText(`${baseUrl}/join/${url}`);                // add on /join/:roomID
}