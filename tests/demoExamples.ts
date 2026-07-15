import { optionsByType, supportedByChart2Music, type DemoExample } from "../stories/chart-examples";

export type { DemoExample };

export type DemoExamples = {
  supportedByChart2Music: Set<string>;
  optionsByType: DemoExample[];
};

export const loadDemoExamples = (): DemoExamples => {
  return { supportedByChart2Music, optionsByType };
};
