/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useMemo, useState } from "react";

import Col from 'react-bootstrap/Col';
import FilterCheckbox from "./FilterCheckbox";
import Row from 'react-bootstrap/Row';
import { PropertyName, PropertyFilter, sortKeysByValue } from "fedialgo";

import { compareStr, debugMsg } from "../../helpers/string_helpers";
import { PARTICIPATED_TAG_COLOR_FADED } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { get } from "http";

type HashtagTooltip = {text: string; color: string;};

// Filtered filters are those that require a minimum number of toots to appear as filter options
export const FILTERED_FILTERS = [PropertyName.HASHTAG, PropertyName.USER];
const FOLLOWED_TAG_MSG = `You follow this hashtag.`;
const PARTICIPATED_TAG_MSG = `You've posted this hashtag`

interface FilterCheckboxGridProps {
    filterSection: PropertyFilter,  // TODO: maybe rename propertyFilter
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
    const getTooltipInfo = (name: string): HashtagTooltip => {
        if (filterSection.title == PropertyName.HASHTAG) {
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
        } else if (filterSection.title == PropertyName.USER && name in algorithm.userData.followedAccounts) {
            return {color: 'cyan', text: `You follow this account`};
        } else if (filterSection.title == PropertyName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return {color: 'cyan', text: `You post most in this language`};
        }
    };

    const optionInfo = useMemo(
        () => {
            // debugMsg(`FilterCheckboxGrid recomputing optionInfo useMemo(${filterSection.title}), validValues:`, filterSection.validValues);
            if (!FILTERED_FILTERS.includes(filterSection.title)) return filterSection.optionInfo;

            // For "filtered" filters only allow options with a minimum number of toots and followed hashtags.
            return Object.fromEntries(Object.entries(filterSection.optionInfo).filter(
                ([option, numToots]) => {
                    if (filterSection.validValues.includes(option)) return true;
                    if (numToots >= minToots) return (tooltippedOnly ? !!getTooltipInfo(option) : true);
                    return false;
                }
            ));
        },
        [algorithm.userData.followedTags, filterSection.optionInfo, filterSection.title, filterSection.validValues, minToots, tooltippedOnly]
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
                capitalize={filterSection.title == PropertyName.TYPE}
                isChecked={filterSection.validValues.includes(name)}
                key={name}
                label={name}
                labelExtra={filterSection.optionInfo[name]}
                onChange={(e) => {
                    filterSection.updateValidOptions(name, e.target.checked);
                }}
                tooltipText={tooltip?.text}
                tooltipColor={tooltip?.color}
            />
        );
    };

    const gridify = (list: React.ReactElement[]): React.ReactElement => {
        if (!list || list.length === 0) return <></>;
        const numCols = list.length > 10 ? 3 : 2;

        const columns = list.reduce((cols, element, index) => {
            const colIndex = index % numCols;
            cols[colIndex] ??= [];
            cols[colIndex].push(element);
            return cols;
        }, [] as React.ReactElement[][]);

        return (
            // Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
            <Row>
                {columns.map((col, i: number) => <Col className="px-0" key={i}>{col}</Col>)}
            </Row>
        );
    };

    return gridify(optionKeys.map((option) => propertyCheckbox(option)));
};
