import { Button, Col, Container, Form, Row } from "react-bootstrap";
import type { Member, RoomData } from "./Room";
import { useWebSocket } from "../../utilities/websocket";
import { useState, type JSX } from "react";

export function PlayerStatuses(props: {roomstatus:RoomData}){
    let playerCards:any = [];

    props.roomstatus.members.forEach((memberData)=>{
        if(memberData.role === 'host' && !props.roomstatus.config.hostCanVote){
            return;
        }
        playerCards.push(<PlayerInfoCard playerData={memberData} roomData={props.roomstatus}/>)
    });

    return (
        <Row className="justify-content-center rowPadding">
            {playerCards}
        </Row>
    )
}

function PlayerInfoCard(props: {playerData:Member, roomData:RoomData}) {

    const classes = "points text-center " + (props.playerData.voted ? (props.roomData.cardsRevealed ? "text-bg-success" : "text-bg-warning") : "text-bg-danger");

    return (
        <Col className="col-2 playerCard">
            <Container className={classes}>
                <p>
                    {props.playerData.voted ? props.playerData.currentChoice : ""}
                </p>
            </Container>
            <div className="playerName text-center">
                {props.playerData.name}
            </div>
        </Col>
    )
}


export function ChoiceCards(props: {roomstatus: RoomData}) {

    if(props.roomstatus.client.role === "host" && !props.roomstatus.config.hostCanVote) {
        return undefined;
    }

    let cards = [];

    for(let i = 0; i < props.roomstatus.config.voteOptions.length; i++) {
        cards.push(
            <ChoiceCard 
                optionName={props.roomstatus.config.voteOptions[i]} 
                voteValue={props.roomstatus.config.voteValues[i]}
            />
        );
    }

    return (
        <Row className="justify-content-center rowPadding">
            {cards}
        </Row>
    );

}

function ChoiceCard(props: {optionName: string, voteValue: number}) {
    const { sendMessage } = useWebSocket();

    
    return (
        <Col className="d-flex justify-content-center playerCard">
            <Button onClick={()=>{
                sendMessage(JSON.stringify({
                    type: "vote",
                    input: props.optionName,
                }));
            }}>
                <p className="text-center text-bg-primary choices">
                    {props.optionName}
                </p>
            </Button>
        </Col>
    );
}

export function RoomInteractions(props: {roomstatus:RoomData}) {

    let allVoted = true;

    props.roomstatus.members.forEach((member)=>{
        if(member.role === 'host' && !props.roomstatus.config.hostCanVote){
            return;
        }

        if(!member.voted) {
            allVoted = false;
        }
    });


    let reveal: JSX.Element | undefined = <RevealButton/>;
    let reset: JSX.Element | undefined = <ResetButton/>;




    if(props.roomstatus.cardsRevealed) {
        reveal = undefined
    }

    if(!allVoted) {
        reveal = undefined;
    }

    if(props.roomstatus.client.role === "host" && !props.roomstatus.config.hostCanReveal) {
        reveal = undefined;
    }

    return (
        <Row className="justify-content-center rowPadding">
            {reveal}
            {reset}
        </Row>
    )
}

function RevealButton(){
    const { sendMessage } = useWebSocket();
    
    return (
        <Col className="d-flex justify-content-center">
            <Button onClick={()=>{
                sendMessage(JSON.stringify({
                    type: "reveal",
                }));
            }}>
                <p className="text-center text-bg-primary interactionButton">
                    Reveal
                </p>
            </Button>
        </Col>
    )
}

function ResetButton(){
    const { sendMessage } = useWebSocket();
    
    return (
        <Col className="d-flex justify-content-center">
            <Button onClick={()=>{
                sendMessage(JSON.stringify({
                    type: "clear",
                }));
            }}>
                <p className="text-center text-bg-primary interactionButton">
                    Reset
                </p>
            </Button>
        </Col>
    )
}

