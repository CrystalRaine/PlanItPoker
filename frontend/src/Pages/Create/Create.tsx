import { Button, Container, Form } from "react-bootstrap";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

export default function Create(){

    const { sendMessage, reconnect } = useWebSocket();
    const navigate = useNavigate();
    const [ username, setUsername ] = useState("");
    const [ roomID, setRoomID ] = useState("");


    useEffect(() => {
        const savedUsername = Cookies.get("username");
        const savedRoomID = Cookies.get("roomID");
        if (savedUsername) {
            setUsername(savedUsername);
        }
        if (savedRoomID) {
            setRoomID(savedRoomID);
        }
        reconnect();
    }, []);


    return (
        <Container className="pt-4" style={{ maxWidth: "400px" }}>
            <h1 className="text-primary">
                Create Room
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
                placeholder="Room Name (Random if empty)"
                onChange={(event) => setRoomID(event.target.value)}
                value={roomID}
                className="mb-3"
            />
            <div className="d-grid gap-2">
                <Button
                variant="primary"
                size="lg"
                onClick={() => {
                    let room = roomID.trim();
                    const user = username.trim();

                    if (!room) {
                    room = uuidv4();
                    }

                    Cookies.set("username", user, { expires: 7 });
                    Cookies.set("roomID", room, { expires: 7 });
                    sendMessage(
                    JSON.stringify({
                        type: "create",
                        input: room,
                        username: user,
                    })
                    );
                    navigate(`/room/${room}`);
                }}
                >
                Create
                </Button>
            </div>
            </Form>
        </Container>
    );
}