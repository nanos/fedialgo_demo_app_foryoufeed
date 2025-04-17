/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';

import { accordionBody } from "./FilterAccordionSection";
import { headerFont, roundedBox } from "./WeightSetter";
import { TheAlgorithm } from "fedialgo";
import { titleStyle } from "./WeightSetter";


export default function TrendingInfo({ algorithm }: { algorithm: TheAlgorithm }) {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Accordion>
            <Accordion.Item eventKey="trendingInfoTags">
                <Accordion.Header>
                    <p style={titleStyle}>
                        What's Trending (WIP)
                    </p>
                </Accordion.Header>

                <Accordion.Body onEnter={() => setOpen(true)} style={accordionBody}>
                    <p style={subHeaderFont}>
                        Trending Hashtags
                    </p>

                    <div style={roundedBox} key={"trendingTagsDiv"}>
                        <ol style={listStyle}>
                            {algorithm.trendingTags.map((tag) => (
                                <li key={tag.name} style={listItemStyle}>
                                    <a href={algorithm.buildTagURL(tag)} style={tagLinkStyle} target="_blank">
                                        #{tag.name}
                                    </a>

                                    <span style={{ marginLeft: "10px" }} >
                                        ({tag.numToots} toots by {tag.numAccounts} accounts)
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const listStyle = {
    fontSize: 17,
    listStyle: "numeric",
    paddingBottom: "10px",
    paddingLeft: "20px",
};

const listItemStyle = {
    marginBottom: 3,
    marginTop: 3,
};

const subHeaderFont = {
    ...headerFont,
    fontSize: 17,
    marginBottom: 10,
    marginTop: 2,
};

const tagLinkStyle = {
    color: "black",
    fontFamily: "monospace",
    fontWeight: "bold",
};
