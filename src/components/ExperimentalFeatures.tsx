/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';

import JsonModal from "./JsonModal";
import { accordionBody, linkesque, roundedBox, titleStyle } from "../helpers/style_helpers";
import { logMsg, versionString } from "../helpers/string_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";


export default function ExperimentalFeatures() {
    const { algorithm, isLoading, setError, timeline, triggerPullAllUserData } = useAlgorithm();
    const [showStateModal, setShowStateModal] = useState(false);
    const [algoState, setAlgoState] = useState({});

    const showAlgoState = () => {
        // Wait for the data to show up
        algorithm.getCurrentState()
            .then((currentState) => {
                console.log("Algorithm state:", currentState);
                currentState.version = versionString();
                setAlgoState(currentState);
                setShowStateModal(true);
            })
            .catch((error) => {
                setError(`Failed to get algorithm state: ${error}`);
            }
        );
    }

    const logState = () => {
        logMsg(`State (isLoading=${isLoading}, algorithm.isLoading()=${algorithm.isLoading()}, timeline.length=${timeline.length})`)
        algorithm.logCurrentState();
    }

    return (
        <Accordion>
            <JsonModal
                dialogClassName="modal-lg"
                infoTxt="Some of the data derived from your Mastodon history that is used to score your feed."
                json={algoState}
                jsonViewProps={{
                    collapsed: 1,
                    displayObjectSize: true,
                    name: "state",
                }}
                setShow={setShowStateModal}
                show={showStateModal}
                title="User Data"
            />

            <Accordion.Item eventKey="trendingInfoTags">
                <Accordion.Header>
                    <p style={titleStyle}>
                        Experimental Features
                    </p>
                </Accordion.Header>

                <Accordion.Body style={accordionBody}>
                    <p style={subheader}>
                        Use with caution.
                    </p>

                    <div style={{...roundedBox, paddingBottom: "20px", paddingLeft: "30px", paddingTop: "20px", paddingRight: "20px"}}>
                        <ul style={listStyle}>
                            <li style={listElement}>
                                <a onClick={triggerPullAllUserData} style={experimentalLink}>
                                    Trigger Complete User History Load
                                </a> (may improve scoring of your feed, takes time & resources proportional to the number of times you've tooted)
                            </li>

                            <li style={listElement}>
                                <a onClick={showAlgoState} style={experimentalLink}>
                                    Show FediAlgo State
                                </a> (show a bunch of information)
                            </li>
                        </ul>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const experimentalLink: CSSProperties = {
    ...linkesque,
    color: "black",
    fontSize: "16px",
    fontWeight: "bold",
    height: "20px",
    listStyle: "inside",
    marginTop: "6px",
};

const listElement: CSSProperties = {
    marginBottom: "7px",
};

const listStyle: CSSProperties = {
    listStyle: "disc",
};

const subheader: CSSProperties = {
    marginBottom: "7px",
};
