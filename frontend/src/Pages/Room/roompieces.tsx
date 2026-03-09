import { Button, Col, Container, Row, Toast } from "react-bootstrap";
import { copyURL, type Member, type RoomData } from "./Room";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useState, type JSX } from "react";
import { useParams } from "react-router-dom";
import { getTextColor } from "../../utilities/utility";
import { PrimaryActionButton } from "../../utilities/utilityComponents";

export function PlayerStatuses(props: { roomstatus: RoomData }) {
    const playerCards: JSX.Element[] = [];

    if(!props.roomstatus.config.showCards) {
        return;
    }


    if (!(!props.roomstatus.config.hostCanVote && props.roomstatus.client.role === 'host')) {
        playerCards.push(
            <PlayerInfoCard
                key={props.roomstatus.client.name}
                playerData={props.roomstatus.client}
                roomData={props.roomstatus}
                highlight={true}
            />
        );
    }

    props.roomstatus.members.forEach((memberData) => {
        if (memberData.role === 'host' && !props.roomstatus.config.hostCanVote) {
            return;
        }

        playerCards.push(
            <PlayerInfoCard
                key={memberData.name}
                playerData={memberData}
                roomData={props.roomstatus}
                highlight={false}
            />
        );
    });

    return (
        <Row className="justify-content-center g-3 rowPadding">
            {playerCards}
        </Row>
    );
}

export function ChoiceCards(props: { roomstatus: RoomData }) {

    if (props.roomstatus.client.role === "host" && !props.roomstatus.config.hostCanVote) {
        return null;
    }

    return (
        <Row className="justify-content-center g-3 rowPadding">
            {props.roomstatus.config.voteOptions!.map((option, index) => (
                <ChoiceCard
                    key={option}
                    optionName={option}
                    voteValue={props.roomstatus.config.voteValues![index]}
                    roomstatus={props.roomstatus}
                />
            ))}
        </Row>
    );
}

function PlayerInfoCard(props: { playerData: Member; roomData: RoomData; highlight: boolean }) {

    const notVoted = props.roomData.config.notVotedColor || "#f8f9fa";
    const voted = props.roomData.config.votedColor || "#0d6efd";
    const revealed = props.roomData.config.revealedColor || "#198754";

    const bgColor = props.playerData.voted
        ? (props.roomData.cardsRevealed ? revealed : voted)
        : notVoted;

    const textColor = getTextColor(bgColor);

    const isSelf = props.highlight;

    let displayValue: string | undefined = undefined;

    if (isSelf) {
        if (props.playerData.voted) {
            displayValue = props.playerData.currentChoice;
        } else {
            displayValue = "—";
        }
    } else {
        if (props.playerData.voted && (props.roomData.cardsRevealed || props.roomData.config.showLiveCards)) {
            displayValue = props.playerData.currentChoice;
        } else {
            displayValue = undefined;
        }
    }

    return (
        <Col xs="auto" className="d-flex justify-content-center">
            <div
                className="player-card shadow-sm rounded-4 px-4 py-3 text-center"
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    border: isSelf
                        ? "2px solid #000"
                        : "1px solid rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease-in-out",
                    minWidth: "90px",
                    maxWidth: "140px",
                }}
            >
                <div
                    style={{
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    className="fw-bold fs-5"
                >
                    {displayValue}
                </div>

                <div className="mt-2 small fw-semibold text-truncate">
                    {props.playerData.name}
                </div>
            </div>
        </Col>
    );
}

function ChoiceCard(props: { optionName: string; voteValue: number; roomstatus: RoomData }) {
    const { sendMessage } = useWebSocket();

    const bgColor = props.roomstatus.config.primaryColor || "#0d6efd";
    const textColor = getTextColor(bgColor);

    return (
        <Col xs="auto" className="d-flex justify-content-center">
            <Button
                className="app-choice-btn fw-semibold px-4 py-3"
                style={{
                    backgroundColor: bgColor,
                    borderColor: bgColor,
                    color: textColor,
                    minWidth: "90px",
                }}
                onClick={() => {
                    sendMessage(JSON.stringify({
                        type: "vote",
                        input: props.optionName,
                    }));
                }}
            >
                {props.optionName}
            </Button>
        </Col>
    );
}

export function RoomInteractions(props: {roomstatus:RoomData}) {

    let reveal: JSX.Element | undefined = <RevealButton roomstatus={props.roomstatus}/>;
    let reset: JSX.Element | undefined = <ResetButton roomstatus={props.roomstatus}/>;
    let copyJoinLink: JSX.Element | undefined = <CopyJoinLink roomstatus={props.roomstatus}/>;
    let startTimer: JSX.Element | undefined = <StartTimer roomstatus={props.roomstatus}/>;

    return (
        <Row className="justify-content-center rowPadding">
            {reveal}
            {reset}
            {copyJoinLink}
            {startTimer}
        </Row>
    )
}

