/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, PropsWithChildren, ReactElement } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";

import { accordionBody, globalFont, roundedBox } from "../../helpers/style_helpers";

interface FilterAccordionSectionProps extends PropsWithChildren {
    description: string,
    isActive: boolean,
    sectionName: string;
    switchbar: ReactElement[],
};


export default function FilterAccordionSection(props: FilterAccordionSectionProps) {
    const { description, isActive, sectionName, switchbar } = props;
    const headerClass = `filterHeader ${isActive ? "filterHeader--active" : ""}`;

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
                {/* Top bar with invert/sort switches */}
                <div style={switchesContainer} key={"invertSelection"}>
                    {switchbar}
                </div>

                <div style={filterSwitchContainer} key={sectionName}>
                    <Form.Group className="mb-1">
                        <Form.Group className="mb-1">
                            {props.children}
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

const subHeaderFont: CSSProperties = {
    ...globalFont,
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
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
