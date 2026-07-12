import * as echarts from "echarts";
import { connect } from "../src/index.js";
import { regionMap, type DemoExample } from "./chart-examples.js";

echarts.registerMap("demo-regions", regionMap);

export const createEChartsExample = (example: DemoExample, sonified: boolean) => {
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
    chart.setOption(example.option as never);

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
