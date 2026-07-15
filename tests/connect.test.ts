import * as echarts from "echarts/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import extension, { connect } from "../src/index";

const chart2MusicMock = vi.hoisted(() => {
  const c2m = {
    cleanUp: vi.fn(),
    getCurrent: vi.fn(),
    setData: vi.fn()
  };
  const c2mChart = vi.fn((_: unknown) => ({
    err: null,
    data: c2m
  }));

  return { c2m, c2mChart };
});

vi.mock("chart2music", () => ({
  default: chart2MusicMock.c2mChart
}));

type FakeChart = {
  dispatchAction: ReturnType<typeof vi.fn>;
  getDom: () => HTMLElement;
  getModel: () => unknown;
  getOption: () => Record<string, unknown>;
  off: (event: string) => unknown;
  on: (event: string, handler: (...args: unknown[]) => void) => unknown;
  setOption: ReturnType<typeof vi.fn>;
};

const makeElement = () =>
  ({
    append: vi.fn(),
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    insertAdjacentElement: vi.fn(),
    remove: vi.fn(),
    setAttribute: vi.fn(),
    style: { position: "" }
  }) as unknown as HTMLElement;

const makeChart = (
  option: Record<string, unknown>,
  root?: Record<string, unknown>
): FakeChart => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const dom = makeElement();

  return {
    dispatchAction: vi.fn(),
    getDom: vi.fn(() => dom),
    getModel: vi.fn(() => ({
      getSeriesByIndex: vi.fn(() => ({
        getData: vi.fn(() => ({
          tree: { root }
        }))
      }))
    })),
    getOption: vi.fn(() => option),
    off: vi.fn((event: string) => handlers.delete(event)),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => handlers.set(event, handler)),
    setOption: vi.fn()
  };
};

describe("echarts extension shape", () => {
  it("can be registered with echarts.use", () => {
    expect(extension).toMatchObject({
      install: expect.any(Function),
      connect: expect.any(Function),
      createEChartsMusic: expect.any(Function)
    });
    expect(() => echarts.use([extension])).not.toThrow();
  });
});

