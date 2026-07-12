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

  it("bridges ECharts slider dataZoom to hidden range controls", () => {
    const previousDocument = globalThis.document;
    const createdElements: Array<HTMLElement & {
      addEventListener: ReturnType<typeof vi.fn>;
      value: string;
      min: string;
      max: string;
      remove: ReturnType<typeof vi.fn>;
    }> = [];
    vi.stubGlobal("document", {
      createElement: vi.fn((tagName: string) => {
        const element = {
          ...makeElement(),
          tagName,
          type: "",
          min: "",
          max: "",
          step: "",
          value: "",
          addEventListener: vi.fn()
        } as unknown as HTMLElement & {
          addEventListener: ReturnType<typeof vi.fn>;
          value: string;
          min: string;
          max: string;
          remove: ReturnType<typeof vi.fn>;
        };
        createdElements.push(element);
        return element;
      })
    });
    const option = {
      xAxis: { data: ["Mon", "Tue", "Wed"] },
      series: [{ type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 42, 29, 45]] }],
      dataZoom: [{ type: "inside" }, { type: "slider", start: -10, end: 125, bottom: 12, height: 28 }]
    };
    const chart = makeChart(option);
    const dom = chart.getDom() as HTMLElement & { append: ReturnType<typeof vi.fn> };

    const connection = connect(chart as unknown as Parameters<typeof connect>[0], { cc: makeElement() });
    const startInput = createdElements.find((element) =>
      (element.setAttribute as ReturnType<typeof vi.fn>).mock.calls.some((call) => call[1] === "Zoom start")
    );
    const endInput = createdElements.find((element) =>
      (element.setAttribute as ReturnType<typeof vi.fn>).mock.calls.some((call) => call[1] === "Zoom end")
    );
    const dataZoomHandler = (chart.on as ReturnType<typeof vi.fn>).mock.calls.find((call) => call[0] === "datazoom")?.[1];

    expect(connection).not.toBeNull();
    expect(dom.style.position).toBe("relative");
    expect(dom.append).toHaveBeenCalledWith(createdElements[0]);
    expect(startInput?.value).toBe("0");
    expect(endInput?.value).toBe("100");

    startInput!.value = "80";
    endInput!.value = "20";
    (startInput!.addEventListener as ReturnType<typeof vi.fn>).mock.calls.find((call) => call[0] === "input")?.[1]();
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: "dataZoom",
      dataZoomIndex: 1,
      start: 20,
      end: 80
    });

    (startInput!.addEventListener as ReturnType<typeof vi.fn>).mock.calls.find((call) => call[0] === "focus")?.[1]();
    expect(chart.setOption).toHaveBeenCalledWith({
      dataZoom: [
        { type: "inside" },
        {
          type: "slider",
          start: -10,
          end: 125,
          bottom: 12,
          height: 28,
          handleStyle: {
            borderColor: "#18212f",
            shadowBlur: 6,
            shadowColor: "rgba(24, 33, 47, 0.35)"
          }
        }
      ]
    });

    option.dataZoom = [{ type: "inside" }, { type: "slider", start: 33, end: 66, bottom: 12, height: 28 }];
    dataZoomHandler?.();
    expect(startInput?.value).toBe("33");
    expect(endInput?.value).toBe("66");

    connection?.dispose();
    expect(chart.off).toHaveBeenCalledWith("datazoom", dataZoomHandler);
    expect(createdElements[0]?.remove).toHaveBeenCalled();
    expect(dom.style.position).toBe("");

    vi.stubGlobal("document", previousDocument);
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
