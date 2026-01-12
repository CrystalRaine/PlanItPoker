import './Home.css'
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router";
import { useWebSocket } from '../../utilities/websocket';


export default function Home(){

    const { reconnect } = useWebSocket();
    reconnect();

    return [
        <Container>
            <Row>
                <Col className='col-12'>
                    <Row className='pt-5'>
                        <Link to='/create'>
                            <Col>
                                <Container className='d-flex justify-content-center align-items-center button-container text-center text-bg-primary rounded-5'>
                                    Create
                                </Container>
                            </Col>
                        </Link>
                    </Row>
                    <Row className='pt-5'>
                        <Link to='/join'>
                            <Col>
                                <Container className='d-flex justify-content-center align-items-center button-container text-center text-bg-primary rounded-5'>
                                    Join
                                </Container>
                            </Col>
                        </Link>
                    </Row>
                </Col>
            </Row>
        </Container>
    ]
}