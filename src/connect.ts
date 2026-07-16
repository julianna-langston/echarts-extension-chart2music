import c2mChart from "chart2music";
import type { EChartsType } from "echarts/core";
import type { C2MChartConfig } from "chart2music";
import { echartsOptionToChart2MusicConfig } from "./converter.js";
import type { EChartsChart2MusicConnection, EChartsChart2MusicOptions } from "./types.js";

type EChartsTreeNode = {
  name?: string;
  dataIndex?: number;
  children?: EChartsTreeNode[];
};

type DataZoomOption = {
  type?: string;
  start?: number;
  end?: number;
  bottom?: number | string;
  height?: number | string;
  showDetail?: boolean;
};

type ZoomRange = {
  start: number;
  end: number;
  index: number;
};

const makeCCElement = (chart: EChartsType, provided?: HTMLElement | null) => {
  if (provided) {
    return provided;
  }

  const cc = document.createElement("div");
  chart.getDom().insertAdjacentElement("afterend", cc);
  return cc;
};

const normalizeOpenCloseData = (data: unknown): unknown => {
  const normalizePoint = (point: unknown) => {
    if (!point || typeof point !== "object" || Array.isArray(point)) {
      return point;
    }
    const value = point as Record<string, unknown>;
    if (
      typeof value.open === "number" &&
      typeof value.close === "number" &&
      !("low" in value) &&
      !("high" in value)
    ) {
      return {
        ...value,
        low: Math.min(value.open, value.close),
        high: Math.max(value.open, value.close)
      };
    }
    return value;
  };

  if (Array.isArray(data)) {
    return data.map(normalizePoint);
  }
  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([group, points]) => [
        group,
        Array.isArray(points) ? points.map(normalizePoint) : points
      ])
    );
  }
  return data;
};

const createDataSnapshot = (option: Record<string, unknown>) => {
  const series = Array.isArray(option.series) ? option.series : [option.series];
  const xAxis = Array.isArray(option.xAxis) ? option.xAxis : [option.xAxis];

  return JSON.stringify({
    series: series.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const seriesItem = item as Record<string, unknown>;
      return {
        type: seriesItem.type,
        name: seriesItem.name,
        data: seriesItem.data
      };
    }),
    xAxis: xAxis.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      return {
        data: (item as Record<string, unknown>).data
      };
    }),
    dataZoom: asArray(option.dataZoom as DataZoomOption | DataZoomOption[] | undefined).map((zoom) => ({
      type: zoom?.type,
      start: zoom?.start,
      end: zoom?.end
    }))
  });
};

const toPercentValue = (value: unknown, fallback: number) => {
  return typeof value === "number" && !Number.isNaN(value)
    ? Math.min(100, Math.max(0, value))
    : fallback;
};

const getSliderZoomRange = (option: Record<string, unknown>): ZoomRange | null => {
  const zooms = asArray(option.dataZoom as DataZoomOption | DataZoomOption[] | undefined);
  const index = zooms.findIndex((zoom) => zoom?.type === "slider");
  if (index < 0) {
    return null;
  }

  const zoom = zooms[index];
  return {
    index,
    start: toPercentValue(zoom?.start, 0),
    end: toPercentValue(zoom?.end, 100)
  };
};

const dataIndexOf = (point: unknown) => {
  if (!point || typeof point !== "object") {
    return undefined;
  }
  const custom = (point as { custom?: unknown }).custom;
  if (!custom || typeof custom !== "object") {
    return undefined;
  }
  const dataIndex = (custom as { dataIndex?: unknown }).dataIndex;
  return typeof dataIndex === "number" ? dataIndex : undefined;
};

const filterZoomedData = (data: C2MChartConfig["data"], range: ZoomRange) => {
  const groups = Array.isArray(data)
    ? { "Series 1": data }
    : data && typeof data === "object"
      ? data as Record<string, unknown>
      : null;

  if (!groups) {
    return data;
  }

  const points = Object.values(groups).flatMap((group) => Array.isArray(group) ? group : []);
  const indexes = points.map(dataIndexOf).filter((index): index is number => index !== undefined);
  const lastIndex = Math.max(...indexes, -1);
  if (lastIndex < 1) {
    return data;
  }

  const start = Math.floor((Math.min(range.start, range.end) / 100) * lastIndex);
  const end = Math.ceil((Math.max(range.start, range.end) / 100) * lastIndex);
  const filtered = Object.fromEntries(Object.entries(groups).map(([name, group]) => [
    name,
    Array.isArray(group)
      ? group.filter((point) => {
          const index = dataIndexOf(point);
          return index === undefined || (index >= start && index <= end);
        })
      : group
  ]));

  return Array.isArray(data) ? filtered["Series 1"] as C2MChartConfig["data"] : filtered as C2MChartConfig["data"];
};

