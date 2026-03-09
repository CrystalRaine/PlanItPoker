import { Button, Container, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import { useWebSocket } from "../../utilities/websocket";

export default function Create(){

    const navigate = useNavigate();
    const { reconnect } = useWebSocket();

    const { roomID, userID } = useParams();

    const [ username, setUsername ] = useState("");
    const [ inputRoomID, setRoomID ] = useState("");

    reconnect();

    useEffect(() => {
        const savedUsername = Cookies.get("username");
        const savedRoomID = Cookies.get("roomID");
        
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
                    placeholder="Room Name (Optional)"
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

                        if (!room) {
                            room = uuidv4();
                        }

                        Cookies.set("username", user, { expires: 7 });
                        Cookies.set("roomID", room, { expires: 7 });
                        navigate(`/host/${room}/${user}`);
                    }}
                    >
                    Create
                    </Button>
                </div>
            </Form>
        </Container>
    );
}