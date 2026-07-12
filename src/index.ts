import { connect, createEChartsMusic } from "./connect.js";

export { connect, createEChartsMusic };
export { echartsOptionToChart2MusicConfig } from "./converter.js";
export type {
  EChartsChart2MusicConnection,
  EChartsChart2MusicOptions,
  EChartsChart2MusicType
} from "./types.js";

export const install = (_registers: unknown) => {
  // ECharts extensions are registered through echarts.use([install]).
  // The current public integration point still needs a chart instance, so use
  // connect(chart, options) after echarts.init(...).
};

export default {
  install,
  connect,
  createEChartsMusic
};
