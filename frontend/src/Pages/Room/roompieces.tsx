import { Accordion, Button, Col, Container, Form, Row, Toast, ToastContainer } from "react-bootstrap";
import { copyURL, type Member, type RoomConfig, type RoomData } from "./Room";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useReducer, useState, type JSX } from "react";
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

    let allVoted:boolean = true;

    const checkMemberVoted = (member:Member)=>{
        if(member.role === 'host' && !props.roomstatus.config.hostCanVote){
            return;
        } 
        if(!member.voted) {
            allVoted = false;
        }
    }

    props.roomstatus.members.forEach((member)=>{
        checkMemberVoted(member);
    });

    checkMemberVoted(props.roomstatus.client);

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

    if(props.roomstatus.client.role !== "host" && !props.roomstatus.config.membersCanReveal) {
        reveal = undefined;
    }

    if(props.roomstatus.client.role !== "host") {
        copyJoinLink = undefined;
    }

    if(!props.roomstatus.config.resetBeforeReveal && !props.roomstatus.cardsRevealed) {
        reset = undefined;
    }

    if(props.roomstatus.client.role !== "host" && !props.roomstatus.config.membersCanReset) {
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

function BooleanSetting(props: { roomstatus: RoomData; description: string; name: string }) {
    function setCookie(name: string, value: string, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
    }

    function getCookie(name: string): string | null {
        return document.cookie.split("; ").reduce((r, v) => {
            const parts = v.split("=");
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, null as string | null);
    }

    const { sendMessage } = useWebSocket();

    const cookieKey = `room_${props.roomstatus.config.roomID}_${props.name}`;

    const [value, setValue] = useState(() => {
        const cookieVal = getCookie(cookieKey);
        if (cookieVal !== null) {
        return cookieVal === "true";
        }
        return props.roomstatus.config[props.name];
    });

    useEffect(() => {
        setCookie(cookieKey, value ? "true" : "false", 30);
    }, [value, cookieKey]);

    return (
        <Col>
        <Form.Check
            inline
            checked={value}
            onChange={(event) => {
            setValue(event.target.checked);

            const optionObj: RoomConfig = {};
            optionObj[props.name] = event.target.checked;

            sendMessage(
                JSON.stringify({
                type: "updateConfig",
                options: optionObj,
                })
            );
            }}
        />
        {props.description}
        </Col>
    );
}

function OptionsSettings(props: {roomstatus:RoomData}) {
    const arrayReducer = (prevValue:(string | number)[] | undefined, val: {i: number, newVal: string, operation:"NEW"|"DEL"|"UPD"})=>{
        let arr = JSON.parse(JSON.stringify(prevValue));
        if(val.operation === "DEL"){
            arr.splice(val.i, val.i+1)
            return arr;
        }
        if(val.operation === "NEW"){
            arr.push("");
            return arr;
        }
        arr[val.i] = val.newVal
        return arr;
    };
    const [options, setOptions] = useReducer(arrayReducer, props.roomstatus.config.voteOptions);
    const [values, setValues] = useReducer(arrayReducer, props.roomstatus.config.voteValues);
    const { sendMessage } = useWebSocket();

    let pairArr = [];

    for(let i = 0; i < (options ? options?.length : 0); i++){
        if(!options || !values){
            return;
        }
        pairArr.push(
             <Row>
                <Col>
                    <Form.Control
                        type="text"
                        placeholder="Card Display"
                        onChange={(event) => setOptions({i, newVal:event.target.value, operation: "UPD"})}
                        value={options[i]}
                        className="mb-3"
                    />
                </Col>
                <Col>
                    <Form.Control
                        type="text"
                        placeholder="Card Value"
                        onChange={(event) => setValues({i, newVal:event.target.value, operation: "UPD"})}
                        value={values[i]}
                        className="mb-3"
                    />
                </Col>
                <Col xs={1}>
                    <Button className="bg-danger" onClick={()=>{
                        setOptions({i, newVal:"DEL", operation: "DEL"});
                        setValues({i, newVal:"DEL", operation: "DEL"});
                    }}>
                        X
                    </Button>
                </Col>
            </Row>
        )
    }


    return [
        <Accordion.Item eventKey="0">
            <Accordion.Header>Vote Cards and Values</Accordion.Header>
            <Accordion.Body>
                <Row>
                    <Col>
                        <Form.Label>
                            Options: 
                        </Form.Label>
                    </Col>
                    <Col>
                        <Form.Label>
                            Values: 
                        </Form.Label>
                    </Col>
                </Row>
                {pairArr}
                <Button className="m-2" onClick={()=>{
                    setOptions({i:0, newVal:"NEW", operation: "NEW"});
                    setValues({i:0, newVal:"NEW", operation: "NEW"});
                }}>
                    + Row
                </Button>
                <Button className="m-2" onClick={()=>{
                    sendMessage(JSON.stringify({
                        type: "updateConfig",
                        options: {
                            voteOptions: options,
                            voteValues: values,
                        }
                    }));
                }}>
                    Update
                </Button>
            </Accordion.Body>
        </Accordion.Item>
    ]
}

export function HostOptions(props: {roomstatus: RoomData}){
    return [
        <Accordion className="p-3">
            <OptionsSettings roomstatus={props.roomstatus}/>
            <Accordion.Item eventKey="1">
                <Accordion.Header>
                    Options
                </Accordion.Header>
                <Accordion.Body>
                    <Row>
                        <Col>
                            Role Rules
                        </Col>
                        <Col>
                            Action Rules
                        </Col>
                        <Col>
                            Anonymity
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host Is Voting Member" name="hostCanVote"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host Can Reveal" name="hostCanReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members Can Reveal" name="membersCanReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members Can Reset" name="membersCanReset"/>
                        </Col>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Can Reveal when members have not voted" name="nonVoteReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Can reset before Reveal" name="resetBeforeReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Can Vote After Reveal" name="voteAfterReveal"/>
                        </Col>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members see voter names" name="memberAnonVoting"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host sees voter names" name="hostAnonVoting"/>
                        </Col>
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2">
                <Accordion.Header>
                    Theme (For all members in room)
                </Accordion.Header>
                <Accordion.Body>
                    <Row>
                        <Col>
                            <Form.Label>
                                Primary Color
                            </Form.Label>
                            <Form.Control
                                type="color"
                                id="primaryColor"
                                defaultValue="#4c00be"
                                title="Primary Color"
                            />
                        </Col>
                        <Col>
                            <Form.Label>
                                Secondary Color
                            </Form.Label>
                            <Form.Control
                                type="color"
                                id="secondaryColor"
                                defaultValue="#808080"
                                title="Secondary Color"
                            />
                        </Col>
                        <Col>
                            <Form.Label>
                                Player Has Not Voted Color
                            </Form.Label>
                            <Form.Control
                                type="color"
                                id="notVotedColor"
                                defaultValue="#b42727"
                                title="notVotedColor"
                            />
                        </Col>
                        <Col>
                            <Form.Label>
                                Player has Voted Color
                            </Form.Label>
                            <Form.Control
                                type="color"
                                id="votedColor"
                                defaultValue="#a0a741"
                                title="votedColor"
                            />
                        </Col>
                        <Col>
                            <Form.Label>
                                Votes Revealed Color
                            </Form.Label>
                            <Form.Control
                                type="color"
                                id="revealedColor"
                                defaultValue="#47744e"
                                title="revealedColor"
                            />
                        </Col>
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
                <Accordion.Header>
                    Logs
                </Accordion.Header>
                <Accordion.Body>
                    {props.roomstatus.logs.map((logItem:string) => <Row>{logItem}</Row>)}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    ];
}