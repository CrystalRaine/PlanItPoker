import { Button, Col } from "react-bootstrap";
import { getTextColor } from "./utility";
import type { RoomData } from "../Pages/Room/Room";

export function PrimaryActionButton(props: {label: string; onClick: () => void; roomstatus: RoomData;}) {
    
    const bgColor = props.roomstatus.config.primaryColor || "#0d6efd";
    const textColor = getTextColor(bgColor);

    return (
        <Col xs="auto" className="d-flex justify-content-center">
            <Button
                onClick={props.onClick}
                className="app-action-btn rounded-4 fw-semibold px-4 py-3"
                style={{
                    backgroundColor: bgColor,
                    borderColor: bgColor,
                    color: textColor,
                    minWidth: "140px",
                }}
            >
                {props.label}
            </Button>
        </Col>
    );
}