# React Perf Tool

A Chrome DevTools extension to analyze the performance of your React app.

After reading [React's 15.4 release notes](https://facebook.github.io/react/blog/2016/11/16/react-v15.4.0.html#profiling-components-with-chrome-timeline), I learned that React already performance instrumentation using the [window.performance API](https://developer.mozilla.org/en-US/docs/Web/API/Window/performance). This tool essentially provides a different view on the performance data already collected by React.

These are the types of questions that can be answered by this tool:
* Which components are taking the longest time on load?
  * Insight: Defer loading certain components (e.g. don't render content below the fold right away).
* What's taking the most time after certain user actions (e.g. scrolling a list-type view, clicking on a new route)?
  * Insight: Identify which components to write `shouldComponentUpdate` logic for.
* How many component instances are there at a given moment?
  * Insight: Unmount unused component instances

Note: This is a **proof-of-concept** and may have bugs.

## Demo

![react-perf-tool-smaller-2](https://user-images.githubusercontent.com/7344640/26852190-49b0f83a-4ac2-11e7-8319-58db43015272.gif)


## Running it locally

1. Install modules: `yarn` / `npm install` (devDependency used for type checking)
2. Compile Typescript file: `yarn ts`
3. Go to chrome://extensions - click "Load unpacked extensions" - select `react-perf-tool/extension`
4. We'll use sound-redux a nice open-source SoundCloud client written in React.
  - Clone my forked version of sound-redux (only recent versions of React have the performance instrumentation): `git clone https://github.com/wwwillchen/sound-redux`
  - Install modules: `yarn` / `npm install`
  - You'll need to modify one line in React so the performance measurements can be captured by the extension:
  In `node_modules/react-dom/lib/ReactDebugTool.js`: comment out the line: `performance.clearMeasures(measurementName);`
  - Start the dev server for sound-redux: `yarn start`

5. Go to http://localhost:8080/?react_perf (you need the query param for React to measure performance timings)
6. Open Chrome DevTools and select the "React Perf" tab.
