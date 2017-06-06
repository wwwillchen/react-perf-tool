import * as React from "react";

declare const chrome: any;

let previousMeasures: PerformanceMeasure[] = [];

interface ComponentPerformanceIndex {
  [key: string]: {
    mount: {
      timeSpent: number[];
    };
    unmount: {
      timeSpent: number[];
    };
    update: {
      timeSpent: number[];
    };
    render: {
      timeSpent: number[];
    };
  };
}

function readReactPerformanceData(
  measures: PerformanceMeasure[]
): ComponentPerformanceIndex {
  const index: ComponentPerformanceIndex = {};
  for (const measure of measures) {
    const [componentName, phase] = measure.name.split(" ");
    if (!index[componentName]) {
      index[componentName] = {
        mount: {
          timeSpent: []
        },
        unmount: {
          timeSpent: []
        },
        update: {
          timeSpent: []
        },
        render: {
          timeSpent: []
        },
      };
    }
    if (phase === "[mount]") {
      index[componentName].mount.timeSpent.push(measure.duration);
    }
    if (phase === "[unmount]") {
      index[componentName].unmount.timeSpent.push(measure.duration);
    }
    if (phase === "[update]") {
      index[componentName].update.timeSpent.push(measure.duration);
    }
    if (phase === "[render]") {
      index[componentName].render.timeSpent.push(measure.duration);
    }
  }
  return index;
}

interface ComponentTimeIndex {
  [key: string]: number;
}

type ComponentTotalTimes = {
  name: string;
  totalTime: number;
}[];

function sum(nums: number[]): number {
  return Math.round(Number(nums.reduce((acc, v) => (acc += v), 0).toFixed(2)));
}

function average(nums: number[]): string {
  if (nums.length === 0) {
    return '-';
  }
  return (nums.reduce((acc, v) => (acc += v), 0) / nums.length).toFixed(1);
}

function mapData(index: ComponentPerformanceIndex): ComponentPerf[] {
  const componentByTotalTime: ComponentTimeIndex = {};
  for (let componentName in index) {
    componentByTotalTime[componentName] =
      componentByTotalTime[componentName] || 0;
    componentByTotalTime[componentName] += sum(
      index[componentName].mount.timeSpent
    );
    componentByTotalTime[componentName] += sum(
      index[componentName].unmount.timeSpent
    );
    componentByTotalTime[componentName] += sum(
      index[componentName].update.timeSpent
    );
  }
  const components: ComponentTotalTimes = Object.keys(
    componentByTotalTime
  ).reduce((acc: ComponentTotalTimes, key) => {
    acc.push({ name: key, totalTime: componentByTotalTime[key] });
    return acc;
  }, []);
  const allComponentsTotalTime: number = components.reduce(
    (acc, component) => (acc += component.totalTime),
    0
  );

  const percent = (num: number): string => Math.round(num * 100) + "%";

  const r = components.sort((a, b) => b.totalTime - a.totalTime);
  return r.map(c => ({
    componentName: c.name,
    totalTimeSpent: c.totalTime,
    numberOfInstances:
      index[c.name].mount.timeSpent.length -
        index[c.name].unmount.timeSpent.length,
    percentTimeSpent: percent(c.totalTime / allComponentsTotalTime),
    render: mapTiming(index[c.name].render.timeSpent),
    mount: mapTiming(index[c.name].mount.timeSpent),
    update: mapTiming(index[c.name].update.timeSpent),
    unmount: mapTiming(index[c.name].unmount.timeSpent)
  }));

  function mapTiming(nums: number[]): PerfTiming {
    return {
      averageTimeSpentMs: average(nums),
      numberOfTimes: nums.length,
      totalTimeSpentMs: sum(nums)
    };
  }
}

interface PerfProviderState {
  data: ComponentPerf[];
  totalTime: number;
  pendingEventCount: number;
}

