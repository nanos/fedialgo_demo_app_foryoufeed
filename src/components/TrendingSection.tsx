/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";
import { TrendingObj } from "fedialgo";

import { accordionBody } from "./FilterAccordionSection";
import { headerFont, roundedBox } from "../helpers/style_helpers";

export const LINK_FONT_SIZE = 16;
export type TrendingListObj = TrendingObj | string;

interface TrendingProps {
    hasCustomStyle?: boolean;
    infoTxt: (obj: TrendingListObj) => string | undefined;
    linkText: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
    sectionName: string;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    const { hasCustomStyle, infoTxt, linkText, linkUrl, onClick, sectionName, trendingObjs } = props;
    const linkStyle = hasCustomStyle ? tagLinkStyle : boldTagLinkStyle;

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_head`}>
                <Form.Label style={subHeaderLabel} >
                    <span key={`${sectionName}_label1`} style={headerFont}>
                        {capitalCase(sectionName)}
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_body`} style={accordionBody}>
                <div style={roundedBox}>
                    <ol style={listStyle}>
                        {trendingObjs.map((obj, i) => (
                            <li key={i} style={listItemStyle}>
                                <a href={linkUrl(obj)} onClick={e => onClick(obj, e)} style={linkStyle} target="_blank">
                                    {linkText(obj)}
                                </a>

                                {infoTxt(obj) && (
                                    <span style={infoTxtStyle}>
                                        ({infoTxt(obj)})
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    );
};


const listItemStyle: CSSProperties = {
    marginBottom: "7px",
    marginTop: "7px",
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
