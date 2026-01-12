import { Button, Container, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { useWebSocket } from "../../utilities/websocket";

export default function Join(){

    const { reconnect } = useWebSocket();
    const navigate = useNavigate();
    const [ username, setUsername ] = useState("");
    const [ inputRoomID, setRoomID ] = useState("");
    const { roomID, userID } = useParams();

    reconnect();

    useEffect(() => {
        const savedUsername = Cookies.get("joinUsername");
        const savedRoomID = Cookies.get("joinRoomID");
        
        if(roomID) {
            setRoomID(roomID);
        } else if(savedRoomID) {
            setRoomID(savedRoomID);
        }
        
        if(userID){
            setUsername(userID);
        } else if(savedUsername){
            setUsername(savedUsername);
        }
    }, []);


    return (
        <Container className="pt-4" style={{ maxWidth: "400px" }}>
            <h1 className="text-primary">
                Join Room
            </h1>
            <Form>
            <Form.Control
                type="text"
                placeholder="Username"
                onChange={(event) => setUsername(event.target.value)}
                value={username}
                className="mb-3"
            />
            <Form.Control
                type="text"
                placeholder="Room Name"
                onChange={(event) => setRoomID(event.target.value)}
                value={inputRoomID}
                className="mb-3"
            />
            <div className="d-grid gap-2">
                <Button
                variant="primary"
                size="lg"
                onClick={() => {
                    let room = inputRoomID.trim();
                    const user = username.trim();

                    Cookies.set("joinUsername", user, { expires: 7 });
                    Cookies.set("joinRoomID", room, { expires: 7 });
                    navigate(`/room/${room}/${user}`);
                }}
                >
                Join
                </Button>
            </div>
            </Form>
        </Container>
    );
}