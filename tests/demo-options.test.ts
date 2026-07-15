import { describe, expect, it, vi } from "vitest";
import { echartsOptionToChart2MusicConfig } from "../src/converter";
import { loadDemoExamples } from "./demoExamples";

const { optionsByType, supportedByChart2Music } = loadDemoExamples();
const isSupportedExample = (example: { type: string; category?: string }) => {
  return supportedByChart2Music.has(example.type) && example.category !== "not-supported";
};
const supportedExamples = optionsByType.filter(isSupportedExample);
const visualOnlyExamples = optionsByType.filter((example) => !isSupportedExample(example));
const adapterUnsupportedExamples = visualOnlyExamples.filter((example) => {
  return echartsOptionToChart2MusicConfig(example.option) === null;
});

const chartName = (example: { type: string; title?: string }) => example.title ?? example.type;

const expectedChart2MusicType = (exampleType: string) => {
  switch (exampleType) {
    case "boxplot":
      return "box";
    case "candlestick":
      return "candlestick";
    case "effectScatter":
    case "scatter":
      return "scatter";
    case "funnel":
      return "bar";
    case "heatmap":
      return "matrix";
    case "sunburst":
    case "tree":
    case "treemap":
      return "treemap";
    default:
      return exampleType;
  }
};

describe("demo chart examples", () => {
  it("loads the demo examples from the shared Storybook fixture", () => {
    expect(optionsByType.length).toBeGreaterThan(40);
    expect(supportedExamples.length).toBeGreaterThan(25);
    expect(adapterUnsupportedExamples.length).toBeGreaterThan(10);
    expect(optionsByType.map(chartName)).toContain("treemap: basic");
    expect(optionsByType.map(chartName)).toContain("candlestick: marks and zoom");
    expect(adapterUnsupportedExamples.map((example) => example.type)).toEqual(
      expect.arrayContaining(["gauge", "radar", "sankey"])
    );
  });

  it("marks the slider zoom demo as unsupported", () => {
    const zoomDemo = visualOnlyExamples.find((example) => example.title === "candlestick: marks and zoom");
    const errorCallback = vi.fn();

    expect(zoomDemo && echartsOptionToChart2MusicConfig(zoomDemo.option, { errorCallback })).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining("slider data zoom overlays are not supported"));
  });

  it.each(supportedExamples.map((example) => [chartName(example), example] as const))(
    "converts %s",
    (_name, example) => {
      const errorCallback = vi.fn();
      const config = echartsOptionToChart2MusicConfig(example.option, { errorCallback });

      expect(errorCallback).not.toHaveBeenCalled();
      expect(config).not.toBeNull();
      expect(config?.title).toBe("");
      expect(config?.data).toBeDefined();
      expect(config?.axes).toBeDefined();
    }
  );

  it.each(adapterUnsupportedExamples.map((example) => [chartName(example), example] as const))(
    "reports %s as unsupported",
    (_name, example) => {
      const errorCallback = vi.fn();
      const config = echartsOptionToChart2MusicConfig(example.option, { errorCallback });

      expect(config).toBeNull();
      expect(errorCallback).toHaveBeenCalledWith(expect.stringContaining(example.type));
    }
  );

  it("can convert visual-only demos when their underlying series are supported", () => {
    const convertibleVisualOnlyExamples = visualOnlyExamples.filter((example) => {
      return !adapterUnsupportedExamples.includes(example);
    });

    expect(convertibleVisualOnlyExamples.map(chartName)).toContain("map: geo scatter overlay");
    convertibleVisualOnlyExamples.forEach((example) => {
      expect(echartsOptionToChart2MusicConfig(example.option)).not.toBeNull();
    });
  });

  it("maps each supported demo series family to the expected Chart2Music type", () => {
    const examplesByType = new Map<string, (typeof supportedExamples)[number]>();
    supportedExamples.forEach((example) => {
      examplesByType.set(example.type, example);
    });

    examplesByType.forEach((example, type) => {
      const config = echartsOptionToChart2MusicConfig(example.option);
      const configType = Array.isArray(config?.type) ? config.type[0] : config?.type;

      expect(configType).toBe(expectedChart2MusicType(type));
    });
  });

  it("keeps hierarchy demo points named so focus can target ECharts tree nodes", () => {
    const hierarchyExamples = supportedExamples.filter((example) =>
      ["sunburst", "tree", "treemap"].includes(example.type)
    );

    hierarchyExamples.forEach((example) => {
      const config = echartsOptionToChart2MusicConfig(example.option);
      const groups = config?.data as Record<string, Array<{ custom?: { name?: string } }>>;
      const points = Object.values(groups).flat();

      expect(config?.type).toBe("treemap");
      expect(points.length).toBeGreaterThan(0);
      expect(points.every((point) => typeof point.custom?.name === "string")).toBe(true);
    });
  });

  it("converts demo line marks to Chart2Music annotations", () => {
    const marks = supportedExamples.find((example) => example.title === "line: marks");
    const config = marks ? echartsOptionToChart2MusicConfig(marks.option) : null;

    expect(config?.info?.annotations).toEqual([
      { x: 4, label: "Max annotation at May, y 28" },
      { x: 0, label: "Min annotation at Jan, y 18" },
      { x: 0, label: "Avg reference line at y 22.5" },
      { x: 2, label: "start of marked area, Mar to Apr" },
      { x: 3, label: "end of marked area, Mar to Apr" }
    ]);
  });

  it("exposes the visually hidden Month axis name to Chart2Music", () => {
    const smoothLine = supportedExamples.find((example) => example.title === "line: smooth");

    expect(smoothLine && echartsOptionToChart2MusicConfig(smoothLine.option)?.axes?.x?.label).toBe("Month");
  });

  it("labels the basic bar value axis as Revenue", () => {
    const basicBar = supportedExamples.find((example) => example.title === "bar: basic");

    expect(basicBar && echartsOptionToChart2MusicConfig(basicBar.option)?.axes?.y?.label).toBe("Revenue");
  });

  it("represents demo floating bars as low and high ranges without Chart2Music stacking", () => {
    const floatingRange = supportedExamples.find((example) => example.title === "bar: floating range");
    const stacked = supportedExamples.find((example) => example.title === "bar: stacked");

    expect(floatingRange && echartsOptionToChart2MusicConfig(floatingRange.option)?.options?.stack).toBeUndefined();
    expect(stacked && echartsOptionToChart2MusicConfig(stacked.option)?.options?.stack).toBe(true);
    expect(floatingRange && echartsOptionToChart2MusicConfig(floatingRange.option)?.data).toEqual([
      { x: 0, low: 3, high: 11, custom: { seriesIndex: 1, dataIndex: 0 } },
      { x: 1, low: 5, high: 15, custom: { seriesIndex: 1, dataIndex: 1 } },
      { x: 2, low: 2, high: 8, custom: { seriesIndex: 1, dataIndex: 2 } },
      { x: 3, low: 8, high: 19, custom: { seriesIndex: 1, dataIndex: 3 } },
      { x: 4, low: 6, high: 13, custom: { seriesIndex: 1, dataIndex: 4 } },
      { x: 5, low: 9, high: 22, custom: { seriesIndex: 1, dataIndex: 5 } }
    ]);
  });

  it("uses an axis tooltip for the whole demo stacked-bar column", () => {
    const stacked = supportedExamples.find((example) => example.title === "bar: stacked");

    expect(stacked?.option.tooltip).toEqual({ trigger: "axis", axisPointer: { type: "shadow" } });
  });

  it("represents demo waterfall bars with open and close values", () => {
    const waterfall = supportedExamples.find((example) => example.title === "bar: waterfall");

    expect(waterfall && echartsOptionToChart2MusicConfig(waterfall.option)?.data).toEqual([
      { x: 0, open: 0, close: 20, custom: { seriesIndex: 1, dataIndex: 0 } },
      { x: 1, open: 20, close: 35, custom: { seriesIndex: 1, dataIndex: 1 } },
      { x: 2, open: 35, close: 22, custom: { seriesIndex: 1, dataIndex: 2 } },
      { x: 3, open: 22, close: 17, custom: { seriesIndex: 1, dataIndex: 3 } },
      { x: 4, open: 0, close: 17, custom: { seriesIndex: 1, dataIndex: 4 } }
    ]);
  });

  it("preserves bar and line types in the demo bar-line chart", () => {
    const barLine = supportedExamples.find((example) => example.title === "bar: bar-line");

    expect(barLine && echartsOptionToChart2MusicConfig(barLine.option)?.type).toEqual(["bar", "line"]);
  });

  it("uses the y-axis category labels for demo horizontal bars", () => {
    const horizontal = supportedExamples.find((example) => example.title === "bar: horizontal");
    const config = horizontal ? echartsOptionToChart2MusicConfig(horizontal.option) : null;

    expect(config?.axes?.x?.valueLabels).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
    expect(config?.data).toEqual(expect.arrayContaining([
      { x: 0, y: 8, custom: { seriesIndex: 0, dataIndex: 0 } }
    ]));
  });
});
