import { RefCallback, useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from './utils';

export type ObservedDimensions = {
    width: number | undefined;
    height: number | undefined;
};

type ElementResizeObserverOptions = {
    onResize?: (dimensions: ObservedDimensions) => void;
};

type ElementResizeObserverResult<T> = {
    assignRef: RefCallback<T>;
} & ObservedDimensions;

export function useElementResizeObserver<T extends HTMLElement>({
    onResize,
}: ElementResizeObserverOptions = {}): ElementResizeObserverResult<T> {
    const [dimensions, setDimensions] = useState<ObservedDimensions>({
        width: undefined,
        height: undefined,
    });

    const prevDimensions = useRef<ObservedDimensions>({
        width: undefined,
        height: undefined,
    });

    const observerInstanceRef = useRef<ResizeObserver | null>(null);
    const callbackRef = useRef<T | null>();

    const onResizeRef = useRef<ElementResizeObserverOptions['onResize'] | undefined>(undefined);
    onResizeRef.current = onResize;

    // track mounted state to ensure we don't attempt to set state on an unmounted component
    const hasUnmounted = useRef(false);
    useEffect(() => {
        return () => {
            hasUnmounted.current = true;
        };
    }, []);

    useIsomorphicLayoutEffect(() => {
        if (observerInstanceRef.current) {
            return;
        }

        const resizeCallback = ([entry]: readonly ResizeObserverEntry[]) => {
            let width;
            let height;

            if (entry.borderBoxSize) {
                width = Math.round(
                    Array.isArray(entry.borderBoxSize)
                        ? entry.borderBoxSize[0].inlineSize
                        : entry.borderBoxSize.inlineSize
                );

                height = Math.round(
                    Array.isArray(entry.borderBoxSize)
                        ? entry.borderBoxSize[0].blockSize
                        : entry.borderBoxSize.blockSize
                );
            } else {
                width = Math.round(entry.contentRect.width);
                height = Math.round(entry.contentRect.height);
            }

            if (
                prevDimensions.current.height !== height ||
                prevDimensions.current.width !== width
            ) {
                const newDimensions = { width, height };
                if (onResizeRef.current) {
                    onResizeRef.current(newDimensions);
                } else {
                    prevDimensions.current.height = height;
                    prevDimensions.current.width = width;

                    if (!hasUnmounted.current) {
                        setDimensions(newDimensions);
                    }
                }
            }
        };

        observerInstanceRef.current = new ResizeObserver(resizeCallback);

        if (callbackRef.current) {
            observerInstanceRef.current.observe(callbackRef.current, {
                box: 'border-box',
            });
        }

        return () => {
            observerInstanceRef.current?.disconnect();
            observerInstanceRef.current = null;
        };
    }, []);

    const assignRef = useCallback((node: T | null) => {
        if (callbackRef.current) {
            observerInstanceRef.current?.unobserve(callbackRef.current);
        }

        callbackRef.current = node;
        if (node) {
            observerInstanceRef.current?.observe(node);
        }
    }, []);

    return {
        assignRef,
        width: dimensions.width,
        height: dimensions.height,
    } as const;
}
