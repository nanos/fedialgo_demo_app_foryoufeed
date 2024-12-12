/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { useState, useEffect } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { TIME_DECAY, TRENDING, TheAlgorithm, Weights } from "fedialgo";

import WeightSlider from './WeightSlider';


export default function WeightSetter({ algorithm }: { algorithm: TheAlgorithm }) {
    const [userWeights, setUserWeights] = useState<Weights>({} as Weights);
    const sortedScorers = algorithm.weightedScorers.sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {initWeights()}, []);
    const initWeights = async () => setUserWeights(await algorithm.getUserWeights());

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: Weights): Promise<void> => {
        console.debug(`updateWeights() called with:`, newWeights);
        setUserWeights(newWeights);
        await algorithm.updateUserWeights(newWeights);
    };

    const weightSlider = (scoreName: string) => {
        return (
            <WeightSlider
                info={algorithm.scorersDict[scoreName]}
                key={scoreName}
                scoreName={scoreName}
                updateWeights={updateWeights}
                userWeights={userWeights}
            />
        );
    };

    return (
        <Accordion>
            <Accordion.Item eventKey="9">
                <Accordion.Header>
                    <p style={titleStyle}>
                        Feed Algorithmus
                    </p>
                </Accordion.Header>

                <Accordion.Body>
                    {weightSlider(TIME_DECAY)}
                    {weightSlider(TRENDING)}
                    <div style={{height: '5px'}} />

                    <div style={roundedBox}>
                        <p style={{...titleStyle, marginBottom: "15px", marginTop: "-5px"}}>
                            Weightings
                        </p>

                        {sortedScorers.map((scorer) => weightSlider(scorer.name))}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


export const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 15,
    fontWeight: 800,
    marginLeft: "15px",
    marginBottom: "0px",
    marginTop: "0px",
};

export const roundedBox = {
    borderRadius: "25px",
    broderWidth: "1px",
    background: "lightgrey",
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "13px",
    paddingTop: "20px",
};

export const titleStyle = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: "5px",
    marginLeft: "5px",
    marginTop: "0px",
    textDecoration: "underline",
};
