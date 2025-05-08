/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import FilterCheckbox, { HASHTAG_ANCHOR, HIGHLIGHT, INVERT_SELECTION, SORT_KEYS } from "./FilterCheckbox";
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import { capitalCase } from "change-case";
import { NumericFilter, PropertyName, PropertyFilter, TheAlgorithm, TypeFilterName } from "fedialgo";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'

import FilterAccordionSection from "./FilterAccordionSection";
import Slider from "./Slider";
import { logMsg } from "../../helpers/string_helpers";
import { PARTICIPATED_TAG_COLOR_FADED, titleStyle } from "../../helpers/style_helpers";

type HashtagTooltip = {text: string; color: string;};
type MinTootsFilter = {[key in PropertyName]?: number};

// Filtered filters are those that require a minimum number of toots to appear as filter options
const FILTERED_FILTERS = [PropertyName.HASHTAG, PropertyName.USER];
const DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;
const FOLLOWED_TAG_MSG = `You follow this hashtag.`;
const PARTICIPATED_TAG_MSG = `You've posted this hashtag`

const DEFAULT_MIN_TOOTS_TO_APPEAR: MinTootsFilter = {
    [PropertyName.HASHTAG]: DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER,
    [PropertyName.USER]: DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER,
};

interface FilterSetterProps {
    algorithm: TheAlgorithm,
};


export default function FilterSetter(props: FilterSetterProps) {
    const { algorithm } = props;
    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);
    const visibleSections = Object.values(algorithm.filters.filterSections).filter(section => section.visible);
    const trendingTagNames = algorithm.trendingData.tags.map(tag => tag.name);

    const [minTootsCutoffs, setMinTootsCutoffs] = useState<MinTootsFilter>({...DEFAULT_MIN_TOOTS_TO_APPEAR});

    const [sortByValue, setSortByValue] = useState<Record<PropertyName, boolean>>(
        visibleSections.reduce((acc, section) => {
            acc[section.title] = false;
            return acc
        }, {} as Record<PropertyName, boolean>)
    );

    const invertSelectionCheckbox = (filter: PropertyFilter) => {
        return (
            <FilterCheckbox
                isChecked={filter.invertSelection}
                label={INVERT_SELECTION}
                onChange={(e) => {
                    filter.invertSelection = e.target.checked;
                    algorithm.updateFilters(algorithm.filters);
                }}
            />
        );
    };

    const sortKeysCheckbox = (filter: PropertyFilter) => {
        return (
            <FilterCheckbox
                isChecked={sortByValue[filter.title]}
                label={SORT_KEYS}
                onChange={(e) => {
                    logMsg(`sortKeysCheckbox: ${filter.title} called with ${e.target.checked}:`, e);
                    const newSortByValue = {...sortByValue};
                    newSortByValue[filter.title] = e.target.checked;
                    setSortByValue(newSortByValue);
                    logMsg(`sortByValue:`, newSortByValue);
                    algorithm.updateFilters(algorithm.filters);
                }}
            />
        );
    };

    const invertNumericFilterCheckbox = (filters: NumericFilter[]) => {
        return (
            <FilterCheckbox
                isChecked={filters.every((filter) => filter.invertSelection)}
                label={INVERT_SELECTION}
                onChange={(e) => {
                    filters.map(filter => filter.invertSelection = e.target.checked)
                    algorithm.updateFilters(algorithm.filters);
                }}
            />
        );
    };

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, filterSection: PropertyFilter) => {
        let tooltipText: string | undefined;
        let tooltipColor: string | undefined;

        if (filterSection.title == PropertyName.HASHTAG) {
            const tooltip = hashtagTooltip(name);
            tooltipText = tooltip?.text;
            tooltipColor = tooltip?.color;
        } else if (filterSection.title == PropertyName.USER && name in algorithm.userData.followedAccounts) {
            tooltipText = `You follow this account`;
        } else if (filterSection.title == PropertyName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            tooltipText = `You post most in this language`;
        }

        return (
            <FilterCheckbox
                isChecked={filterSection.validValues.includes(name)}
                label={name}
                labelExtra={filterSection.optionInfo[name]}
                onChange={(e) => {
                    filterSection.updateValidOptions(name, e.target.checked);
                    algorithm.updateFilters(algorithm.filters);
                }}
                tooltipText={tooltipText}
                tooltipColor={tooltipColor}
            />
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

    // Turn all the available options for a filter into a grid of checkboxes
    const makeCheckboxList = (filter: PropertyFilter): ReactNode => {
        let optionInfo = filter.optionInfo;

        // If the filter is a "filtered" filter then only allow options with a minimum number of toots.
        // Also always include any followed hashtags.
        if (FILTERED_FILTERS.includes(filter.title)) {
            optionInfo = Object.fromEntries(Object.entries(filter.optionInfo).filter(
                ([option, numToots]) => {
                    if (numToots >= minTootsCutoffs[filter.title]) return true;
                    if (filter.title != PropertyName.HASHTAG) return false;
                    return hashtagTooltip(option)?.text == FOLLOWED_TAG_MSG;
                }
            ));
        }

        let optionKeys = Object.keys(optionInfo);

        if (sortByValue[filter.title]) {
            optionKeys = optionKeys.sort((a, b) => (optionInfo[b] || 0) - (optionInfo[a] || 0));
        } else {
            optionKeys = optionKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        }

        return gridify(optionKeys.map((e) => propertyCheckbox(e, filter)));
    }

    // Generate color and tooltip text for a hashtag checkbox
    const hashtagTooltip = (name: string): HashtagTooltip => {
        if (name in algorithm.userData.followedTags) {
            return {
                text: FOLLOWED_TAG_MSG,
                color: "yellow",
            }
        } else if (trendingTagNames.includes(name)) {
            return {
                text: `This hashtag is trending.`,
                color: "#FAD5A5",
            }
        } else if (name in algorithm.userData.participatedHashtags) {
            const tag = algorithm.userData.participatedHashtags[name];

            return {
                text: `${PARTICIPATED_TAG_MSG} ${tag.numToots} times recently.`,
                color: PARTICIPATED_TAG_COLOR_FADED,
            }
        }
    };

    const filterSectionDescription = (filterSection: PropertyFilter) => {
        let description = filterSection.description;
        return description;
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
                                description={filterSection.description}
                                invertCheckbox={invertSelectionCheckbox(filterSection)}
                                isActive={filterSection.validValues.length > 0}
                                key={filterSection.title}
                                minToots={minTootsCutoffs[filterSection.title]}
                                sectionName={filterSection.title}
                                setMinToots={(minToots) => {
                                    minTootsCutoffs[filterSection.title] = minToots;
                                    setMinTootsCutoffs({...minTootsCutoffs});
                                }}
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
