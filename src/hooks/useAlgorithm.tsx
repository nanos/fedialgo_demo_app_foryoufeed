/*
 * Context to hold the TheAlgorithm variable
 */
import React, { ReactNode, useContext, useState, createContext } from "react";

import { GET_FEED_BUSY_MSG, TheAlgorithm } from "fedialgo";

import { errorMsg, logMsg, warnMsg } from "../helpers/string_helpers";

interface AlgoContext {
    algorithm?: TheAlgorithm,
    triggerLoad?: () => void,
};

interface AlgorithmContextProps extends AlgoContext {
    children: ReactNode,
    setError?: (error: string) => void,
};

const AlgorithmContext = createContext<AlgoContext>({});
export const useAlgorithmContext = () => useContext(AlgorithmContext);


export function AlgorithmProvider(props: AlgorithmContextProps) {
    const { algorithm, children, setError } = props;
    const [isLoading, setIsLoading] = useState(false);
    const triggerLoad = () => triggerAlgoLoad(algorithm, setError, setIsLoading);

    return (
        <AlgorithmContext.Provider value={{ algorithm, triggerLoad }}>
            {children}
        </AlgorithmContext.Provider>
    );
};


// Trigger the algorithm to load new data
export const triggerAlgoLoad = (
    algorithm: TheAlgorithm,
    setError?: (error: string) => void,
    setIsLoading?: (isLoading: boolean) => void,
) => {
    logMsg(`triggerAlgoLoad() called. algorithm exists?: ${!!algorithm}`);
    if (!algorithm) return;
    setIsLoading?.(true);

    algorithm.triggerFeedUpdate()
        .then(() => logMsg(`triggerLoad() finished`))
        .catch((err) => {
            if (err.message.includes(GET_FEED_BUSY_MSG)) {
                warnMsg(`triggerLoad() Load already in progress, please wait a moment and try again`);
            } else {
                errorMsg(`Failed to triggerLoad() with error:`, err);
                setError?.(`Failed to triggerLoad: ${err}`);
            }
        })
        .finally(() => setIsLoading?.(false));
};
