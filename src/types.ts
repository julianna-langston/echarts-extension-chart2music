import type { EChartsType } from "echarts/core";
import type { C2MChartConfig, c2m } from "chart2music";

export type EChartsChart2MusicType =
  | "bar"
  | "box"
  | "candlestick"
  | "line"
  | "matrix"
  | "pie"
  | "scatter"
  | "treemap";

export type EChartsChart2MusicOptions = Partial<Pick<
  C2MChartConfig,
  "audioEngine" | "axes" | "cc" | "info" | "lang" | "options"
>> & {
  errorCallback?: (err: string) => void;
  seriesIndex?: number | number[];
  title?: string;
  type?: EChartsChart2MusicType;
};

export type EChartsChart2MusicConnection = {
  chart: EChartsType;
  c2m: c2m;
  update: () => void;
  dispose: () => void;
};

export type EChartsMusicPoint = {
  x: number;
  y: number;
  label?: string;
  children?: string;
  custom: {
    seriesIndex: number;
    dataIndex: number;
    name?: string;
  };
};

export type EChartsMusicDataPoint =
  | EChartsMusicPoint
  | EChartsMusicRangePoint
  | EChartsMusicOpenClosePoint
  | EChartsMusicBoxPoint
  | EChartsMusicCandlestickPoint
  | EChartsMusicMatrixPoint;

export type EChartsMusicRangePoint = {
  x: number;
  high: number;
  low: number;
  custom: {
    seriesIndex: number;
    dataIndex: number;
  };
};

export type EChartsMusicOpenClosePoint = {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  custom: {
    seriesIndex: number;
    dataIndex: number;
  };
};

export type EChartsMusicBoxPoint = {
  x: number;
  high: number;
  q3: number;
  median: number;
  q1: number;
  low: number;
  outlier?: number[];
  custom: {
    seriesIndex: number;
    dataIndex: number;
  };
};

export type EChartsMusicCandlestickPoint = {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  custom: {
    seriesIndex: number;
    dataIndex: number;
  };
};

export type EChartsMusicMatrixPoint = {
  x: number;
  y2: number;
  custom: {
    seriesIndex: number;
    dataIndex?: number;
  };
};

export type EChartsMusicGroupData = Record<string, EChartsMusicDataPoint[]>;
