/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';

import { accordionBody, linkesque, roundedBox, titleStyle } from "../helpers/style_helpers";
import { DEMO_APP } from "../helpers/string_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";


export default function ExperimentalFeatures() {
    const { algorithm, isLoading, timeline, triggerPullAllUserData } = useAlgorithm();

    const logState = () => {
        algorithm.logWithState(
            DEMO_APP,
            `State (isLoading=${isLoading}, algorithm.isLoading()=${algorithm.isLoading()}, timeline.length=${timeline.length})`,
        );
    }

    return (
        <Accordion>
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
                                <a onClick={logState} style={experimentalLink}>
                                    Dump Current State to Console
                                </a>
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
