import { Button, Container, Form } from "react-bootstrap";
import { useWebSocket } from "../../utilities/websocket";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";

export default function Join(){

    const { sendMessage, reconnect } = useWebSocket();
    const navigate = useNavigate();
    const [ username, setUsername ] = useState("");
    const [ roomID, setRoomID ] = useState("");
    const { roomID:id } = useParams();
    const [ lockID, setLockID ] = useState(false);


    useEffect(() => {
        const savedUsername = Cookies.get("joinUsername");
        const savedRoomID = Cookies.get("joinRoomID");
        if (savedUsername) {
            setUsername(savedUsername);
        }
        if (savedRoomID) {
            setRoomID(savedRoomID);
        }

        if(id){
            if(id && savedUsername) {
                sendMessage( 
                    JSON.stringify({
                        type: "join",
                        input: id,
                        username: savedUsername.trim(),
                    })
                );
                navigate(`/room/${id}`);
                return;
            }

            setRoomID(id);
            setLockID(true);
        }

        reconnect();
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
                value={roomID}
                className="mb-3"
                disabled={lockID}
            />
            <div className="d-grid gap-2">
                <Button
                variant="primary"
                size="lg"
                onClick={() => {
                    let room = roomID.trim();
                    const user = username.trim();

                    Cookies.set("joinUsername", user, { expires: 7 });
                    Cookies.set("joinRoomID", room, { expires: 7 });
                    sendMessage(
                    JSON.stringify({
                        type: "join",
                        input: room,
                        username: user,
                    })
                    );
                    navigate(`/room/${room}`);
                }}
                >
                Join
                </Button>
            </div>
            </Form>
        </Container>
    );
}