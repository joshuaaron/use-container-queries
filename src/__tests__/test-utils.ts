// Store the element with the entry callback to be able to test/observe the node
// the observe method was called on.
export const observerMap = new Map<ResizeObserver, ObserverItem>();

// Mock the callback and the entry with only the properties we wish to test for brevity.
export interface MockedResizeObserverCallback {
    (entries: ResizeObserverEntry[], observer?: ResizeObserver): void;
}

interface MockedResizeObserverEntry {
    readonly target: Element;
    readonly contentRect: DOMRectReadOnly;
    readonly borderBoxSize: ResizeObserverSize[] | ResizeObserverSize;
}

type ObserverItem = {
    callback: ResizeObserverCallback;
    element: Set<Element>;
};

// This function is used to mock the callback triggered when the intersection observer fires a change on the observed element
// We can mock the return type, to test against the isIntersecting property along with thresholds.
export function triggerObserverCallback({
    target,
    contentRect = defaultDomRect,
    borderBoxSize = defaultInlineSize,
}: MockedResizeObserverEntry): void {
    const observer = getMockedInstance(target);

    if (!observer) {
        throw new Error('No ResizeObserver instance found, Is the element still mounted?');
    }

    const item = observerMap.get(observer);
    if (item) {
        const entry: ResizeObserverEntry[] = [
            {
                target,
                contentRect,
                borderBoxSize,
                contentBoxSize: defaultInlineSize,
                devicePixelContentBoxSize: defaultInlineSize,
            },
        ];

        item.callback(entry, observer);
    }
}

export function getMockedInstance(element: Element): ResizeObserver {
    for (const [observer, item] of observerMap) {
        if (item.element.has(element)) {
            return observer;
        }
    }

    throw new Error(
        'Failed to find a ResizeObserver instance for the provided element. Is it still being observed?'
    );
}

const defaultDomRect: DOMRectReadOnly = {
    width: 0,
    height: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => void {},
};

const defaultInlineSize: ResizeObserverSize = {
    inlineSize: 0,
    blockSize: 0,
};
