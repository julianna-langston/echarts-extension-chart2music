import type { C2MChartConfig } from "chart2music";
import type {
  EChartsChart2MusicOptions,
  EChartsMusicBoxPoint,
  EChartsMusicCandlestickPoint,
  EChartsMusicGroupData,
  EChartsMusicMatrixPoint,
  EChartsMusicOpenClosePoint,
  EChartsMusicPoint,
  EChartsMusicRangePoint
} from "./types.js";

type C2MSeriesType = Exclude<NonNullable<C2MChartConfig["type"]>, unknown[]>;
type C2MInfo = NonNullable<C2MChartConfig["info"]>;

const echartsToC2MType: Record<string, C2MSeriesType> = {
  bar: "bar",
  boxplot: "box",
  candlestick: "candlestick",
  effectScatter: "scatter",
  funnel: "bar",
  heatmap: "matrix",
  line: "line",
  pie: "pie",
  scatter: "scatter",
  sunburst: "treemap",
  tree: "treemap",
  treemap: "treemap"
};

const isBubbleSeries = (series: Record<string, unknown> | undefined) => {
  return series?.type === "scatter" &&
    series.coordinateSystem === undefined &&
    typeof series.symbolSize === "function";
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const seriesName = (series: Record<string, unknown>, index: number) => {
  if (series.type === "effectScatter") {
    return typeof series.name === "string" && series.name ? series.name : "Effect";
  }

  return typeof series.name === "string" && series.name ? series.name : `Series ${index + 1}`;
};

const getNumericY = (raw: unknown): number | null => {
  let y: unknown = raw;

  if (Array.isArray(raw)) {
    y = raw.length > 1 ? raw[1] : raw[0];
  } else if (raw && typeof raw === "object") {
    const point = raw as Record<string, unknown>;
    if (Array.isArray(point.value)) {
      y = point.value.length > 1 ? point.value[1] : point.value[0];
    } else if ("value" in point) {
      y = point.value;
    }
  }

  return typeof y === "number" && !Number.isNaN(y) ? y : null;
};

const formatNumber = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
};

const nodeName = (node: Record<string, unknown>, fallback: string) => {
  return typeof node.name === "string" && node.name ? node.name : fallback;
};

const nodeValue = (node: Record<string, unknown>, fallbackLeafValue = 0): number => {
  if (typeof node.value === "number" && !Number.isNaN(node.value)) {
    return node.value;
  }
  if (
    Array.isArray(node.value) &&
    typeof node.value[0] === "number" &&
    !Number.isNaN(node.value[0])
  ) {
    return node.value[0];
  }

  const children = Array.isArray(node.children) ? node.children : [];
  const childTotal = children.reduce((sum, child) => {
    if (!child || typeof child !== "object" || Array.isArray(child)) {
      return sum;
    }

    return sum + nodeValue(child as Record<string, unknown>, fallbackLeafValue);
  }, 0);

  return childTotal || fallbackLeafValue;
};

const readDataPoint = (
  raw: unknown,
  fallbackX: number,
  seriesIndex: number,
  dataIndex: number,
  includePointLabel = true
): EChartsMusicPoint | null => {
  let x = fallbackX;
  let label: string | undefined;
  let y: unknown = raw;

  if (Array.isArray(raw)) {
    x = typeof raw[0] === "number" ? raw[0] : fallbackX;
    label = typeof raw[0] === "string" ? raw[0] : label;
    y = raw.length > 1 ? raw[1] : raw[0];
  } else if (raw && typeof raw === "object") {
    const point = raw as Record<string, unknown>;
    if (typeof point.name === "string") {
      label = point.name;
    }
    if (Array.isArray(point.value)) {
      x = typeof point.value[0] === "number" ? point.value[0] : x;
      label = typeof point.value[0] === "string" ? point.value[0] : label;
      y = point.value.length > 1 ? point.value[1] : point.value[0];
    } else if ("value" in point) {
      y = point.value;
    }
  }

  if (typeof y !== "number" || Number.isNaN(y)) {
    return null;
  }

  return {
    x,
    y,
    ...(includePointLabel && label ? { label } : {}),
    custom: {
      seriesIndex,
      dataIndex
    }
  };
};

const numericArrayFromData = (raw: unknown): number[] | null => {
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>).value
      : raw;

  if (!Array.isArray(value) || !value.every((item) => typeof item === "number" && !Number.isNaN(item))) {
    return null;
  }

  return value;
};

