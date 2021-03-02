# use-container-queries

A react hook that tracks a containers size and reports what range that width falls into within a list of breakpoints. This allows better responsive styling, where the user can style DOM elements based on their container, rather than the browser viewport.

Try out a demo [here](https://codesandbox.io/s/usecontainerqueries-s1l0k)

## Install

💡 Note: Since this module uses React Hooks, you'll need to have version >=16.8.0 of react and react-dom installed in your project

```sh
npm install use-container-queries --save-dev
# or
yarn add use-container-queries --dev
```

🚨 **Important**:
This hook uses the [Resize Observer](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) internally to measure the changes of size on your element. Browser support for the API is relatively wide and can be viewed [here](https://caniuse.com/resizeobserver). For now, this library does not ship with a polyfill (open to changing this) but you can include one in your project from [here](https://www.npmjs.com/package/resize-observer-polyfill)

## Quick Start

```jsx
import React from 'react';
import { useContainerQueries } from 'use-container-queries';

const breakpoints = {
    small: [0, 300],
    med: [301, 600],
    large: [601, 900],
    xl: [901],
};

function App() {
    const { ref, active, width } = useContainerQueries({ breakpoints });

    return (
        <div ref={ref}>
            The current width is: {width}
            This matches your breakpoint: {active}
        </div>
    );
}
```

### Background

> "Container queries allow an author to control styling based on the size of a containing element rather than the size of the user’s viewport."
> [Editors Draft - WICG](https://wicg.github.io/container-queries/)

We've been using Media Queries to handle responsive web design for years, but as we've started to adopt a more modular and component based design system, the shortcomings of this approach become obvious. A component may behave and look differently depending on where it is placed within your layout. Components should be responsive and independent of purely just the viewport size.

Container Queries aim to solve this by allowing you to observe the container's width to allow you to adjust your styles accordingly.

### How it works

The hook accepts an object of key/value pairs that signify the width ranges per breakpoint. These ranges are the 'min' and 'max' values in pixels for that breakpoint. For example, you want to set breakpoints to be notified when a containers width falls between 0-300, 301-600 and 601+. We'll label these as small, med, and large:

```js
const breakpoints = {
    small: [0, 300],
    med: [301, 600],
    large: [601],
};
```

If the containers current width is 430px, the hook would return `{ active: 'med', width: 430 }`. For your largest breakpoint, you can omit the 'max' value as it is implied this breakpoint is from the minimum value and above.

### API

#### `useContainerQueries(options)`

```ts
function useContainerQueries<T extends HTMLElement>(
    options: ContainerQueryProps
): ContainerQueryResult<T>;
```

#### Options: `ContainerQueryProps`

| Name             | Type                               | Default | Required | Description                                                                                                                                                                           |
| ---------------- | ---------------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| breakpoints      | `[key: string]: [number, number?]` |         | true     | A key/value object of the breakpoints you wish to use. The key will label that breakpoint range. Each value should have a min and max range (Eg { small: [0, 300], med: [301, 600]} ) |
| ignoreDimensions | `boolean`                          | true    | false    | Flag to ignore updating state for container width changes when they don't trigger a breakpoint change, thus saving renders. Width will always return 0                                |

#### Returns `ContainerQueryResult<T>`

| Name   | Type             | Description                                                                                                          |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| ref    | `RefCallback<T>` | A callback ref to be assigned to the element you wish to observe changes on. This must be assigned                   |
| width  | `number`         | The current width of the observed element                                                                            |
| active | `string`         | The current active breakpoint. This key will match a property from the breakpoints supplied to the hook by the user. |

### Examples

Coming soon
