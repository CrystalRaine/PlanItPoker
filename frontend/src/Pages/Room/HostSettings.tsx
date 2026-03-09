import { useEffect, useReducer, useState } from "react";
import { arrayReducer, getLocalStorage, setLocalStorage } from "../../utilities/utility";
import { useWebSocket } from "../../utilities/websocket";
import type { RoomConfig, RoomData } from "./Room";
import { Accordion, Button, Col, Form, Row } from "react-bootstrap";

interface ColorSettingProps {
  roomstatus: RoomData;
  description: string;
  name: keyof RoomConfig;
  defaultColor?: string; 
}

export function HostOptions(props: {roomstatus: RoomData}){
    return [
        <Accordion className="p-3">
            <Accordion.Item eventKey="OPT" defaultChecked>
                <Accordion.Header>
                    Options
                </Accordion.Header>
                <Accordion.Body>
                    <Row style={{borderBottom: "1px solid black"}}>
                        <Col>
                            Displays
                        </Col>
                        <Col>
                            Role Rules
                        </Col>
                        {!(props.roomstatus.config.showBarLive && props.roomstatus.config.showBar) ? 
                            <Col>
                                Action Rules
                            </Col>
                        : null }
                        <Col>
                            Anonymity
                        </Col>
                        <Col>
                            Timer
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Show Vote Cards" name="showCards"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Show Vote Count" name="showVoteCount"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Show Average" name="showAvg"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Show Bar Chart" name="showBar"/>
                            {props.roomstatus.config.showBar ?
                                <BooleanSetting roomstatus={props.roomstatus} description="Show Bar Chart Live" name="showBarLive"/>
                            : null }
                        </Col>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host Is Voting Member" name="hostCanVote"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host Can Reveal" name="hostCanReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members Can Reveal" name="membersCanReveal"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members Can Reset" name="membersCanReset"/>
                        </Col>
                        {!(props.roomstatus.config.showBarLive && props.roomstatus.config.showBar) ? 
                            <Col>
                                <BooleanSetting roomstatus={props.roomstatus} description="Can Reveal when not all members have voted" name="nonVoteReveal"/>
                                <BooleanSetting roomstatus={props.roomstatus} description="Can reset before Reveal" name="resetBeforeReveal"/>
                                <BooleanSetting roomstatus={props.roomstatus} description="Can Vote After Reveal" name="voteAfterReveal"/>
                            </Col>  
                        : null }
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Members see voter names" name="memberAnonVoting"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Host sees voter names" name="hostAnonVoting"/>
                            <BooleanSetting roomstatus={props.roomstatus} description="Show Votes Live" name="showLiveCards"/>
                        </Col>
                        <Col>
                            <BooleanSetting roomstatus={props.roomstatus} description="Enable Timer" name="timerEnabled"/>
                            {props.roomstatus.config.timerEnabled ? [
                                <BooleanSetting roomstatus={props.roomstatus} description="Auto start timer on reset" name="timerStartOnReset"/>,
                                <BooleanSetting roomstatus={props.roomstatus} description="Auto reveal on timer finish" name="revealOnTimerFinish"/>
                            ] : null}
                            <NumberSetting roomstatus={props.roomstatus} description="Timer Length" name="timerLength" min={0}/>
                        </Col>
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="URL">
                <Accordion.Header>
                    URL
                </Accordion.Header>
                <Accordion.Body>
                    <StringSetting roomstatus={props.roomstatus} description="URL to show" name="currentURL"/>
                </Accordion.Body>
            </Accordion.Item>
            <OptionsSettings roomstatus={props.roomstatus}/>
            <Accordion.Item eventKey="THM">
                <Accordion.Header>
                    Theme (For all members in room)
                </Accordion.Header>
                <Accordion.Body>
                    <Row>
                        <ColorSetting roomstatus={props.roomstatus} description="Primary Color" name="primaryColor" defaultColor="#4c00be"/>
                        <ColorSetting roomstatus={props.roomstatus} description="Secondary Color" name="secondaryColor" defaultColor="#808080"/>
                        <ColorSetting roomstatus={props.roomstatus} description="Player Has Not Voted Color" name="notVotedColor" defaultColor="#b42727"/>
                        <ColorSetting roomstatus={props.roomstatus} description="Player has Voted Color" name="votedColor" defaultColor="#a0a741"/>
                        <ColorSetting roomstatus={props.roomstatus} description="Votes Revealed Color" name="revealedColor" defaultColor="#47744e"/>
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="LOG">
                <Accordion.Header>
                    Logs
                </Accordion.Header>
                <Accordion.Body>
                    {props.roomstatus.logs.map((logItem:string) => <Row>{logItem}</Row>)}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    ];
}

