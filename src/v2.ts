import { RefCallback, useCallback, useMemo, useRef, useState } from 'react';
import { useElementResizeObserver, ObservedDimensions } from './use-element-resize-observer';

export type QueryBreakpoints2 = {
    [key: string]: number;
};

type BreakpointRange = {
    [key: string]: [number, number?];
};

export type ContainerQueryProps = {
    valueType: 'min' | 'max';
    breakpoints: QueryBreakpoints2[];
    implicitBreakpointKey?: string;
    ignoreDimensions?: boolean;
    // mode?: 'horizontal' | 'vertical'
};

type ContainerQueryState = {
    active: string;
    dimensions: ObservedDimensions;
};

export type ContainerQueryResult<T> = {
    assignRef: RefCallback<T>;
    dimensions: ObservedDimensions;
    active: string;
};

export function useContainerQueries<T extends HTMLElement>({
    breakpoints,
    valueType,
    implicitBreakpointKey,
    ignoreDimensions = false,
}: ContainerQueryProps): ContainerQueryResult<T> {
    const initialBreakpoint = Object.keys(breakpoints)[0];
    const [state, setState] = useState<ContainerQueryState>({
        active: initialBreakpoint,
        dimensions: {
            width: 0,
            height: 0,
        },
    });

    const breakpointLength = useRef(Object.keys(breakpoints).length);

    const breakpointRanges: BreakpointRange = useMemo(() => {
        return breakpoints.reduce((acc, value, i) => {
            let entry: BreakpointRange = {};
            const thisKey = Object.keys(value)[0];

            // handle implicit max
            if (valueType === 'max') {
                // first value will be the implicit min - first max range
                if (i === 0) {
                    entry[thisKey] = [0, value[thisKey]];
                } else {
                    const prevBreakpoint = breakpoints[i - 1];
                    const prevKey = Object.keys(prevBreakpoint)[0];
                    entry[thisKey] = [prevBreakpoint[prevKey] + 1, value[thisKey]];

                    // on the final value, we need to create the implicit max
                    if (i === breakpointLength.current - 1) {
                        Object.assign(entry, {
                            [implicitBreakpointKey || 'max']: [value[thisKey] + 1],
                        });
                    }
                }
            }

            // handle implicit min
            else {
                if (i !== breakpointLength.current - 1) {
                    const nextBreakpoint = breakpoints[i + 1];
                    const nextKey = Object.keys(nextBreakpoint)[0];

                    if (i === 0) {
                        entry[implicitBreakpointKey || 'min'] = [0, value[thisKey] - 1];
                    }
                    entry[thisKey] = [value[thisKey], nextBreakpoint[nextKey] - 1];
                }
                // final value, the single value will be the final min-width
                else {
                    entry[thisKey] = [value[thisKey]];
                }
            }
            return {
                ...acc,
                ...entry,
            };
        }, {} as BreakpointRange);
    }, [breakpoints, implicitBreakpointKey, valueType]);

    const matchBreakpoint = useCallback(
        (prevActive, { width, height }) => {
            let currentActive;

            for (const [key, [min, max]] of Object.entries(breakpointRanges)) {
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
                active: currentActive ?? prevActive,
                dimensions: { width, height },
            };
        },
        [breakpointRanges]
    );

    const handleResize = useCallback(
        (dimensions: ObservedDimensions) => {
            if (ignoreDimensions) {
                const { active } = matchBreakpoint(state.active, dimensions);

                if (active !== state.active) {
                    setState((prev) => ({ ...prev, active }));
                }
            } else {
                setState((prev) => matchBreakpoint(prev.active, dimensions));
            }
        },
        [state.active, ignoreDimensions, matchBreakpoint]
    );

    const { assignRef } = useElementResizeObserver<T>({
        onResize: handleResize,
    });

    return {
        assignRef,
        dimensions: state.dimensions,
        active: state.active,
    } as const;
}