describe("connect", () => {
  beforeEach(() => {
    chart2MusicMock.c2m.cleanUp.mockClear();
    chart2MusicMock.c2m.getCurrent.mockReset();
    chart2MusicMock.c2m.setData.mockClear();
    chart2MusicMock.c2mChart.mockClear();
  });

  it("creates a caption container when one is not provided", () => {
    const created = makeElement();
    const previousDocument = globalThis.document;
    vi.stubGlobal("document", {
      createElement: vi.fn(() => created)
    });
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ type: "bar", data: [4] }]
    });
    const dom = chart.getDom() as HTMLElement & {
      insertAdjacentElement: ReturnType<typeof vi.fn>;
    };

    const connection = connect(chart as unknown as Parameters<typeof connect>[0]);

    expect(connection).not.toBeNull();
    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(dom.insertAdjacentElement).toHaveBeenCalledWith("afterend", created);
    expect(chart2MusicMock.c2mChart).toHaveBeenCalledWith(expect.objectContaining({ cc: created }));

    vi.stubGlobal("document", previousDocument);
  });

  it("passes the ECharts DOM node and caption container to Chart2Music", () => {
    const cc = makeElement();
    const chart = makeChart({
      xAxis: { data: ["A", "B"] },
      series: [{ type: "bar", data: [4, 8] }]
    });

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc });

    expect(connection).not.toBeNull();
    expect(chart2MusicMock.c2mChart).toHaveBeenCalledWith(
      expect.objectContaining({
        element: chart.getDom(),
        cc,
        type: "bar"
      })
    );
    expect(chart.on).toHaveBeenCalledWith("finished", connection?.update);
  });

  it("ignores waterfall bars without attaching ECharts interaction hooks", () => {
    const errorCallback = vi.fn();
    const chart = makeChart({
      xAxis: { data: ["Start", "Sales", "Costs"] },
      series: [
        {
          name: "Base",
          type: "bar",
          stack: "total",
          itemStyle: { color: "transparent" },
          data: [0, 20, 35]
        },
        { name: "Change", type: "bar", stack: "total", data: [20, 15, -13] }
      ]
    });

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], {
      cc: makeElement(),
      errorCallback
    });

    expect(connection).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("waterfall bar charts are not supported"));
    expect(chart2MusicMock.c2mChart).not.toHaveBeenCalled();
    expect(chart.on).not.toHaveBeenCalled();
    expect(chart.off).not.toHaveBeenCalled();
    expect(chart.dispatchAction).not.toHaveBeenCalled();
  });

  it("updates Chart2Music data after the ECharts series changes", () => {
    const cc = makeElement();
    const option = {
      xAxis: { data: ["A", "B"] },
      series: [{ type: "line", data: [1, 2] }]
    };
    const chart = makeChart(option);
    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc });

    option.series = [{ type: "line", data: [3, 5] }];
    connection?.update();

    expect(chart2MusicMock.c2m.setData).toHaveBeenCalledWith(
      [
        { x: 0, y: 3, custom: { seriesIndex: 0, dataIndex: 0 } },
        { x: 1, y: 5, custom: { seriesIndex: 0, dataIndex: 1 } }
      ],
      expect.objectContaining({
        x: expect.objectContaining({ valueLabels: ["A", "B"] })
      })
    );
  });

  it("does not update Chart2Music when the ECharts data snapshot has not changed or after disposal", () => {
    const cc = makeElement();
    const chart = makeChart({
      xAxis: { data: ["A", "B"] },
      series: [{ type: "line", data: [1, 2] }]
    });
    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc });

    connection?.update();
    expect(chart2MusicMock.c2m.setData).not.toHaveBeenCalled();

    connection?.dispose();
    connection?.update();
    expect(chart2MusicMock.c2m.setData).not.toHaveBeenCalled();
  });

  it("reports Chart2Music initialization errors without attaching ECharts listeners", () => {
    const errorCallback = vi.fn();
    chart2MusicMock.c2mChart.mockReturnValueOnce({
      err: "Unable to initialize Chart2Music",
      data: undefined
    } as never);
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ type: "bar", data: [4] }]
    });

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], {
      cc: makeElement(),
      errorCallback
    });

    expect(connection).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith("Unable to initialize Chart2Music");
    expect(chart.on).not.toHaveBeenCalled();
    expect(chart.dispatchAction).not.toHaveBeenCalled();
  });

  it("returns null when Chart2Music does not provide a connection", () => {
    chart2MusicMock.c2mChart.mockReturnValueOnce({
      err: null,
      data: undefined
    } as never);
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ type: "bar", data: [4] }]
    });

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc: makeElement() });

    expect(connection).toBeNull();
    expect(chart.on).not.toHaveBeenCalled();
  });

  it("fails gracefully for unsupported chart types without attaching ECharts interaction hooks", () => {
    const errorCallback = vi.fn();
    const chart = makeChart({
      radar: {
        indicator: [
          { name: "Speed", max: 100 },
          { name: "Reliability", max: 100 }
        ]
      },
      series: [
        {
          type: "radar",
          data: [{ name: "Product A", value: [80, 72] }]
        }
      ]
    });
    const dom = chart.getDom() as HTMLElement & {
      insertAdjacentElement: ReturnType<typeof vi.fn>;
    };

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { errorCallback });

    expect(connection).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("radar"));
    expect(chart2MusicMock.c2mChart).not.toHaveBeenCalled();
    expect(chart.on).not.toHaveBeenCalled();
    expect(chart.off).not.toHaveBeenCalled();
    expect(chart.dispatchAction).not.toHaveBeenCalled();
    expect(dom.insertAdjacentElement).not.toHaveBeenCalled();
  });

  it("highlights hierarchy charts using the ECharts internal tree dataIndex", () => {
    const cc = makeElement();
    const treeRoot = {
      name: "",
      dataIndex: 0,
      children: [
        { name: "A", dataIndex: 1 },
        { name: "B", dataIndex: 2 },
        { name: "C", dataIndex: 3 }
      ]
    };
    const chart = makeChart(
      {
        series: [
          {
            name: "Portfolio",
            type: "treemap",
            data: [
              { name: "A", value: 10 },
              { name: "B", value: 8 },
              { name: "C", value: 6 }
            ]
          }
        ]
      },
      treeRoot
    );
    chart2MusicMock.c2m.getCurrent.mockReturnValue({
      group: "Portfolio",
      point: {
        custom: {
          seriesIndex: 0,
          dataIndex: 2,
          name: "C"
        }
      }
    });

    connect(chart as unknown as Parameters<typeof connect>[0], { cc });
    const config = chart2MusicMock.c2mChart.mock.calls[0]?.[0] as {
      options?: { onFocusCallback?: () => void };
    };
    config.options?.onFocusCallback?.();

    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "treemapRootToNode",
      seriesIndex: 0,
      targetNode: treeRoot
    });
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: 3
    });
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: 3
    });
  });

  it("ignores charts with slider data zoom overlays without attaching ECharts hooks", () => {
    const errorCallback = vi.fn();
    const chart = makeChart({
      xAxis: { data: ["Mon", "Tue", "Wed"] },
      series: [{ type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 42, 29, 45]] }],
      dataZoom: [{ type: "inside" }, { type: "slider", start: -10, end: 125, bottom: 12, height: 28 }]
    });

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { errorCallback });

    expect(connection).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("slider data zoom overlays are not supported"));
    expect(chart2MusicMock.c2mChart).not.toHaveBeenCalled();
    expect(chart.on).not.toHaveBeenCalled();
    expect(chart.off).not.toHaveBeenCalled();
    expect(chart.dispatchAction).not.toHaveBeenCalled();
  });

  it("runs the caller's Chart2Music onFocusCallback after syncing the ECharts highlight", () => {
    const cc = makeElement();
    const onFocusCallback = vi.fn();
    const callbackPoint = {
      slice: "Revenue",
      index: 0,
      point: {
        x: 0,
        y: 4,
        custom: {
          seriesIndex: 0,
          dataIndex: 0
        }
      }
    };
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ name: "Revenue", type: "bar", data: [4] }]
    });
    chart2MusicMock.c2m.getCurrent.mockReturnValue({
      group: "Revenue",
      point: callbackPoint.point
    });

    connect(chart as unknown as Parameters<typeof connect>[0], {
      cc,
      options: {
        onFocusCallback
      }
    });
    const config = chart2MusicMock.c2mChart.mock.calls[0]?.[0] as unknown as {
      options?: { onFocusCallback?: (point: typeof callbackPoint) => void };
    };
    config.options?.onFocusCallback?.(callbackPoint);

    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: 0
    });
    expect(onFocusCallback).toHaveBeenCalledWith(callbackPoint);
  });

  it("does not move the ECharts tooltip when Chart2Music changes boxplot statistics", () => {
    const cc = makeElement();
    const callbackPoint = {
      point: {
        x: 0,
        low: 4,
        q1: 7,
        median: 10,
        q3: 14,
        high: 18,
        custom: {
          seriesIndex: 0,
          dataIndex: 0
        }
      }
    };
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ type: "boxplot", data: [[4, 7, 10, 14, 18]] }]
    });
    chart2MusicMock.c2m.getCurrent.mockReturnValue({
      group: "Series 1",
      point: callbackPoint.point
    });

    connect(chart as unknown as Parameters<typeof connect>[0], { cc });
    const config = chart2MusicMock.c2mChart.mock.calls[0]?.[0] as {
      options?: { onFocusCallback?: (point: typeof callbackPoint) => void };
    };
    config.options?.onFocusCallback?.(callbackPoint);
    config.options?.onFocusCallback?.(callbackPoint);

    expect(chart.dispatchAction).toHaveBeenCalledTimes(3);
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: 0
    });
  });

  it("highlights the selected scatter outlier for boxplot outlier navigation", () => {
    const cc = makeElement();
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [
        { type: "boxplot", data: [[4, 7, 10, 14, 18]] },
        { type: "scatter", data: [[0, 3], [0, 26]] }
      ]
    });
    const point = {
      x: 0,
      low: 4,
      q1: 7,
      median: 10,
      q3: 14,
      high: 18,
      outlier: [3, 26],
      custom: {
        seriesIndex: 0,
        dataIndex: 0,
        outlierIndexes: [{ seriesIndex: 1, dataIndex: 0 }, { seriesIndex: 1, dataIndex: 1 }]
      }
    };
    Object.assign(chart2MusicMock.c2m, { _outlierIndex: 1 });
    chart2MusicMock.c2m.getCurrent.mockReturnValue({ group: "Series 1", point, stat: "outlier" });

    connect(chart as unknown as Parameters<typeof connect>[0], { cc });
    const config = chart2MusicMock.c2mChart.mock.calls[0]?.[0] as {
      options?: { onFocusCallback?: () => void };
    };
    config.options?.onFocusCallback?.();

    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "highlight",
      seriesIndex: 1,
      dataIndex: 1
    });
  });

  it("clears the previous ECharts series when changing Chart2Music groups", () => {
    const cc = makeElement();
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [
        { name: "Control", type: "bar", data: [4] },
        { name: "Variant", type: "bar", data: [8] }
      ]
    });
    const current: {
      group: string;
      point: { custom: { seriesIndex: number; dataIndex: number } };
    } = { group: "Control", point: { custom: { seriesIndex: 0, dataIndex: 0 } } };
    chart2MusicMock.c2m.getCurrent.mockImplementation(() => current);

    connect(chart as unknown as Parameters<typeof connect>[0], { cc });
    const config = chart2MusicMock.c2mChart.mock.calls[0]?.[0] as {
      options?: { onFocusCallback?: () => void };
    };
    config.options?.onFocusCallback?.();
    current.group = "Variant";
    current.point = { custom: { seriesIndex: 1, dataIndex: 0 } };
    config.options?.onFocusCallback?.();

    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: "showTip",
      seriesIndex: 1,
      dataIndex: 0
    });
    expect(chart.dispatchAction).toHaveBeenCalledWith({ type: "downplay", seriesIndex: 0 });
  });

  it("disposes Chart2Music and detaches the ECharts finished listener", () => {
    const cc = makeElement();
    const chart = makeChart({
      xAxis: { data: ["A"] },
      series: [{ type: "bar", data: [4] }]
    });
    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc });

    connection?.dispose();

    expect(chart.off).toHaveBeenCalledWith("finished", connection?.update);
    expect(chart2MusicMock.c2m.cleanUp).toHaveBeenCalled();
  });
});