const hasAtLeast = <T, N extends number>(values: T[], count: N): values is T[] & { length: N } => {
  return values.length >= count;
};

const resolveX = (value: unknown, labels: string[]) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const index = labels.indexOf(value);
    return index >= 0 ? index : null;
  }

  return null;
};

const describeX = (x: number, labels: string[]) => {
  return labels[x] ?? String(x);
};

const calculateMarkLineValue = (mark: Record<string, unknown>, data: unknown[]) => {
  if (typeof mark.yAxis === "number") {
    return mark.yAxis;
  }

  const values = data.map(getNumericY).filter((value): value is number => value !== null);
  if (!values.length || typeof mark.type !== "string") {
    return null;
  }

  if (mark.type === "average") {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  if (mark.type === "max") {
    return Math.max(...values);
  }
  if (mark.type === "min") {
    return Math.min(...values);
  }

  return null;
};

const calculateMarkPoint = (mark: Record<string, unknown>, data: unknown[]) => {
  if (typeof mark.xAxis === "number" && typeof mark.yAxis === "number") {
    return { x: mark.xAxis, y: mark.yAxis };
  }

  const points = data
    .map((raw, index) => {
      const values = numericArrayFromData(raw);
      if (values && hasAtLeast(values, 4)) {
        const [open, close, low, high] = values as [number, number, number, number, ...number[]];
        return {
          x: index,
          high: Math.max(open, close, low, high),
          low: Math.min(open, close, low, high),
          y: close
        };
      }

      const y = getNumericY(raw);
      return y === null ? null : { x: index, high: y, low: y, y };
    })
    .filter((point): point is { x: number; high: number; low: number; y: number } => point !== null);

  if (!points.length || typeof mark.type !== "string") {
    return null;
  }

  const firstPoint = points[0];
  if (!firstPoint) {
    return null;
  }

  if (mark.type === "max") {
    return points.reduce((best, point) => (point.high > best.high ? point : best), firstPoint);
  }
  if (mark.type === "min") {
    return points.reduce((best, point) => (point.low < best.low ? point : best), firstPoint);
  }

  return null;
};

const createMarkInfo = (series: Record<string, unknown>[], indexes: number[], labels: string[]) => {
  const annotations: Array<{ x: number; label: string }> = [];

  indexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const data = Array.isArray(item?.data) ? item.data : [];

    const markPoint = item?.markPoint as Record<string, unknown> | undefined;
    const markPointData = Array.isArray(markPoint?.data) ? markPoint.data : [];
    markPointData.forEach((rawMark) => {
      if (!rawMark || typeof rawMark !== "object" || Array.isArray(rawMark)) {
        return;
      }

      const mark = rawMark as Record<string, unknown>;
      const point = calculateMarkPoint(mark, data);
      if (!point) {
        return;
      }

      const name =
        typeof mark.name === "string" && mark.name
          ? mark.name
          : typeof mark.type === "string"
            ? mark.type
            : "Reference point";
      const xLabel = describeX(point.x, labels);
      const yValue = "high" in point && mark.type === "max" ? point.high : "low" in point && mark.type === "min" ? point.low : point.y;
      annotations.push({ x: point.x, label: `${name} annotation at ${xLabel}, y ${formatNumber(yValue)}` });
    });

    const markLine = item?.markLine as Record<string, unknown> | undefined;
    const markLineData = Array.isArray(markLine?.data) ? markLine.data : [];
    markLineData.forEach((rawMark) => {
      if (!rawMark || typeof rawMark !== "object" || Array.isArray(rawMark)) {
        return;
      }

      const mark = rawMark as Record<string, unknown>;
      const x = resolveX(mark.xAxis, labels) ?? 0;
      const name =
        typeof mark.name === "string" && mark.name
          ? mark.name
          : typeof mark.type === "string"
            ? mark.type
            : "Reference line";
      const yValue = calculateMarkLineValue(mark, data);

      annotations.push({
        x,
        label:
          yValue === null
            ? `${name} reference line`
            : `${name} reference line at y ${formatNumber(yValue)}`
      });
    });

    const markArea = item?.markArea as Record<string, unknown> | undefined;
    const markAreaData = Array.isArray(markArea?.data) ? markArea.data : [];
    markAreaData.forEach((rawArea) => {
      if (!Array.isArray(rawArea) || rawArea.length < 2) {
        return;
      }

      const [rawStart, rawEnd] = rawArea;
      if (!rawStart || !rawEnd || typeof rawStart !== "object" || typeof rawEnd !== "object") {
        return;
      }

      const start = rawStart as Record<string, unknown>;
      const end = rawEnd as Record<string, unknown>;
      const startX = resolveX(start.xAxis, labels);
      const endX = resolveX(end.xAxis, labels);

      if (startX === null || endX === null) {
        return;
      }

      const areaName = typeof start.name === "string" && start.name ? `${start.name}: ` : "";
      const range = `${describeX(startX, labels)} to ${describeX(endX, labels)}`;
      annotations.push({ x: startX, label: `${areaName}start of marked area, ${range}` });
      annotations.push({ x: endX, label: `${areaName}end of marked area, ${range}` });
    });
  });

  return annotations.length ? { annotations } : undefined;
};

