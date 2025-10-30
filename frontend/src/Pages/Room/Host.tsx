import type { RoomData } from "./Room";
import { Container } from "react-bootstrap";
import { AverageDisplay, ChoiceCards, HostOptions, PlayerStatuses, RoomInteractions } from "./roompieces";

export default function Host(props: {roomstatus:RoomData}) {

    return (
        <Container>
            <AverageDisplay roomstatus={props.roomstatus}/>
            <PlayerStatuses roomstatus={props.roomstatus}/>
            <ChoiceCards roomstatus={props.roomstatus}/>
            <RoomInteractions roomstatus={props.roomstatus}/>
            <HostOptions roomstatus={props.roomstatus}/>
        </Container>
    )
}