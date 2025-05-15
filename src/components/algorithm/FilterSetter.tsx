/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { Tooltip } from 'react-tooltip';

import BooleanFilterAccordionSection from "./BooleanFilterAccordionSection";
import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckbox, { HASHTAG_ANCHOR, HIGHLIGHT } from "./FilterCheckbox";
import Slider from "./Slider";
import { SwitchType } from "./BooleanFilterAccordionSection";
import { titleStyle } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    // Filter for 'visible' because the SERVER_SIDE_FILTERS (blocklist, basically) are not shown to the user
    const booleanFilters = Object.values(algorithm.filters.booleanFilters).filter(f => f.visible);
    const numericFilters = Object.values(algorithm.filters.numericFilters);
    const hasActiveBooleanFilter = booleanFilters.some(f => f.validValues.length);
    const hasActiveNumericFilter = numericFilters.some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    const numericFilterSwitchbar = [
        <FilterCheckbox
            capitalize={true}
            isChecked={numericFilters.every((filter) => filter.invertSelection)}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => numericFilters.forEach((filter) => filter.invertSelection = e.target.checked)}
        />
    ];

    return (
        <Accordion>
            <Accordion.Item eventKey="filters">
                <Accordion.Header style={accordionPadding}>
                    <span
                        className={hasAnyActiveFilter ? "filterHeader--rounded" : "blahblahblah"}
                        style={{...titleStyle, color: hasAnyActiveFilter ? "white" : "black"}}
                    >
                        Feed Filters
                    </span>
                </Accordion.Header>

                <Accordion.Body style={accordionPadding}>
                    <Tooltip id={HASHTAG_ANCHOR + HIGHLIGHT} place="top" />

                    <Accordion key={"fiaccordion"}>
                        {booleanFilters.map((f) => <BooleanFilterAccordionSection filter={f} key={f.title} />)}

                        <FilterAccordionSection
                            description={"Filter based on minimum/maximum number of replies, reposts, etc"}
                            isActive={hasActiveNumericFilter}
                            key={"numericFilters"}
                            switchbar={numericFilterSwitchbar}
                            title="Interactions"
                        >
                            {Object.entries(algorithm.filters.numericFilters).map(([name, numericFilter]) => (
                                <Slider
                                    description={numericFilter.description}
                                    key={name}
                                    label={numericFilter.title}
                                    maxValue={50}
                                    minValue={0}
                                    onChange={async (e) => {
                                        numericFilter.value = Number(e.target.value);
                                        algorithm.updateFilters(algorithm.filters);
                                    }}
                                    stepSize={1}
                                    value={numericFilter.value}
                                />
                            ))}
                        </FilterAccordionSection>
                    </Accordion>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};


const accordionPadding: CSSProperties = {
    padding: "0px",
};