const getAxisCategoryLabels = (
  axis: Record<string, unknown> | Record<string, unknown>[] | undefined
): string[] => {
  const axes = asArray(axis);
  const firstAxis = axes[0];
  const data = firstAxis?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter((value): value is string | number => {
      return typeof value === "string" || typeof value === "number";
    })
    .map((value) => String(value));
};

const getAxisName = (
  axis: Record<string, unknown> | Record<string, unknown>[] | undefined
): string | undefined => {
  const name = asArray(axis)[0]?.name;
  return typeof name === "string" && name ? name : undefined;
};

const getCategoryLabels = (option: Record<string, unknown>): string[] => {
  return getAxisCategoryLabels(option.xAxis as Record<string, unknown> | Record<string, unknown>[] | undefined);
};

const getDataItemNameLabels = (series: Record<string, unknown> | undefined): string[] => {
  const data = Array.isArray(series?.data) ? series.data : [];
  return data.map((raw) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const name = (raw as Record<string, unknown>).name;
      if (typeof name === "string" || typeof name === "number") {
        return String(name);
      }
    }

    return "";
  });
};

const getTitle = (option: Record<string, unknown>, fallback?: string): string => {
  if (fallback) {
    return fallback;
  }

  const title = asArray(option.title as Record<string, unknown> | Record<string, unknown>[]);
  const text = title[0]?.text;
  return typeof text === "string" ? text : "";
};

const mergeInfo = (
  provided: C2MChartConfig["info"] | undefined,
  generated: C2MChartConfig["info"] | undefined = undefined
): C2MInfo | undefined => {
  const notes = [...(provided?.notes ?? []), ...(generated?.notes ?? [])];
  const annotations = [...(provided?.annotations ?? []), ...(generated?.annotations ?? [])];
  const info: C2MInfo = {};

  if (notes.length) {
    info.notes = notes;
  }
  if (annotations.length) {
    info.annotations = annotations;
  }

  return Object.keys(info).length ? info : undefined;
};

const selectedSeriesIndexes = (
  series: Record<string, unknown>[],
  requested: number | number[] | undefined
) => {
  if (requested === undefined) {
    return series.map((_item, index) => index);
  }
  return asArray(requested).filter((index) => index >= 0 && index < series.length);
};

const isTransparentColor = (color: unknown) => {
  if (typeof color !== "string") {
    return false;
  }

  const normalized = color.trim().toLowerCase();
  return (
    normalized === "transparent" ||
    normalized === "rgba(0,0,0,0)" ||
    normalized === "rgba(0, 0, 0, 0)"
  );
};

const isVisibleSeries = (series: Record<string, unknown>) => {
  const itemStyle = series.itemStyle as Record<string, unknown> | undefined;

  if (itemStyle?.opacity === 0) {
    return false;
  }

  return !isTransparentColor(itemStyle?.color);
};

const isStackedBar = (series: Record<string, unknown>[], indexes: number[]) => {
  const selected = indexes.map((index) => series[index]);
  const stacks = new Map<string | number, number>();

  selected.forEach((item) => {
    if (item?.type !== "bar" || !isVisibleSeries(item)) {
      return;
    }

    const stack = item.stack;
    const hasStack = (typeof stack === "string" && stack.length > 0) || typeof stack === "number";
    if (!hasStack) {
      return;
    }

    stacks.set(stack, (stacks.get(stack) ?? 0) + 1);
  });

  return [...stacks.values()].some((count) => count > 1);
};

const floatingBarHelper = (
  series: Record<string, unknown>[],
  seriesIndex: number
) => {
  const item = series[seriesIndex];
  const stack = item?.stack;
  const hasStack = (typeof stack === "string" && stack.length > 0) || typeof stack === "number";

  if (!item || item.type !== "bar" || !isVisibleSeries(item) || !hasStack) {
    return undefined;
  }

  return series.find((candidate, candidateIndex) =>
    candidateIndex !== seriesIndex &&
    candidate?.type === "bar" &&
    candidate.stack === stack &&
    !isVisibleSeries(candidate)
  );
};

