import type { Meta, StoryObj } from "@storybook/html-vite";
import * as echarts from "echarts";
import { connect } from "../src/index.js";
import {
  optionsByType,
  regionMap,
  supportedByChart2Music,
  type DemoExample
} from "./chart-examples.js";

echarts.registerMap("demo-regions", regionMap);

const makeChart = (example: DemoExample) => {
  const panel = document.createElement("section");
  panel.className = "c2m-panel";

  const header = document.createElement("div");
  header.className = "c2m-panel-header";
  const title = example.title ?? example.type;
  header.innerHTML = `<h2>${title}</h2><span class="c2m-badge ${supportedByChart2Music.has(example.type) ? "is-supported" : "is-visual"}">${supportedByChart2Music.has(example.type) ? "sonified" : "visual only"}</span>`;
  panel.append(header);

  const chartElement = document.createElement("div");
  chartElement.className = "c2m-chart";
  chartElement.setAttribute("aria-label", `${title} chart`);
  panel.append(chartElement);

  const cc = document.createElement("div");
  cc.className = "c2m-caption";
  cc.setAttribute("aria-live", "polite");
  panel.append(cc);

  requestAnimationFrame(() => {
    const chart = echarts.init(chartElement, undefined, { renderer: "canvas", devicePixelRatio: 1 });
    chart.setOption({ animation: false, tooltip: {}, title: { text: title, show: false }, ...example.option } as never);
    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(chartElement);

    try {
      const music = connect(chart, {
        cc,
        errorCallback: (message) => {
          cc.textContent = message;
        }
      });
      if (music) {
        cc.textContent = "Chart2Music controls are attached to this chart.";
      }
    } catch (error) {
      cc.textContent = error instanceof Error ? error.message : String(error);
    }

    const cleanup = () => {
      observer.disconnect();
      chart.dispose();
    };
    const removalObserver = new MutationObserver(() => {
      if (!panel.isConnected) {
        removalObserver.disconnect();
        cleanup();
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: true });
  });

  return panel;
};

const renderExamples = (examples: DemoExample[], heading: string) => {
  const root = document.createElement("main");
  root.className = "c2m-gallery";
  root.innerHTML = `<header class="c2m-gallery-header"><h1>${heading}</h1><p>Interactive ECharts examples with Chart2Music controls where the extension supports the underlying series.</p></header>`;
  const grid = document.createElement("div");
  grid.className = "c2m-grid";
  examples.forEach((example) => grid.append(makeChart(example)));
  root.append(grid);
  return root;
};

const byCategory = (category: string) => optionsByType.filter((example) => (example.category ?? example.type) === category);

const meta = {
  title: "ECharts Examples/Chart2Music",
  parameters: { layout: "fullscreen" }
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => renderExamples([
    {
      type: "bar",
      title: "Quarterly revenue",
      option: {
        xAxis: { data: ["Q1", "Q2", "Q3", "Q4"] },
        yAxis: {},
        series: [{ name: "Revenue", type: "bar", data: [12, 19, 8, 15] }]
      }
    }
  ], "Basic ECharts connection")
};

export const AllExamples: Story = { render: () => renderExamples(optionsByType, "All ECharts examples") };
export const Line: Story = { render: () => renderExamples(byCategory("line"), "Line charts") };
export const Bar: Story = { render: () => renderExamples(byCategory("bar"), "Bar charts") };
export const Pie: Story = { render: () => renderExamples(byCategory("pie"), "Pie charts") };
export const Scatter: Story = { render: () => renderExamples(byCategory("scatter"), "Scatter charts") };
export const Hierarchy: Story = { render: () => renderExamples(byCategory("hierarchy"), "Hierarchy charts") };
export const OtherSeries: Story = {
  render: () => renderExamples(optionsByType.filter((example) => !["line", "bar", "pie", "scatter", "hierarchy"].includes(example.category ?? example.type)), "Other ECharts series")
};
