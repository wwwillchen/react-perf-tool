   requirejs(['./react', './react-dom', "./out/perf"], function (React, ReactDOM, perf) {
            const root = document.getElementById('root');
            ReactDOM.render(React.createElement(Perf$$Provider), root)
        });