const readFloatingBarPoint = (
  raw: unknown,
  offset: unknown,
  dataIndex: number,
  seriesIndex: number
): EChartsMusicRangePoint | null => {
  const start = getNumericY(offset);
  const extent = getNumericY(raw);

  if (start === null || extent === null) {
    return null;
  }

  const end = start + extent;
  return {
    x: dataIndex,
    low: Math.min(start, end),
    high: Math.max(start, end),
    custom: {
      seriesIndex,
      dataIndex
    }
  };
};

const isWaterfallBar = (data: unknown[]) => data.some((raw) => (getNumericY(raw) ?? 0) < 0);

const readWaterfallBarPoint = (
  raw: unknown,
  offset: unknown,
  dataIndex: number,
  seriesIndex: number
): EChartsMusicOpenClosePoint | null => {
  const open = getNumericY(offset);
  const change = getNumericY(raw);

  if (open === null || change === null) {
    return null;
  }

  const close = open + change;
  return {
    x: dataIndex,
    open,
    close,
    low: Math.min(open, close),
    high: Math.max(open, close),
    custom: {
      seriesIndex,
      dataIndex
    }
  };
};

const createHierarchyData = (
  seriesItem: Record<string, unknown>,
  seriesIndex: number,
  options: { fallbackLeafValue?: number; unwrapSingleRoot?: boolean } = {}
) => {
  const sourceData = Array.isArray(seriesItem.data) ? seriesItem.data : [];
  const singleRoot =
    options.unwrapSingleRoot &&
    sourceData.length === 1 &&
    sourceData[0] &&
    typeof sourceData[0] === "object" &&
    !Array.isArray(sourceData[0])
      ? (sourceData[0] as Record<string, unknown>)
      : null;
  const data = singleRoot && Array.isArray(singleRoot.children) ? singleRoot.children : sourceData;
  const root = singleRoot ? nodeName(singleRoot, seriesName(seriesItem, seriesIndex)) : seriesName(seriesItem, seriesIndex);
  const groups: EChartsMusicGroupData = {};
  const labels: string[] = [];
  const labelIndexes = new Map<string, number>();
  const usedGroupNames = new Set<string>();

  const labelIndex = (label: string) => {
    const existing = labelIndexes.get(label);
    if (existing !== undefined) {
      return existing;
    }

    const index = labels.length;
    labels.push(label);
    labelIndexes.set(label, index);
    return index;
  };

  const uniqueGroupName = (base: string) => {
    let candidate = base || "Group";
    let suffix = 2;
    while (usedGroupNames.has(candidate)) {
      candidate = `${base} ${suffix}`;
      suffix += 1;
    }
    usedGroupNames.add(candidate);
    return candidate;
  };

  const addGroup = (groupName: string, nodes: unknown[]) => {
    const points: Array<EChartsMusicPoint | null> = nodes
      .map((rawNode, dataIndex) => {
        if (!rawNode || typeof rawNode !== "object" || Array.isArray(rawNode)) {
          return null;
        }

        const node = rawNode as Record<string, unknown>;
        const label = nodeName(node, `Item ${dataIndex + 1}`);
        const children = Array.isArray(node.children) ? node.children : [];
        const x = labelIndex(label);
        const childGroupName = children.length ? uniqueGroupName(label) : undefined;

        if (childGroupName) {
          addGroup(childGroupName, children);
        }

        return {
          x,
          y: nodeValue(node, options.fallbackLeafValue),
          ...(childGroupName ? { children: childGroupName } : {}),
          custom: {
            seriesIndex,
            dataIndex,
            name: label
          }
        };
      });

    groups[groupName] = points.filter((point): point is EChartsMusicPoint => point !== null);
  };

  usedGroupNames.add(root);
  addGroup(root, data);

  return { data: groups, labels, root };
};

