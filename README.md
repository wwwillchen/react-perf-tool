# React Perf Tool

A Chrome DevTools extension to analyze the performance of your React app.

## Demo



## Running it locally

1. Install modules: `yarn` / `npm install` (devDependency used for type checking)
2. Compile Typescript file: `yarn ts`
3. Go to chrome://extensions - click "Load unpacked extensions" - select react-perf-tool/extension
4. We'll use sound-redux a nice open-source SoundCloud client written in React.
  - Clone my forked version of sound-redux (only recent versions of React have the performance instrumentation): `git clone https://github.com/wwwillchen/sound-redux`
  - Install modules: `yarn` / `npm install`
  - You'll need to modify one line in React so the performance measurements can be captured by the extension:
  In node_modules/react-dom/lib/ReactDebugTool.js: comment out `performance.clearMeasures()`
  - Start the dev server for sound-redux: `yarn start`

5. Go to http://localhost:8080/?react_perf (you need the query param for React to measure performance timings)
6. Open Chrome DevTools and select the "React Perf" tab.
