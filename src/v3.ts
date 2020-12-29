import { RefCallback, useCallback, useState } from 'react';
import { useElementResizeObserver, ObservedDimensions } from './use-element-resize-observer';

export type QueryBreakpoints = {
    [key: string]: [number, number?];
};

export type ContainerQueryProps = {
    breakpoints: QueryBreakpoints;
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

    const matchBreakpoint = useCallback(
        (prevActive, { width, height }) => {
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
                active: currentActive ?? prevActive,
                dimensions: { width, height },
            };
        },
        [breakpoints]
    );

    const handleResize = useCallback(
        (dimensions: ObservedDimensions) => {
            if (ignoreDimensions) {
                const { active } = matchBreakpoint(state.active, dimensions);

                if (active !== state.active) {
                    setState((prev) => ({ ...prev, active }));
                }
            } else {
                setState(matchBreakpoint(state.active, dimensions));
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
