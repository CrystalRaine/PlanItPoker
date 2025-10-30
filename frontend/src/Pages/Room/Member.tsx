import type { Member, RoomData } from "./Room";
import { Container } from "react-bootstrap";
import { AverageDisplay, ChoiceCards, PlayerStatuses, RoomInteractions } from "./roompieces";

export default function Member(props: {roomstatus:RoomData}) {

    return (
        <Container>
            <AverageDisplay roomstatus={props.roomstatus}/>
            <PlayerStatuses roomstatus={props.roomstatus}/>
            <ChoiceCards roomstatus={props.roomstatus}/>
            <RoomInteractions roomstatus={props.roomstatus} />
        </Container>
    )
}