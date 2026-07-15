import type { Preview } from "@storybook/html-vite";

const preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          "ECharts Examples",
          [
            "Bar",
            "Line",
            "Pie",
            "Scatter",
            "Heatmap",
            "Boxplot",
            "Candlestick",
            "Hierarchy",
            "Funnel",
            "Not Supported"
          ]
        ]
      }
    }
  }
} satisfies Preview;

export default preview;
