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
import { TIME_DECAY, StringNumberDict, TheAlgorithm } from "fedialgo";

import WeightSlider from './WeightSlider';

export interface WeightSetterProps {
    algorithm: TheAlgorithm;
};


export default function WeightSetter(params: WeightSetterProps) {
    const { algorithm } = params;
    const [userWeights, setUserWeights] = useState<StringNumberDict>({});

    useEffect(() => {initWeights()}, []);
    const initWeights = async () => setUserWeights(await algorithm.getUserWeights());

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: StringNumberDict): Promise<void> => {
        console.debug(`updateWeights() called with:`, newWeights);
        setUserWeights(newWeights);
        await algorithm.updateUserWeights(newWeights);
    };

    const weightSlider = (scoreName: string) => {
        return (
            <WeightSlider
                description={algorithm.scorersDict[scoreName].description + '.'}
                key={scoreName}
                scoreName={scoreName}
                updateWeights={updateWeights}
                userWeights={userWeights}
            />
        );
    };

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
                        {algorithm.weightedScorers.map((scorer) => weightSlider(scorer.name))}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const evenNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 == 0);
const oddNumbered = (list: Array<any>) => list.filter((_, index) => index % 2 != 0);

export const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "15px",
    textDecoration: "underline",
};

export const roundedBox = {
    borderRadius: "25px",
    broderWidth: "1px",
    background: "lightgrey",
    marginBottom: "20px",
    padding: "20px",
};