const containerStyle = {
  fontFamily: `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  zIndex: 999,
  position: "fixed",
  bottom: 0,
  right: 0,
  width: "100%",
  backgroundColor: "white",
  overflowY: "auto",
  fontSize: 12,
  height: "100%",
};

export class PerfProvider extends React.Component<any, PerfProviderState> {
  constructor(props: any) {
    super(props);
    this.state = {
      data: [],
      totalTime: 0,
      pendingEventCount: 0,
    };
  }

  componentDidMount() {
    setInterval(() => {
      chrome.devtools.inspectedWindow.eval(
        "performance.getEntriesByType('measure').length",
        function(result: string, exception: Error) {
          if (exception) {
            console.error("exception", exception);
            return;
          }
          innerEvents(JSON.parse(result));
        }
      );
    }, 2000);

    const innerEvents = (eventCount: number) => {
      this.setState({
        pendingEventCount: eventCount
      });
      if (this.state.data.length === 0) {
        this.flush();
      }
    };
  }

  private flush = () => {
    chrome.devtools.inspectedWindow.eval(
      "JSON.stringify(performance.getEntriesByType('measure'))",
      function(result: string, exception: Error) {
        if (exception) {
          console.error("exception", exception);
          return;
        }
        innerFlush(JSON.parse(result));
      }
    );
    const innerFlush = (result: PerformanceMeasure[]) => {
      previousMeasures = previousMeasures.concat(result);
      const data = mapData(readReactPerformanceData(previousMeasures));
      this.setState({
        data,
        totalTime: data.reduce((acc, comp) => acc + comp.totalTimeSpent, 0)
      });
      chrome.devtools.inspectedWindow.eval(
        "JSON.stringify(performance.clearMeasures())"
      );
    };
  }

  private clear = () => {
    previousMeasures = [];
    this.setState({
      data: mapData(readReactPerformanceData(previousMeasures)),
      totalTime: 0
    });
    chrome.devtools.inspectedWindow.eval(
      "JSON.stringify(performance.clearMeasures())"
    );
  }

  private reload = () => {
    this.clear();
    chrome.devtools.inspectedWindow.reload();
  }

  render() {
    const toolbarStyle = {
      border: "1px solid #dadada",
      paddingTop: 2,
      paddingBottom: 2
    };
    const toolbarDividerStyle = {
      backgroundColor: "#ccc",
      width: 1,
      margin: "0 4px",
      height: 12,
      display: "inline-block"
    };

    const buttonStyle = {
      backgroundColor: "#3B78E7",
      color: "white",
      padding: "1px 12px",
      border: "1px solid rgba(0, 0, 0, 0.14)"
    };

    return (
      <div>
        {this.props.children}
        <div style={{ ...containerStyle as any}}>
          <div style={toolbarStyle}>
            <span>React Perf Panel</span>
            <div style={toolbarDividerStyle} />
            <button style={buttonStyle} onClick={this.flush}>
              Update
            </button>
            <div style={toolbarDividerStyle} />
            <span>{this.state.pendingEventCount} pending events</span>
            <div style={toolbarDividerStyle} />
            <button style={buttonStyle} onClick={this.clear}>
              Clear
            </button>
            <div style={toolbarDividerStyle} />
            <button style={buttonStyle} onClick={this.reload}>
              Reload Inspected Page
            </button>
          </div>
          <PerfTable components={this.state.data} />
          <div
            style={{
              ...toolbarStyle,
              position: "sticky",
              width: "100%",
              bottom: 0,
              background: "#EEE",
              paddingLeft: 10,
              fontWeight: "bold"
            }}
          >
            <span>
              Total time: {this.state.totalTime}
              ms
            </span>
          </div>
        </div>
      </div>
    );
  }
}

interface ComponentPerf {
  componentName: string;
  numberOfInstances: number;
  totalTimeSpent: number;
  percentTimeSpent: string;
  render: PerfTiming;
  mount: PerfTiming;
  unmount: PerfTiming;
  update: PerfTiming;
}

interface PerfTiming {
  averageTimeSpentMs: string;
  numberOfTimes: number;
  totalTimeSpentMs: number;
}

interface PerfTableProps {
  components: ComponentPerf[];
}

const PerfTable = (props: PerfTableProps) =>
  <div
    style={{
      minWidth: "100%",
      display: "inline-block"
    }}
  >
    <TableHeader />
    {" "}
    {props.components.map((c, i) =>
      <ComponentView
        perf={c}
        key={c.componentName}
        alternateRow={i % 2 === 0}
      />
    )}
  </div>;

const width = 70;
const componentNameWidth = 200;

const HeaderStyle = {
  width,
  display: "inline-block",
  textAlign: "center",
  fontWeight: "bold",
  whiteSpace: "pre-wrap"
} as any;

const ComponentNameStyle = {
  ...HeaderStyle,
  width: componentNameWidth
};

const ComponentTimingStyle = {
  width,
  display: "inline-block",
  textAlign: "center"
};

const TableHeader = () =>
  <div
    style={{
      flexDirection: "row",
      borderBottom: "1px solid #e1e1e1",
      display: "inline-block",
      whiteSpace: "nowrap"
    }}
  >
    <span style={ComponentNameStyle}>Component Name</span>
    <span style={HeaderStyle}>Total time (ms)</span>
    <span style={HeaderStyle}>% of time</span>
    <MetricHeader name={"Mount"} />
    <MetricHeader name={"Update"} />
    <MetricHeader name={"Unmount"} />
  </div>;

const MetricHeader = ({
  name
}: {name: string}) =>
  <span
    style={{
      border: "1px solid #3B78E7"
    }}
  >
    <span
      style={{
        ...HeaderStyle,
        position: "relative"
      }}
    >
      Count
      <span
        style={{
          position: "absolute",
          left: width - 5,
          fontWeight: "normal"
        }}
      >
        ✕
      </span>
    </span>
    <span style={HeaderStyle}>
      <span
        style={{
          display: "block"
        }}
      >
        {name}
      </span>
      <span
        style={{
          display: "block",
          position: "relative"
        }}
      >
        Ms per
        <span
          style={{
            position: "absolute",
            left: width - 5,
            fontWeight: "normal"
          }}
        >
          =
        </span>
      </span>
    </span>
    <span style={HeaderStyle}>Total ms</span>
  </span>;

interface ComponentViewProps {
  perf: ComponentPerf;
  alternateRow: boolean;
}

const ComponentView = (props: ComponentViewProps) =>
  <div
    style={
      props.alternateRow
        ? {
            background: "#EEE"
          }
        : {}
    }
  >
    <span
      style={{
        ...ComponentNameStyle,
        width: componentNameWidth - 10,
        paddingLeft: 10,
        fontWeight: "normal",
        textAlign: "left",
      }}
    >
      {props.perf.componentName}
    </span>
    <span style={ComponentTimingStyle}>{props.perf.totalTimeSpent}</span>
    <span style={ComponentTimingStyle}>{props.perf.percentTimeSpent}</span>
    <ComponentTimingView
      name={"mount"}
      timing={props.perf.mount}
    />
    <ComponentTimingView
      name={"update"}
      timing={props.perf.update}
    />
    <ComponentTimingView
      name={"unmount"}
      timing={props.perf.unmount}
    />
  </div>;

interface ComponentTimingViewProps {
  timing: PerfTiming;
  name: string;
}

const ComponentTimingView = (props: ComponentTimingViewProps) =>
  <span>
    <span style={ComponentTimingStyle}>{props.timing.numberOfTimes}</span>
    <span style={ComponentTimingStyle}>{props.timing.averageTimeSpentMs}</span>
    <span style={ComponentTimingStyle}>{props.timing.totalTimeSpentMs}</span>
  </span>;
