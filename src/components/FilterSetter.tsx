/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactNode } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/Row';
import { capitalCase } from "change-case";

import FilterAccordionSection from "./FilterAccordionSection";
import Slider from "./Slider";
import { NumericFilter, PropertyFilter, SourceFilterName, TheAlgorithm } from "fedialgo";
import { titleStyle } from "./WeightSetter";

const MAX_LABEL_LENGTH = 17;
const INVERT_SELECTION = "invertSelection";
const CAPITALIZED_LABELS = [INVERT_SELECTION].concat(Object.values(SourceFilterName) as string[]);


export default function FilterSetter({ algorithm }: { algorithm: TheAlgorithm }) {
    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);
    const visibleSections = Object.values(algorithm.filters.filterSections).filter(section => section.visible);

    const makeCheckbox = (
        isChecked: boolean,
        label: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: number | string
    ) => {
        labelExtra = (typeof labelExtra == "number") ? labelExtra.toLocaleString() : labelExtra;
        const style: CSSProperties = {fontWeight: "bold"};

        if (CAPITALIZED_LABELS.includes(label)) {
            label = capitalCase(label);
            style.fontSize = "14px";
        } else {
            label = (label.length > (MAX_LABEL_LENGTH - 2)) ? `${label.slice(0, MAX_LABEL_LENGTH)}...` : label;
        }

        return (
            <Form.Switch
                checked={isChecked}
                id={label}
                key={label}
                label={<><span style={style}>{label}</span>{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
                    onChange(e);
                    algorithm.updateFilters(algorithm.filters);
                }}
            />
        );
    };

    const invertSelectionCheckbox = (filter: PropertyFilter) => {
        return makeCheckbox(
            filter.invertSelection,
            INVERT_SELECTION,
            (e) => (filter.invertSelection = e.target.checked)
        );
    };

    const invertNumericFilterCheckbox = (filters: NumericFilter[]) => {
        return makeCheckbox(
            filters.every((filter) => filter.invertSelection),
            INVERT_SELECTION,
            (e) => filters.map(filter => filter.invertSelection = e.target.checked)
        );
    };

    const propertyCheckbox = (element: string, filterSection: PropertyFilter) => {
        return makeCheckbox(
            filterSection.validValues.includes(element),
            element,
            (e) => filterSection.updateValidOptions(element, e.target.checked),
            filterSection.optionInfo[element]
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

        return <Row>{columns.map((col, i) => <Col key={i}>{col}</Col>)}</Row>;
    };

    const makeCheckboxList = (filter: PropertyFilter) => {
        return gridify(Object.keys(filter.optionInfo).sort().map((e) => propertyCheckbox(e, filter)));
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
            <Accordion.Item eventKey="0">
                <Accordion.Header style={{padding: "0px"}}>
                    <p style={titleStyle}>
                        Filters
                    </p>
                </Accordion.Header>

                <Accordion.Body style={{padding: "0px"}}>
                    <Accordion key={"fiaccordion"}>
                        {/* property filters (language, source, etc) */}
                        {visibleSections.map((filterSection) => (
                            <FilterAccordionSection
                                description={filterSection.description}
                                invertCheckbox={invertSelectionCheckbox(filterSection)}
                                key={filterSection.title}
                                isActive={filterSection.validValues.length > 0}
                                sectionName={filterSection.title}
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
