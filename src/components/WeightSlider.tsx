/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Form from 'react-bootstrap/esm/Form';
import { ScoresType } from "fedialgo";

const DEFAULT_VALUE = 1;
const STEP_SIZE = 0.05;

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
    const valueString = <span style={monoFont}>{userWeights[scoreName]?.toFixed(2) ?? defaultValue}</span>;

    return (
        <Form.Group className="mb-1">
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <div>
                    <span style={{fontWeight: 'bold'}}>
                        {`${scoreName}: `}
                    </span>

                    <span>{description}</span>
                </div>

                <div style={sliderValue}>
                    {valueString}
                </div>
            </div>

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


const monoFont = {
    fontFamily: "AnonymousPro, Courier New, monospace",
    fontSize: "15px",
    fontWeight: 'bold',
};

const sliderValue = {
    alignSelf: 'end',
    backgroundColor: 'white',
    // color: 'white',
    border: "1px solid #000",
    borderColor: 'black',
    borderRadius: '3px',
    borderWidth: '1px',
    fontColor: 'white',
    paddingBottom: '2px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '2px',
};
