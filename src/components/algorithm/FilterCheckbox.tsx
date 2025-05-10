/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";

import Form from 'react-bootstrap/esm/Form';
import { capitalCase } from "change-case";

import { followUri } from "../../helpers/react_helpers";
import { linkesque } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export const HASHTAG_ANCHOR = "user-hashtag-anchor";
export const HIGHLIGHT = "highlighted";
export const INVERT_SELECTION = "invertSelection";
export const SORT_KEYS = "sortByCount";

const MAX_LABEL_LENGTH = 21;

interface FilterCheckboxProps {
    capitalize?: boolean,
    isChecked: boolean,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    labelExtra?: number | string,
    tooltipText?: string,
    tooltipColor?: string,
    url?: string,
};


export default function FilterCheckbox(props: FilterCheckboxProps) {
    let { capitalize, isChecked, label, labelExtra, onChange, tooltipColor, tooltipText, url } = props;
    const [isCheckedState, setIsCheckedState] = useState(isChecked);
    const { algorithm } = useAlgorithm();

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

    let labelNode = <span style={labelStyle}>{label}</span>;

    if (url) {
        labelNode = (
            <a href={url} onClick={(e) => followUri(url, e)} style={hashtagLink}>
                {labelNode}
            </a>
        );
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
                label={<>{labelNode}{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
                    setIsCheckedState(e.target.checked);
                    onChange(e);
                    algorithm?.updateFilters(algorithm.filters);
                }}
                style={{...style}}
            />
        </a>
    );
};


const hashtagLink: CSSProperties = {
    ...linkesque,
    color: "black",
};

const highlightedCheckboxStyle: CSSProperties = {
    backgroundColor: "cyan",
    borderRadius: "12px"
};
