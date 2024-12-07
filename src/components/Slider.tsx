/*
 * Slider that sets a weight for the algorithm.
 */
import React, { ChangeEvent } from 'react';

import Form from 'react-bootstrap/esm/Form';
import { WeightName } from 'fedialgo/dist/types';

interface SliderProps {
    description: string;
    label: WeightName;
    minValue: number;
    maxValue: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    value: number;
};


export default function Slider(props: SliderProps) {
    const { description, label, minValue, maxValue, onChange, value } = props;
    if (!value && value != 0) return <></>;
    let stepSize = minValue;
    let decimals = 2;

    if (minValue > 0 && minValue < 0.01) {
        decimals = 3;
    } else if (minValue % 1 == 0) {
        decimals = 0;
        stepSize = 1;
    }

    return (
        <Form.Group className="me-2">
            <div style={{alignItems: 'center', display: 'flex', flexDirection: 'row', justifyContent: 'start'}}>
                <div style={sliderValue}>
                    <span style={monoFont}>
                        {value?.toFixed(decimals)}
                    </span>
                </div>

                <span>
                    <span style={{fontWeight: 'bold', marginRight: '3px'}}>
                        {`${label}:`}
                    </span>

                    <span>{description}</span>
                </span>
            </div>

            <Form.Range
                className={"custom-slider"}
                id={label}
                min={minValue}
                max={maxValue}
                onChange={onChange}
                step={stepSize}
                value={value}
            />
        </Form.Group>
    );
};


const monoFont = {
    fontFamily: "AnonymousPro, Courier New, monospace",
    fontSize: "13px",
    fontWeight: 'bold',
};

const sliderValue = {
    alignSelf: 'end',
    backgroundColor: 'white',
    border: "1px solid #000",
    borderColor: 'black',
    borderRadius: '3px',
    borderWidth: '1px',
    fontColor: 'white',
    marginRight: '10px',
    paddingBottom: '1px',
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '1px',
};
