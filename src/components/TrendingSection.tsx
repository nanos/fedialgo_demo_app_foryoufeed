/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";
import { TrendingObj } from "fedialgo/dist/types";

import { accordionBody } from "./FilterAccordionSection";
import { headerFont, roundedBox } from "./WeightSetter";

const LINK_FONT_SIZE = 16;

interface TrendingProps {
    hasCustomStyle?: boolean;
    infoTxt: (obj: TrendingObj) => string;
    linkText: (obj: TrendingObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingObj) => string;
    onClick: (obj: TrendingObj, e: React.MouseEvent) => void;
    sectionName: string;
    trendingObjs: TrendingObj[];
};


export default function TrendingSection(props: TrendingProps) {
    const { hasCustomStyle, infoTxt, linkText, linkUrl, onClick, sectionName, trendingObjs } = props;
    const linkStyle = hasCustomStyle ? tagLinkStyle : boldTagLinkStyle;
    const [open, setOpen] = useState<boolean>(false);  // TODO: is this necessary?

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_head`}>
                <Form.Label style={subHeaderLabel} >
                    <span key={`${sectionName}_label1`} style={headerFont}>
                        {capitalCase(sectionName)}
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_body`} onEnter={() => setOpen(true)} style={accordionBody}>
                <div style={roundedBox} key={`${sectionName}_div`}>
                    <ol style={listStyle}>
                        {trendingObjs.map((obj, i) => (
                            <li key={i} style={listItemStyle}>
                                <a href={linkUrl(obj)} onClick={e => onClick(obj, e)} style={linkStyle} target="_blank">
                                    {linkText(obj)}
                                </a>

                                <span style={infoTxtStyle}>
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
    fontSize: LINK_FONT_SIZE,
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
};

const boldTagLinkStyle: CSSProperties = {
    ...tagLinkStyle,
    fontWeight: "bold",
};

const infoTxtStyle: CSSProperties = {
    fontSize: LINK_FONT_SIZE - 3,
    marginLeft: "6px",
};
