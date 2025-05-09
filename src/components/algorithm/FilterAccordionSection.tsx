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

export const ACTIVE_CLASSNAME = "filterHeader--active";
const TOOLTIP_ANCHOR = "ToolTipAnchor";

export interface FilterSwitches {
    invert: React.ReactElement,
    sortKeys?: React.ReactElement,
    tooltipOnly?: React.ReactElement,
}

interface AccordionProps {
    children: ReactNode,
    description: string,
    isActive: boolean,
    maxToots?: number,
    minToots?: number,
    sectionName: string;
    setMinToots?: (minToots: number) => void,
    switches?: FilterSwitches,
};


export default function FilterAccordionSection(props: AccordionProps) {
    const { children, description, isActive, maxToots, minToots, sectionName, setMinToots, switches } = props;
    const headerClass = `filterHeader ${isActive ? "filterHeader--active" : ""}`;
    const spacer = <div style={{width: "20px"}} />

    let tooltipText = `Hide ${sectionName}s with less than ${minToots} toots`;
    if (sectionName == PropertyName.HASHTAG.toString()) tooltipText += ` (followed hashtags will always appear)`;

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header>
                <Form.Label style={subHeaderLabel} >
                    <span className={headerClass} key={`${sectionName}_label1`}>
                        {capitalCase(sectionName)}
                    </span>

                    <span style={subHeaderFont} key={`${sectionName}_label2`}>
                        {'   '}({description})
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body style={accordionBodyDiv}>
                <Tooltip id={TOOLTIP_ANCHOR} place="bottom" />

                {/* Top bar with invert/sort switches */}
                <div style={switchesContainer} key={"invertSelection"}>
                    {switches.sortKeys && !minToots && spacer}
                    {switches.invert}
                    {switches.sortKeys && switches.sortKeys}
                    {switches.tooltipOnly && switches.tooltipOnly}
                    {switches.sortKeys && !minToots && spacer}

                    {/* Show a slider to set minToots filter if needed */}
                    {minToots && (<div style={{width: "23%"}} key={"minTootsSlider"}>
                        <a data-tooltip-id={TOOLTIP_ANCHOR} data-tooltip-content={tooltipText}>
                            <Slider
                                hideValueBox={true}
                                label="Minimum"
                                minValue={1}
                                maxValue={maxToots || 20}
                                onChange={async (e) => setMinToots(parseInt(e.target.value))}
                                stepSize={1}
                                value={minToots}
                                width={"80%"}
                            />
                        </a></div>)}
                </div>

                <div style={filterSwitchContainer} key={sectionName}>
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


const accordionBodyDiv: CSSProperties = {
    ...accordionBody,
    paddingTop: "7px",
};

const filterSwitchContainer: CSSProperties = {
    ...roundedBox,
    paddingTop: "10px",
    paddingBottom: "5px",
    paddingRight: "15px",
};

const switchesContainer: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'space-around',
    marginBottom: '3px',
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
