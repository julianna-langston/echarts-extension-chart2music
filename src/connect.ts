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
  handleStyle?: Record<string, unknown>;
  showDetail?: boolean;
};

const STACKED_TOTAL_OVERLAY_ID = "__chart2music_stacked_total_overlay__";

const isInternalSeries = (series: unknown) =>
  Boolean(
    series &&
      typeof series === "object" &&
      (series as Record<string, unknown>).id === STACKED_TOTAL_OVERLAY_ID
  );

const publicOption = (option: Record<string, unknown>) => {
  const sourceSeries = option.series;
  const series = asArray(sourceSeries as Record<string, unknown> | Record<string, unknown>[]);
  const visibleSeries = series.filter((item) => !isInternalSeries(item));

  if (visibleSeries.length === series.length) {
    return option;
  }

  return {
    ...option,
    series: Array.isArray(sourceSeries) ? visibleSeries : (visibleSeries[0] ?? [])
  };
};

const numericBarValue = (value: unknown): number | null => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return numericBarValue(value[value.length - 1]);
  }
  if (value && typeof value === "object") {
    return numericBarValue((value as Record<string, unknown>).value);
  }
  return null;
};

const addStackedTotalOverlay = (chart: EChartsType, option: Record<string, unknown>, stacked: boolean) => {
  if (!stacked) {
    return undefined;
  }

  const series = asArray(option.series as Record<string, unknown> | Record<string, unknown>[]);
  const stackedBars = series.filter((item) => {
    if (item?.type !== "bar" || (typeof item?.stack !== "string" && typeof item?.stack !== "number")) {
      return false;
    }
    const itemStyle = item.itemStyle as Record<string, unknown> | undefined;
    return itemStyle?.opacity !== 0 && itemStyle?.color !== "transparent";
  });
  const length = Math.max(0, ...stackedBars.map((item) => asArray(item.data).length));

  if (stackedBars.length < 2 || length === 0) {
    return undefined;
  }

  const overlay = {
    id: STACKED_TOTAL_OVERLAY_ID,
    type: "bar",
    data: Array.from({ length }, (_item, dataIndex) =>
      stackedBars.reduce((total, item) => total + (numericBarValue(asArray(item.data)[dataIndex]) ?? 0), 0)
    ),
    silent: true,
    tooltip: { show: false },
    legendHoverLink: false,
    barGap: "-100%",
    z: 10,
    itemStyle: {
      color: "rgba(0, 0, 0, 0)",
      borderColor: "transparent",
      borderWidth: 0
    },
    emphasis: {
      itemStyle: {
        color: "rgba(0, 0, 0, 0)",
        borderColor: "#000",
        borderWidth: 2
      }
    }
  };

  chart.setOption({ series: [...series, overlay] });
  return { seriesIndex: series.length };
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
  const series = asArray(option.series as Record<string, unknown> | Record<string, unknown>[]).filter(
    (item) => !isInternalSeries(item)
  );
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
    })
  });
};

const toPercentValue = (value: unknown, fallback: number) => {
  return typeof value === "number" && !Number.isNaN(value) ? Math.min(100, Math.max(0, value)) : fallback;
};

const setRangeAria = (input: HTMLInputElement) => {
  input.setAttribute("aria-valuemin", input.min);
  input.setAttribute("aria-valuemax", input.max);
  input.setAttribute("aria-valuenow", input.value);
};

