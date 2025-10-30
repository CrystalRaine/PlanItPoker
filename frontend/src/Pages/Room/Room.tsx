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
    roomID: string,
    hostCanVote: boolean,
    hostCanReveal: boolean,
    voteAfterReveal: boolean,
    voteOptions: string[],
    voteValues: number[],
}

export type RoomData = {
    type: 'roomStatus',
    cardsRevealed: any,
    logs: any,
    config: RoomConfig,
    currentURL: string,
    members: Member[],
    client: Member
}

export default function Room(){
    const { lastMessage, register } = useWebSocket();
    const {roomID} = useParams()
    const [roomstatus, setRoomStatus] = useState<RoomData | undefined>(undefined);

    const handleMessage = (message: any) =>{
        if(!message) return;
        if(message.type === 'open' || message.type === 'close') return;
        if(message.type === 'error') return;
        setRoomStatus(JSON.parse(message.data));
    }

    useEffect(()=>{
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
                <a href='#' onClick={() => { copyURI(roomID) }}>
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

function copyURI(url: string|undefined) {
    if(!url) return;
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    navigator.clipboard.writeText(`${baseUrl}/join/${url}`).then(() => {
    
    }, () => {});
}