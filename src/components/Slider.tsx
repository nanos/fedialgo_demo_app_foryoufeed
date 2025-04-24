/*
 * Slider that sets a weight for the algorithm.
 */
import React, { ChangeEvent, CSSProperties } from 'react';

import Form from 'react-bootstrap/esm/Form';

export type ChangeHandler = (e: ChangeEvent<HTMLInputElement>) => Promise<void>;

export const DEFAULT_STEP_SIZE = 0.02;

interface SliderProps {
    description: string;
    label: string;
    minValue: number;
    maxValue: number;
    onChange: ChangeHandler;
    stepSize?: number;
    value: number;
};


export default function Slider(props: SliderProps) {
    const { description, label, minValue, maxValue, onChange, stepSize, value } = props;
    if (!value && value != 0) return;

    let step = stepSize ?? (minValue >= 0 ? DEFAULT_STEP_SIZE : 1);
    let decimals = 2;

    if (stepSize == 1) {
        decimals = 0;
    } else if (minValue > 0 && minValue < 0.01) {
        decimals = 3;
    } else if (value >= 10.0) {
        decimals = 1;
    }

    return (
        <Form.Group className="me-2">
            <div style={{...labelContainer}} id="outer_doop">
                <div style={labelContainer} id="innter_doop">
                    <div style={sliderValue} id="innerest_doop">
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

                <div style={{display: 'flex', flexDirection: 'row', justifyContent: "end"}}>
                    <Form.Range
                        className={"custom-slider"}
                        id={label}
                        min={minValue}
                        max={maxValue}
                        onChange={onChange}
                        style={{width: '100%'}}
                        step={step}
                        value={value}
                    />
                </div>
            </div>
        </Form.Group>
    );
};


const labelContainer: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '14px',
    justifyContent: 'space-between',
};

const monoFont: CSSProperties = {
    // fontFamily: "AnonymousPro, Courier New, monospace",
    fontFamily: "Courier New, monospace",
    fontSize: "13px",
    fontWeight: 'bold',
};

const sliderValue: CSSProperties = {
    alignSelf: 'end',
    backgroundColor: 'white',
    border: "1px solid #000",
    borderColor: 'black',
    borderRadius: '3px',
    borderWidth: '1px',
    marginRight: '10px',
    paddingBottom: '1px',
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '1px',
};
