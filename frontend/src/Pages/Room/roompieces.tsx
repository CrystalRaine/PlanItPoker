import { Button, Col, Container, Form, Row, Toast, ToastContainer } from "react-bootstrap";
import { copyURL, type Member, type RoomConfig, type RoomData } from "./Room";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useState, type JSX } from "react";
import { useParams } from "react-router-dom";

export function PlayerStatuses(props: {roomstatus:RoomData}){
    let playerCards:any = [];

    if(!(!props.roomstatus.config.hostCanVote && props.roomstatus.client.role === 'host')) {
        playerCards.push(<PlayerInfoCard playerData={props.roomstatus.client} roomData={props.roomstatus} highlight={true}/>)
    }
    props.roomstatus.members.forEach((memberData)=>{
        if(memberData.role === 'host' && !props.roomstatus.config.hostCanVote){
            return;
        }
        playerCards.push(<PlayerInfoCard playerData={memberData} roomData={props.roomstatus} highlight={false}/>)
    });

    return (
        <Row className="justify-content-center rowPadding">
            {playerCards}
        </Row>
    )
}

function PlayerInfoCard(props: {playerData:Member, roomData:RoomData, highlight: boolean}) {

    const classes = "points text-center " + 
        (props.playerData.voted ? (props.roomData.cardsRevealed ? "text-bg-success " : "text-bg-warning ") : "text-bg-danger ") + 
        (props.highlight ? "border border-info " : " ");

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

    for(let i = 0; i < props.roomstatus.config.voteOptions!.length; i++) {
        cards.push(
            <ChoiceCard 
                optionName={props.roomstatus.config.voteOptions![i]} 
                voteValue={props.roomstatus.config.voteValues![i]}
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
    let copyJoinLink: JSX.Element | undefined = <CopyJoinLink/>;

    if(props.roomstatus.cardsRevealed) {
        reveal = undefined
    }

    if(!allVoted) {
        reveal = undefined;
    }

    if(props.roomstatus.client.role === "host" && !props.roomstatus.config.hostCanReveal) {
        reveal = undefined;
    }

    if(props.roomstatus.client.role !== "host") {
        copyJoinLink = undefined;
    }

    if(!props.roomstatus.config.resetBeforeReveal && !props.roomstatus.cardsRevealed) {
        reset = undefined;
    }

    return (
        <Row className="justify-content-center rowPadding">
            {reveal}
            {reset}
            {copyJoinLink}
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

function CopyJoinLink(){
    
    const {roomID} = useParams()
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (showToast) {
        const timer = setTimeout(() => {
            setShowToast(false);
        }, 2000); // Hide after 2 seconds

        return () => clearTimeout(timer); // Clean up the timer
        }
    }, [showToast]);

    return (
        <Col className="d-flex justify-content-center">
            <Button onClick={()=>{
                copyURL(roomID);
                setShowToast(true);
            }}>
                <p className="text-center text-bg-primary interactionButton">
                    Copy Join Link
                </p>
            </Button>
            <ToastContainer>
                <Toast
                    onClose={()=>setShowToast(false)}
                    show={showToast} 
                    delay={2000} 
                    autohide
                >
                    <Toast.Header>
                        <strong>Copied!</strong>
                    </Toast.Header>
                </Toast>
            </ToastContainer>
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
        avg += props.roomstatus.config.voteValues![props.roomstatus.config.voteOptions!.indexOf(member.currentChoice)];
        votingMembers++;
    });

    if(!props.roomstatus.client.currentChoice){
        return;
    }
    avg += props.roomstatus.config.voteValues![props.roomstatus.config.voteOptions!.indexOf(props.roomstatus.client.currentChoice)];
    votingMembers++;

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

function BooleanSetting(props: {roomstatus:RoomData, description: string, name: string}) {

    const { sendMessage } = useWebSocket();
    const [value, setValue] = useState(props.roomstatus.config[props.name]);

    return (
        <Col>
            <Form.Check
                inline
                checked={value}
                onChange={(event)=>{
                    setValue(event.target.checked);

                    let optionObj:RoomConfig = {};
                    optionObj[props.name] = event.target.checked;

                    sendMessage(JSON.stringify({
                        type: "updateConfig",
                        options: optionObj
                    }))
                }}
            />
            {props.description}
        </Col>
    )
}

export function HostOptions(props: {roomstatus: RoomData}){
    const [options, setOptions] = useState(props.roomstatus.config.voteOptions?.join(",")); 
    const [values, setValues] = useState(props.roomstatus.config.voteValues?.join(",")); 
    const [link, setLink] = useState(props.roomstatus.currentURL); 
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
                            voteOptions: options?.replaceAll(" ", "").split(','),
                            voteValues: values?.replaceAll(" ", "").split(',').map((value)=>Number.parseFloat(value)),
                        }
                    }))
                }}>
                    Update
                </Button>
            </Col>
        </Row>,
        <Row className="justify-content-center">
            <BooleanSetting roomstatus={props.roomstatus} description="Host Is Voting Member" name="hostCanVote"/>
            <BooleanSetting roomstatus={props.roomstatus} description="Host Can Reveal" name="hostCanReveal"/>
            <BooleanSetting roomstatus={props.roomstatus} description="Can Vote After Reveal" name="voteAfterReveal"/>
            <BooleanSetting roomstatus={props.roomstatus} description="Host sees voter names" name="hostAnonVoting"/>
            <BooleanSetting roomstatus={props.roomstatus} description="Members see voter names" name="memberAnonVoting"/>
            <BooleanSetting roomstatus={props.roomstatus} description="Can reset before reveal" name="resetBeforeReveal"/>
        </Row>
    ];

}