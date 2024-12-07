/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Slider, { DEFAULT_STEP_SIZE } from './Slider';
import { ScorerInfo, StringNumberDict } from "fedialgo";

const SCALE_MULTIPLIER = 1.2;

interface WeightSliderProps {
    info: ScorerInfo;
    scoreName: string;
    updateWeights: (newWeights: StringNumberDict) => Promise<void>;
    userWeights: StringNumberDict;
};


export default function WeightSlider(props: WeightSliderProps) {
    const { info, scoreName, updateWeights, userWeights } = props;
    if (!userWeights[scoreName] && userWeights[scoreName] != 0) return <></>;

    const weightValues = Object.values(userWeights).filter(x => !isNaN(x)) ?? [0];
    const defaultMin = Math.min(...weightValues) - 1 * SCALE_MULTIPLIER;
    const defaultMax = Math.max(...weightValues) + 1 * SCALE_MULTIPLIER;
    const minValue = info.minValue ?? defaultMin;

    return (
        <Slider
            description={info.description}
            key={scoreName}
            label={scoreName}
            minValue={minValue}
            maxValue={defaultMax}
            onChange={async (e) => {
                const newWeights = Object.assign({}, userWeights);
                newWeights[scoreName] = Number(e.target.value);
                await updateWeights(newWeights);
            }}
            stepSize={(info.minValue && info.minValue < DEFAULT_STEP_SIZE) ? minValue : DEFAULT_STEP_SIZE}
            value={userWeights[scoreName]}
        />
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
