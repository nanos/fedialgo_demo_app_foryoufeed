/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import * as ChangeCase from "change-case";
import { TIME_DECAY, FeedFilterSettings, StringNumberDict, TheAlgorithm } from "fedialgo";

import WeightSlider from './WeightSlider';

interface WeightSetterProps {
    algorithm: TheAlgorithm;
    updateFilters: (settings: FeedFilterSettings) => void;
    updateWeights: (weights: StringNumberDict) => Promise<void>;
    userWeights: StringNumberDict;
};


export default function WeightSetter(params: WeightSetterProps) {
    const { algorithm, updateFilters, updateWeights, userWeights,} = params

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
                    updateFilters(algorithm.filters);
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

    const languageCheckbox = (languageCode: string) => {
        const filteredLanguages = algorithm.filters.filteredLanguages

        return makeCheckbox(
            algorithm.filters.filteredLanguages.includes(languageCode),
            languageCode,
            (e) => {
                if (e.target.checked) {
                    filteredLanguages.push(languageCode);
                } else {
                    filteredLanguages.splice(filteredLanguages.indexOf(languageCode), 1);
                }
            },
            `${algorithm.feedLanguages[languageCode]} toots`
        );
    };

    const weightSlider = (scoreName: string) => {
        return (
            <WeightSlider
                description={algorithm.scorersDict[scoreName].description}
                key={scoreName}
                scoreName={scoreName}
                updateWeights={updateWeights}
                userWeights={userWeights}
            />
        );
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

    const languageCheckboxes = Object.keys(algorithm.feedLanguages)
                                     .sort()
                                     .map((lang) => languageCheckbox(lang));

    return (
        <Accordion>
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    <p style={{fontSize: 25, fontWeight: "bold"}}>
                        Feed Algorithmus
                    </p>
                </Accordion.Header>

                <Accordion.Body>
                    {weightSlider(TIME_DECAY)}
                    <div style={{height: '5px'}} />

                    <div style={roundedBox}>
                        <p style={headerFont}>Weightings</p>
                        {userWeights && algorithm.weightedScorers.map((scorer) => weightSlider(scorer.name))}
                    </div>

                    <div style={roundedBox}>
                        <p style={headerFont}>Filters</p>

                        <Form.Label>
                            <b>If you turn off both toots from accounts you follow as well as trending toots you will see no toots.</b>
                        </Form.Label>

                        <Form.Group className="mb-1">
                            {algorithm.filters && gridify(filterCheckboxes)}
                        </Form.Group>
                    </div>

                    <div style={roundedBox}>
                        <p style={headerFont}>Languages</p>

                        <Form.Group className="mb-1">
                            <Form.Label>
                                <b>Show only toots in these languages:</b>
                            </Form.Label>

                            {gridify(languageCheckboxes)}
                        </Form.Group>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const evenNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 == 0);
const oddNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 != 0);

const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "15px",
    textDecoration: "underline",
};

const roundedBox = {
    borderRadius: "25px",
    broderWidth: "1px",
    background: "lightgrey",
    marginBottom: "20px",
    padding: "20px",
};
