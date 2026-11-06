// @vitest-environment jsdom

import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connect } from "../src/index";
import type { EChartsChart2MusicConnection } from "../src/types";

echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

type Graphic = { currentStates?: string[]; childrenRef?: () => Graphic[] };
const hasEmphasis = (element: Graphic | undefined): boolean =>
  !!element && (element.currentStates?.includes("emphasis") === true ||
    (element.childrenRef?.() ?? []).some(hasEmphasis));

const emphasizedNames = (chart: echarts.EChartsType) => {
  const model = chart as unknown as {
    getModel: () => {
      getSeriesByIndex: (index: number) => {
        getData: () => {
          count: () => number;
          getName: (index: number) => string;
          getItemGraphicEl: (index: number) => Graphic | undefined;
        };
      };
    };
  };
  const data = model.getModel().getSeriesByIndex(0).getData();
  return Array.from({ length: data.count() }, (_, index) => index)
    .filter((index) => hasEmphasis(data.getItemGraphicEl(index)))
    .map((index) => data.getName(index));
};

const starting = [{ name: "A", value: 10 }, { name: "B", value: 20 }, { name: "C", value: 30 }];
const fixtures = [
  { change: "insertion", next: [{ name: "X", value: 5 }, ...starting], selected: "A" },
  { change: "reordering", next: [starting[1]!, starting[0]!, starting[2]!], selected: "A" },
  { change: "removal", next: [starting[0]!, starting[2]!], selected: "C" }
];
const option = (data: typeof starting) => ({
  animation: false,
  tooltip: { trigger: "item" as const, renderMode: "richText" as const },
  xAxis: { type: "category" as const, data: data.map((point) => point.name) },
  yAxis: { type: "value" as const },
  series: [{ id: "fixture", name: "Fixture", type: "line" as const, data }]
});

describe("focus synchronization after data updates", () => {
  let chart: echarts.EChartsType;
  let connection: EChartsChart2MusicConnection | null;
  let element: HTMLDivElement;

  beforeEach(() => {
    // SVG text layout needs only deterministic text measurement in JSDOM.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 7 })
    } as unknown as CanvasRenderingContext2D);
    element = document.createElement("div");
    document.body.append(element);
    chart = echarts.init(element, undefined, { renderer: "svg", width: 600, height: 300 });
    chart.setOption(option(starting));
    connection = connect(chart, { options: { enableSound: false, enableSpeech: false } });
    expect(connection).not.toBeNull();
  });

  afterEach(() => {
    connection?.dispose();
    chart.dispose();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it.each(fixtures)("repaints the newly selected point after $change", async ({ next, selected }) => {
    const dispatch = vi.spyOn(chart, "dispatchAction");
    element.focus();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(connection?.c2m.getCurrent().index).toBe(1);
    expect(connection?.c2m.getCurrent().point?.label).toBe("B");
    await expect.poll(() => emphasizedNames(chart)).toEqual(["B"]);

    dispatch.mockClear();
    chart.setOption(option(next));
    connection?.update();
    // setData intentionally resets to the first point without a focus callback.
    expect(connection?.c2m.getCurrent().index).toBe(0);
    expect(dispatch).toHaveBeenCalledWith({ type: "downplay", seriesIndex: 0 }, { silent: true });
    expect(dispatch).toHaveBeenCalledWith({ type: "hideTip" }, { silent: true });
    await expect.poll(() => emphasizedNames(chart)).toEqual([]);

    dispatch.mockClear();
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(connection?.c2m.getCurrent().index).toBe(1);
    expect(connection?.c2m.getCurrent().point?.label).toBe(selected);
    expect(dispatch).toHaveBeenCalledWith({ type: "highlight", seriesIndex: 0, dataIndex: 1 });
    expect(dispatch).toHaveBeenCalledWith({ type: "showTip", seriesIndex: 0, dataIndex: 1 });
    await expect.poll(() => emphasizedNames(chart)).toEqual([selected]);

    // Resize/unchanged finished events must not reset focus or invalidate the cache.
    const setData = vi.spyOn(connection!.c2m, "setData");
    dispatch.mockClear();
    chart.resize({ width: 620, height: 310 });
    connection?.update();
    element.dispatchEvent(new FocusEvent("focus"));
    expect(setData).not.toHaveBeenCalled();
    expect(connection?.c2m.getCurrent().index).toBe(1);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
