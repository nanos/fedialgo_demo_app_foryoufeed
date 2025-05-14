/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState, useEffect } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { NON_SCORE_WEIGHTS, PresetWeightLabel, PresetWeights, WeightName, Weights } from "fedialgo";

import WeightSlider from './WeightSlider';
import { accordionBody, roundedBox, titleStyle } from "../../helpers/style_helpers";
import { logMsg } from "../../helpers/string_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

const PRESET_MENU_TITLE = "Preset Algorithm Configurations";


export default function WeightSetter() {
    const { algorithm } = useAlgorithm();
    const [userWeights, setUserWeights] = useState<Weights>({} as Weights);
    const sortedScorers = algorithm.weightedScorers.sort((a, b) => a.name.localeCompare(b.name));
    const initWeights = async () => setUserWeights(await algorithm.getUserWeights());

    useEffect(() => {initWeights()}, []);

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: Weights): Promise<void> => {
        logMsg(`updateWeights() called with:`, newWeights);
        setUserWeights(newWeights);
        await algorithm.updateUserWeights(newWeights);
    };

    const weightSlider = (scoreName: WeightName) => (
        <WeightSlider
            info={algorithm.weightInfo[scoreName]}
            key={scoreName}
            scoreName={scoreName}
            updateWeights={updateWeights}
            userWeights={userWeights}
        />
    );

    return (
        <Accordion>
            <Accordion.Item eventKey="9">
                <Accordion.Header>
                    <p style={titleStyle}>
                        Feed Algorithm Control Panel
                    </p>
                </Accordion.Header>

                <Accordion.Body style={accordionBody}>
                    <DropdownButton id="presets" style={presetMenu} title={PRESET_MENU_TITLE} variant="secondary">
                        {/* Mapping enums is annoying. See: https://www.typescriptlang.org/play/?ts=5.0.4#code/KYDwDg9gTgLgBMAdgVwLZwDIENEHNla7ADOAongDYCWxAFnAN4BQccA5EgKoDKbcAvO3K5qdNgBoW7AF60AEjhh9BbALI4AJlihVE4uABUoWDVRhUIiLBQlMAvkyYwAnmGBwwVAMYBrYFAB5MHNLAUYpLwgNYAAuOD9nCAAzOBc3ZMwcfEISYVFaAG4pCiwAI2AKOOw8AiIyShpC+yKmJORELxDEOCJEfywYYCCugAoEuISMtOAM6uy6vMaASjjPX39hi27mVihgGGQobalWSOiJ4GdJVlYS8srMmpz6kUaAbQSAXWu4OyKHJiRRDEeAQYJbYhhEZSAKlABWwE6ADoEsQRnNarkGnQlnAsJCxpcpq4ZikMc9Fji3p8mEskagsGARr1+oNNpYlkUgA */}
                        {(Object.keys(PresetWeights) as (keyof typeof PresetWeightLabel)[]).map((preset) => (
                            <Dropdown.Item
                                key={preset}
                                onClick={async () => await updateWeights(PresetWeights[preset])}
                            >
                                {preset}
                            </Dropdown.Item>
                        ))}
                    </DropdownButton>

                    {NON_SCORE_WEIGHTS.map((weight) => weightSlider(weight))}
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


const presetMenu: CSSProperties = {
    marginBottom: "7px",
};

const weightingsStyle: CSSProperties = {
    ...titleStyle,
    marginBottom: "15px",
    marginTop: "-5px",
};
