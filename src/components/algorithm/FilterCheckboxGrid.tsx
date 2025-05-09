/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode, useState } from "react";

import Col from 'react-bootstrap/Col';
import FilterCheckbox from "./FilterCheckbox";
import Row from 'react-bootstrap/Row';
import { PropertyName, PropertyFilter, sortKeysByValue } from "fedialgo";

import { compareStr } from "../../helpers/string_helpers";
import { PARTICIPATED_TAG_COLOR_FADED } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

type HashtagTooltip = {text: string; color: string;};

// Filtered filters are those that require a minimum number of toots to appear as filter options
const FILTERED_FILTERS = [PropertyName.HASHTAG, PropertyName.USER];
const FOLLOWED_TAG_MSG = `You follow this hashtag.`;
const PARTICIPATED_TAG_MSG = `You've posted this hashtag`

interface FilterCheckboxGridProps {
    filterSection: PropertyFilter,  // TODO: maybe rename propertyFilter
    minToots?: number,
    sortByValue?: boolean,
};


export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filterSection, minToots, sortByValue } = props;
    const { algorithm } = useAlgorithm();
    const trendingTagNames = algorithm.trendingData.tags.map(tag => tag.name);
    let optionInfo = filterSection.optionInfo;
    let optionKeys: string[];

    // For "filtered" filters only allow options with a minimum number of toots and followed hashtags.
    if (FILTERED_FILTERS.includes(filterSection.title)) {
        optionInfo = Object.fromEntries(Object.entries(filterSection.optionInfo).filter(
            ([option, numToots]) => {
                if (numToots >= minToots) return true;
                if (filterSection.title != PropertyName.HASHTAG) return false;
                return option in algorithm.userData.followedTags;  // TODO: this sucks but works for now
            }
        ));
    }

    if (sortByValue) {
        optionKeys = sortKeysByValue(optionInfo)
    } else {
        optionKeys = Object.keys(optionInfo).sort((a, b) => compareStr(a, b));
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

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string) => {
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
                capitalize={filterSection.title == PropertyName.TYPE}
                isChecked={filterSection.validValues.includes(name)}
                key={name}
                label={name}
                labelExtra={filterSection.optionInfo[name]}
                onChange={(e) => {
                    filterSection.updateValidOptions(name, e.target.checked);
                }}
                tooltipText={tooltipText}
                tooltipColor={tooltipColor}
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
            <Row>
                {columns.map((col, i: number) => <Col key={i}>{col}</Col>)}
            </Row>
        );
    };

    return gridify(optionKeys.map((e) => propertyCheckbox(e)));
};
