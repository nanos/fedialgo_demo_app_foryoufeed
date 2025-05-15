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
import { FeedFilterSettings, useAlgorithm } from "../../hooks/useAlgorithm";
import { SwitchType } from "./BooleanFilterAccordionSection";
import { titleStyle } from "../../helpers/style_helpers";

type NumericFilter = FeedFilterSettings["numericFilters"]["Chaos"];


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    // The SERVER_SIDE_FILTERS filter is invisible to the user
    const visibleFilters = Object.values(algorithm.filters.booleanFilters).filter(f => f.visible);
    const hasActiveBooleanFilter = visibleFilters.some(f => f.validValues.length);
    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    const invertNumericFilterCheckbox = (filters: NumericFilter[]) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={filters.every((filter) => filter.invertSelection)}
                label={SwitchType.INVERT_SELECTION}
                onChange={(e) => filters.forEach(filter => filter.invertSelection = e.target.checked)}
            />
        );
    };

    const numericSliders = Object.entries(algorithm.filters.numericFilters).reduce(
        (sliders, [name, numericFilter]) => {
            const slider = (
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
            );

            sliders.push(slider);
            return sliders;
        },
        [] as ReactNode[]
    );

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
                        {visibleFilters.map((f) => <BooleanFilterAccordionSection filter={f} key={f.title} />)}

                        <FilterAccordionSection
                            description={"Filter based on minimum/maximum number of replies, reposts, etc"}
                            isActive={hasActiveNumericFilter}
                            key={"numericFilters"}
                            sectionName="Interactions"
                            switchbar={[invertNumericFilterCheckbox(Object.values(algorithm.filters.numericFilters))]}
                        >
                            {numericSliders}
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