const setRangeAria = (input: HTMLInputElement) => {
  input.setAttribute("aria-valuemin", input.min);
  input.setAttribute("aria-valuemax", input.max);
  input.setAttribute("aria-valuenow", input.value);
  input.setAttribute("aria-valuetext", `${input.value}%`);
};

const createZoomRangeBridge = (
  chart: EChartsType,
  onRangeChange: (range: ZoomRange) => void
) => {
  const option = chart.getOption() as Record<string, unknown>;
  const initialRange = getSliderZoomRange(option);
  if (!initialRange) {
    return () => undefined;
  }

  const zoom = asArray(option.dataZoom as DataZoomOption | DataZoomOption[] | undefined)[initialRange.index];
  const chartElement = chart.getDom();
  const previousPosition = chartElement.style.position;
  if (!previousPosition) {
    chartElement.style.position = "relative";
  }

  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", "Chart zoom range");
  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.zIndex = "1";
  wrapper.style.pointerEvents = "none";

  const makeIndicator = (color: string) => {
    const indicator = document.createElement("div");
    indicator.style.position = "absolute";
    indicator.style.bottom = typeof zoom?.bottom === "number" ? `${zoom.bottom}px` : (zoom?.bottom ?? "10px");
    indicator.style.width = "14px";
    indicator.style.height = typeof zoom?.height === "number" ? `${zoom.height}px` : (zoom?.height ?? "24px");
    indicator.style.transform = "translateX(-50%)";
    indicator.style.border = `2px solid ${color}`;
    indicator.style.boxSizing = "border-box";
    indicator.style.display = "none";
    wrapper.append(indicator);
    return indicator;
  };

  const makeValueLabel = (color: string) => {
    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.bottom = typeof zoom?.bottom === "number" ? `${zoom.bottom + 28}px` : "38px";
    label.style.transform = "translateX(-50%)";
    label.style.background = "#fff";
    label.style.border = `1px solid ${color}`;
    label.style.color = "#18212f";
    label.style.padding = "2px 4px";
    label.style.fontSize = "12px";
    label.style.display = "none";
    wrapper.append(label);
    return label;
  };

  const makeInput = (kind: "start" | "end", value: number) => {
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = String(Math.round(value));
    input.setAttribute("aria-label", kind === "start" ? "Zoom start" : "Zoom end");
    input.style.position = "absolute";
    input.style.left = "0";
    input.style.right = "0";
    input.style.bottom = typeof zoom?.bottom === "number" ? `${zoom.bottom}px` : (zoom?.bottom ?? "10px");
    input.style.height = typeof zoom?.height === "number" ? `${zoom.height}px` : (zoom?.height ?? "24px");
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    setRangeAria(input);
    wrapper.append(input);
    return input;
  };

  const startInput = makeInput("start", initialRange.start);
  const endInput = makeInput("end", initialRange.end);
  const startIndicator = makeIndicator("#1259a7");
  const endIndicator = makeIndicator("#a13d00");
  const startLabel = makeValueLabel("#1259a7");
  const endLabel = makeValueLabel("#a13d00");
  chartElement.append(wrapper);

  const rangeFromInputs = (): ZoomRange => ({
    index: initialRange.index,
    start: Number(startInput.value),
    end: Number(endInput.value)
  });
  const updateVisuals = () => {
    const start = Number(startInput.value);
    const end = Number(endInput.value);
    startIndicator.style.left = `${start}%`;
    endIndicator.style.left = `${end}%`;
    startLabel.style.left = `${start}%`;
    endLabel.style.left = `${end}%`;
    startLabel.textContent = `${start}%`;
    endLabel.textContent = `${end}%`;
    setRangeAria(startInput);
    setRangeAria(endInput);
  };
  const updateChartZoom = (changed?: "start" | "end") => {
    let start = Number(startInput.value);
    let end = Number(endInput.value);
    if (changed === "start") {
      start = Math.min(start, end);
    } else if (changed === "end") {
      end = Math.max(start, end);
    } else {
      [start, end] = [Math.min(start, end), Math.max(start, end)];
    }
    startInput.value = String(start);
    endInput.value = String(end);
    updateVisuals();
    const range = rangeFromInputs();
    chart.dispatchAction({ type: "dataZoom", dataZoomIndex: range.index, start: range.start, end: range.end });
    onRangeChange(range);
  };
  const syncFromChart = () => {
    const range = getSliderZoomRange(chart.getOption() as Record<string, unknown>);
    if (!range) {
      return;
    }
    startInput.value = String(Math.round(range.start));
    endInput.value = String(Math.round(range.end));
    updateVisuals();
    onRangeChange(rangeFromInputs());
  };
  const updateFromKeyboard = (input: HTMLInputElement, event: KeyboardEvent) => {
    const step = Number(input.step) || 1;
    const current = Number(input.value);
    const next = ({
      ArrowDown: current - step,
      ArrowLeft: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      Home: 0,
      End: 100,
      PageDown: current - step * 10,
      PageUp: current + step * 10
    } as Record<string, number | undefined>)[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    input.value = String(Math.min(100, Math.max(0, next)));
    updateChartZoom(input === startInput ? "start" : "end");
  };
  const setFocused = (kind: "start" | "end", focused: boolean) => {
    const indicator = kind === "start" ? startIndicator : endIndicator;
    const label = kind === "start" ? startLabel : endLabel;
    indicator.style.display = focused ? "block" : "none";
    label.style.display = focused ? "block" : "none";
  };

  startInput.addEventListener("input", () => updateChartZoom("start"));
  endInput.addEventListener("input", () => updateChartZoom("end"));
  startInput.addEventListener("keydown", (event) => updateFromKeyboard(startInput, event));
  endInput.addEventListener("keydown", (event) => updateFromKeyboard(endInput, event));
  startInput.addEventListener("focus", () => setFocused("start", true));
  endInput.addEventListener("focus", () => setFocused("end", true));
  startInput.addEventListener("blur", () => setFocused("start", false));
  endInput.addEventListener("blur", () => setFocused("end", false));
  chart.on("datazoom", syncFromChart);
  updateVisuals();

  return () => {
    chart.off("datazoom", syncFromChart);
    wrapper.remove();
    chartElement.style.position = previousPosition;
  };
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const seriesName = (series: Record<string, unknown>, index: number) => {
  return typeof series.name === "string" && series.name ? series.name : `Series ${index + 1}`;
};

const getSeriesItem = (chart: EChartsType, seriesIndex: number) => {
  const option = chart.getOption() as Record<string, unknown>;
  const series = asArray(option.series as Record<string, unknown> | Record<string, unknown>[]);
  return series[seriesIndex];
};

const getTreeRoot = (chart: EChartsType, seriesIndex: number) => {
  const echartsModel = chart as unknown as {
    getModel?: () => {
      getSeriesByIndex?: (index: number) => {
        getData?: () => { tree?: { root?: EChartsTreeNode } };
      };
    };
  };

  return echartsModel.getModel?.().getSeriesByIndex?.(seriesIndex)?.getData?.().tree?.root;
};

const isHierarchySeries = (seriesItem: Record<string, unknown> | undefined) => {
  return seriesItem?.type === "sunburst" || seriesItem?.type === "tree" || seriesItem?.type === "treemap";
};

type HighlightState = {
  key: string;
  seriesIndex: number;
};

const highlightCurrentPoint = (
  chart: EChartsType,
  c2m: EChartsChart2MusicConnection["c2m"],
  previous?: HighlightState
) => {
  const current = c2m.getCurrent();
  const custom = current.point?.custom;

  if (!custom || typeof custom !== "object") {
    return previous;
  }

  const { seriesIndex: pointSeriesIndex, dataIndex: pointDataIndex, name, outlierIndexes } = custom as {
    seriesIndex?: number;
    dataIndex?: number;
    name?: string;
    outlierIndexes?: Array<{ seriesIndex: number; dataIndex: number }>;
  };
  if (pointSeriesIndex === undefined || pointDataIndex === undefined) {
    return previous;
  }
  const outlierIndex = (c2m as unknown as { _outlierIndex?: number })._outlierIndex;
  const outlierTarget = current.stat === "outlier" && typeof outlierIndex === "number"
    ? outlierIndexes?.[outlierIndex]
    : undefined;
  const seriesIndex = outlierTarget?.seriesIndex ?? pointSeriesIndex;
  const dataIndex = outlierTarget?.dataIndex ?? pointDataIndex;
  const seriesItem = getSeriesItem(chart, seriesIndex);
  const hierarchyNode =
    name && isHierarchySeries(seriesItem) ? findNodeByName(getTreeRoot(chart, seriesIndex), name) : null;
  const target =
    typeof hierarchyNode?.dataIndex === "number"
      ? { dataIndex: hierarchyNode.dataIndex }
      : name
        ? { name }
        : { dataIndex };
  const pointKey = `${current.group}:${seriesIndex}:${"dataIndex" in target ? target.dataIndex : target.name}`;

  if (pointKey === previous?.key) {
    return previous;
  }

  chart.dispatchAction({
    type: "downplay",
    seriesIndex: previous?.seriesIndex ?? seriesIndex
  });
  chart.dispatchAction({
    type: "highlight",
    seriesIndex,
    ...target
  });
  chart.dispatchAction({
    type: "showTip",
    seriesIndex,
    ...target
  });
  return { key: pointKey, seriesIndex };
};

const findNodeByName = (node: EChartsTreeNode | undefined, name: string): EChartsTreeNode | null => {
  if (!node) {
    return null;
  }

  if (node.name === name) {
    return node;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    const match = findNodeByName(child, name);
    if (match) {
      return match;
    }
  }

  return null;
};

const syncTreemapViewRoot = (
  chart: EChartsType,
  c2m: EChartsChart2MusicConnection["c2m"]
) => {
  const current = c2m.getCurrent();
  const custom = current.point?.custom;
  const seriesIndex =
    custom && typeof custom === "object" && typeof (custom as { seriesIndex?: unknown }).seriesIndex === "number"
      ? (custom as { seriesIndex: number }).seriesIndex
      : 0;
  const seriesItem = getSeriesItem(chart, seriesIndex);

  if (seriesItem?.type !== "treemap") {
    return;
  }

  const root = getTreeRoot(chart, seriesIndex);
  const targetNode =
    current.group === seriesName(seriesItem, seriesIndex) ? root : findNodeByName(root, current.group);

  if (!targetNode) {
    return;
  }

  chart.dispatchAction({
    type: "treemapRootToNode",
    seriesIndex,
    targetNode
  });
};

export const createEChartsMusic = (
  chart: EChartsType,
  options: EChartsChart2MusicOptions = {}
): EChartsChart2MusicConnection | null => {
  let connection: EChartsChart2MusicConnection | null = null;
  const initialOption = chart.getOption() as Record<string, unknown>;
  const config = echartsOptionToChart2MusicConfig(initialOption, options);

  if (!config) {
    return null;
  }

  const initialZoomRange = getSliderZoomRange(initialOption);
  config.element = chart.getDom();
  config.cc = makeCCElement(chart, options.cc);
  const userOnFocusCallback = config.options?.onFocusCallback;
  let lastHighlightedPoint: HighlightState | undefined;
  config.options = {
    ...config.options,
    onFocusCallback: (point) => {
      if (connection) {
        syncTreemapViewRoot(chart, connection.c2m);
        lastHighlightedPoint = highlightCurrentPoint(
          chart,
          connection.c2m,
          lastHighlightedPoint
        );
      }
      userOnFocusCallback?.(point);
    }
  };

  const { err, data } = c2mChart({
    ...config,
    data: normalizeOpenCloseData(
      initialZoomRange ? filterZoomedData(config.data, initialZoomRange) : config.data
    ) as C2MChartConfig["data"]
  });
  if (err) {
    options.errorCallback?.(err);
    return null;
  }
  if (!data) {
    return null;
  }

  let disposed = false;
  let lastDataSnapshot = createDataSnapshot(initialOption);
  let disposeZoomBridge: () => void = () => undefined;

  const updateChart2Music = (range?: ZoomRange, force = false) => {
    if (disposed) {
      return;
    }
    const nextOption = chart.getOption() as Record<string, unknown>;
    const nextDataSnapshot = createDataSnapshot(nextOption);
    if (!force && nextDataSnapshot === lastDataSnapshot) {
      return;
    }

    const nextConfig = echartsOptionToChart2MusicConfig(nextOption, options);
    if (nextConfig) {
      const zoomRange = range ?? getSliderZoomRange(nextOption);
      data.setData(
        zoomRange ? filterZoomedData(nextConfig.data, zoomRange) : nextConfig.data,
        nextConfig.axes
      );
      lastDataSnapshot = nextDataSnapshot;
    }
  };

  connection = {
    chart,
    c2m: data,
    update: updateChart2Music,
    dispose: () => {
      disposed = true;
      chart.off("finished", connection?.update);
      disposeZoomBridge();
      data.cleanUp();
    }
  };

  disposeZoomBridge = createZoomRangeBridge(chart, (range) => updateChart2Music(range, true));
  chart.on("finished", connection.update);

  return connection;
};

export const connect = createEChartsMusic;
