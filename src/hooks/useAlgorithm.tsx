/*
 * Context to hold the TheAlgorithm variable
 */
import React, { ReactElement, ReactNode, useContext, useState, createContext } from "react";

import { TheAlgorithm } from "fedialgo";

const AlgorithmContext = createContext<TheAlgorithm | undefined>(undefined);

interface AlgorithmContextProps {
    algorithm?: TheAlgorithm,
    children: ReactNode
};


export function AlgorithmProvider(props: AlgorithmContextProps) {
    const { algorithm, children } = props;

    return (
        <AlgorithmContext.Provider value={algorithm}>
            {children}
        </AlgorithmContext.Provider>
    );
};


export const useAlgorithmContext = () => {
    return useContext(AlgorithmContext);
};
