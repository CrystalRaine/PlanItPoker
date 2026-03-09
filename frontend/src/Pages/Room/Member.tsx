import type { Member, RoomData } from "./Room";
import { Container } from "react-bootstrap";
import { RoomStatusDisplay, ChoiceCards, PlayerStatuses, RoomInteractions, TicketLink, BarChartDisplay } from "./roompieces";

export default function Member(props: {roomstatus:RoomData}) {

    return (
        <Container>
            <RoomStatusDisplay roomstatus={props.roomstatus}/>
            <BarChartDisplay roomstatus={props.roomstatus}/>
            <PlayerStatuses roomstatus={props.roomstatus}/>
            <TicketLink roomstatus={props.roomstatus}/>
            <ChoiceCards roomstatus={props.roomstatus}/>
            <RoomInteractions roomstatus={props.roomstatus} />
        </Container>
    )
}