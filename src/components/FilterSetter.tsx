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
import { headerFont, roundedBox, titleStyle } from "./WeightSetter";
import { NumericFilter, PropertyFilter, SourceFilterName, TheAlgorithm } from "fedialgo";

const MAX_LABEL_LENGTH = 17;
const INVERT_SELECTION = "invertSelection";
const CAPITALIZED_LABELS = [INVERT_SELECTION].concat(Object.values(SourceFilterName) as string[]);
const JUNK_CLASS = "JUNKJUNKJUNK";


export default function FilterSetter({ algorithm }: { algorithm: TheAlgorithm }) {
    const hasActiveNumericFilter = Object.values(algorithm.filters.numericFilters).some(f => f.value > 0);

    const makeCheckbox = (
        isChecked: boolean,
        filterName: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        labelExtra?: number | string
    ) => {
        labelExtra = typeof labelExtra == "number" ? labelExtra.toLocaleString() : labelExtra;
        const style: CSSProperties = {fontWeight: "bold"};
        let label = filterName;

        if (CAPITALIZED_LABELS.includes(filterName)) {
            label = capitalCase(filterName);
            style.fontSize = "14px";
        } else {
            label = label.length > MAX_LABEL_LENGTH ? (label.slice(0, MAX_LABEL_LENGTH) + '...') : label;
        }

        const labelNode = <>
            <span style={style}>{label}</span>{labelExtra && ` (${labelExtra})`}
        </>;

        return (
            <Form.Switch
                checked={isChecked}
                id={filterName}
                key={filterName}
                label={labelNode}
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

    const listCheckbox = (element: string, filterSection: PropertyFilter) => {
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

        return <Row>{columns.map((col) => <Col>{col}</Col>)}</Row>;
    };

    const makeCheckboxList = (filterSection: PropertyFilter) => {
        const checkboxes = Object.keys(filterSection.optionInfo)
                                 .sort()
                                 .map((element) => listCheckbox(element, filterSection));

        return gridify(checkboxes);
    }

    const numericSliders = Object.entries(algorithm.filters.numericFilters).reduce(
        (sliders, [name, numericFilter]) => {
            const slider = (
                <Slider
                    description={numericFilter.description}
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
                        {/* List filters (language, source, etc) */}
                        {Object.entries(algorithm.filters.filterSections).map(([sectionName, filterSection]) => (
                            <FilterAccordionSection
                                description={filterSection.description}
                                invertCheckbox={invertSelectionCheckbox(filterSection)}
                                isActive={filterSection.validValues.length > 0}
                                sectionName={sectionName}
                            >
                                {makeCheckboxList(filterSection)}
                            </FilterAccordionSection>))}

                        <FilterAccordionSection
                            description={"Filter based on minimum/maximum number of replies, reposts, etc"}
                            invertCheckbox={invertNumericFilterCheckbox(Object.values(algorithm.filters.numericFilters))}
                            isActive={hasActiveNumericFilter}
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


const accordionBody = {
    backgroundColor: '#b2bfd4',
};

const invertTagSelectionStyle: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'center',
    marginBottom: '8px',
};

const subHeaderFont: CSSProperties = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: CSSProperties = {
    marginBottom: "-5px",
    marginTop: "-5px"
};
