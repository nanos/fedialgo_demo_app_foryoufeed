/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { Button } from 'react-bootstrap';
import { FEDIALGO } from 'fedialgo';

import FindFollowers from "./FindFollowers";
import JsonModal from "./JsonModal";
import { accordionBody, roundedBox, titleStyle } from "../helpers/style_helpers";
import { logMsg, versionString } from "../helpers/string_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";
import { useAuthContext } from "../hooks/useAuth";

const BUTTON_TEXT = {
    "Show State": "Show a bunch of information about FediAlgo's internal state",
    "Load Complete User History": "Load all your toots and favourites. May improve scoring of your feed. Takes time & resources proportional to the number of times you've tooted.",
}


export default function ExperimentalFeatures() {
    const { algorithm, api, isLoading, setError, timeline, triggerPullAllUserData } = useAlgorithm();
    const { user } = useAuthContext();

    const [isLoadingState, setIsLoadingState] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [algoState, setAlgoState] = useState({});

    const showAlgoState = () => {
        logMsg(`State (isLoading=${isLoading}, algorithm.isLoading()=${algorithm.isLoading()}, timeline.length=${timeline.length})`);
        setIsLoadingState(true);

        // Wait for the data to show up
        algorithm.getCurrentState()
            .then((currentState) => {
                console.log("FediAlgo state:", currentState);
                currentState.version = versionString();
                setAlgoState(currentState);
                setShowStateModal(true);
            })
            .catch((error) => setError(`Failed to get algorithm state: ${error}`))
            .finally(() => setIsLoadingState(false));
        ;
    }

    const makeButton = (label: string, onClick: () => void, variant?: string) => (
        <Button
            className='p-2 text-center'
            disabled={isLoading}
            onClick={onClick}
            size="sm"
            style={buttonStyle}
            variant={variant || "primary"}
        >
            {isLoading || isLoadingState ? "Loading..." : label}
        </Button>
    );

    const makeLabeledButton = (label: string, onClick: () => void, variant?: string) => (
        <li style={listElement}>
            {makeButton(label, onClick, variant)}

            <div style={{flex: 4, marginLeft: "10px", fontSize: "14px"}}>
                {BUTTON_TEXT[label]}
            </div>
        </li>
    );

    return (
        <Accordion>
            <JsonModal
                dialogClassName="modal-lg"
                infoTxt="A window into FediAlgo's internal state."
                json={algoState}
                jsonViewProps={{
                    collapsed: 1,
                    displayObjectSize: true,
                    name: "state",
                }}
                setShow={setShowStateModal}
                show={showStateModal}
                title="FediAlgo State"
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
                            {makeLabeledButton("Show State", showAlgoState)}

                            <hr className="hr" />

                            {makeLabeledButton("Load Complete User History", triggerPullAllUserData)}
                        </ul>

                        <hr className="hr" />
                        <FindFollowers api={api} user={user} />
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const buttonStyle: CSSProperties = {
    // borderColor: "black",
    // borderWidth: "1px",
    flex: 2,
    marginBottom: "5px",
    marginTop: "5px",
};

const listElement: CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    fontSize: "18px",
    marginBottom: "7px",
};

const listStyle: CSSProperties = {
    // listStyle: "disc",
};

const subheader: CSSProperties = {
    marginBottom: "7px",
};
