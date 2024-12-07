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

import Slider from "./Slider";
import { headerFont, roundedBox, titleStyle } from "./WeightSetter";
import { FeedFilterSection, NumericFilter, SourceFilterName, TheAlgorithm } from "fedialgo";

const MAX_LABEL_LENGTH = 17;
const INVERT_SELECTION = "invertSelection";
const CAPITALIZED_LABELS = [INVERT_SELECTION].concat(Object.values(SourceFilterName) as string[]);


export default function FilterSetter({ algorithm }: { algorithm: TheAlgorithm }) {
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
            style.fontSize = "16px";
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

    const invertSelectionCheckbox = (filter: FeedFilterSection) => {
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
            (e) => {
                filters.map(filter => filter.invertSelection = e.target.checked);
            }
        );
    };

    const listCheckbox = (element: string, filterSection: FeedFilterSection) => {
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

    const filterSections: Record<string, ReactNode> = Object.entries(algorithm.filters.filterSections).reduce(
        (sections, [name, section]) => {
            sections[name] =  Object.keys(section.optionInfo)
                                    .sort()
                                    .map((element) => listCheckbox(element, section));

            sections[name] = gridify(sections[name]);
            return sections;
        },
        {}
    );

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
                        {Object.entries(filterSections).map(([sectionName, checkboxes]) => (
                            <Accordion.Item eventKey={sectionName} className="accordion-inner-button">
                                <Accordion.Header key={`${sectionName}_accordionhead`}>
                                    <Form.Label style={subHeaderLabel}>
                                        <span style={headerFont} key={`${sectionName}_label1`}>
                                            {capitalCase(sectionName)}
                                        </span>

                                        <span style={subHeaderFont} key={`${sectionName}_label2`}>
                                            {'   '}({algorithm.filters.filterSections[sectionName].description})
                                        </span>
                                    </Form.Label>
                                </Accordion.Header>

                                <Accordion.Body key={`${sectionName}_accordionbody`} style={{backgroundColor: '#b2bfd4'}}>
                                    <div style={invertTagSelectionStyle} key={"invertSelection"}>
                                        {invertSelectionCheckbox(algorithm.filters.filterSections[sectionName])}
                                    </div>

                                    <div style={roundedBox} key={sectionName}>
                                        <Form.Group className="mb-1">
                                            <Form.Group className="mb-1">
                                                {checkboxes}
                                            </Form.Group>
                                        </Form.Group>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>))}

                            {/* Numeric filters (min/max replies, reposts, etc) */}
                            <Accordion.Item eventKey="numericFilters">
                                <Accordion.Header>
                                    <Form.Label style={subHeaderLabel}>
                                        <span style={headerFont} key={`numericFilters_label1`}>
                                            {"Interactions"}
                                        </span>

                                        <span style={subHeaderFont} key={`numericFilters_label2`}>
                                            {'   '}(Filter based on a minimumm or maximum number of replies, reposts, etc.)
                                        </span>
                                    </Form.Label>
                                </Accordion.Header>

                                <Accordion.Body>
                                    <div style={invertTagSelectionStyle} key={"invertSelection"}>
                                        {invertNumericFilterCheckbox(Object.values(algorithm.filters.numericFilters))}
                                    </div>

                                    <div style={roundedBox}>
                                        {numericSliders}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>

                    </Accordion>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
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