export function AverageDisplay(props: {roomstatus:RoomData}){

    if(!props.roomstatus.cardsRevealed) {
        return;
    }

    let avg = 0;
    let votingMembers = 0;

    props.roomstatus.members.forEach((member)=>{
        if(!member.currentChoice){
            return;
        }
        avg += props.roomstatus.config.voteValues[props.roomstatus.config.voteOptions.indexOf(member.currentChoice)];
        votingMembers++;
    });

    if(votingMembers === 0) {
        avg = 0;
    } else {
        avg = avg / votingMembers;
    }

    const avgstr = avg.toFixed(2);

    return (
        <Row className="justify-content-center rowPadding">
            <Col className="d-flex justify-content-center">
                <p className="text-center interactionButton">
                    Average: {avgstr}
                </p>
            </Col>
        </Row>
    )
}

export function HostOptions(props: {roomstatus: RoomData}){
    const [options, setOptions] = useState(props.roomstatus.config.voteOptions.join(",")); 
    const [values, setValues] = useState(props.roomstatus.config.voteValues.join(",")); 
    const [link, setLink] = useState(props.roomstatus.currentURL); 
    const [hostVotes, setHostVote] = useState(props.roomstatus.config.hostCanVote); 
    const [hostReveal, setHostReveal] = useState(props.roomstatus.config.hostCanReveal); 
    const [voteAfterReveal, setVoteAfterReveal] = useState(props.roomstatus.config.voteAfterReveal); 
    const { sendMessage } = useWebSocket();

    return [
        <Row className="justify-content-center">
            <Col>
                <Form.Label>
                    Display Link: 
                </Form.Label>
                <Form.Control
                    type="text"
                    placeholder="URL"
                    onChange={(event) => setLink(event.target.value)}
                    value={link}
                    className="mb-3"
                />
            </Col>
            <Col className="col-1">
                <Button className="buttonMTop" onClick={()=>{
                    sendMessage(JSON.stringify({
                        type: "updateConfig",
                        options: {
                            currentURL: link,
                        }
                    }))
                }}>
                    Send
                </Button>
            </Col>
        </Row>,
        <Row className="justify-content-center">
            <Col>
                <Form.Label>
                    Options: 
                </Form.Label>
                <Form.Control
                type="text"
                placeholder="Username"
                onChange={(event) => setOptions(event.target.value)}
                value={options}
                className="mb-3"
            />
            </Col>
            <Col>
                <Form.Label>
                    Values: 
                </Form.Label>
                <Form.Control
                type="text"
                placeholder="Username"
                onChange={(event) => setValues(event.target.value)}
                value={values}
                className="mb-3"
            />
            </Col>
            <Col className="col-1">
                <Button className="buttonMTop" onClick={()=>{
                    sendMessage(JSON.stringify({
                        type: "updateConfig",
                        options: {
                            voteOptions: options.replaceAll(" ", "").split(','),
                            voteValues: values.replaceAll(" ", "").split(',').map((value)=>Number.parseFloat(value)),
                        }
                    }))
                }}>
                    Update
                </Button>
            </Col>
        </Row>,
        <Row className="justify-content-center">
            <Col>
                <Form.Check
                    inline
                    checked={hostVotes}
                    onChange={(event)=>{
                        setHostVote(event.target.checked);
                        sendMessage(JSON.stringify({
                            type: "updateConfig",
                            options: {
                                hostCanVote: event.target.checked,
                            }
                        }))
                    }}
                />
                Host Is Voting Member
            </Col>
            <Col>
                <Form.Check
                    inline
                    checked={hostReveal}
                    onChange={(event)=>{
                        setHostReveal(event.target.checked);
                        sendMessage(JSON.stringify({
                            type: "updateConfig",
                            options: {
                                hostCanReveal: event.target.checked,
                            }
                        }))
                    }}
                />
                Host Can Reveal
            </Col>
            <Col>
                <Form.Check
                    inline
                    checked={voteAfterReveal}
                    onChange={(event)=>{
                        setVoteAfterReveal(event.target.checked);
                        sendMessage(JSON.stringify({
                            type: "updateConfig",
                            options: {
                                voteAfterReveal: event.target.checked,
                            }
                        }))
                    }}
                />
                Can Vote After Reveal
            </Col>
        </Row>
    ];

}