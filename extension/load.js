require.config({
    paths: {
        'react': './third_party/react',
        'react-dom': './third_party/react-dom',
    }
});

requirejs(['react', 'react-dom', "../out/perf"], function (React, ReactDOM, perf) {
    const root = document.getElementById('root');
    ReactDOM.render(React.createElement(perf.PerfProvider), root)
});