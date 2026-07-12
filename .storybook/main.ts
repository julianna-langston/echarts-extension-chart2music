import type { StorybookConfig } from "@storybook/html-vite";

const config = {
  stories: ["../stories/**/*.stories.ts"],
  framework: {
    name: "@storybook/html-vite",
    options: {}
  }
} satisfies StorybookConfig;

export default config;
