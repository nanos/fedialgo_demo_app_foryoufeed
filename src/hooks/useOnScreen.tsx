/*
 * Used to determine if an element is in the viewport. Currently sets the isBottom variable
 * which triggers the loading of infinite scroll content.
 */
import { useEffect, useMemo, useState, RefObject } from 'react';


export default function useOnScreen(ref: RefObject<HTMLElement>) {
    const [isIntersecting, setIntersecting] = useState(false);

    const observer = useMemo(
        () => new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting)),
        [ref]
    );

    useEffect(() => {
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return isIntersecting;
};