const createFunnelData = (series: Record<string, unknown>[], indexes: number[]) => {
  const labels: string[] = [];
  const labelIndexes = new Map<string, number>();

  const labelIndex = (label: string) => {
    const existing = labelIndexes.get(label);
    if (existing !== undefined) {
      return existing;
    }

    const index = labels.length;
    labels.push(label);
    labelIndexes.set(label, index);
    return index;
  };

  const groups: EChartsMusicGroupData = {};

  indexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const rawData = Array.isArray(item?.data) ? item.data : [];
    groups[seriesName(item ?? {}, seriesIndex)] = rawData
      .map((raw, dataIndex) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          return null;
        }

        const datum = raw as Record<string, unknown>;
        const name =
          typeof datum.name === "string" && datum.name ? datum.name : `Slice ${dataIndex + 1}`;
        const value = datum.value;

        if (typeof value !== "number" || Number.isNaN(value)) {
          return null;
        }

        return {
          x: labelIndex(name),
          y: value,
          custom: {
            seriesIndex,
            dataIndex
          }
        };
      })
      .filter((point): point is EChartsMusicPoint => point !== null);
  });

  return {
    data: indexes.length === 1 ? Object.values(groups)[0] ?? [] : groups,
    labels
  };
};

const createBoxplotData = (
  option: Record<string, unknown>,
  series: Record<string, unknown>[],
  indexes: number[]
) => {
  const categoryLabels = getCategoryLabels(option);
  const firstIndex = indexes[0];
  const labels = categoryLabels.length
    ? categoryLabels
    : indexes.length === 1 && firstIndex !== undefined
      ? getDataItemNameLabels(series[firstIndex])
      : [];
  const boxIndexes = indexes.filter((seriesIndex) => series[seriesIndex]?.type === "boxplot");
  const scatterIndexes = indexes.filter((seriesIndex) => series[seriesIndex]?.type === "scatter");
  const groups: Record<string, EChartsMusicBoxPoint[]> = {};

  boxIndexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const rawData = Array.isArray(item?.data) ? item.data : [];
    groups[seriesName(item ?? {}, seriesIndex)] = rawData
      .map((raw, dataIndex) => {
        const values = numericArrayFromData(raw);
        if (!values || !hasAtLeast(values, 5)) {
          return null;
        }

        const low = values[0];
        const q1 = values[1];
        const median = values[2];
        const q3 = values[3];
        const high = values[4];
        return {
          x: dataIndex,
          low,
          q1,
          median,
          q3,
          high,
          custom: {
            seriesIndex,
            dataIndex
          }
        };
      })
      .filter((point): point is EChartsMusicBoxPoint => point !== null);
  });

  scatterIndexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const rawData = Array.isArray(item?.data) ? item.data : [];
    const firstBoxIndex = boxIndexes[0];
    const matchingGroups =
      boxIndexes.length === 1 && firstBoxIndex !== undefined
        ? [seriesName(series[firstBoxIndex] ?? {}, firstBoxIndex)]
        : typeof item?.name === "string" && item.name in groups
          ? [item.name]
          : [];

    matchingGroups.forEach((groupName) => {
      rawData.forEach((raw) => {
        const values = numericArrayFromData(raw);
        if (!values || !hasAtLeast(values, 2)) {
          return;
        }

        const x = values[0];
        const outlier = values[1];
        if (typeof x !== "number" || typeof outlier !== "number") {
          return;
        }

        const box = groups[groupName]?.find((point) => point.x === x);
        if (box) {
          box.outlier = [...(box.outlier ?? []), outlier];
        }
      });
    });
  });

  return {
    data: boxIndexes.length === 1 ? Object.values(groups)[0] ?? [] : groups,
    labels
  };
};

const createCandlestickData = (
  option: Record<string, unknown>,
  series: Record<string, unknown>[],
  indexes: number[]
) => {
  const categoryLabels = getCategoryLabels(option);
  const firstIndex = indexes[0];
  const labels = categoryLabels.length
    ? categoryLabels
    : indexes.length === 1 && firstIndex !== undefined
      ? getDataItemNameLabels(series[firstIndex])
      : [];
  const groups: EChartsMusicGroupData = {};
  const types: C2MSeriesType[] = [];

  indexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const rawData = Array.isArray(item?.data) ? item.data : [];

    if (item?.type === "candlestick") {
      groups[seriesName(item ?? {}, seriesIndex)] = rawData
        .map((raw, dataIndex) => {
          const values = numericArrayFromData(raw);
          if (!values || !hasAtLeast(values, 4)) {
            return null;
          }

          const open = values[0];
          const close = values[1];
          const low = values[2];
          const high = values[3];
          return {
            x: dataIndex,
            open,
            close,
            low,
            high,
            custom: {
              seriesIndex,
              dataIndex
            }
          };
        })
        .filter((point): point is EChartsMusicCandlestickPoint => point !== null);
      types.push("candlestick");
      return;
    }

    if (item?.type !== "bar" && item?.type !== "line") {
      return;
    }

    groups[seriesName(item ?? {}, seriesIndex)] = rawData
      .map((raw, dataIndex) => readDataPoint(raw, dataIndex, seriesIndex, dataIndex))
      .filter((point): point is EChartsMusicPoint => point !== null);
    types.push(item.type === "line" ? "line" : "bar");
  });

  const groupCount = Object.keys(groups).length;

  return {
    data: groupCount === 1 ? Object.values(groups)[0] ?? [] : groups,
    labels,
    type: groupCount === 1 ? types[0] ?? "candlestick" : types
  };
};