function RevealButton(props: { roomstatus: RoomData }) {

    let allVoted:boolean = true;
    let oneVoted: boolean = false;

    const checkMemberVoted = (member:Member)=>{
        if(member.role === 'host' && !props.roomstatus.config.hostCanVote){
            return;
        } 
        if(!member.voted) {
            allVoted = false;
        } else {
            oneVoted = true;
        }
    }

    props.roomstatus.members.forEach((member)=>{
        checkMemberVoted(member);
    });

    checkMemberVoted(props.roomstatus.client);

    if(props.roomstatus.cardsRevealed) {
        return;
    }

    if(!(allVoted || (oneVoted && props.roomstatus.config.nonVoteReveal)) && !(props.roomstatus.config.showBarLive && props.roomstatus.config.showBar)) {
        return;
    }

    if(props.roomstatus.client.role === "host" && !props.roomstatus.config.hostCanReveal) {
        return;
    }

    if(props.roomstatus.client.role !== "host" && !props.roomstatus.config.membersCanReveal) {
        return;
    }

    const { sendMessage } = useWebSocket();

    return (
        <PrimaryActionButton
            label= {(props.roomstatus.config.showBarLive && props.roomstatus.config.showBar) ? "Close" : "Reveal"}
            roomstatus={props.roomstatus}
            onClick={() =>
                sendMessage(JSON.stringify({ type: "reveal" }))
            }
        />
    );
}

function StartTimer(props: { roomstatus: RoomData }) {

    if(props.roomstatus.client.role !== "host") {
        return;
    }

    if(!props.roomstatus.config.timerEnabled) {
        return;
    }

    const { sendMessage } = useWebSocket();

    return (
        <PrimaryActionButton
            label="Start Timer"
            roomstatus={props.roomstatus}
            onClick={() =>
                sendMessage(JSON.stringify({
                    type: "updateConfig",
                    options: {
                        timerStartTimestamp: Date.now(),
                    }
                }))
            }
        />
    );
}

function ResetButton(props: { roomstatus: RoomData }) {

    if(!(props.roomstatus.config.resetBeforeReveal || (props.roomstatus.config.showBarLive && props.roomstatus.config.showBar)) && !props.roomstatus.cardsRevealed) {
        return;
    }

    if(props.roomstatus.client.role !== "host" && !props.roomstatus.config.membersCanReset) {
        return;
    }
    
    const { sendMessage } = useWebSocket();

    return (
        <PrimaryActionButton
            label="Reset"
            roomstatus={props.roomstatus}
            onClick={() => {
                sendMessage(JSON.stringify({ type: "clear" }));

                if (props.roomstatus.config.timerStartOnReset) {
                    sendMessage(JSON.stringify({
                        type: "updateConfig",
                        options: {
                            timerStartTimestamp: Date.now(),
                        }
                    }));
                }
            }}
        />
    );
}

function CopyJoinLink(props: { roomstatus: RoomData }) {

    if(props.roomstatus.client.role !== "host") {
        return;
    }

    const { roomID } = useParams();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (!showToast) return;
        const timer = setTimeout(() => setShowToast(false), 2000);
        return () => clearTimeout(timer);
    }, [showToast]);

    return (
        <Col xs="auto" className="d-flex flex-column align-items-center">
            <PrimaryActionButton
                label="Copy Join Link"
                roomstatus={props.roomstatus}
                onClick={() => {
                    copyURL(roomID);
                    setShowToast(true);
                }}
            />

            <Toast show={showToast} delay={2000} autohide className="mt-2 shadow-sm rounded-3">
                <Toast.Header>
                    <strong className="me-auto">Copied!</strong>
                </Toast.Header>
            </Toast>
        </Col>
    );
}

export function RoomStatusDisplay(props: { roomstatus: RoomData }) {

    let timer = null;

    if (props.roomstatus.config.timerEnabled) {
        timer = (
            <div className="timer-container">
                <TimerDisplay roomstatus={props.roomstatus} />
            </div>
        );
    }

    return (
        <div className="room-status-container my-3">
            {timer}
            <div className="text-center">
                <VoteCountDisplay roomstatus={props.roomstatus} />
                <AverageDisplay roomstatus={props.roomstatus} />
            </div>
        </div>
    );
}

