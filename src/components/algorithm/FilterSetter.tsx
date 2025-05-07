/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import { capitalCase } from "change-case";
import { NumericFilter, PropertyName, PropertyFilter, TheAlgorithm, TypeFilterName } from "fedialgo";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'

import FilterAccordionSection from "./FilterAccordionSection";
import Slider from "./Slider";
import { logMsg } from "../../helpers/string_helpers";
import { titleStyle } from "../../helpers/style_helpers";

const MAX_LABEL_LENGTH = 18;
const HASHTAG_ANCHOR = "user-hashtag-anchor";
const HIGHLIGHT = "highlighted";
const INVERT_SELECTION = "invertSelection";
const SORT_KEYS = "sortByCount";
const CAPITALIZED_LABELS = [INVERT_SELECTION, SORT_KEYS].concat(Object.values(TypeFilterName) as string[]);
// Filtered filters are those that require a minimum number of toots to appear as filter options
const FILTERED_FILTERS = [PropertyName.HASHTAG, PropertyName.USER];
const MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;
const MIN_TOOT_MSG = ` with at least ${MIN_TOOTS_TO_APPEAR_IN_FILTER} toots`;

interface FilterSetterProps {
    algorithm: TheAlgorithm,
    resetNumDisplayedToots: () => void,
};