const readHeatmapValue = (raw: unknown): unknown[] | null => {
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>).value
      : raw;

  return Array.isArray(value) ? value : null;
};

const createHeatmapData = (
  option: Record<string, unknown>,
  series: Record<string, unknown>[],
  indexes: number[]
) => {
  const xLabels = getCategoryLabels(option);
  const yLabels = getAxisCategoryLabels(option.yAxis as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const labelIndexes = new Map<string, number>();
  const labels = [...xLabels];
  xLabels.forEach((label, index) => labelIndexes.set(label, index));
  const groups: Record<string, EChartsMusicMatrixPoint[]> = {};
  const multipleSeries = indexes.length > 1;

  const labelIndex = (label: string) => {
    const existing = labelIndexes.get(label);
    if (existing !== undefined) {
      return existing;
    }

    const index = labels.length;
    labels.push(label);
    labelIndexes.set(label, index);
    return index;
  };

  const addPoint = (groupName: string, point: EChartsMusicMatrixPoint) => {
    groups[groupName] ??= [];
    groups[groupName].push(point);
  };

  indexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const rawData = Array.isArray(item?.data) ? item.data : [];
    const isCalendar = item?.coordinateSystem === "calendar";
    const baseName = seriesName(item ?? {}, seriesIndex);

    rawData.forEach((raw, dataIndex) => {
      const values = readHeatmapValue(raw);
      if (!values) {
        return;
      }

      if (isCalendar) {
        const rawX = values[0];
        const rawValue = values[1];
        if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
          return;
        }

        const label = typeof rawX === "string" || typeof rawX === "number" ? String(rawX) : String(dataIndex);
        addPoint(baseName, {
          x: labelIndex(label),
          y2: rawValue,
          custom: {
            seriesIndex,
            dataIndex
          }
        });
        return;
      }

      const rawX = values[0];
      const rawY = values[1];
      const rawValue = values[2];
      if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
        return;
      }

      const x =
        typeof rawX === "number"
          ? rawX
          : typeof rawX === "string"
            ? labelIndex(rawX)
            : null;
      const y =
        typeof rawY === "number"
          ? rawY
          : typeof rawY === "string"
            ? yLabels.indexOf(rawY) >= 0
              ? yLabels.indexOf(rawY)
              : null
            : null;

      if (x === null || y === null) {
        return;
      }

      const rowLabel = yLabels[y] ?? String(y);
      const groupName = multipleSeries ? `${baseName}: ${rowLabel}` : rowLabel;
      addPoint(groupName, {
        x,
        y2: rawValue,
        custom: {
          seriesIndex,
          dataIndex
        }
      });
    });
  });

  return {
    data: groups,
    labels
  };
};

