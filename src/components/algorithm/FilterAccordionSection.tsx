/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";

import { globalFont, headerFont, roundedBox } from "../../helpers/style_helpers";

const JUNK_CLASS = "JUNKJUNKJUNK";

interface AccordionProps {
    children: ReactNode,
    description: string,
    invertCheckbox?: React.ReactElement,
    isActive: boolean,
    sortKeysCheckbox?: React.ReactElement,
    sectionName: string;
};


export default function FilterAccordionSection(props: AccordionProps) {
    const { children, description, invertCheckbox, isActive, sectionName, sortKeysCheckbox } = props;

    return (
        <Accordion.Item eventKey={sectionName} >
            <Accordion.Header key={`${sectionName}_head`}>
                <Form.Label style={subHeaderLabel} >
                    <span
                        className={`filterHeader ${isActive ? "filterHeader--active" : ""}`}
                        key={`${sectionName}_label1`}
                    >
                        {capitalCase(sectionName)}
                    </span>

                    <span style={subHeaderFont} key={`${sectionName}_label2`}>
                        {'   '}({description})
                    </span>
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body key={`${sectionName}_body`} style={accordionBody}>
                <div style={invertTagSelectionStyle} key={"invertSelection"}>
                    {invertCheckbox}
                    {sortKeysCheckbox && <><div style={{width: "30px"}} />{sortKeysCheckbox}</>}
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


export const accordionBody: CSSProperties = {
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
    marginBottom: '7px',
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
