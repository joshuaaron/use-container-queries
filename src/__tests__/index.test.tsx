import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-test-renderer';
import { ContainerQueryProps, QueryBreakpoints, useContainerQueries } from '..';
import { getMockedInstance, observerMap, triggerObserverCallback } from './test-utils';
import '@testing-library/jest-dom/extend-expect';

const mockResizeObserver = (callback: ResizeObserverCallback) => {
    const observerItem = {
        element: new Set<Element>(),
        callback,
    };
    const instance = {
        observe: jest.fn((element: Element): void => {
            observerItem.element.add(element);
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    };

    observerMap.set(instance, observerItem);
    return instance;
};

beforeEach(() => {
    window.ResizeObserver = jest.fn(mockResizeObserver);
});

afterEach(() => {
    // @ts-ignore
    window.ResizeObserver.mockRestore();
});

const queryBreakpoints: QueryBreakpoints = {
    small: [0, 300],
    med: [301, 600],
    large: [601, 900],
    xl: [901],
};

// Helper component to render the hook, and return the result
// and all utils from the render method from testing-library
const renderElement = ({
    opts: { breakpoints = queryBreakpoints, ignoreDimensions = true } = {},
    mount = true,
    width = '400px',
}: {
    mount?: boolean;
    opts?: Partial<ContainerQueryProps>;
    width?: string;
} = {}) => {
    const { result, rerender, unmount } = renderHook(() =>
        useContainerQueries({ breakpoints, ignoreDimensions })
    );

    const utils = render(
        <div data-testid='wrapper' ref={mount ? result.current.ref : null} style={{ width }}>
            {result.current.current.toString()}
        </div>
    );

    return {
        utils,
        result,
        rerender,
        unmount,
    };
};

describe('use-container-queries', () => {
    it('should not create an instance if the ref has not been assigned to an element once hook mounts', () => {
        const { utils } = renderElement({ mount: false });
        const element = utils.getByTestId('wrapper');

        expect(() => getMockedInstance(element)).toThrowError();
    });
    it('should create an instance if the ref is attached via the callback ref', () => {
        const { utils } = renderElement();
        const element = utils.getByTestId('wrapper');
        const instance = getMockedInstance(element);

        expect(instance.observe).toHaveBeenCalledWith(element);
    });
    it('returns the matching breakpoint from the latest reported size on the observed element', () => {
        const { utils, result } = renderElement();
        const element = utils.getByTestId('wrapper');

        act(() => {
            triggerObserverCallback({
                target: element,
                borderBoxSize: { inlineSize: 400, blockSize: 200 },
            });
        });

        // 400px falls in the med breakpoint
        expect(result.current.current).toEqual('med');
    });
    it('returns the matching breakpoint from the latest reported size when the size changes multiple times on the observed element', () => {
        const { utils, result } = renderElement();
        const element = utils.getByTestId('wrapper');

        act(() => {
            triggerObserverCallback({
                target: element,
                borderBoxSize: { inlineSize: 400, blockSize: 200 },
            });
        });

        expect(result.current.current).toEqual('med');

        act(() => {
            triggerObserverCallback({
                target: element,
                borderBoxSize: { inlineSize: 700, blockSize: 200 },
            });
        });

        expect(result.current.current).toEqual('large');
    });
    it('reports the correct width on the observed element when observing dimension changes', () => {
        const { utils, result } = renderElement({ opts: { ignoreDimensions: false } });
        const element = utils.getByTestId('wrapper');

        act(() => {
            triggerObserverCallback({
                target: element,
                borderBoxSize: { inlineSize: 250, blockSize: 200 },
            });
        });

        expect(result.current.current).toEqual('small');
        expect(result.current.width).toEqual(250);
    });
    it('disconnects the observer instance when the element is unmounted from the DOM', () => {
        const { utils, unmount } = renderElement();
        const element = utils.getByTestId('wrapper');
        const instance = getMockedInstance(element);

        expect(instance.disconnect).toBeCalledTimes(0);

        unmount();

        expect(instance.disconnect).toBeCalledTimes(1);
    });
});
