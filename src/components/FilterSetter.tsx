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
import { StringNumberDict } from "fedialgo";

import { WeightSetterProps, headerFont, roundedBox } from "./WeightSetter";

const MAX_CHECKBOX_LABEL_LENGTH = 20;


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

    const listCheckbox = (element: string, filterList: string[], numToots: number) => {
        return makeCheckbox(
            filterList.includes(element),
            element,
            (e) => {
                if (e.target.checked) {
                    filterList.push(element);
                } else {
                    filterList.splice(filterList.indexOf(element), 1);
                }
            },
            `${numToots}`
        );
    };

    // Generate a bunch of checkboxes for switches that filter the feed based on an array
    // of values. For example, this could be used to filter on toots' languages.
    const listCheckboxes = (counts: StringNumberDict, filterList: string[]) => {
        return Object.keys(counts)
                     .sort()
                     .map((element) => listCheckbox(element, filterList, counts[element]));
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

    const filterCheckboxes = Object.keys(algorithm.filters)
                                   .sort()
                                   .filter((filter) => typeof algorithm.filters[filter] === 'boolean')
                                   .map((filter) => settingCheckbox(filter));

    const checkboxSections = {
        languages: listCheckboxes(algorithm.feedLanguageCounts, algorithm.filters.filteredLanguages),
        apps: listCheckboxes(algorithm.appCounts, algorithm.filters.filteredApps),
        tags: listCheckboxes(algorithm.tagFilterCounts, algorithm.filters.filteredTags),
    };

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    <p style={{fontSize: 25, fontWeight: "bold"}}>
                        Filter Toots
                    </p>
                </Accordion.Header>

                <Accordion.Body>
                    <Accordion key={"baseFilters"}>
                        <Accordion.Item eventKey="5">
                            <Accordion.Header>
                                <Form.Label>
                                    <span style={headerFont}>Filters</span> (Choose what kind of toots are in your feed)
                                </Form.Label>
                            </Accordion.Header>

                            <Accordion.Body>
                                <div style={roundedBox}>
                                    <Form.Group className="mb-1">
                                        <Form.Group className="mb-1">
                                            {gridify(filterCheckboxes)}
                                        </Form.Group>
                                    </Form.Group>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    {Object.entries(checkboxSections).map(([sectionName, checkboxes]) => (
                        <Accordion key={sectionName}>
                            <Accordion.Item eventKey="5">
                                <Accordion.Header>
                                    <Form.Label>
                                        <span style={headerFont}>{ChangeCase.capitalCase(sectionName)}</span>
                                        {'   '}(Show only toots from these {sectionName})
                                    </Form.Label>
                                </Accordion.Header>

                                <Accordion.Body>
                                    {sectionName == "tags" && settingCheckbox("suppressSelectedTags")}

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