export default function FilterSetter(props: FilterSetterProps) {
    const {algorithm, resetNumDisplayedToots} = props;
    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);
    const visibleSections = Object.values(algorithm.filters.filterSections).filter(section => section.visible);

    const [sortByValue, setSortByValue] = useState<Record<PropertyName, boolean>>(
        visibleSections.reduce((acc, section) => {
            acc[section.title] = false;
            return acc
        }, {} as Record<PropertyName, boolean>)
    );

    // TODO: this maybe should be refactored to its own Component with a state variable?
    // Throwing errors (though rarely) as it is. React's suggestion is here:
    // https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable
    const makeCheckbox = (
        isChecked: boolean,
        label: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: number | string,
        tooltipText?: string,
        tooltipColor?: string,
    ) => {
        labelExtra = (typeof labelExtra == "number") ? labelExtra.toLocaleString() : labelExtra;
        const labelStyle: CSSProperties = {fontWeight: "bold"};
        let style: CSSProperties = {};

        if (tooltipText) {
            style = highlightedCheckboxStyle;
            if (tooltipColor) style = { ...highlightedCheckboxStyle, backgroundColor: tooltipColor };
        }

        if (CAPITALIZED_LABELS.includes(label)) {
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
                    checked={isChecked}
                    id={label}
                    key={label}
                    label={<><span style={labelStyle}>{label}</span>{labelExtra && ` (${labelExtra})`}</>}
                    onChange={(e) => {
                        onChange(e);
                        algorithm.updateFilters(algorithm.filters);
                        // TODO: should we reset the displayed toots here?
                        //resetNumDisplayedToots();
                    }}
                    style={style}
                />
            </a>
        );
    };

    const invertSelectionCheckbox = (filter: PropertyFilter) => {
        return makeCheckbox(
            filter.invertSelection,
            INVERT_SELECTION,
            (e) => (filter.invertSelection = e.target.checked)
        );
    };

    const sortKeysCheckbox = (filter: PropertyFilter) => {
        return makeCheckbox(
            sortByValue[filter.title],
            SORT_KEYS,
            (e) => {
                logMsg(`sortKeysCheckbox: ${filter.title} called with ${e.target.checked}:`, e);
                const newSortByValue = {...sortByValue};
                newSortByValue[filter.title] = e.target.checked;
                setSortByValue(newSortByValue);
                logMsg(`sortByValue:`, newSortByValue);
            }
        );
    };

    const invertNumericFilterCheckbox = (filters: NumericFilter[]) => {
        return makeCheckbox(
            filters.every((filter) => filter.invertSelection),
            INVERT_SELECTION,
            (e) => filters.map(filter => filter.invertSelection = e.target.checked)
        );
    };

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, filterSection: PropertyFilter) => {
        let tooltipText: string | undefined;
        let tooltipColor: string | undefined;

        if (filterSection.title == PropertyName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                const tag = algorithm.userData.followedTags[name];
                tooltipText = `You follow this hashtag.`;
                tooltipColor = "yellow";
            } else if (name in algorithm.userData.participatedHashtags) {
                const tag = algorithm.userData.participatedHashtags[name];
                tooltipText = `You've posted this hashtag ${tag.numToots} times recently.`;
            }
        } else if (filterSection.title == PropertyName.USER && name in algorithm.userData.followedAccounts) {
            tooltipText = `You follow this account`;
        } else if (filterSection.title == PropertyName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            tooltipText = `You post most in this language`;
        }

        return makeCheckbox(
            filterSection.validValues.includes(name),
            name,
            (e) => filterSection.updateValidOptions(name, e.target.checked),
            filterSection.optionInfo[name],
            tooltipText,
            tooltipColor
        );
    };

    const gridify = (list: ReactNode[]): ReactNode => {
        if (!list || list.length === 0) return <></>;
        const numCols = list.length > 10 ? 3 : 2;

        const columns = list.reduce((cols, element, index) => {
            const colIndex = index % numCols;
            cols[colIndex] ??= [];
            cols[colIndex].push(element);
            return cols;
        }, [] as ReactNode[][]);

        return <Row>{columns.map((col, i: number) => <Col key={i}>{col}</Col>)}</Row>;
    };

    const makeCheckboxList = (filter: PropertyFilter) => {
        let optionInfo = filter.optionInfo;

        if (FILTERED_FILTERS.includes(filter.title)) {
            optionInfo = Object.fromEntries(Object.entries(filter.optionInfo).filter(
                ([_k, v]) => v >= MIN_TOOTS_TO_APPEAR_IN_FILTER)
            );
        }

        let optionKeys = Object.keys(optionInfo);

        if (sortByValue[filter.title]) {
            optionKeys = optionKeys.sort((a, b) => (optionInfo[b] || 0) - (optionInfo[a] || 0));
        } else {
            optionKeys = optionKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        }

        return gridify(optionKeys.map((e) => propertyCheckbox(e, filter)));
    }

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
                    <p style={titleStyle}>
                        Feed Filters
                    </p>
                </Accordion.Header>

                <Accordion.Body style={accordionPadding}>
                    <Tooltip id={HASHTAG_ANCHOR + HIGHLIGHT} place="top" />

                    <Accordion key={"fiaccordion"}>
                        {/* property filters (language, type, etc) */}
                        {visibleSections.map((filterSection) => (
                            <FilterAccordionSection
                                description={
                                    filterSection.description +
                                    (FILTERED_FILTERS.includes(filterSection.title) ? MIN_TOOT_MSG : "")
                                }
                                invertCheckbox={invertSelectionCheckbox(filterSection)}
                                key={filterSection.title}
                                isActive={filterSection.validValues.length > 0}
                                sectionName={filterSection.title}
                                sortKeysCheckbox={sortKeysCheckbox(filterSection)}
                            >
                                {makeCheckboxList(filterSection)}
                            </FilterAccordionSection>))}

                        <FilterAccordionSection
                            description={"Filter based on minimum/maximum number of replies, reposts, etc"}
                            invertCheckbox={invertNumericFilterCheckbox(Object.values(algorithm.filters.numericFilters))}
                            isActive={hasActiveNumericFilter}
                            key={"numericFilters"}
                            sectionName="Interactions"
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

export const highlightedCheckboxStyle: CSSProperties = {
    backgroundColor: "cyan",
    borderRadius: "5px"
};

const followedCheckboxStyle: CSSProperties = {
    ...highlightedCheckboxStyle,
    backgroundColor: "yellow",
};
