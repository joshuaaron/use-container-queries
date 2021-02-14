import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { ContainerQueryProps, QueryBreakpoints, useContainerQueries } from '..';
import { getMockedInstance, observerMap } from './test-utils';
import '@testing-library/jest-dom/extend-expect';

const mockResizeObserver = (callback: any) => {
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
    const { result, rerender } = renderHook(() =>
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
    };
};

describe('use-container-queries', () => {
    it('should not create an instance if the ref has not been assigned to an element once hook mounts', () => {
        const { utils } = renderElement({ mount: false });
        const element = utils.getByTestId('wrapper');

        expect(() => getMockedInstance(element)).toThrowError();
    });
    it('should create an instance if the ref is attached via the callback ref', async () => {
        const { utils } = renderElement();
        const element = utils.getByTestId('wrapper');
        const instance = getMockedInstance(element);
        // await waitForNextUpdate();
        expect(instance.observe).toHaveBeenCalledWith(element);
    });
    // it('returns the initial width and matching breakpoint on the reported element once it has mounted', async () => {
    //     const { result } = renderElement();
    //     console.log(result.current);
    // });
});
