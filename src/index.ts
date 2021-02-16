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

export type ContainerQueryResult<T> = {
    /** Callback ref to be assigned to the containing DOM node the user wishes to observe for changes. */
    ref: RefCallback<T>;
    /** The current 'active' breakpoint. This key will match from one of the key/value pairs from the breakpoints supplied to the hook */
    current: string;
    /** Current width of the observed element */
    width: number;
};

type ContainerQueryState = {
    currentBreakpoint: string;
    width: number;
};

/**
 * useContainerQueries.
 *
 * A react hook utilizing the Resize Observer API that observes a containing elements width.
 * It matches that width with the users predefined breakpoint ranges and determines the containers size.
 * The main purpose of this is to allow web developers  to style DOM elements based on
 * the size of a containing element rather than the size of the browser viewport.
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
        currentBreakpoint: initialBreakpoint,
        width: 0,
    });

    // Store refs for the resize observer instance, and observed element we are tracking.
    const observerRef = useRef<ResizeObserver | null>(null);
    const elementRef = useRef<T | null>(null);

    const matchBreakpoint = useCallback(
        (prevActive: string, width: number) => {
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
                currentBreakpoint: currentActive || prevActive,
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
            let width: number;
            if (entry.borderBoxSize) {
                // Checking for chrome as using a non-standard array (https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
                width = Math.round(
                    Array.isArray(entry.borderBoxSize)
                        ? entry.borderBoxSize[0].inlineSize
                        : entry.borderBoxSize.inlineSize
                );
            } else {
                width = Math.round(entry.contentRect.width);
            }

            if (ignoreDimensions) {
                const { currentBreakpoint } = matchBreakpoint(state.currentBreakpoint, width);

                if (currentBreakpoint !== state.currentBreakpoint) {
                    setState((prev) => ({ ...prev, currentBreakpoint }));
                }
            } else {
                setState(matchBreakpoint(state.currentBreakpoint, width));
            }
        },
        [state.currentBreakpoint, ignoreDimensions, matchBreakpoint]
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
        ref: assignRef,
        width: state.width,
        current: state.currentBreakpoint,
    } as const;
}
