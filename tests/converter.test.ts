import { describe, expect, it, vi } from "vitest";
import { echartsOptionToChart2MusicConfig } from "../src/converter";

describe("echartsOptionToChart2MusicConfig", () => {
  it("passes Chart2Music top-level config, axes, info, and options through", () => {
    const cc = {} as HTMLElement;
    const audioEngine = {
      masterGain: 0.5,
      playDataPoint: vi.fn(),
      playNotification: vi.fn()
    };
    const xFormat = vi.fn((value: number) => `x ${value}`);
    const yFormat = vi.fn((value: number) => `y ${value}`);
    const y2Format = vi.fn((value: number) => `y2 ${value}`);
    const onFocusCallback = vi.fn();
    const onSelectCallback = vi.fn();
    const customHotkeyCallback = vi.fn();
    const translationCallback = vi.fn(() => "translated");
    const modifyHelpDialogText = vi.fn((lang: string, text: string) => `${lang}:${text}`);
    const modifyHelpDialogKeyboardListing = vi.fn(
      (_lang: string, _headers: string[], shortcuts: string[][]) => shortcuts
    );

    const config = echartsOptionToChart2MusicConfig(
      {
        title: { text: "Original title" },
        xAxis: { data: ["Jan", "Feb"] },
        series: [{ type: "line", data: [2, 5] }]
      },
      {
        audioEngine,
        cc,
        lang: "es",
        title: "Override title",
        type: "scatter",
        axes: {
          x: {
            minimum: 0,
            maximum: 10,
            label: "Month",
            format: xFormat,
            type: "log10",
            valueLabels: ["One", "Two"],
            continuous: true
          },
          y: {
            minimum: -10,
            maximum: 100,
            label: "Revenue",
            format: yFormat,
            type: "linear",
            continuous: false
          },
          y2: {
            minimum: 1,
            maximum: 5,
            label: "Secondary",
            format: y2Format,
            valueLabels: ["Low", "High"]
          }
        },
        info: {
          notes: ["Source: demo"],
          annotations: [{ x: 1, label: "Provided annotation" }]
        },
        options: {
          enableSound: false,
          enableSpeech: true,
          onFocusCallback,
          onSelectCallback,
          live: true,
          maxWidth: 40,
          customHotkeys: [
            {
              key: { key: "k", altKey: true },
              callback: customHotkeyCallback,
              title: "Custom action",
              keyDescription: "Alt+K",
              description: "Runs a custom action",
              force: true
            }
          ],
          hertzes: [220, 440, 880],
          stack: false,
          root: "Root override",
          translationCallback,
          modifyHelpDialogText,
          modifyHelpDialogKeyboardListing
        }
      }
    );

    expect(config).toMatchObject({
      audioEngine,
      cc,
      lang: "es",
      title: "Override title",
      type: "scatter",
      info: {
        notes: ["Source: demo"],
        annotations: [{ x: 1, label: "Provided annotation" }]
      }
    });
    expect(config?.axes?.x).toEqual({
      minimum: 0,
      maximum: 10,
      label: "Month",
      format: xFormat,
      type: "log10",
      valueLabels: ["One", "Two"],
      continuous: true
    });
    expect(config?.axes?.y).toEqual({
      minimum: -10,
      maximum: 100,
      label: "Revenue",
      format: yFormat,
      type: "linear",
      continuous: false
    });
    expect(config?.axes?.y2).toEqual({
      minimum: 1,
      maximum: 5,
      label: "Secondary",
      format: y2Format,
      valueLabels: ["Low", "High"]
    });
    expect(config?.options).toEqual({
      enableSound: false,
      enableSpeech: true,
      onFocusCallback,
      onSelectCallback,
      live: true,
      maxWidth: 40,
      customHotkeys: [
        {
          key: { key: "k", altKey: true },
          callback: customHotkeyCallback,
          title: "Custom action",
          keyDescription: "Alt+K",
          description: "Runs a custom action",
          force: true
        }
      ],
      hertzes: [220, 440, 880],
      stack: false,
      root: "Root override",
      translationCallback,
      modifyHelpDialogText,
      modifyHelpDialogKeyboardListing
    });
  });

  it("converts a single line series with category labels", () => {
    const config = echartsOptionToChart2MusicConfig({
      title: { text: "Revenue" },
      xAxis: { data: ["Jan", "Feb"] },
      series: [{ type: "line", data: [2, 5] }]
    });

    expect(config?.type).toBe("line");
    expect(config?.title).toBe("Revenue");
    expect(config?.axes?.x?.valueLabels).toEqual(["Jan", "Feb"]);
    expect(config?.data).toEqual([
      { x: 0, y: 2, custom: { seriesIndex: 0, dataIndex: 0 } },
      { x: 1, y: 5, custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
  });

  it("converts multiple series into Chart2Music groups", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", "B"] },
      series: [
        { name: "Cats", type: "bar", data: [1, 2] },
        { name: "Dogs", type: "bar", data: [3, 4] }
      ]
    });

    expect(config?.type).toBe("bar");
    expect(config?.axes?.x?.valueLabels).toEqual(["A", "B"]);
    expect(config?.data).toMatchObject({
      Cats: expect.arrayContaining([{ x: 0, y: 1, custom: { seriesIndex: 0, dataIndex: 0 } }]),
      Dogs: expect.arrayContaining([{ x: 0, y: 3, custom: { seriesIndex: 1, dataIndex: 0 } }])
    });
  });

  it("enables Chart2Music stacking for stacked bar series", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", "B"] },
      series: [
        { name: "Cats", type: "bar", stack: "total", data: [1, 2] },
        { name: "Dogs", type: "bar", stack: "total", data: [3, 4] }
      ]
    });

    expect(config?.type).toBe("bar");
    expect(config?.options?.stack).toBe(true);
  });

  it("does not enable Chart2Music stacking for floating bar helper series", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", "B"] },
      series: [
        {
          name: "Offset",
          type: "bar",
          stack: "range",
          itemStyle: { borderColor: "transparent", color: "transparent" },
          data: [3, 5]
        },
        { name: "Range", type: "bar", stack: "range", data: [8, 10] }
      ]
    });

    expect(config?.type).toBe("bar");
    expect(config?.options?.stack).toBeUndefined();
  });

  it("uses pie data item names as x-axis labels", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          type: "pie",
          data: [
            { name: "Apples", value: 4 },
            { name: "Oranges", value: 6 }
          ]
        }
      ]
    });

    expect(config?.type).toBe("pie");
    expect(config?.axes?.x?.valueLabels).toEqual(["Apples", "Oranges"]);
    expect(config?.data).toEqual([
      { x: 0, y: 4, custom: { seriesIndex: 0, dataIndex: 0 } },
      { x: 1, y: 6, custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
  });

  it("preserves scatter data item names as point labels", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          type: "scatter",
          data: [
            { name: "A", value: [1, 8, 6] },
            { name: "B", value: [2, 12, 12] }
          ]
        }
      ]
    });

    expect(config?.type).toBe("scatter");
    expect(config?.data).toEqual([
      { x: 1, y: 8, label: "A", custom: { seriesIndex: 0, dataIndex: 0 } },
      { x: 2, y: 12, label: "B", custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
  });

  it("converts effectScatter series as scatter with the default Effect group label", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        { name: "Samples", type: "scatter", data: [[1, 8], [2, 12]] },
        { type: "effectScatter", data: [[3, 20], [4, 24]] }
      ]
    });

    expect(config?.type).toBe("scatter");
    expect(config?.data).toMatchObject({
      Samples: [
        { x: 1, y: 8, custom: { seriesIndex: 0, dataIndex: 0 } },
        { x: 2, y: 12, custom: { seriesIndex: 0, dataIndex: 1 } }
      ],
      Effect: [
        { x: 3, y: 20, custom: { seriesIndex: 1, dataIndex: 0 } },
        { x: 4, y: 24, custom: { seriesIndex: 1, dataIndex: 1 } }
      ]
    });
  });

  it("converts funnel slices to bars with slice names as x-axis labels", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          type: "funnel",
          data: [
            { name: "Visit", value: 100 },
            { name: "Lead", value: 72 },
            { name: "Buy", value: 28 }
          ]
        }
      ]
    });

    expect(config?.type).toBe("bar");
    expect(config?.axes?.x?.valueLabels).toEqual(["Visit", "Lead", "Buy"]);
    expect(config?.data).toEqual([
      { x: 0, y: 100, custom: { seriesIndex: 0, dataIndex: 0 } },
      { x: 1, y: 72, custom: { seriesIndex: 0, dataIndex: 1 } },
      { x: 2, y: 28, custom: { seriesIndex: 0, dataIndex: 2 } }
    ]);
  });

  it("converts comparison funnels to grouped bar data", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          name: "Actual",
          type: "funnel",
          data: [
            { name: "Visit", value: 100 },
            { name: "Lead", value: 64 },
            { name: "Buy", value: 24 }
          ]
        },
        {
          name: "Goal",
          type: "funnel",
          data: [
            { name: "Visit", value: 100 },
            { name: "Lead", value: 76 },
            { name: "Buy", value: 34 }
          ]
        }
      ]
    });

    expect(config?.type).toBe("bar");
    expect(config?.axes?.x?.valueLabels).toEqual(["Visit", "Lead", "Buy"]);
    expect(config?.data).toEqual({
      Actual: [
        { x: 0, y: 100, custom: { seriesIndex: 0, dataIndex: 0 } },
        { x: 1, y: 64, custom: { seriesIndex: 0, dataIndex: 1 } },
        { x: 2, y: 24, custom: { seriesIndex: 0, dataIndex: 2 } }
      ],
      Goal: [
        { x: 0, y: 100, custom: { seriesIndex: 1, dataIndex: 0 } },
        { x: 1, y: 76, custom: { seriesIndex: 1, dataIndex: 1 } },
        { x: 2, y: 34, custom: { seriesIndex: 1, dataIndex: 2 } }
      ]
    });
  });

  it("converts boxplot series to Chart2Music box data", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", "B"] },
      series: [{ type: "boxplot", data: [[4, 7, 10, 14, 18], [6, 9, 12, 16, 21]] }]
    });

    expect(config?.type).toBe("box");
    expect(config?.axes?.x?.valueLabels).toEqual(["A", "B"]);
    expect(config?.data).toEqual([
      {
        x: 0,
        low: 4,
        q1: 7,
        median: 10,
        q3: 14,
        high: 18,
        custom: { seriesIndex: 0, dataIndex: 0 }
      },
      {
        x: 1,
        low: 6,
        q1: 9,
        median: 12,
        q3: 16,
        high: 21,
        custom: { seriesIndex: 0, dataIndex: 1 }
      }
    ]);
  });

  it("adds scatter overlay values as boxplot outliers", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", "B"] },
      series: [
        { name: "Distribution", type: "boxplot", data: [[4, 7, 10, 14, 18], [6, 9, 12, 16, 21]] },
        { name: "Outliers", type: "scatter", data: [[0, 24], [1, 3], [1, 27]] }
      ]
    });

    expect(config?.type).toBe("box");
    expect(config?.data).toEqual([
      {
        x: 0,
        low: 4,
        q1: 7,
        median: 10,
        q3: 14,
        high: 18,
        outlier: [24],
        custom: { seriesIndex: 0, dataIndex: 0 }
      },
      {
        x: 1,
        low: 6,
        q1: 9,
        median: 12,
        q3: 16,
        high: 21,
        outlier: [3, 27],
        custom: { seriesIndex: 0, dataIndex: 1 }
      }
    ]);
  });

  it("converts candlestick series to Chart2Music OHLC data", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["Mon", "Tue"] },
      series: [{ type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36]] }]
    });

    expect(config?.type).toBe("candlestick");
    expect(config?.axes?.x?.valueLabels).toEqual(["Mon", "Tue"]);
    expect(config?.data).toEqual([
      {
        x: 0,
        open: 20,
        close: 34,
        low: 10,
        high: 38,
        custom: { seriesIndex: 0, dataIndex: 0 }
      },
      {
        x: 1,
        open: 34,
        close: 30,
        low: 28,
        high: 36,
        custom: { seriesIndex: 0, dataIndex: 1 }
      }
    ]);
  });

  it("combines candlestick and volume bar series into one Chart2Music chart", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: [
        { data: ["Mon", "Tue"] },
        { data: ["Mon", "Tue"], gridIndex: 1 }
      ],
      yAxis: [{ scale: true }, { gridIndex: 1 }],
      series: [
        { name: "OHLC", type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36]] },
        { name: "Volume", type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: [120, 92] }
      ]
    });

    expect(config?.type).toEqual(["candlestick", "bar"]);
    expect(config?.axes?.x?.valueLabels).toEqual(["Mon", "Tue"]);
    expect(config?.data).toEqual({
      OHLC: [
        {
          x: 0,
          open: 20,
          close: 34,
          low: 10,
          high: 38,
          custom: { seriesIndex: 0, dataIndex: 0 }
        },
        {
          x: 1,
          open: 34,
          close: 30,
          low: 28,
          high: 36,
          custom: { seriesIndex: 0, dataIndex: 1 }
        }
      ],
      Volume: [
        { x: 0, y: 120, custom: { seriesIndex: 1, dataIndex: 0 } },
        { x: 1, y: 92, custom: { seriesIndex: 1, dataIndex: 1 } }
      ]
    });
  });

  it("converts candlestick marks to Chart2Music annotations", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["Mon", "Tue", "Wed"] },
      yAxis: { scale: true },
      series: [
        {
          type: "candlestick",
          data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 42, 29, 45]],
          markPoint: { data: [{ type: "max", name: "High" }, { type: "min", name: "Low" }] },
          markLine: { data: [{ yAxis: 36, name: "Reference" }] }
        }
      ]
    });

    expect(config?.info?.annotations).toEqual([
      { x: 2, label: "High annotation at Wed, y 45" },
      { x: 0, label: "Low annotation at Mon, y 10" },
      { x: 0, label: "Reference reference line at y 36" }
    ]);
  });

  it("merges caller-provided Chart2Music info with generated ECharts annotations", () => {
    const config = echartsOptionToChart2MusicConfig(
      {
        xAxis: { data: ["Mon", "Tue"] },
        series: [
          {
            type: "line",
            data: [4, 8],
            markLine: { data: [{ yAxis: 6, name: "Goal" }] }
          }
        ]
      },
      {
        info: {
          notes: ["Source: quarterly forecast"],
          annotations: [{ x: 1, label: "Provided note at Tue" }]
        }
      }
    );

    expect(config?.info).toEqual({
      notes: ["Source: quarterly forecast"],
      annotations: [
        { x: 1, label: "Provided note at Tue" },
        { x: 0, label: "Goal reference line at y 6" }
      ]
    });
  });

  it("converts sunburst data to Chart2Music treemap hierarchy data", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          name: "Root",
          type: "sunburst",
          data: [
            {
              name: "A",
              value: 10,
              children: [
                { name: "A1", value: 4 },
                { name: "A2", value: 6 }
              ]
            },
            { name: "B", value: 8 }
          ]
        }
      ]
    });

    expect(config?.type).toBe("treemap");
    expect(config?.options?.root).toBe("Root");
    expect(config?.axes?.x?.valueLabels).toEqual(["A", "A1", "A2", "B"]);
    expect(config?.data).toEqual({
      Root: [
        { x: 0, y: 10, children: "A", custom: { seriesIndex: 0, dataIndex: 0, name: "A" } },
        { x: 3, y: 8, custom: { seriesIndex: 0, dataIndex: 1, name: "B" } }
      ],
      A: [
        { x: 1, y: 4, custom: { seriesIndex: 0, dataIndex: 0, name: "A1" } },
        { x: 2, y: 6, custom: { seriesIndex: 0, dataIndex: 1, name: "A2" } }
      ]
    });
  });

  it("preserves an explicit null Chart2Music root option for hierarchy charts", () => {
    const config = echartsOptionToChart2MusicConfig(
      {
        series: [
          {
            name: "Root",
            type: "sunburst",
            data: [{ name: "A", value: 10 }]
          }
        ]
      },
      {
        options: {
          root: null
        }
      }
    );

    expect(config?.options?.root).toBeNull();
  });

  it("converts tree data to Chart2Music treemap hierarchy data", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          type: "tree",
          data: [
            {
              name: "All",
              children: [
                { name: "Alpha", value: 12 },
                {
                  name: "Beta",
                  children: [{ name: "Beta 1" }, { name: "Beta 2" }]
                }
              ]
            }
          ]
        }
      ]
    });

    expect(config?.type).toBe("treemap");
    expect(config?.options?.root).toBe("All");
    expect(config?.axes?.x?.valueLabels).toEqual(["Alpha", "Beta", "Beta 1", "Beta 2"]);
    expect(config?.data).toEqual({
      All: [
        { x: 0, y: 12, custom: { seriesIndex: 0, dataIndex: 0, name: "Alpha" } },
        { x: 1, y: 2, children: "Beta", custom: { seriesIndex: 0, dataIndex: 1, name: "Beta" } }
      ],
      Beta: [
        { x: 2, y: 1, custom: { seriesIndex: 0, dataIndex: 0, name: "Beta 1" } },
        { x: 3, y: 1, custom: { seriesIndex: 0, dataIndex: 1, name: "Beta 2" } }
      ]
    });
  });

  it("converts treemap data to Chart2Music treemap hierarchy data", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          name: "Portfolio",
          type: "treemap",
          data: [
            {
              name: "Hardware",
              value: 42,
              children: [
                { name: "Sensors", value: [18, 82] },
                { name: "Displays", value: 14 }
              ]
            },
            { name: "Services", value: 22 }
          ]
        }
      ]
    });

    expect(config?.type).toBe("treemap");
    expect(config?.options?.root).toBe("Portfolio");
    expect(config?.axes?.x?.valueLabels).toEqual(["Hardware", "Sensors", "Displays", "Services"]);
    expect(config?.data).toEqual({
      Portfolio: [
        { x: 0, y: 42, children: "Hardware", custom: { seriesIndex: 0, dataIndex: 0, name: "Hardware" } },
        { x: 3, y: 22, custom: { seriesIndex: 0, dataIndex: 1, name: "Services" } }
      ],
      Hardware: [
        { x: 1, y: 18, custom: { seriesIndex: 0, dataIndex: 0, name: "Sensors" } },
        { x: 2, y: 14, custom: { seriesIndex: 0, dataIndex: 1, name: "Displays" } }
      ]
    });
  });

  it("converts cartesian heatmap data to Chart2Music matrix groups", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { type: "category", data: ["A", "B"] },
      yAxis: { type: "category", data: ["Row 1", "Row 2"] },
      series: [{ type: "heatmap", data: [[0, 0, 5], [1, 0, 8], [0, 1, 3]] }]
    });

    expect(config?.type).toBe("matrix");
    expect(config?.axes?.x?.valueLabels).toEqual(["A", "B"]);
    expect(config?.data).toEqual({
      "Row 1": [
        { x: 0, y2: 5, custom: { seriesIndex: 0, dataIndex: 0 } },
        { x: 1, y2: 8, custom: { seriesIndex: 0, dataIndex: 1 } }
      ],
      "Row 2": [{ x: 0, y2: 3, custom: { seriesIndex: 0, dataIndex: 2 } }]
    });
  });

  it("converts calendar heatmap data to a single Chart2Music matrix group", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          name: "Calendar",
          type: "heatmap",
          coordinateSystem: "calendar",
          data: [["2026-01-01", 10], ["2026-01-02", 15]]
        }
      ]
    });

    expect(config?.type).toBe("matrix");
    expect(config?.axes?.x?.valueLabels).toEqual(["2026-01-01", "2026-01-02"]);
    expect(config?.data).toEqual({
      Calendar: [
        { x: 0, y2: 10, custom: { seriesIndex: 0, dataIndex: 0 } },
        { x: 1, y2: 15, custom: { seriesIndex: 0, dataIndex: 1 } }
      ]
    });
  });

  it("converts ECharts line marks into Chart2Music annotations", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      yAxis: {},
      series: [
        {
          type: "line",
          data: [18, 21, 25, 19, 28, 24],
          markLine: { data: [{ type: "average", name: "Avg" }] },
          markArea: { data: [[{ xAxis: "Mar" }, { xAxis: "Apr" }]] }
        }
      ]
    });

    expect(config?.info?.annotations).toEqual([
      { x: 0, label: "Avg reference line at y 22.5" },
      { x: 2, label: "start of marked area, Mar to Apr" },
      { x: 3, label: "end of marked area, Mar to Apr" }
    ]);
  });

  it("reports when no selectable series are available", () => {
    const errorCallback = vi.fn();

    const missingSeries = echartsOptionToChart2MusicConfig({}, { errorCallback });
    const outOfRangeSeries = echartsOptionToChart2MusicConfig(
      {
        series: [{ type: "bar", data: [1] }]
      },
      {
        errorCallback,
        seriesIndex: 5
      }
    );

    expect(missingSeries).toBeNull();
    expect(outOfRangeSeries).toBeNull();
    expect(errorCallback).toHaveBeenCalledTimes(2);
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("no series"));
  });

  it("handles alternate ECharts data shapes and filters malformed points", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["A", 2, { text: "ignored" }] },
      series: [
        {
          type: "scatter",
          data: [
            ["Named", 7],
            { name: "Object name", value: ["Label x", 9] },
            { value: [3, Number.NaN] },
            { value: ["Missing y"] },
            "bad"
          ]
        }
      ]
    });

    expect(config?.axes?.x?.valueLabels).toEqual(["A", "2"]);
    expect(config?.data).toEqual([
      { x: 0, y: 7, label: "Named", custom: { seriesIndex: 0, dataIndex: 0 } },
      { x: 1, y: 9, label: "Label x", custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
  });

  it("handles mark annotation fallbacks and malformed mark entries gracefully", () => {
    const config = echartsOptionToChart2MusicConfig({
      xAxis: { data: ["Jan", "Feb", "Mar"] },
      series: [
        {
          type: "line",
          data: [
            { value: 4 },
            { value: [1, 8] },
            { value: Number.NaN }
          ],
          markPoint: {
            data: [
              null,
              { xAxis: 1, yAxis: 8 },
              { type: "average" },
              { type: "min" }
            ]
          },
          markLine: {
            data: [
              null,
              { type: "max" },
              { type: "min" },
              { type: "median" },
              { xAxis: "Missing", name: "Named line" }
            ]
          },
          markArea: {
            data: [
              null,
              [{ xAxis: "Jan" }],
              [{ xAxis: "Jan" }, null],
              [{ name: "Window", xAxis: "Jan" }, { xAxis: "Mar" }],
              [{ xAxis: "Missing" }, { xAxis: "Mar" }]
            ]
          }
        }
      ]
    });

    expect(config?.info?.annotations).toEqual([
      { x: 1, label: "Reference point annotation at Feb, y 8" },
      { x: 0, label: "min annotation at Jan, y 4" },
      { x: 0, label: "max reference line at y 8" },
      { x: 0, label: "min reference line at y 4" },
      { x: 0, label: "median reference line" },
      { x: 0, label: "Named line reference line" },
      { x: 0, label: "Window: start of marked area, Jan to Mar" },
      { x: 2, label: "Window: end of marked area, Jan to Mar" }
    ]);
  });

  it("uses fallback hierarchy names, unique duplicate group names, and fallback leaf values", () => {
    const config = echartsOptionToChart2MusicConfig({
      series: [
        {
          type: "tree",
          data: [
            {
              children: [
                {
                  name: "Branch",
                  children: [
                    { name: "Leaf" },
                    { name: "Leaf" }
                  ]
                },
                {
                  name: "Branch",
                  children: [{}, null, []]
                }
              ]
            }
          ]
        }
      ]
    });

    expect(config?.options?.root).toBe("Series 1");
    expect(config?.axes?.x?.valueLabels).toEqual(["Branch", "Leaf", "Item 1"]);
    expect(config?.data).toEqual({
      "Series 1": [
        { x: 0, y: 2, children: "Branch", custom: { seriesIndex: 0, dataIndex: 0, name: "Branch" } },
        { x: 0, y: 1, children: "Branch 2", custom: { seriesIndex: 0, dataIndex: 1, name: "Branch" } }
      ],
      Branch: [
        { x: 1, y: 1, custom: { seriesIndex: 0, dataIndex: 0, name: "Leaf" } },
        { x: 1, y: 1, custom: { seriesIndex: 0, dataIndex: 1, name: "Leaf" } }
      ],
      "Branch 2": [
        { x: 2, y: 1, custom: { seriesIndex: 0, dataIndex: 0, name: "Item 1" } }
      ]
    });
  });

  it("filters malformed funnel, boxplot, candlestick, and heatmap values", () => {
    const funnel = echartsOptionToChart2MusicConfig({
      series: [{ type: "funnel", data: [{ name: "Visit", value: 100 }, { name: "Bad", value: "nope" }, null] }]
    });
    const boxplot = echartsOptionToChart2MusicConfig({
      series: [{ type: "boxplot", data: [[1, 2, 3, 4], [2, 4, 6, 8, 10]] }]
    });
    const candlestick = echartsOptionToChart2MusicConfig({
      series: [{ type: "candlestick", data: [[1, 2, 3], [2, 4, 1, 5]] }]
    });
    const heatmap = echartsOptionToChart2MusicConfig({
      yAxis: { data: ["Row 1"] },
      series: [
        {
          type: "heatmap",
          data: [
            null,
            [0, 0, "bad"],
            [{ bad: true }, 0, 4],
            [0, "Missing", 6],
            ["A", "Row 1", 8]
          ]
        }
      ]
    });

    expect(funnel?.data).toEqual([{ x: 0, y: 100, custom: { seriesIndex: 0, dataIndex: 0 } }]);
    expect(boxplot?.data).toEqual([
      { x: 1, low: 2, q1: 4, median: 6, q3: 8, high: 10, custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
    expect(candlestick?.data).toEqual([
      { x: 1, open: 2, close: 4, low: 1, high: 5, custom: { seriesIndex: 0, dataIndex: 1 } }
    ]);
    expect(heatmap?.axes?.x?.valueLabels).toEqual(["A"]);
    expect(heatmap?.data).toEqual({
      "Row 1": [{ x: 0, y2: 8, custom: { seriesIndex: 0, dataIndex: 4 } }]
    });
  });

  it("reports unsupported series types", () => {
    const errorCallback = vi.fn();
    const config = echartsOptionToChart2MusicConfig(
      {
        series: [{ type: "radar", data: [1, 2] }]
      },
      { errorCallback }
    );

    expect(config).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("radar"));
  });

  it("does not let an unselected unsupported series block a selected supported series", () => {
    const errorCallback = vi.fn();
    const config = echartsOptionToChart2MusicConfig(
      {
        xAxis: { data: ["A", "B"] },
        radar: { indicator: [{ name: "Speed" }, { name: "Power" }] },
        series: [
          { type: "radar", data: [{ value: [80, 70], name: "Profile" }] },
          { name: "Revenue", type: "bar", data: [4, 8] }
        ]
      },
      {
        errorCallback,
        seriesIndex: 1
      }
    );

    expect(errorCallback).not.toHaveBeenCalled();
    expect(config?.type).toBe("bar");
    expect(config?.data).toEqual([
      { x: 0, y: 4, custom: { seriesIndex: 1, dataIndex: 0 } },
      { x: 1, y: 8, custom: { seriesIndex: 1, dataIndex: 1 } }
    ]);
  });

  it("reports an unsupported series when it is selected explicitly", () => {
    const errorCallback = vi.fn();
    const config = echartsOptionToChart2MusicConfig(
      {
        xAxis: { data: ["A", "B"] },
        series: [
          { name: "Revenue", type: "bar", data: [4, 8] },
          { type: "radar", data: [{ value: [80, 70], name: "Profile" }] }
        ]
      },
      {
        errorCallback,
        seriesIndex: 1
      }
    );

    expect(config).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("radar"));
  });
});
