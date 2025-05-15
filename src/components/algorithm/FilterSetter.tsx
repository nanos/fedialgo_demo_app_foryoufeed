/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { NumericFilter, BooleanFilterName, BooleanFilter } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection, { ACTIVE_CLASSNAME } from "./FilterAccordionSection";
import FilterCheckbox, { HASHTAG_ANCHOR, HIGHLIGHT, INVERT_SELECTION, SORT_KEYS } from "./FilterCheckbox";
import FilterCheckboxGrid, { FILTERED_FILTERS } from "./FilterCheckboxGrid";
import Slider from "./Slider";
import { logMsg } from "../../helpers/string_helpers";
import { titleStyle } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

type MinTootsFilter = {[key in BooleanFilterName]?: number};

const DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;

const DEFAULT_MIN_TOOTS_TO_APPEAR: MinTootsFilter = {
    [BooleanFilterName.HASHTAG]: DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER,
    [BooleanFilterName.USER]: DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER,
};


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);
    const hasActiveBooleanFilter = Object.values(algorithm.filters.booleanFilters).some(f => f.visible && f.validValues.length);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;
    const visibleSections = Object.values(algorithm.filters.booleanFilters).filter(section => section.visible);
    const [minTootsCutoffs, setMinTootsCutoffs] = useState<MinTootsFilter>({...DEFAULT_MIN_TOOTS_TO_APPEAR});

    const [sortByValue, setSortByValue] = useState<Record<BooleanFilterName, boolean>>(
        visibleSections.reduce((acc, section) => {
            acc[section.title] = false;
            return acc
        }, {} as Record<BooleanFilterName, boolean>)
    );

    const [tooltippedOnly, setTooltippedOnly] = useState<Record<BooleanFilterName, boolean>>(
        visibleSections.reduce((acc, section) => {
            acc[section.title] = false;
            return acc
        }, {} as Record<BooleanFilterName, boolean>)
    );

    const invertSelectionCheckbox = (filter: BooleanFilter) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={filter.invertSelection}
                label={INVERT_SELECTION}
                onChange={(e) => {
                    filter.invertSelection = e.target.checked;
                }}
            />
        );
    };

    const sortKeysCheckbox = (filter: BooleanFilter) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={sortByValue[filter.title]}
                label={SORT_KEYS}
                onChange={(e) => {
                    const newSortByValue = {...sortByValue};
                    newSortByValue[filter.title] = e.target.checked;
                    setSortByValue(newSortByValue);
                }}
            />
        );
    };

    const tooltipOnlyCheckbox = (filter: BooleanFilter) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={tooltippedOnly[filter.title]}
                label={"Highlights Only"}
                onChange={(e) => {
                    const newTooltippedOnly = {...tooltippedOnly};
                    newTooltippedOnly[filter.title] = e.target.checked;
                    setTooltippedOnly(newTooltippedOnly);
                }}
            />
        );
    };

    const invertNumericFilterCheckbox = (filters: NumericFilter[]) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={filters.every((filter) => filter.invertSelection)}
                label={INVERT_SELECTION}
                onChange={(e) => {
                    filters.map(filter => filter.invertSelection = e.target.checked)
                    algorithm.updateFilters(algorithm.filters);
                }}
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
                        {/* property filters (language, type, etc) */}
                        {visibleSections.map((filterSection) => (
                            <FilterAccordionSection
                                description={filterSection.description}
                                isActive={filterSection.validValues.length > 0}
                                key={filterSection.title}
                                minToots={minTootsCutoffs[filterSection.title]}
                                maxToots={Math.max(...Object.values(filterSection.optionInfo))}
                                sectionName={filterSection.title}
                                setMinToots={(minToots) => {
                                    minTootsCutoffs[filterSection.title] = minToots;
                                    setMinTootsCutoffs({...minTootsCutoffs});
                                }}
                                switches={{
                                    invert: invertSelectionCheckbox(filterSection),
                                    sortKeys: sortKeysCheckbox(filterSection),
                                    tooltipOnly: FILTERED_FILTERS.includes(filterSection.title) && tooltipOnlyCheckbox(filterSection),
                                }}
                            >
                                <FilterCheckboxGrid
                                    filter={filterSection}
                                    minToots={minTootsCutoffs[filterSection.title]}
                                    sortByValue={sortByValue[filterSection.title]}
                                    tooltippedOnly={tooltippedOnly[filterSection.title]}
                                />
                            </FilterAccordionSection>))}

                        <FilterAccordionSection
                            description={"Filter based on minimum/maximum number of replies, reposts, etc"}
                            isActive={hasActiveNumericFilter}
                            key={"numericFilters"}
                            sectionName="Interactions"
                            switches={{invert: invertNumericFilterCheckbox(Object.values(algorithm.filters.numericFilters))}}
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
