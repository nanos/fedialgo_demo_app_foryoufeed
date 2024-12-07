/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";

import { headerFont, roundedBox } from "./WeightSetter";

const JUNK_CLASS = "JUNKJUNKJUNK";

interface AccordionProps {
    children: ReactNode,
    description: string,
    invertCheckbox: React.ReactElement,
    isActive: boolean,
    sectionName: string;
}

export default function FilterAccordionSection({ children, description, invertCheckbox, isActive, sectionName }: AccordionProps) {
    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_accordionhead`}>
                <Form.Label style={subHeaderLabel} >
                    <span
                        className={isActive ? "someFilterActive" : JUNK_CLASS}
                        key={`${sectionName}_label1`}
                        style={headerFont}
                    >
                        {capitalCase(sectionName)}
                    </span>

                    <span style={subHeaderFont} key={`${sectionName}_label2`}>
                        {'   '}({description})
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_accordionbody`} style={accordionBody}>
                <div style={invertTagSelectionStyle} key={"invertSelection"}>
                    {invertCheckbox}
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
    )
};


const accordionBody = {
    backgroundColor: '#b2bfd4',
};

const invertTagSelectionStyle: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'center',
    marginBottom: '8px',
};

const subHeaderFont: CSSProperties = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
};