function BooleanSetting(props: { roomstatus: RoomData; description: string; name: string }) {
    const { sendMessage } = useWebSocket();
    const cookieKey = `room_${props.roomstatus.config.roomID}_${props.name}`;

    const savedCookieVal = getLocalStorage(cookieKey);

    const [value, setValue] = useState(() => {
    if (savedCookieVal !== null) {
        return savedCookieVal === "true";
    }
    return !!props.roomstatus.config[props.name];
    });

    useEffect(() => {
    setLocalStorage(cookieKey, value ? "true" : "false");
    }, [value, cookieKey]);

    useEffect(() => {
    const remoteVal = !!props.roomstatus.config[props.name];
    if (savedCookieVal !== null) {
        const cookieBool = savedCookieVal === "true";
        if (cookieBool !== remoteVal) {
            const optionObj: RoomConfig = {};
            optionObj[props.name] = cookieBool;

            sendMessage(
                JSON.stringify({
                type: "updateConfig",
                options: optionObj,
                })
            );
        }
    }
    }, []); // run once on mount

    return (
    <Col>
        <Form.Check
        inline
        checked={value}
        onChange={(event) => {
            const newVal = event.target.checked;
            setValue(newVal);

            const optionObj: RoomConfig = {};
            optionObj[props.name] = newVal;

            sendMessage(
                JSON.stringify({
                    type: "updateConfig",
                    options: optionObj,
                })
            );
        }}
        />
        {props.description}
    </Col>
    );
}

