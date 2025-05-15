/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState } from "react";

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckbox from "./FilterCheckbox";
import FilterCheckboxGrid, { FILTERED_FILTERS } from "./FilterCheckboxGrid";
import Slider from "./Slider";
import { BooleanFilter } from "../../hooks/useAlgorithm";

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

const TOOLTIP_ANCHOR = "ToolTipAnchor";
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

    const minTootsTooltipTxt = `Hide ${filter.title}s with less than ${minToots} toots`;
    const spacer = <div style={{width: "20px"}} />

    let switchbar = [
        <FilterCheckbox
            capitalize={true}
            isChecked={filter.invertSelection}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => filter.invertSelection = e.target.checked}  // TODO: this is modifying the filter directly
        />,

        <FilterCheckbox
            capitalize={true}
            isChecked={sortByCount}
            label={SwitchType.SORT_BY_COUNT}
            onChange={(e) => setSortByValue(e.target.checked)} // TODO: this will unnecessarily call filterFeed
        />
    ];

    if (hasMinToots) {
        switchbar = switchbar.concat([
            <FilterCheckbox
                capitalize={true}
                isChecked={highlightedOnly}
                label={SwitchType.HIGHLIGHTS_ONLY}
                onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily call filterFeed
            />,

            <div style={{width: "23%"}} key={"minTootsSlider"}>
                <a data-tooltip-id={TOOLTIP_ANCHOR} data-tooltip-content={minTootsTooltipTxt}>
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
    } else {
        switchbar = [spacer, ...switchbar, spacer];
    }

    return (
        <FilterAccordionSection
            description={filter.description}
            isActive={filter.validValues.length > 0}
            sectionName={filter.title}
            switchbar={switchbar}
        >
            <FilterCheckboxGrid
                filter={filter}
                minToots={minToots}
                sortByValue={sortByCount}
                highlightedOnly={highlightedOnly}
            />
        </FilterAccordionSection>
    );
};
