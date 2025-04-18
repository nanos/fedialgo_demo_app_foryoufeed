/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";
import { Toot } from "fedialgo";
import { TrendingWithHistory } from "fedialgo/dist/types";

import { accordionBody } from "./FilterAccordionSection";
import { headerFont, roundedBox } from "./WeightSetter";

interface TrendingProps {
    infoTxt: (obj: TrendingWithHistory | Toot) => string;
    linkText?: (obj: TrendingWithHistory | Toot) => string;
    onClick: (obj: TrendingWithHistory | Toot, e: React.MouseEvent) => void;
    sectionName: string;
    trendingObjs: Toot[] | TrendingWithHistory[];
};


export default function TrendingSection(props: TrendingProps) {
    const { infoTxt, linkText, onClick, sectionName, trendingObjs } = props;
    const [open, setOpen] = useState<boolean>(false);  // TODO: is this necessary?

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_head`}>
                <Form.Label style={subHeaderLabel} >
                    <span
                        key={`${sectionName}_label1`}
                        style={headerFont}
                    >
                        {capitalCase(sectionName)}
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_body`} onEnter={() => setOpen(true)} style={accordionBody}>
                <div style={roundedBox} key={`${sectionName}_div`}>
                    <ol style={listStyle}>
                        {trendingObjs.map((obj, i) => (
                            <li key={`${linkText(obj)}_${i}`} style={listItemStyle}>
                                <a onClick={e => onClick(obj, e)} style={tagLinkStyle} target="_blank">
                                    {linkText(obj)}
                                </a>

                                <span style={{ marginLeft: "10px" }} >
                                    ({infoTxt(obj)})
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    );
};


const listItemStyle: CSSProperties = {
    marginBottom: "5px",
    marginTop: "5px",
};

const listStyle: CSSProperties = {
    fontSize: 16,
    listStyle: "numeric",
    paddingBottom: "10px",
    paddingLeft: "20px",
};

const subHeaderLabel: CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
};

const tagLinkStyle: CSSProperties = {
    color: "black",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
};
