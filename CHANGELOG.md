# Changelog

## Unreleased

- Read `[value, category]` data items, so charts with the value axis on x and the
  category axis on y (horizontal bars, and pies fed from the same data) are no
  longer converted to an empty series.

## 0.1.0

- Initial scaffold for `echarts-extension-chart2music`.
- Add ECharts option converter for bar, line, pie, and scatter series.
- Add `connect()` / `createEChartsMusic()` chart-instance integration.
- Add ECharts-compatible `install()` export for `echarts.use(...)`.