const createZoomRangeBridge = (chart: EChartsType) => {
  const option = chart.getOption() as Record<string, unknown>;
  const zooms = asArray(option.dataZoom as DataZoomOption | DataZoomOption[] | undefined);
  const zoomIndex = zooms.findIndex((zoom) => zoom?.type === "slider");
  const zoom = zoomIndex >= 0 ? zooms[zoomIndex] : undefined;

  if (!zoom) {
    return () => undefined;
  }

  const chartElement = chart.getDom();
  const previousPosition = chartElement.style.position;
  if (!previousPosition) {
    chartElement.style.position = "relative";
  }

  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", "Chart zoom range");
  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.zIndex = "0";
  wrapper.style.pointerEvents = "none";

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
    input.style.bottom = typeof zoom.bottom === "number" ? `${zoom.bottom}px` : (zoom.bottom ?? "10px");
    input.style.height = typeof zoom.height === "number" ? `${zoom.height}px` : (zoom.height ?? "24px");
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    setRangeAria(input);
    return input;
  };

  const startInput = makeInput("start", toPercentValue(zoom.start, 0));
  const endInput = makeInput("end", toPercentValue(zoom.end, 100));
  wrapper.append(startInput, endInput);
  chartElement.append(wrapper);

  const updateChartZoom = () => {
    const start = Math.min(Number(startInput.value), Number(endInput.value));
    const end = Math.max(Number(startInput.value), Number(endInput.value));
    startInput.value = String(start);
    endInput.value = String(end);
    setRangeAria(startInput);
    setRangeAria(endInput);
    chart.dispatchAction({
      type: "dataZoom",
      dataZoomIndex: zoomIndex,
      start,
      end
    });
  };

  const updateFromKeyboard = (input: HTMLInputElement, event: KeyboardEvent) => {
    const step = Number(input.step) || 1;
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const current = Number(input.value);
    const nextValue = {
      ArrowDown: current - step,
      ArrowLeft: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      End: maximum,
      Home: minimum,
      PageDown: current - step * 10,
      PageUp: current + step * 10
    }[event.key];

    if (nextValue === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    input.value = String(Math.min(maximum, Math.max(minimum, nextValue)));
    updateChartZoom();
  };

  const syncFromChart = () => {
    const nextOption = chart.getOption() as Record<string, unknown>;
    const nextZoom = asArray(nextOption.dataZoom as DataZoomOption | DataZoomOption[] | undefined)[zoomIndex];
    if (!nextZoom) {
      return;
    }
    startInput.value = String(Math.round(toPercentValue(nextZoom.start, Number(startInput.value))));
    endInput.value = String(Math.round(toPercentValue(nextZoom.end, Number(endInput.value))));
    setRangeAria(startInput);
    setRangeAria(endInput);
  };

  const initialHandleStyle = zoom.handleStyle ?? {};
  const initialShowDetail = zoom.showDetail;
  const setFocusedStyle = (focused: boolean) => {
    const currentZooms = asArray(
      (chart.getOption() as Record<string, unknown>).dataZoom as DataZoomOption | DataZoomOption[] | undefined
    );
    const nextZooms = currentZooms.map((item, index) =>
      index === zoomIndex
        ? {
            ...item,
            showDetail: focused ? true : initialShowDetail,
            handleStyle: focused
              ? {
                  ...initialHandleStyle,
                  borderColor: "#18212f",
                  shadowBlur: 6,
                  shadowColor: "rgba(24, 33, 47, 0.35)"
                }
              : initialHandleStyle
          }
        : item
    );
    chart.setOption({ dataZoom: nextZooms });
  };

  startInput.addEventListener("input", updateChartZoom);
  endInput.addEventListener("input", updateChartZoom);
  startInput.addEventListener("keydown", (event) => updateFromKeyboard(startInput, event));
  endInput.addEventListener("keydown", (event) => updateFromKeyboard(endInput, event));
  startInput.addEventListener("focus", () => setFocusedStyle(true));
  endInput.addEventListener("focus", () => setFocusedStyle(true));
  startInput.addEventListener("blur", () => setFocusedStyle(false));
  endInput.addEventListener("blur", () => setFocusedStyle(false));
  chart.on("datazoom", syncFromChart);

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
  previous?: HighlightState,
  totalOverlay?: { seriesIndex: number }
) => {
  const current = c2m.getCurrent();
  const custom = current.point?.custom;

  if (current.group === "All" && totalOverlay) {
    const dataIndex =
      typeof current.point?.x === "number"
        ? current.point.x
        : custom && typeof custom === "object" && typeof (custom as { dataIndex?: unknown }).dataIndex === "number"
          ? (custom as { dataIndex: number }).dataIndex
          : undefined;
    const pointKey = `All:${totalOverlay.seriesIndex}:${dataIndex}`;

    if (dataIndex === undefined || pointKey === previous?.key) {
      return previous;
    }

    chart.dispatchAction({
      type: "downplay",
      seriesIndex: previous?.seriesIndex ?? totalOverlay.seriesIndex
    });
    chart.dispatchAction({
      type: "highlight",
      seriesIndex: totalOverlay.seriesIndex,
      dataIndex
    });
    chart.dispatchAction({
      type: "showTip",
      xAxisIndex: 0,
      dataIndex
    });
    return { key: pointKey, seriesIndex: totalOverlay.seriesIndex };
  }

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
  const initialOption = publicOption(chart.getOption() as Record<string, unknown>);
  const config = echartsOptionToChart2MusicConfig(initialOption, options);

  if (!config) {
    return null;
  }

  config.element = chart.getDom();
  config.cc = makeCCElement(chart, options.cc);
  const userOnFocusCallback = config.options?.onFocusCallback;
  const totalOverlay = addStackedTotalOverlay(chart, initialOption, config.options?.stack === true);
  let lastHighlightedPoint: HighlightState | undefined;
  config.options = {
    ...config.options,
    onFocusCallback: (point) => {
      if (connection) {
        syncTreemapViewRoot(chart, connection.c2m);
        lastHighlightedPoint = highlightCurrentPoint(
          chart,
          connection.c2m,
          lastHighlightedPoint,
          totalOverlay
        );
      }
      userOnFocusCallback?.(point);
    }
  };

  const { err, data } = c2mChart({
    ...config,
    data: normalizeOpenCloseData(config.data) as C2MChartConfig["data"]
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
  const cleanUpZoomRangeBridge = createZoomRangeBridge(chart);

  connection = {
    chart,
    c2m: data,
    update: () => {
      if (disposed) {
        return;
      }
      const nextOption = publicOption(chart.getOption() as Record<string, unknown>);
      const nextDataSnapshot = createDataSnapshot(nextOption);
      if (nextDataSnapshot === lastDataSnapshot) {
        return;
      }

      const nextConfig = echartsOptionToChart2MusicConfig(nextOption, options);
      if (nextConfig) {
        data.setData(nextConfig.data, nextConfig.axes);
        lastDataSnapshot = nextDataSnapshot;
      }
    },
    dispose: () => {
      disposed = true;
      chart.off("finished", connection?.update);
      cleanUpZoomRangeBridge();
      data.cleanUp();
    }
  };

  chart.on("finished", connection.update);

  return connection;
};

export const connect = createEChartsMusic;
