/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { useState, useEffect } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import * as ChangeCase from "change-case";
import { StringNumberDict } from "fedialgo";

import { headerFont, roundedBox, WeightSetterProps } from "./WeightSetter";


export default function FilterSetter(params: WeightSetterProps) {
    const { algorithm } = params;

    const makeCheckbox = (
        isChecked: boolean,
        filterName: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: string
    ) => {
        const label = labelExtra ? `${filterName} (${labelExtra})` : ChangeCase.capitalCase(filterName);

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
            `${numToots} toots`
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

    const filterCheckboxes = Object.keys(algorithm.filters)
                                   .sort()
                                   .filter((filter) => typeof algorithm.filters[filter] === 'boolean')
                                   .map((filter) => settingCheckbox(filter));

    const checkboxSections = {
        languages: listCheckboxes(algorithm.feedLanguageCounts, algorithm.filters.filteredLanguages),
        apps: listCheckboxes(algorithm.appCounts, algorithm.filters.filteredApps),
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
                    <div style={roundedBox}>
                        <p style={headerFont}>Filters</p>

                        <Form.Label>
                            <b>Choose what kind of toots are in your feed.</b>
                        </Form.Label>

                        <Form.Group className="mb-1">
                            {gridify(filterCheckboxes)}
                        </Form.Group>
                    </div>

                    {Object.entries(checkboxSections).map(([sectionName, checkboxes]) => (
                        <div style={roundedBox} key={sectionName}>
                            <p style={headerFont}>{ChangeCase.capitalCase(sectionName)}</p>

                            <Form.Group className="mb-1">
                                <Form.Label>
                                    <b>Show only toots from these {sectionName}:</b>
                                </Form.Label>

                                <Form.Group className="mb-1">
                                    {gridify(checkboxes)}
                                </Form.Group>
                            </Form.Group>
                        </div>
                    ))}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const evenNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 == 0);
const oddNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 != 0);
