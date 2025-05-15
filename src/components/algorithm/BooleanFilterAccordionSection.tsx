/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import React, { CSSProperties, useState } from "react";

import { BooleanFilter } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckbox from "./FilterCheckbox";
import FilterCheckboxGrid, { FILTERED_FILTERS } from "./FilterCheckboxGrid";
import Slider from "./Slider";
import { TOOLTIP_ANCHOR } from "../../helpers/style_helpers";

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

const DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;
    const hasMinToots = FILTERED_FILTERS.includes(filter.title);

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(hasMinToots ? DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER : 0);
    const [sortByCount, setSortByValue] = useState(false);

    const minTootsTooltipAnchor = `${TOOLTIP_ANCHOR}-${filter.title}`;
    const minTootsTooltipTxt = `Hide ${filter.title}s with less than ${minToots} toots`;
    const spacer = <div style={{width: "20px"}} />

    let switchbar = [
        <FilterCheckbox
            capitalize={true}
            isChecked={filter.invertSelection}
            key={SwitchType.INVERT_SELECTION}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => filter.invertSelection = e.target.checked}  // TODO: this is modifying the filter directly
        />,

        <FilterCheckbox
            capitalize={true}
            isChecked={sortByCount}
            key={SwitchType.SORT_BY_COUNT}
            label={SwitchType.SORT_BY_COUNT}
            onChange={(e) => setSortByValue(e.target.checked)} // TODO: this will unnecessarily call filterFeed
        />
    ];

    if (!hasMinToots) {
        switchbar = [spacer, ...switchbar, spacer];
    } else {
        switchbar = switchbar.concat([
            <FilterCheckbox
                capitalize={true}
                isChecked={highlightedOnly}
                key={SwitchType.HIGHLIGHTS_ONLY}
                label={SwitchType.HIGHLIGHTS_ONLY}
                onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily call filterFeed
            />,

            <div style={{width: "23%"}} key={"minTootsSlider"}>
                <Tooltip id={minTootsTooltipAnchor} place="bottom" />

                <a data-tooltip-id={minTootsTooltipAnchor} data-tooltip-content={minTootsTooltipTxt}>
                    <Slider
                        hideValueBox={true}
                        label="Minimum"
                        minValue={1}
                        maxValue={Math.max(...Object.values(filter.optionInfo)) || 5}
                        onChange={async (e) => setMinToots(parseInt(e.target.value))}
                        stepSize={1}
                        value={minToots}
                        width={"80%"}
                    />
                </a>
            </div>
        ]);
    }

    return (
        <FilterAccordionSection
            description={filter.description}
            isActive={filter.validValues.length > 0}
            switchbar={switchbar}
            title={filter.title}
        >
            <FilterCheckboxGrid
                filter={filter}
                minToots={minToots}
                sortByCount={sortByCount}
                highlightedOnly={highlightedOnly}
            />
        </FilterAccordionSection>
    );
};
