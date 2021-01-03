import { RefCallback, useCallback, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './utils';

export type QueryBreakpoints = {
    /** the values should be consisted of a min and max number, except for your largest breakpoint where it would be the min value and anything above */
    [key: string]: [number, number?];
};

export type ContainerQueryProps = {
    /** Explicit key/value map of the predefined breakpoints you wish to use. Each value should have a min and max range (Eg { small: [0, 300], med: [301, 600]} ) */
    breakpoints: QueryBreakpoints;
    /** Flag to ignore width updates if you are only interested in when a breakpoint changes. App will forego updating state for the width */
    ignoreDimensions?: boolean;
};

type ContainerQueryState = {
    current: string;
    width: number;
};

export type ContainerQueryResult<T> = {
    /** Callback ref to be assigned to the containing DOM node the user wishes to observe for changes. */
    assignRef: RefCallback<T>;
    /** The current 'active' breakpoint. This key will match from one of the key/value pairs from the breakpoints supplied to the hook */
    current: string;
    /** Current width of the observed element */
    width: number;
};

/**
 * useContainerQueries.
 *
 * A react hook utilizing the Resize Observer API that allows a user to track an elements changing width
 * with predefined breakpoint ranges, in order to react to the changes, such as responsive styling, where
 * the user can style DOM elements based on their container, rather than the browser viewport.
 *
 * @param {QueryBreakpoints} breakpoints A key/value mapping of explicit breakpoint ranges to be
 * tested against the current observed elements width to find a match.
 * @param {boolean} ignoreDimensions Flag stating the user doesn't care about the changing container width,
 * and only the breakpoint changes. The app will only update state on these changes.
 */
export function useContainerQueries<T extends HTMLElement>({
    breakpoints,
    ignoreDimensions = false,
}: ContainerQueryProps): ContainerQueryResult<T> {
    const initialBreakpoint = Object.keys(breakpoints)[0];
    const [state, setState] = useState<ContainerQueryState>({
        current: initialBreakpoint,
        width: 0,
    });

    const observerRef = useRef<ResizeObserver | null>(null);
    const elementRef = useRef<T | null>(null);

    const matchBreakpoint = useCallback(
        (prevActive, width) => {
            let currentActive;
            for (const [key, [min, max]] of Object.entries(breakpoints)) {
                if (width >= min) {
                    if (max === undefined) {
                        currentActive = key;
                        break;
                    } else if (width <= max) {
                        currentActive = key;
                        break;
                    }
                }
            }

            return {
                current: currentActive || prevActive,
                width,
            };
        },
        [breakpoints]
    );

    /**
     * Callback triggered on from the resize observer on change.
     */
    const handleResize = useCallback(
        ([entry]: readonly ResizeObserverEntry[]) => {
            let width;
            if (entry.borderBoxSize) {
                width = Math.round(
                    Array.isArray(entry.borderBoxSize)
                        ? entry.borderBoxSize[0].inlineSize
                        : entry.borderBoxSize.inlineSize
                );
            } else {
                width = Math.round(entry.contentRect.width);
            }

            // Allow user to opt of updating the state on width changes, and only for breakpoint changes
            if (ignoreDimensions) {
                const { current } = matchBreakpoint(state.current, width);

                if (current !== state.current) {
                    setState((prev) => ({ ...prev, current }));
                }
            } else {
                setState(matchBreakpoint(state.current, width));
            }
        },
        [state.current, ignoreDimensions, matchBreakpoint]
    );

    useIsomorphicLayoutEffect(() => {
        if (!observerRef.current) {
            observerRef.current = new ResizeObserver(handleResize);
        }

        if (elementRef.current) {
            observerRef.current.observe(elementRef.current, {
                box: 'border-box',
            });
        }

        return () => {
            observerRef.current?.disconnect();
            observerRef.current = null;
        };
    }, [handleResize]);

    // Ref callback passed to user
    // todo: allow user to provide their own ref.
    const assignRef = useCallback((node: T | null) => {
        if (elementRef.current) {
            observerRef.current?.unobserve(elementRef.current);
        }

        elementRef.current = node;
        if (node) {
            observerRef.current?.observe(node);
        }
    }, []);

    return {
        assignRef,
        width: state.width,
        current: state.current,
    } as const;
}
