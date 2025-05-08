/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";

import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";
import 'react-tooltip/dist/react-tooltip.css'

export const HASHTAG_ANCHOR = "user-hashtag-anchor";
export const HIGHLIGHT = "highlighted";
export const INVERT_SELECTION = "invertSelection";
export const SORT_KEYS = "sortByCount";

const MAX_LABEL_LENGTH = 18;

interface FilterCheckboxProps {
    capitalize?: boolean,
    isChecked: boolean,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    labelExtra?: number | string,
    tooltipText?: string,
    tooltipColor?: string,
};


export default function FilterCheckbox(props: FilterCheckboxProps) {
    let { capitalize, isChecked, label, labelExtra, onChange, tooltipColor, tooltipText } = props;
    const [isCheckedState, setIsCheckedState] = useState(isChecked);

    labelExtra = (typeof labelExtra == "number") ? labelExtra.toLocaleString() : labelExtra;
    const labelStyle: CSSProperties = {fontWeight: "bold"};
    let style: CSSProperties = {};

    if (tooltipText) {
        style = highlightedCheckboxStyle;
        if (tooltipColor) style = { ...highlightedCheckboxStyle, backgroundColor: tooltipColor };
    }

    if (capitalize) {
        label = capitalCase(label);
        labelStyle.fontSize = "14px";
    } else {
        label = (label.length > (MAX_LABEL_LENGTH - 2)) ? `${label.slice(0, MAX_LABEL_LENGTH)}...` : label;
    }

    return (
        <a
            data-tooltip-id={HASHTAG_ANCHOR + (tooltipText ? HIGHLIGHT : "")}
            data-tooltip-content={tooltipText}
            key={label}
            style={{color: "black"}}
        >
            <Form.Switch
                checked={isCheckedState}
                id={label}
                key={label + "_switch"}
                label={<><span style={labelStyle}>{label}</span>{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
                    setIsCheckedState(e.target.checked);
                    onChange(e);
                }}
                style={{...style}}
            />
        </a>
    );
};


const highlightedCheckboxStyle: CSSProperties = {
    backgroundColor: "cyan",
    borderRadius: "5px"
};
