import * as echarts from "echarts";
import { connect } from "../src/index.js";
import { regionMap, type DemoExample } from "./chart-examples.js";

echarts.registerMap("demo-regions", regionMap);

export const createEChartsExample = (example: DemoExample, sonified: boolean) => {
  const root = document.createElement("section");
  const title = example.title ?? example.type;

  const chartElement = document.createElement("div");
  chartElement.className = "c2m-chart";
  chartElement.setAttribute("aria-label", `${title} chart`);
  root.append(chartElement);

  const cc = document.createElement("div");
  cc.className = "c2m-caption";
  cc.setAttribute("aria-live", "polite");
  cc.textContent = sonified ? "Loading Chart2Music controls." : "Visual-only ECharts example.";
  root.append(cc);

  requestAnimationFrame(() => {
    const chart = echarts.init(chartElement, undefined, { renderer: "canvas", devicePixelRatio: 1 });
    chart.setOption({ animation: false, tooltip: {}, title: { text: title, show: false }, ...example.option } as never);

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

    if (music) {
      cc.textContent = "Chart2Music controls are attached to this chart.";
    }

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
