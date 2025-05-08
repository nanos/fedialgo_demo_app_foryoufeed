/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";
import { PropertyName } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import Slider from "./Slider";
import { accordionBody, globalFont, roundedBox } from "../../helpers/style_helpers";

const TOOLTIP_ANCHOR = "ToolTipAnchor";

interface AccordionProps {
    children: ReactNode,
    description: string,
    invertCheckbox?: React.ReactElement,
    isActive: boolean,
    minToots?: number,
    sectionName: string;
    setMinToots?: (minToots: number) => void,
    sortKeysCheckbox?: React.ReactElement,
};


export default function FilterAccordionSection(props: AccordionProps) {
    const { children, description, invertCheckbox, isActive, minToots, sectionName, setMinToots, sortKeysCheckbox } = props;
    const headerClass = `filterHeader ${isActive ? "filterHeader--active" : ""}`;
    const spacer = <div style={{width: "20px"}} />

    let tooltipText = `Hide ${sectionName}s with less than ${minToots} toots`;
    if (sectionName == PropertyName.HASHTAG.toString()) tooltipText += ` (followed hashtags will always appear)`;

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_head`}>
                <Form.Label style={subHeaderLabel} >
                    <span className={headerClass} key={`${sectionName}_label1`}>
                        {capitalCase(sectionName)}
                    </span>

                    <span style={subHeaderFont} key={`${sectionName}_label2`}>
                        {'   '}({description})
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_body`} style={accordionBody}>
                <Tooltip id={TOOLTIP_ANCHOR} place="bottom" />

                <div style={invertTagSelectionStyle} key={"invertSelection"}>
                    {sortKeysCheckbox && !minToots && spacer}
                    {invertCheckbox}
                    {sortKeysCheckbox && sortKeysCheckbox}
                    {sortKeysCheckbox && !minToots && spacer}

                    {minToots && (
                        <a data-tooltip-id={TOOLTIP_ANCHOR} data-tooltip-content={tooltipText}>
                            <Slider
                                hideValueBox={true}
                                label="Minimum"
                                minValue={1}
                                maxValue={100}
                                onChange={async (e) => setMinToots(parseInt(e.target.value))}
                                stepSize={1}
                                value={minToots}
                                width={"80%"}
                            />
                        </a>)}
                </div>

                <div style={roundedBox} key={sectionName}>
                    <Form.Group className="mb-1">
                        <Form.Group className="mb-1">
                            {children}
                        </Form.Group>
                    </Form.Group>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    );
};


const invertTagSelectionStyle: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'space-around',
    marginBottom: '6px',
};

const subHeaderFont: CSSProperties = {
    ...globalFont,
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
};
