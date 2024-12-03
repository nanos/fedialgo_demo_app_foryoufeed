/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Form from 'react-bootstrap/esm/Form';
import { StringNumberDict } from "fedialgo";

const DEFAULT_VALUE = 1;
const STEP_SIZE = 0.02;

interface WeightSliderProps {
    description: string;
    scoreName: string;
    updateWeights: (newWeights: StringNumberDict) => Promise<void>;
    userWeights: StringNumberDict;
};


export default function WeightSlider(props: WeightSliderProps) {
    const { description, scoreName, updateWeights, userWeights } = props;
    if (!userWeights[scoreName]) return <></>;

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
                    <span style={monoFont}>
                        {userWeights[scoreName]?.toFixed(2)}
                    </span>
                </div>
            </div>

            <Form.Range
                id={scoreName}
                min={Math.min(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) - 1 * 1.2}
                max={Math.max(...Object.values(userWeights).filter(x => !isNaN(x)) ?? [0]) + 1 * 1.2}
                onChange={async (e) => {
                    const newWeights = Object.assign({}, userWeights);
                    newWeights[scoreName] = Number(e.target.value);
                    await updateWeights(newWeights);
                }}
                step={STEP_SIZE}
                value={userWeights[scoreName]}
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
