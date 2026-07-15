# Changelog

## Next version

## 0.1.0 - 2026-07-15

### ECharts integration

- Added an ECharts extension package with an `install()` hook for use with `echarts.use()`.
- Added `connect(chart, options)` and the `createEChartsMusic()` alias to attach Chart2Music to an initialized ECharts chart.
- Added `echartsOptionToChart2MusicConfig()` for converting ECharts options without a rendered chart instance.
- Added exported TypeScript types for extension options, connections, and converted data points.
- Added automatic title, axis, series, category, tooltip, and visual focus synchronization between ECharts and Chart2Music.
- Added support for a custom Chart2Music control/caption container, an injected container when one is not supplied, error callbacks, audio-engine options, language options, axis configuration, title overrides, type overrides, and selecting one or more series.
- Added disposal support that removes Chart2Music event handlers when the ECharts chart is disposed.

### Supported chart conversions

- Added line-chart conversion, including multiple series, smooth and stepped lines, gaps, area and stacked-area charts, visual maps, and mark-line and mark-area annotations.
- Added bar-chart conversion, including basic, grouped, stacked, horizontal, negative, data-label, background, mixed bar-line, and floating/range bars. Floating bars preserve their `low` and `high` values.
- Added pie-chart conversion, including doughnut, rose, nested-ring, and half-doughnut charts. Rose slices use their names and values in Chart2Music.
- Added scatter and effect-scatter conversion, including per-point labels and separate effect-scatter series.
- Added heatmap conversion to Chart2Music matrices, including rectangular grids, labeled matrices, missing values, and calendar heatmaps with row and column navigation.
- Added hierarchy conversion to Chart2Music treemaps for sunburst, tree, and treemap series, including nested nodes, drill-down, and visual focus synchronization.
- Added funnel conversion to bar charts, with comparison funnels represented as grouped bars.
- Added boxplot conversion, including five-number values, outliers, grouped plots, and stable ECharts tooltip positioning while navigating points.
- Added candlestick conversion, including open, close, low, high, volume, moving-average, and mark annotations.

### Demos, testing, and compatibility

- Added Storybook examples organized by Bar, Line, Pie, Scatter, Heatmap, Boxplot, Candlestick, Hierarchy, Funnel, and Not Supported.
- Added chart controls for tooltips, title, legend, and axis labels, plus an interactive gallery covering supported ECharts features.
- Added visual-only examples for unsupported ECharts series so they remain usable as ordinary ECharts charts without creating a Chart2Music control.
- Added graceful handling for unsupported series, including radar, map, graph, gauge, parallel, sankey, lines, pictorial bar, theme river, custom, bubble scatter, and waterfall charts.
- Added converter, connection, Storybook, demo-option, and ECharts compatibility tests with coverage reporting.
- Added Node.js 24 support in the development and GitHub Actions workflows.
