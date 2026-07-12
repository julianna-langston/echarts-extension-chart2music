import { readFileSync } from "node:fs";

export type DemoExample = {
  type: string;
  category?: string;
  title?: string;
  option: Record<string, unknown>;
};

export type DemoExamples = {
  supportedByChart2Music: Set<string>;
  optionsByType: DemoExample[];
};

let cachedExamples: DemoExamples | null = null;

export const loadDemoExamples = (): DemoExamples => {
  if (cachedExamples) {
    return cachedExamples;
  }

  const html = readFileSync(new URL("../examples/all-chart-types.html", import.meta.url), "utf8");
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];

  if (!script) {
    throw new Error("Unable to find the demo page module script.");
  }

  const start = script.indexOf("const supportedByChart2Music");
  const end = script.indexOf("const gallery");

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Unable to find the demo examples block.");
  }

  const examplesBlock = script
    .slice(start, end)
    .replace(/\s*echarts\.registerMap\("demo-regions", regionMap\);\s*/, "");

  cachedExamples = Function(`
    ${examplesBlock}
    return { supportedByChart2Music, optionsByType };
  `)() as DemoExamples;

  return cachedExamples;
};

