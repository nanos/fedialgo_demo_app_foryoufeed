/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import * as ChangeCase from "change-case";

import { WeightSetterProps, headerFont, roundedBox, titleStyle } from "./WeightSetter";
import FeedFilterSection, { FilterOptionName } from "fedialgo/dist/objects/feed_filter_section";

const MAX_CHECKBOX_LABEL_LENGTH = 23;


export default function FilterSetter(params: WeightSetterProps) {
    const { algorithm } = params;

    const makeCheckbox = (
        isChecked: boolean,
        filterName: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: string
    ) => {
        let label = filterName;

        if (filterName.length > MAX_CHECKBOX_LABEL_LENGTH) {
            label = filterName.slice(0, MAX_CHECKBOX_LABEL_LENGTH) + '...';
        }

        label = labelExtra ? `${label} (${labelExtra})` : ChangeCase.capitalCase(label);

        return (
            <Form.Check
                checked={isChecked}
                // className="d-flex align-items-end"
                id={filterName}
                key={filterName}
                label={label}
                onChange={(e) => {
                    onChange(e);
                    algorithm.updateFilters(algorithm.filters);
                }}
                type="checkbox"
            />
        );
    };

    const settingCheckbox = (filterName: string) => {
        return makeCheckbox(
            algorithm.filters[filterName],
            filterName,
            (e) => (algorithm.filters[filterName] = e.target.checked)
        );
    };

    const invertSelectionCheckbox = (sectionName: FilterOptionName) => {
        const filterSection = algorithm.filters.filterSections[sectionName];

        return makeCheckbox(
            filterSection.invertSelection,
            "invertSelection",
            (e) => (filterSection.invertSelection = e.target.checked)
        );
    };

    const listCheckbox = (element: string, filterSection: FeedFilterSection) => {
        return makeCheckbox(
            filterSection.validValues.includes(element),
            element,
            (e) => filterSection.updateValidOptions(element, e.target.checked),
            `${filterSection.optionInfo[element]}`
        );
    };

    // Generate a bunch of checkboxes for switches that filter the feed based on an array
    // of values. For example, this could be used to filter on toots' languages.
    const listCheckboxes = (filterSection: FeedFilterSection) => {
        return Object.keys(filterSection.optionInfo)
                     .sort()
                     .map((element) => listCheckbox(element, filterSection));
    };

    const gridify = (list: Array<any>) => {
        if (!list || list.length === 0) return <></>;

        return (
            <Row>
                <Col>{evenNumbered(list)}</Col>
                {list.length > 1 && <Col>{oddNumbered(list)}</Col>}
            </Row>
        );
    };

    const gridify3 = (list: Array<any>) => {
        const col1 = list.filter((_, index) => index % 3 == 0);
        const col2 = list.filter((_, index) => (index + 2) % 3 == 0);
        const col3 = list.filter((_, index) => (index + 1) % 3 == 0);

        return (
            <Row>
                <Col>{col1}</Col>
                <Col>{col2}</Col>
                <Col>{col3}</Col>
            </Row>
        );
    };

    const tootSourceFilterCheckboxes = Object.keys(algorithm.filters)
                                             .sort()
                                             .filter((filter) => typeof algorithm.filters[filter] === 'boolean')
                                             .map((filter) => settingCheckbox(filter));

    const checkboxSections = Object.entries(algorithm.filters.filterSections).reduce((sections, [name, filterSection]) => {
        sections[name] = listCheckboxes(filterSection);
        return sections;
    }, {});

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header style={{padding: "0px"}}>
                    <p style={titleStyle}>
                        Filter Toots
                    </p>
                </Accordion.Header>

                <Accordion.Body style={{padding: "0px"}}>
                    <Accordion key={"baseFilters"}>
                        <Accordion.Item eventKey="5">
                            <Accordion.Header>
                                <Form.Label style={subHeaderLabel}>
                                    <span style={headerFont}>Filters</span>
                                    <span style={subHeaderFont}>{'   '}(Choose what kind of toots are in your feed)</span>
                                </Form.Label>
                            </Accordion.Header>

                            <Accordion.Body>
                                <div style={roundedBox}>
                                    <Form.Group className="mb-1">
                                        <Form.Group className="mb-1">
                                            {gridify(tootSourceFilterCheckboxes)}
                                        </Form.Group>
                                    </Form.Group>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    {Object.entries(checkboxSections).map(([sectionName, checkboxes]) => (
                        <Accordion key={sectionName}>
                            <Accordion.Item eventKey={sectionName} className="accordion-inner-button">
                                <Accordion.Header>
                                    <Form.Label style={subHeaderLabel}>
                                        <span style={headerFont}>{ChangeCase.capitalCase(sectionName)}</span>

                                        <span style={subHeaderFont}>
                                            {'   '}({algorithm.filters.filterSections[sectionName].description})
                                        </span>
                                    </Form.Label>
                                </Accordion.Header>

                                <Accordion.Body style={{backgroundColor: '#b2bfd4'}}>
                                    <div style={invertTagSelectionStyle}>
                                        {invertSelectionCheckbox(sectionName as FilterOptionName)}
                                    </div>

                                    <div style={roundedBox} key={sectionName}>
                                        <Form.Group className="mb-1">
                                            <Form.Group className="mb-1">
                                                {gridify3(checkboxes)}
                                            </Form.Group>
                                        </Form.Group>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    ))}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const evenNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 == 0);
const oddNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 != 0);

const invertTagSelectionStyle: React.CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'center',
    marginBottom: '8px',
};

const subHeaderFont: React.CSSProperties = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: React.CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
};
