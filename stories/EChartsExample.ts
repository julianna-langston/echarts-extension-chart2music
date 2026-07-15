import * as echarts from "echarts";
import { connect } from "../src/index.js";
import { regionMap, type DemoExample } from "./chart-examples.js";

echarts.registerMap("demo-regions", regionMap);

export type EChartsStoryOptions = {
  title: string;
  showTitle: boolean;
  showTooltip: boolean;
  showXAxisLabels: boolean;
  showYAxisLabels: boolean;
  showLegend: boolean;
  animation: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
};

const setAxisLabelVisibility = (axis: unknown, visible: boolean) => {
  if (Array.isArray(axis)) {
    return axis.map((item) => setAxisLabelVisibility(item, visible));
  }
  if (!axis || typeof axis !== "object") {
    return axis;
  }
  const value = axis as Record<string, unknown>;
  return {
    ...value,
    axisLabel: { ...asRecord(value.axisLabel), show: visible }
  };
};

const withStoryOptions = (example: DemoExample, options: EChartsStoryOptions) => ({
  ...example.option,
  animation: options.animation,
  title: { ...asRecord(example.option.title), text: options.title, show: options.showTitle },
  tooltip: { ...asRecord(example.option.tooltip), show: options.showTooltip },
  legend: { ...asRecord(example.option.legend), show: options.showLegend },
  xAxis: setAxisLabelVisibility(example.option.xAxis, options.showXAxisLabels),
  yAxis: setAxisLabelVisibility(example.option.yAxis, options.showYAxisLabels)
});

export const createEChartsExample = (
  example: DemoExample,
  sonified: boolean,
  options: EChartsStoryOptions
) => {
  const root = document.createElement("div");
  const title = example.title ?? example.type;

  const chartElement = document.createElement("div");
  chartElement.style.height = "320px";
  chartElement.setAttribute("aria-label", `${title} chart`);
  root.append(chartElement);

  const cc = document.createElement("div");
  cc.setAttribute("aria-live", "polite");
  if (!sonified) {
    cc.textContent = "Visual-only ECharts example.";
  }
  root.append(cc);

  requestAnimationFrame(() => {
    const chart = echarts.init(chartElement);
    chart.setOption(withStoryOptions(example, options) as never);

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartElement);
    const music = sonified
      ? connect(chart, {
          cc,
          errorCallback: (message) => {
            cc.textContent = message;
          }
        })
      : null;

    const removalObserver = new MutationObserver(() => {
      if (!root.isConnected) {
        removalObserver.disconnect();
        observer.disconnect();
        music?.dispose();
        chart.dispose();
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: true });
  });

  return root;
};