export const echartsOptionToChart2MusicConfig = (
  option: Record<string, unknown>,
  options: EChartsChart2MusicOptions = {}
): C2MChartConfig | null => {
  const series = asArray(option.series as Record<string, unknown> | Record<string, unknown>[]);
  const indexes = selectedSeriesIndexes(series, options.seriesIndex);

  if (indexes.length === 0) {
    options.errorCallback?.("Unable to connect chart2music to ECharts: no series were found.");
    return null;
  }

  const unsupportedType = indexes
    .map((index) => series[index])
    .find((item) => typeof item?.type === "string" && !echartsToC2MType[item.type]);

  if (unsupportedType?.type) {
    options.errorCallback?.(
      `Unable to connect chart2music to ECharts: series type "${unsupportedType.type}" is not supported. Supported types are ${Object.keys(echartsToC2MType).join(", ")}.`
    );
    return null;
  }

  if (indexes.some((index) => isBubbleSeries(series[index]))) {
    options.errorCallback?.(
      "Unable to connect chart2music to ECharts: bubble plots are not supported."
    );
    return null;
  }

  const firstSelectedSeries = series[indexes[0] ?? 0];
  const inferredType =
    options.type ??
    echartsToC2MType[
      typeof firstSelectedSeries?.type === "string" ? firstSelectedSeries.type : "line"
    ] ?? "line";

  if (
    firstSelectedSeries?.type === "sunburst" ||
    firstSelectedSeries?.type === "tree" ||
    firstSelectedSeries?.type === "treemap"
  ) {
    const hierarchy = createHierarchyData(firstSelectedSeries, indexes[0] ?? 0, {
      fallbackLeafValue: firstSelectedSeries?.type === "tree" ? 1 : 0,
      unwrapSingleRoot: firstSelectedSeries?.type === "tree"
    });
    const c2mOptions = {
      ...options.options,
      root: options.options && "root" in options.options ? options.options.root : hierarchy.root
    };
    const info = mergeInfo(options.info);

    return {
      element: undefined as unknown as HTMLElement,
      ...(options.cc ? { cc: options.cc } : {}),
      ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
      ...(options.lang ? { lang: options.lang } : {}),
      type: "treemap",
      title: getTitle(option, options.title),
      data: hierarchy.data,
      ...(info ? { info } : {}),
      options: c2mOptions,
      axes: {
        x: {
          ...(hierarchy.labels.length ? { valueLabels: hierarchy.labels } : {}),
          ...options.axes?.x
        },
        y: {
          format: (value: number) => value.toLocaleString(),
          ...options.axes?.y
        },
        ...(options.axes?.y2 ? { y2: options.axes.y2 } : {})
      }
    };
  }

  if (firstSelectedSeries?.type === "funnel") {
    const funnel = createFunnelData(series, indexes);
    const axes = {
      x: {
        ...(funnel.labels.length ? { valueLabels: funnel.labels } : {}),
        ...options.axes?.x
      },
      y: {
        format: (value: number) => value.toLocaleString(),
        ...options.axes?.y
      },
      ...(options.axes?.y2 ? { y2: options.axes.y2 } : {})
    };
    const info = mergeInfo(options.info);

    return {
      element: undefined as unknown as HTMLElement,
      ...(options.cc ? { cc: options.cc } : {}),
      ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
      ...(options.lang ? { lang: options.lang } : {}),
      type: "bar",
      title: getTitle(option, options.title),
      data: funnel.data,
      ...(info ? { info } : {}),
      ...(options.options && Object.keys(options.options).length ? { options: options.options } : {}),
      axes
    };
  }

  if (firstSelectedSeries?.type === "boxplot") {
    const boxplot = createBoxplotData(option, series, indexes);
    const axes = {
      x: {
        ...(boxplot.labels.length ? { valueLabels: boxplot.labels } : {}),
        ...options.axes?.x
      },
      y: {
        format: (value: number) => value.toLocaleString(),
        ...options.axes?.y
      },
      ...(options.axes?.y2 ? { y2: options.axes.y2 } : {})
    };
    const info = mergeInfo(options.info);

    return {
      element: undefined as unknown as HTMLElement,
      ...(options.cc ? { cc: options.cc } : {}),
      ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
      ...(options.lang ? { lang: options.lang } : {}),
      type: "box",
      title: getTitle(option, options.title),
      data: boxplot.data,
      ...(info ? { info } : {}),
      ...(options.options && Object.keys(options.options).length ? { options: options.options } : {}),
      axes
    };
  }

  if (firstSelectedSeries?.type === "candlestick") {
    const candlestick = createCandlestickData(option, series, indexes);
    const info = createMarkInfo(series, indexes, candlestick.labels);
    const axes = {
      x: {
        ...(candlestick.labels.length ? { valueLabels: candlestick.labels } : {}),
        ...options.axes?.x
      },
      y: {
        format: (value: number) => value.toLocaleString(),
        ...options.axes?.y
      },
      ...(options.axes?.y2 ? { y2: options.axes.y2 } : {})
    };
    const mergedInfo = mergeInfo(options.info, info);

    return {
      element: undefined as unknown as HTMLElement,
      ...(options.cc ? { cc: options.cc } : {}),
      ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
      ...(options.lang ? { lang: options.lang } : {}),
      type: candlestick.type,
      title: getTitle(option, options.title),
      data: candlestick.data,
      ...(mergedInfo ? { info: mergedInfo } : {}),
      ...(options.options && Object.keys(options.options).length ? { options: options.options } : {}),
      axes
    };
  }

  if (firstSelectedSeries?.type === "heatmap") {
    const heatmap = createHeatmapData(option, series, indexes);
    const axes = {
      x: {
        ...(heatmap.labels.length ? { valueLabels: heatmap.labels } : {}),
        ...options.axes?.x
      },
      y2: {
        format: (value: number) => value.toLocaleString(),
        ...options.axes?.y2
      }
    };
    const info = mergeInfo(options.info);

    return {
      element: undefined as unknown as HTMLElement,
      ...(options.cc ? { cc: options.cc } : {}),
      ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
      ...(options.lang ? { lang: options.lang } : {}),
      type: "matrix",
      title: getTitle(option, options.title),
      data: heatmap.data,
      ...(info ? { info } : {}),
      ...(options.options && Object.keys(options.options).length ? { options: options.options } : {}),
      axes
    };
  }

  const xCategoryLabels = getCategoryLabels(option);
  const yCategoryLabels = getAxisCategoryLabels(
    option.yAxis as Record<string, unknown> | Record<string, unknown>[] | undefined
  );
  const categoryLabels = xCategoryLabels.length ? xCategoryLabels : yCategoryLabels;
  const xAxisName = getAxisName(
    option.xAxis as Record<string, unknown> | Record<string, unknown>[] | undefined
  );
  const yAxisName = getAxisName(
    option.yAxis as Record<string, unknown> | Record<string, unknown>[] | undefined
  );
  const categoryAxisName = xCategoryLabels.length ? xAxisName : yAxisName;
  const pieLabels =
    inferredType === "pie" && indexes.length === 1
      ? getDataItemNameLabels(firstSelectedSeries)
      : [];
  const labels = pieLabels.some(Boolean) ? pieLabels : categoryLabels;
  const groups: EChartsMusicGroupData = {};
  const groupTypes: C2MSeriesType[] = [];
  const shouldUseAxisLabelsForPointNames = inferredType === "pie" && pieLabels.some(Boolean);

  indexes.forEach((seriesIndex) => {
    const item = series[seriesIndex];
    const data = Array.isArray(item?.data) ? item.data : [];
    const helper = floatingBarHelper(series, seriesIndex);

    if (item?.type === "bar" && !isVisibleSeries(item)) {
      return;
    }

    if (helper) {
      const offsets = Array.isArray(helper.data) ? helper.data : [];
      const readPoint = isWaterfallBar(data) ? readWaterfallBarPoint : readFloatingBarPoint;
      groups[seriesName(item ?? {}, seriesIndex)] = data
        .map((raw, dataIndex) => readPoint(raw, offsets[dataIndex], dataIndex, seriesIndex))
        .filter((point): point is EChartsMusicRangePoint | EChartsMusicOpenClosePoint => point !== null);
      groupTypes.push("bar");
      return;
    }

    groups[seriesName(item ?? {}, seriesIndex)] = data
      .map((raw, dataIndex) =>
        readDataPoint(
          raw,
          dataIndex,
          seriesIndex,
          dataIndex,
          !shouldUseAxisLabelsForPointNames
        )
      )
      .filter((point): point is EChartsMusicPoint => point !== null);
    groupTypes.push(
      echartsToC2MType[typeof item?.type === "string" ? item.type : "line"] ?? inferredType
    );
  });

  const groupValues = Object.values(groups);
  const data = groupValues.length === 1 ? groupValues[0] ?? [] : groups;
  const type =
    options.type ??
    (groupTypes.length > 1 && new Set(groupTypes).size > 1 ? groupTypes : groupTypes[0] ?? inferredType);
  const info = createMarkInfo(series, indexes, labels);
  const c2mOptions = {
    ...options.options,
    ...(isStackedBar(series, indexes) ? { stack: true } : {})
  };
  const axes = {
    x: {
      ...(labels.length ? { valueLabels: labels } : {}),
      ...(categoryAxisName ? { label: categoryAxisName } : {}),
      ...options.axes?.x
    },
    y: {
      format: (value: number) => value.toLocaleString(),
      ...options.axes?.y
    },
    ...(options.axes?.y2 ? { y2: options.axes.y2 } : {})
  };
  const mergedInfo = mergeInfo(options.info, info);

  return {
    element: undefined as unknown as HTMLElement,
    ...(options.cc ? { cc: options.cc } : {}),
    ...(options.audioEngine ? { audioEngine: options.audioEngine } : {}),
    ...(options.lang ? { lang: options.lang } : {}),
    type,
    title: getTitle(option, options.title),
    data,
    ...(mergedInfo ? { info: mergedInfo } : {}),
    ...(Object.keys(c2mOptions).length ? { options: c2mOptions } : {}),
    axes
  };
};
