/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Form from 'react-bootstrap/esm/Form';
import { ScoresType } from "fedialgo";

const DEFAULT_VALUE = 1;
const STEP_SIZE = 0.01;

interface WeightSliderProps {
    defaultValue?: number | undefined;
    description: string;
    scoreName: string;
    updateWeights: (newWeights: ScoresType) => void;
    userWeights: ScoresType;
};


export default function WeightSlider({
    defaultValue = DEFAULT_VALUE,
    description,
    scoreName,
    updateWeights,
    userWeights,
}: WeightSliderProps) {
    defaultValue = defaultValue ?? DEFAULT_VALUE;
    const descriptionWithValue = `${description}: ${userWeights[scoreName]?.toFixed(2) ?? defaultValue}`;

    return (
        <Form.Group className="mb-3">
            <Form.Label key={`${scoreName}_label`}>
                <b>{scoreName + " - "}</b>{descriptionWithValue}
            </Form.Label>

            <Form.Range
                id={scoreName}
                min={Math.min(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) - 1 * 1.2}
                max={Math.max(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) + 1 * 1.2}
                onChange={(e) => {
                    const newWeights = Object.assign({}, userWeights);
                    newWeights[scoreName] = Number(e.target.value);
                    updateWeights(newWeights);
                }}
                step={STEP_SIZE}
                value={userWeights[scoreName] ?? defaultValue}
            />
        </Form.Group>
    );
};
