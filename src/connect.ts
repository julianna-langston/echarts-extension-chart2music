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
    })
  });
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

  connection = {
    chart,
    c2m: data,
    update: () => {
      if (disposed) {
        return;
      }
      const nextOption = chart.getOption() as Record<string, unknown>;
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
      data.cleanUp();
    }
  };

  chart.on("finished", connection.update);

  return connection;
};

export const connect = createEChartsMusic;
