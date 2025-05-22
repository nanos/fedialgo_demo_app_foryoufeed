/*
 * Drop down button that starts with a default but updates to take a value.
 */
import React, { CSSProperties } from 'react';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

interface LabeledDropdownButton {
    initialLabel: string;
    onClick: (value: string) => void;
    variant?: string;
    options: string[];
};


export default function LabeledDropdownButton(props: LabeledDropdownButton) {
    let { initialLabel, onClick, options, variant } = props;
    const [currentLabel, setCurrentLabel] = React.useState(initialLabel);
    variant ||= "info";

    const selectOption = (value: string) => {
        setCurrentLabel(value);
        onClick(value);
    };

    return (
        <DropdownButton id={initialLabel} title={currentLabel} style={buttonStyle} variant={variant}>
            {options.map((value) => (
                <Dropdown.Item key={value} onClick={() => selectOption(value)}>
                    {value}
                </Dropdown.Item>))}
        </DropdownButton>
    );
};


const buttonStyle: CSSProperties = {
    marginBottom: "5px",
    marginRight: "10px",
    marginTop: "-10px",
};

// const charStyle: CSSProperties = {
//     backgroundColor: FEED_BACKGROUND_COLOR,
//     borderRadius: "15px",
// }

// const textStyle: CSSProperties = {
//     color: "black",
// };
