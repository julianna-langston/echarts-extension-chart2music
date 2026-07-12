# echarts-extension-chart2music

Apache ECharts extension for [Chart2Music](https://chart2music.com/). Turns ECharts charts into music so blind users can hear data.

This package follows the ECharts extension naming convention:

```text
echarts-extension-chart2music
```

## Install

```sh
npm install echarts echarts-extension-chart2music
```

## Usage

```ts
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import chart2musicExtension, { connect } from "echarts-extension-chart2music";

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
  chart2musicExtension
]);

const chart = echarts.init(document.getElementById("chart")!);

chart.setOption({
  title: { text: "Quarterly revenue" },
  tooltip: {},
  xAxis: { data: ["Q1", "Q2", "Q3", "Q4"] },
  yAxis: {},
  series: [
    {
      name: "Revenue",
      type: "bar",
      data: [12, 19, 8, 15]
    }
  ]
});

const music = connect(chart, {
  errorCallback: console.error,
  axes: {
    y: {
      format: (value) => `$${value}M`
    }
  }
});
```

Call `music.dispose()` when you dispose the chart.

```ts
music?.dispose();
chart.dispose();
```

## Options

`connect(chart, options)` accepts:

- `errorCallback`: receives conversion or Chart2Music errors.
- `cc`: a caption / control container element. If omitted, the extension creates one after the chart DOM element.
- `audioEngine`: passed through to Chart2Music.
- `axes`: passed through to Chart2Music after ECharts axis defaults are inferred.
- `lang`: passed through to Chart2Music.
- `seriesIndex`: one series index or an array of series indexes to sonify. Defaults to all series.
- `title`: overrides the title read from `option.title.text`.
- `type`: overrides the inferred Chart2Music chart type.

## Supported ECharts Series

The first release focuses on common data series:

- `bar`
- `line`
- `pie`
- `scatter`

Unsupported visual-only ECharts features are ignored. Complex `dataset` / `encode` mappings, time axes, stacked charts, custom series, and interaction synchronization are good next targets.

## API

### `connect(chart, options)`

Creates a Chart2Music instance from an ECharts chart instance.

### `createEChartsMusic(chart, options)`

Alias for `connect`.

### `echartsOptionToChart2MusicConfig(option, options)`

Pure converter from an ECharts option object to a Chart2Music config. Useful for tests, framework wrappers, and custom integrations.

### `install(registers)`

ECharts-compatible extension install hook for `echarts.use([...])`. The current Chart2Music bridge still needs a concrete chart instance, so call `connect(chart, options)` after `echarts.init(...)`.

## Development

```sh
pnpm install
pnpm test
pnpm run typecheck
pnpm run build
```

## Examples

- `examples/basic.html` shows one connected bar chart.
- `examples/all-chart-types.html` renders every chart type exported by ECharts 5.6 and labels the chart types currently supported by the Chart2Music adapter.

Run `pnpm run build` first, then serve the repo root with any static file server and open the example HTML files.

## Publishing

This repo includes a GitHub Actions workflow that publishes to npm when a GitHub release is created. Add an `NPM_TOKEN` repository secret with publish rights for the npm package.

## License

MIT
