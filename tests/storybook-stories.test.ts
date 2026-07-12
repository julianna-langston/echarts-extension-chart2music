import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { optionsByType, supportedByChart2Music } from "../stories/chart-examples";

const generatedDirectory = new URL("../stories/generated/", import.meta.url);
const generatedStories = readdirSync(generatedDirectory)
  .filter((file) => file.endsWith(".stories.ts"))
  .map((file) => readFileSync(new URL(file, generatedDirectory), "utf8"));

describe("generated Storybook examples", () => {
  it("creates one story for every chart example", () => {
    const storyExamples = generatedStories.flatMap((source) => [
      ...source.matchAll(/getExample\(("(?:[^"\\]|\\.)*")\)/g)
    ].map((match) => JSON.parse(match[1] ?? "\"\"")));
    const exampleNames = optionsByType.map((example) => example.title ?? example.type);

    expect(storyExamples).toHaveLength(exampleNames.length);
    expect(new Set(storyExamples)).toEqual(new Set(exampleNames));
  });

  it("omits a supported chart type from its story label", () => {
    const lineStories = generatedStories.find((source) => source.includes('title: "ECharts Examples/Line"'));

    expect(lineStories).toContain('name: "smooth"');
    expect(lineStories).not.toContain('name: "line: smooth"');
  });

  it("provides ECharts display options to every story section", () => {
    generatedStories.forEach((source) => {
      expect(source).toContain("showTooltip: true");
      expect(source).toContain("showXAxisLabels: true");
      expect(source).toContain("showYAxisLabels: true");
      expect(source).toContain("showLegend: true");
      expect(source).toContain("animation: true");
    });
  });

  it("puts unsupported ECharts types in the Visual only section", () => {
    const visualOnly = generatedStories.find((source) => source.includes('title: "ECharts Examples/Visual only"'));
    const visualOnlyNames = visualOnly
      ? [...visualOnly.matchAll(/name: ("(?:[^"\\]|\\.)*")/g)].map((match) => JSON.parse(match[1] ?? "\"\""))
      : [];
    const expectedVisualOnlyNames = optionsByType
      .filter((example) => !supportedByChart2Music.has(example.type))
      .map((example) => example.title ?? example.type);

    expect(visualOnlyNames).toEqual(expectedVisualOnlyNames);
    expect(visualOnly).toContain("createEChartsExample(getExample");
    expect(visualOnly).toContain(", false, args)");
  });
});
