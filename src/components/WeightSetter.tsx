/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React from 'react';

import * as ChangeCase from "change-case";
import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import { DEFAULT_TIME_DECAY, NO_LANGUAGE, TIME_DECAY, FeedFilterSettings, ScoresType, TheAlgorithm } from "fedialgo";

import WeightSlider from './WeightSlider';
import { CountsType } from "../types";

const TIME_DECAY_DESCRIPTION = "Higher values means toots are demoted sooner";

interface WeightSetterProps {
    algorithm: TheAlgorithm;
    languagesInFeed: CountsType;
    updateFilters: (settings: FeedFilterSettings) => void;
    updateWeights: (weights: ScoresType) => Promise<ScoresType>;
    userWeights: ScoresType;
};


export default function WeightSetter({
    algorithm,
    languagesInFeed,
    updateFilters,
    updateWeights,
    userWeights,
}: WeightSetterProps) {
    if (!algorithm) return <></>;

    const makeCheckbox = (
        isChecked: boolean,
        label: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: string
    ) => {
        return (
            <Form.Check
                checked={isChecked}
                id={label}
                key={label}
                label={ChangeCase.capitalCase(label) + (labelExtra ? ` (${labelExtra})` : '')}
                onChange={(e) => {
                    onChange(e);
                    updateFilters(algorithm.filters);
                }}
                type="checkbox"
            />
        );
    };

    const settingCheckbox = (settingName: string) => {
        return makeCheckbox(
            algorithm.filters[settingName],
            settingName,
            (e) => (algorithm.filters[settingName] = e.target.checked)
        );
    };

    const languageCheckbox = (languageCode: string) => {
        const lang = languageCode || NO_LANGUAGE;
        const filteredLanguages = algorithm.filters.filteredLanguages

        return makeCheckbox(
            algorithm.filters.filteredLanguages.includes(lang),
            lang,
            (e) => {
                if (e.target.checked) {
                    filteredLanguages.push(lang);
                } else {
                    filteredLanguages.splice(filteredLanguages.indexOf(lang), 1);
                }
            },
            `${languagesInFeed[languageCode]} toots`
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

    const languageCheckboxes = Object.keys(languagesInFeed)
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
                    {/* Time Decay slider */}
                    <WeightSlider
                        defaultValue={DEFAULT_TIME_DECAY}
                        description={TIME_DECAY_DESCRIPTION}
                        key={TIME_DECAY}
                        scoreName={TIME_DECAY}
                        updateWeights={updateWeights}
                        userWeights={userWeights}
                    />

                    <div style={{height: '5px'}} />

                    {/* Other feature weighting sliders */}
                    <div style={roundedBox}>
                        <p style={headerFont}>Weightings</p>

                        {userWeights && algorithm.weightedScoreNames.map((scoreName) => (
                            <WeightSlider
                                description={algorithm.getDescription(scoreName)}
                                key={scoreName}
                                scoreName={scoreName}
                                updateWeights={updateWeights}
                                userWeights={userWeights}
                            />))}
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