function NumberSetting(props: {roomstatus: RoomData; description: string; name: string; min?: number; max?: number;}) {
  
    const { sendMessage } = useWebSocket();
    const cookieKey = `room_${props.roomstatus.config.roomID}_${props.name}`;

    const savedCookieVal = getLocalStorage(cookieKey);

    const [value, setValue] = useState(() => {
    if (savedCookieVal !== null) {
        const parsed = Number(savedCookieVal);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    const remoteVal = props.roomstatus.config[props.name];
    return typeof remoteVal === "number" ? remoteVal : 0;
    });

    useEffect(() => {
        setLocalStorage(cookieKey, value.toString());
    }, [value, cookieKey]);

  useEffect(() => {
    const remoteVal = props.roomstatus.config[props.name];
    if (savedCookieVal !== null) {
      const cookieNum = Number(savedCookieVal);
      if (!Number.isNaN(cookieNum) && cookieNum !== remoteVal) {
        const optionObj: RoomConfig = {};
        optionObj[props.name] = cookieNum;

        sendMessage(
          JSON.stringify({
            type: "updateConfig",
            options: optionObj,
          })
        );
      }
    }
  }, []); // once on mount

  return (
    <Col>
      <Form.Control
        type="number"
        value={value}
        min={props.min}
        max={props.max}
        onChange={(event) => {
          const newVal = Number(event.target.value);
          if (!Number.isNaN(newVal)) {
            setValue(newVal);

            const optionObj: RoomConfig = {};
            optionObj[props.name] = newVal;

            sendMessage(
              JSON.stringify({
                type: "updateConfig",
                options: optionObj,
              })
            );
          }
        }}
      />
      {props.description}
    </Col>
  );
}

function StringSetting(props: {roomstatus: RoomData; description: string; name: string}) {
  const { sendMessage } = useWebSocket();
  const cookieKey = `room_${props.roomstatus.config.roomID}_${props.name}`;

  const savedCookieVal = getLocalStorage(cookieKey);

  const [value, setValue] = useState(() => {
    if (savedCookieVal !== null) {
      return savedCookieVal;
    }
    const remoteVal = props.roomstatus.config[props.name];
    return typeof remoteVal === "string" ? remoteVal : "";
  });

  useEffect(() => {
    setLocalStorage(cookieKey, value);
  }, [value, cookieKey]);

  useEffect(() => {
    const remoteVal = props.roomstatus.config[props.name];
    if (savedCookieVal !== null) {
      if (savedCookieVal !== remoteVal) {
        const optionObj: RoomConfig = {};
        optionObj[props.name] = savedCookieVal;

        sendMessage(
          JSON.stringify({
            type: "updateConfig",
            options: optionObj,
          })
        );
      }
    }
  }, []); // once on mount

  return (
    <Col>
      <Form.Control
        type="text" 
        value={value}
        onChange={(event) => {
          const newVal = event.target.value;
          setValue(newVal);

          const optionObj: RoomConfig = {};
          optionObj[props.name] = newVal;

          sendMessage(
            JSON.stringify({
              type: "updateConfig",
              options: optionObj,
            })
          );
        }}
      />
      {props.description}
    </Col>
  );
}

function OptionsSettings(props: { roomstatus: RoomData }) {
  const { sendMessage } = useWebSocket();

  const roomID = props.roomstatus.config.roomID ?? "default";
  const optionsCookieKey = `room_${roomID}_voteOptions`;
  const valuesCookieKey = `room_${roomID}_voteValues`;

  const savedOptions = (() => {
    const cookieVal = getLocalStorage(optionsCookieKey);
    if (cookieVal) {
      try {
        return JSON.parse(cookieVal);
      } catch {
        return props.roomstatus.config.voteOptions ?? [];
      }
    }
    return props.roomstatus.config.voteOptions ?? [];
  })();

  const savedValues = (() => {
    const cookieVal = getLocalStorage(valuesCookieKey);
    if (cookieVal) {
      try {
        return JSON.parse(cookieVal);
      } catch {
        return props.roomstatus.config.voteValues ?? [];
      }
    }
    return props.roomstatus.config.voteValues ?? [];
  })();

  const [options, setOptions] = useReducer(arrayReducer, savedOptions);
  const [values, setValues] = useReducer(arrayReducer, savedValues);

  useEffect(() => {
    setLocalStorage(optionsCookieKey, JSON.stringify(options));
  }, [options, optionsCookieKey]);

  useEffect(() => {
    setLocalStorage(valuesCookieKey, JSON.stringify(values));
  }, [values, valuesCookieKey]);

  useEffect(() => {
    const remoteOptions = props.roomstatus.config.voteOptions ?? [];
    const remoteValues = props.roomstatus.config.voteValues ?? [];

    const optionsDiffer =
      JSON.stringify(savedOptions) !== JSON.stringify(remoteOptions);
    const valuesDiffer = JSON.stringify(savedValues) !== JSON.stringify(remoteValues);

    if (optionsDiffer || valuesDiffer) {
      sendMessage(
        JSON.stringify({
          type: "updateConfig",
          options: {
            voteOptions: savedOptions,
            voteValues: savedValues,
          },
        })
      );
    }
  }, []); 

  const pairArr = options?.map((opt, i) => (
    <Row key={i} className="align-items-center">
      <Col>
        <Form.Control
          type="text"
          placeholder="Card Display"
          value={opt}
          onChange={(e) =>
            setOptions({ i, newVal: e.target.value, operation: "UPD" })
          }
          className="mb-3"
        />
      </Col>
      <Col>
        <Form.Control
          type="text"
          placeholder="Card Value"
          value={values![i] ?? ""}
          onChange={(e) =>
            setValues({ i, newVal: e.target.value, operation: "UPD" })
          }
          className="mb-3"
        />
      </Col>
      <Col xs={1}>
        <Button
          variant="danger"
          onClick={() => {
            setOptions({ i, newVal: "", operation: "DEL" });
            setValues({ i, newVal: "", operation: "DEL" });
          }}
        >
          X
        </Button>
      </Col>
    </Row>
  ));

  return (
    <Accordion.Item eventKey="VOT">
      <Accordion.Header>Vote Cards and Values</Accordion.Header>
      <Accordion.Body>
        <Row>
          <Col>
            <Form.Label>Options:</Form.Label>
          </Col>
          <Col>
            <Form.Label>Values:</Form.Label>
          </Col>
          <Col xs={1}/>
        </Row>
        {pairArr}
        <Button
          className="m-2"
          onClick={() => {
            setOptions({ i: 0, newVal: "NEW", operation: "NEW" });
            setValues({ i: 0, newVal: "NEW", operation: "NEW" });
          }}
        >
          + Row
        </Button>
        <Button
          className="m-2"
          onClick={() => {
            sendMessage(
              JSON.stringify({
                type: "updateConfig",
                options: {
                  voteOptions: options,
                  voteValues: values,
                },
              })
            );
          }}
        >
          Update
        </Button>
      </Accordion.Body>
    </Accordion.Item>
  );
}

export function ColorSetting({ roomstatus, description, name, defaultColor = "#000000" }: ColorSettingProps) {
  const { sendMessage } = useWebSocket();
  const roomID = roomstatus.config.roomID ?? "default";
  const storageKey = `room_${roomID}_${name}`;

  const [color, setColor] = useState(() => {
    const saved = getLocalStorage(storageKey);
    if (saved !== null) return saved;
    if (typeof roomstatus.config[name] === "string") {
      return roomstatus.config[name] as string;
    }
    return defaultColor;
  });

  useEffect(() => {
    setLocalStorage(storageKey, color);
  }, [color, storageKey]);

  useEffect(() => {
    const remoteColor = roomstatus.config[name];
    if (color === remoteColor) return;

    const handler = setTimeout(() => {
      sendMessage(
        JSON.stringify({
          type: "updateConfig",
          options: { [name]: color },
        })
      );
    }, 100); // debounce delay

    return () => clearTimeout(handler);
  }, [color, name, roomstatus.config, sendMessage]);

  function handleChange(value: string) {
    setColor(value);
  }

  return (
    <Col className="d-flex align-items-center gap-2">
      <Form.Control
        type="color"
        id={name.toString()}
        value={color}
        title={name.toString()}
        onChange={(e) => handleChange(e.target.value)}
        style={{ width: "3rem", padding: 0, border: "none", height: "2.5rem" }}
      />
      <span>{description}</span>
    </Col>
  );
}