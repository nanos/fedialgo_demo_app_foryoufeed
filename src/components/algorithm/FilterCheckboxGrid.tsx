/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useMemo, useState } from "react";

import Col from 'react-bootstrap/Col';
import FilterCheckbox from "./FilterCheckbox";
import Row from 'react-bootstrap/Row';
import { BooleanFilterName, BooleanFilter, TypeFilterName, sortKeysByValue } from "fedialgo";

import { compareStr, debugMsg } from "../../helpers/string_helpers";
import { PARTICIPATED_TAG_COLOR_FADED } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

type HashtagTooltip = {
    color?: CSSProperties["color"];
    text: string;
};

// Filtered filters are those that require a minimum number of toots to appear as filter options
export const FILTERED_FILTERS = [
    BooleanFilterName.HASHTAG,
    BooleanFilterName.USER,
];

const DEFAULT_TOOLTIP_COLOR = 'cyan';

const TOOLTIPS: {[key in (TypeFilterName | BooleanFilterName)]?: HashtagTooltip} = {
    [BooleanFilterName.LANGUAGE]: {text: `You post most in this language`},
    [TypeFilterName.FOLLOWED_ACCOUNTS]: {text: `You follow this account`},
    [TypeFilterName.FOLLOWED_HASHTAGS]: {text: `You follow this hashtag`},
    [TypeFilterName.PARTICIPATED_HASHTAGS]: {color: PARTICIPATED_TAG_COLOR_FADED, text: `You've posted this hashtag`},
    [TypeFilterName.TRENDING_HASHTAGS]: {color: "#FAD5A5", text: `This hashtag is trending`},
};

interface FilterCheckboxGridProps {
    filterSection: BooleanFilter,  // TODO: maybe rename propertyFilter
    minToots?: number,
    sortByValue?: boolean,
    tooltippedOnly?: boolean,
};


export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filterSection, minToots, sortByValue, tooltippedOnly } = props;
    const { algorithm } = useAlgorithm();

    const trendingTagNames = algorithm.trendingData.tags.map(tag => tag.name);
    let optionKeys: string[];

    // Generate color and tooltip text for a hashtag checkbox
    const getTooltipInfo = (name: string): HashtagTooltip | undefined => {
        if (filterSection.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return TOOLTIPS[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (trendingTagNames.includes(name)) {
                return TOOLTIPS[TypeFilterName.TRENDING_HASHTAGS];
            } else if (name in algorithm.userData.participatedHashtags) {
                const tooltip = {...TOOLTIPS[TypeFilterName.PARTICIPATED_HASHTAGS]};
                tooltip.text += ` ${algorithm.userData.participatedHashtags[name].numToots} times recently`;
                return tooltip;
            }
        } else if (filterSection.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return TOOLTIPS[TypeFilterName.FOLLOWED_ACCOUNTS];
        } else if (filterSection.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return TOOLTIPS[BooleanFilterName.LANGUAGE];
        }
    };

    const optionInfo = useMemo(
        () => {
            // debugMsg(`useMemo() recomputing optionInfo for ${filterSection.title}, validValues:`, filterSection.validValues);
            if (!FILTERED_FILTERS.includes(filterSection.title)) return filterSection.optionInfo;

            // For "filtered" filters only allow options with a minimum number of toots (and active options)
            return Object.fromEntries(Object.entries(filterSection.optionInfo).filter(
                ([option, numToots]) => {
                    if (filterSection.validValues.includes(option)) return true;
                    if (numToots >= minToots) return (tooltippedOnly ? !!getTooltipInfo(option) : true);
                    return false;
                }
            ));
        },
        [
            algorithm.userData.followedTags,
            filterSection.optionInfo,
            filterSection.title,
            filterSection.validValues,
            minToots,
            tooltippedOnly
        ]
    );

    if (sortByValue) {
        optionKeys = sortKeysByValue(optionInfo)
    } else {
        optionKeys = Object.keys(optionInfo).sort((a, b) => compareStr(a, b));
    }

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string) => {
        const tooltip = getTooltipInfo(name);

        return (
            <FilterCheckbox
                capitalize={filterSection.title == BooleanFilterName.TYPE}
                isChecked={filterSection.validValues.includes(name)}
                key={name}
                label={name}
                labelExtra={filterSection.optionInfo[name]}
                onChange={(e) => filterSection.updateValidOptions(name, e.target.checked)}
                tooltipColor={tooltip?.color || DEFAULT_TOOLTIP_COLOR}
                tooltipText={tooltip?.text && `${tooltip.text}.`}
                url={(filterSection.title == BooleanFilterName.HASHTAG) && algorithm.tagUrl(name)}
            />
        );
    };

    const gridify = (elements: React.ReactElement[]): React.ReactElement => {
        if (!elements || elements.length === 0) return <></>;
        const numCols = elements.length > 10 ? 3 : 2;

        const columns = elements.reduce((cols, element, index) => {
            const colIndex = index % numCols;
            cols[colIndex] ??= [];
            cols[colIndex].push(element);
            return cols;
        }, [] as React.ReactElement[][]);

        return (
            // Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
            <Row>
                {columns.map((col, i: number) => <Col className="px-1" key={i}>{col}</Col>)}
            </Row>
        );
    };

    return gridify(optionKeys.map((option) => propertyCheckbox(option)));
};
