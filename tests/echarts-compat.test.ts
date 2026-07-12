import * as echarts from "echarts";
import * as echartsCore from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { describe, expect, it } from "vitest";
import extension from "../src/index";

const seriesFrom = (option: unknown) => {
  return (option as { series?: Array<{ name?: string; type?: string; data?: unknown[] }> }).series ?? [];
};

const legendFrom = (option: unknown) => {
  return (option as { legend?: Array<{ selected?: Record<string, boolean> }> }).legend ?? [];
};

describe("ECharts compatibility", () => {
  it("registers as an ECharts extension without changing normal full-build chart behavior", () => {
    echarts.use([extension]);
    const chart = echarts.init(null, null, {
      renderer: "svg",
      ssr: true,
      width: 300,
      height: 200
    });

    chart.setOption({
      legend: {},
      xAxis: { type: "category", data: ["Jan", "Feb"] },
      yAxis: {},
      series: [{ name: "Revenue", type: "bar", data: [4, 8] }]
    });

    expect(seriesFrom(chart.getOption())[0]).toMatchObject({
      name: "Revenue",
      type: "bar",
      data: [4, 8]
    });
    expect(chart.renderToSVGString()).toContain("<svg");

    chart.dispatchAction({ type: "legendToggleSelect", name: "Revenue" });
    expect(legendFrom(chart.getOption())[0]?.selected).toMatchObject({
      Revenue: false
    });

    chart.resize({ width: 420, height: 240 });
    expect(chart.renderToSVGString()).toContain('width="420"');

    chart.dispose();
    expect(chart.isDisposed()).toBe(true);
  });

  it("registers with the modular echarts/core API without interfering with registered components", () => {
    echartsCore.use([BarChart, LineChart, GridComponent, LegendComponent, SVGRenderer, extension]);
    const chart = echartsCore.init(null, null, {
      renderer: "svg",
      ssr: true,
      width: 320,
      height: 220
    });

    chart.setOption({
      legend: {},
      xAxis: { type: "category", data: ["A", "B", "C"] },
      yAxis: {},
      series: [
        { name: "Bars", type: "bar", data: [3, 7, 5] },
        { name: "Line", type: "line", data: [2, 4, 9] }
      ]
    });

    expect(seriesFrom(chart.getOption()).map((series) => series.type)).toEqual(["bar", "line"]);
    expect(chart.renderToSVGString()).toContain("<svg");

    chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: 1 });
    chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: 1 });

    expect(seriesFrom(chart.getOption())[0]).toMatchObject({
      name: "Bars",
      type: "bar",
      data: [3, 7, 5]
    });

    chart.dispose();
    expect(chart.isDisposed()).toBe(true);
  });
});
