import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useContainerQueries, QueryBreakpoints } from '../src';

const breakpoints: QueryBreakpoints = {
    small: [0, 300],
    med: [301, 600],
    large: [601, 900],
    xl: [901],
};

const App = () => {
    const { current, ref, width } = useContainerQueries({
        breakpoints,
    });
    const [bg, setBg] = React.useState(current);

    React.useEffect(() => {
        setBg(current);
    }, [current]);

    let background: string;
    switch (bg) {
        case 'small':
            background = '#4fc4c4';
            break;
        case 'med':
            background = '#caa0d8';
            break;
        case 'large':
            background = '#8deac9';
            break;
        default:
            background = '#f5c780';
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '40px auto' }}>
            <h1 style={{ fontFamily: 'sans-serif' }}>useContainerQueries</h1>
            <div
                style={{
                    padding: '20px',
                    resize: 'both',
                    overflow: 'auto',
                    fontFamily: 'sans-serif',
                    borderRadius: '4px',
                    background,
                }}
                ref={ref}
            >
                <div>Resize me!</div>
                <br />
                <div>Current breakpoint: {current}</div>
                <div>Container width: {width}</div>
            </div>
            <div style={{ margin: '10px 0', fontFamily: 'monospace' }}>
                <h4 style={{ fontFamily: 'sans-serif', margin: '20px 0 10px' }}>Breakpoints:</h4>
                {JSON.stringify(breakpoints, null, 2)}
            </div>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