export function TimerDisplay(props: { roomstatus: RoomData }) {

    const { sendMessage } = useWebSocket();
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [lastReveal, setLastReveal] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatter = new Intl.NumberFormat('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });

    let secondsRemaining = Math.max(
        0,
        Math.floor(
            (
                (props.roomstatus.config.timerStartTimestamp! +
                    props.roomstatus.config.timerLength! * 1000) -
                currentTime
            ) / 1000
        )
    );

    let minsRemaining = Math.floor(secondsRemaining / 60);
    let seconds = secondsRemaining % 60;
    let secComp = formatter.format(seconds);

    let remaining =
        (props.roomstatus.config.timerStartTimestamp! +
            props.roomstatus.config.timerLength! * 1000) -
        currentTime;

    if (
        remaining < 0 &&
        props.roomstatus.config.revealOnTimerFinish &&
        remaining > -2000 &&
        currentTime - lastReveal > 5000 &&
        !props.roomstatus.cardsRevealed
    ) {
        sendMessage(JSON.stringify({ type: "reveal" }));
        setLastReveal(currentTime);
    }

    return (
        <div className={"timer-text" + (secondsRemaining < 10 && secondsRemaining > 0 ? " warning" : "" ) }>
            {minsRemaining}:{secComp}
        </div>
    );
}

export function AverageDisplay(props: { roomstatus: RoomData }) {

    if(!props.roomstatus.config.showAvg) {
        return;
    }

    let avg = 0;
    let votingMembers = 0;

    props.roomstatus.members.forEach((member) => {
        if (!member.currentChoice) return;

        avg += props.roomstatus.config.voteValues![
            props.roomstatus.config.voteOptions!.indexOf(member.currentChoice)
        ];
        votingMembers++;
    });

    if (props.roomstatus.client.currentChoice) {
        avg += props.roomstatus.config.voteValues![
            props.roomstatus.config.voteOptions!.indexOf(props.roomstatus.client.currentChoice)
        ];
        votingMembers++;
    }

    avg = votingMembers === 0 ? 0 : avg / votingMembers;

    let avgstr = (props.roomstatus.cardsRevealed || props.roomstatus.config.showLiveCards || (props.roomstatus.config.showBarLive && props.roomstatus.config.showBar))
        ? avg.toFixed(2)
        : "?";

    return (
        <div className="average-text">
            Average: {avgstr}
        </div>
    );
}

export function VoteCountDisplay(props: { roomstatus: RoomData }) {

    if(!props.roomstatus.config.showVoteCount) {
        return;
    }

    let votingMembers = 0;

    props.roomstatus.members.forEach((member) => {
        if (!member.voted) return;

        votingMembers++;
    });

    if (props.roomstatus.client.currentChoice) {
        votingMembers++;
    }

    return (
        <div className="average-text">
            Votes: {votingMembers}
        </div>
    );
}

export function BarChartDisplay(props: { roomstatus: RoomData }) {
    const { roomstatus } = props;

    if (!roomstatus.config.showBar) {
        return null;
    }

    if (!(roomstatus.config.showBarLive && roomstatus.config.showBar) && !roomstatus.cardsRevealed) {
        return null;
    }

    const buckets = roomstatus.config.voteOptions;
    const counts: number[] = new Array(buckets?.length || 0).fill(0);

    roomstatus.members.forEach((member) => {
        if (!member.currentChoice) return;
        const index = buckets!.indexOf(member.currentChoice);
        if (index !== -1) {
            counts[index] += 1;
        }
    });

    if (roomstatus.client.currentChoice) {
        const index = buckets!.indexOf(roomstatus.client.currentChoice);
        if (index !== -1) {
            counts[index] += 1;
        }
    }

    const maxCount = Math.max(...counts, 0);
    const totalCount = counts.reduce((prev, cur) => prev + cur);

    const chartData = buckets!.map((bucket, index) => ({
        label: bucket,
        value: counts[index],
    }));

    const effectiveMaxCount = maxCount === 0 ? 1 : maxCount;

    const bgColor = props.roomstatus.config.primaryColor || "#0d6efd";
    const secondaryBg = props.roomstatus.config.secondaryColor ||  "#ffffff";
    const secondaryText = getTextColor(secondaryBg);

    return (
        <Container className="bar-chart-container my-3 p-3 border rounded" style={{backgroundColor:secondaryBg, color: secondaryText}}>
            <div className="bar-chart" style={{borderBottom:"1px solid " + secondaryText}}>
                {chartData.map((data, index) => (
                    <div className="bar-wrapper" key={index} style={{paddingTop:"1em"}}>
                        {data.value > 0 ? (
                            <div
                                className="bar"
                                style={{ position: "relative", borderBottom: "1px solid " + secondaryText, height: `${(data.value / effectiveMaxCount) * 100}%`, backgroundColor: bgColor }}
                            >
                                <span className="bar-value" style={{color:secondaryText, zIndex: 10}}>{data.value}</span>
                            </div>
                        ) : (
                            <div className="bar"
                                style={{ borderBottom: "1px solid " + secondaryText, height: `${2}%`, backgroundColor: bgColor }}></div>
                        )}
                        <div className="bar-label">{data.label}</div>
                    </div>
                ))}
            </div>
            <div className="y-axis-label text-start mt-2">
                <small style={{paddingRight:"10px"}}>Max: {maxCount}</small>
                <small>Total: {totalCount}</small>
            </div>
        </Container>
    );
}

export function TicketLink(props: {roomstatus: RoomData}) {
    let linkDisplay = null;
    const textColor = getTextColor(
        props.roomstatus.config.secondaryColor || "#ffffff"
    );

    if (props.roomstatus.config.currentURL) {
        let url = props.roomstatus.config.currentURL;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        linkDisplay = (
            <div className="text-center mb-2">
                Ticket: <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="status-link"
                    style={{ color: textColor }}
                >
                    {props.roomstatus.config.currentURL.substring(
                        props.roomstatus.config.currentURL.lastIndexOf('/') + 1
                    )}
                </a>
            </div>
        );
    }

    return linkDisplay;
}