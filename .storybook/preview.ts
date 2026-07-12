import type { Preview } from "@storybook/html-vite";
import "../stories/storybook.css";

const preview = {
  parameters: {
    layout: "fullscreen"
  }
} satisfies Preview;

export default preview;
