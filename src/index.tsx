import { RefCallback, useCallback, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './utils';

export type QueryBreakpoints = {
    [key: string]: [number, number?];
};

export type ContainerQueryProps = {
    breakpoints: QueryBreakpoints;
    ignoreDimensions?: boolean;
};

type ContainerQueryState = {
    active: string;
    width: number;
};

export type ContainerQueryResult<T> = {
    assignRef: RefCallback<T>;
    width: number;
    active: string;
};

export function useContainerQueries<T extends HTMLElement>({
    breakpoints,
    ignoreDimensions = false,
}: ContainerQueryProps): ContainerQueryResult<T> {
    const initialBreakpoint = Object.keys(breakpoints)[0];
    const [state, setState] = useState<ContainerQueryState>({
        active: initialBreakpoint,
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
                active: currentActive || prevActive,
                width,
            };
        },
        [breakpoints]
    );

    const handleResize = useCallback(
        (width: number) => {
            if (ignoreDimensions) {
                const { active } = matchBreakpoint(state.active, width);

                if (active !== state.active) {
                    setState((prev) => ({ ...prev, active }));
                }
            } else {
                setState(matchBreakpoint(state.active, width));
            }
        },
        [state.active, ignoreDimensions, matchBreakpoint]
    );

    useIsomorphicLayoutEffect(() => {
        if (!observerRef.current) {
            observerRef.current = new ResizeObserver(([entry]) => {
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

                handleResize(width);
            });
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
    }, []);

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
        active: state.active,
    } as const;
}
