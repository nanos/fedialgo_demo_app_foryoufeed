/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState, useEffect } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { PresetWeightLabel, PresetWeights, TIME_DECAY, TRENDING, TheAlgorithm, Weights } from "fedialgo";

import WeightSlider from './WeightSlider';
import { accordionBody } from "./FilterAccordionSection";
import { globalFont } from "../helpers/style_helpers";

const PRESET_BUTTON_TITLE = "Preset Algorithm Configurations";


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
                        Feed Algorithm Settings
                    </p>
                </Accordion.Header>

                <Accordion.Body style={accordionBody}>
                    <DropdownButton id="presets" style={presetButton} title={PRESET_BUTTON_TITLE} variant="secondary">
                        {/* Mapping enums is annoying. See: https://www.typescriptlang.org/play/?ts=5.0.4#code/KYDwDg9gTgLgBMAdgVwLZwDIENEHNla7ADOAongDYCWxAFnAN4BQccA5EgKoDKbcAvO3K5qdNgBoW7AF60AEjhh9BbALI4AJlihVE4uABUoWDVRhUIiLBQlMAvkyYwAnmGBwwVAMYBrYFAB5MHNLAUYpLwgNYAAuOD9nCAAzOBc3ZMwcfEISYVFaAG4pCiwAI2AKOOw8AiIyShpC+yKmJORELxDEOCJEfywYYCCugAoEuISMtOAM6uy6vMaASjjPX39hi27mVihgGGQobalWSOiJ4GdJVlYS8srMmpz6kUaAbQSAXWu4OyKHJiRRDEeAQYJbYhhEZSAKlABWwE6ADoEsQRnNarkGnQlnAsJCxpcpq4ZikMc9Fji3p8mEskagsGARr1+oNNpYlkUgA */}
                        {(Object.keys(PresetWeights) as (keyof typeof PresetWeightLabel)[]).map((preset) => (
                            <Dropdown.Item
                                key={preset}
                                onClick={async () => {
                                    const presetWeights = PresetWeights[preset];
                                    console.log(`Setting weights to preset named '${preset}'`, presetWeights);
                                    await updateWeights(presetWeights);
                                }}
                            >
                                {preset}
                            </Dropdown.Item>
                        ))}
                    </DropdownButton>

                    {weightSlider(TIME_DECAY)}
                    {weightSlider(TRENDING)}
                    <div style={{height: '12px'}} />

                    <div style={roundedBox}>
                        <p style={weightingsStyle}>
                            Weightings
                        </p>

                        {sortedScorers.map((scorer) => weightSlider(scorer.name))}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


export const headerFont: CSSProperties = {
    ...globalFont,
    fontSize: 15,
    fontWeight: 800,
    marginLeft: "15px",
    marginBottom: "0px",
    marginTop: "0px",
};

export const roundedBox: CSSProperties = {
    borderRadius: "25px",
    background: "lightgrey",
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "13px",
    paddingTop: "20px",
};

export const titleStyle: CSSProperties = {
    ...globalFont,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: "5px",
    marginLeft: "5px",
    marginTop: "0px",
    textDecoration: "underline",
};

const presetButton: CSSProperties = {
    marginBottom: "7px",
};

const weightingsStyle: CSSProperties = {
    ...titleStyle,
    marginBottom: "15px",
    marginTop: "-5px",
};
