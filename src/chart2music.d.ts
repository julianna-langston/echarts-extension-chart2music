declare module "chart2music" {
  export type C2MChartConfig = {
    type:
      | "band"
      | "bar"
      | "box"
      | "candlestick"
      | "histogram"
      | "line"
      | "matrix"
      | "pie"
      | "scatter"
      | "treemap"
      | "unsupported"
      | Array<
          | "band"
          | "bar"
          | "box"
          | "candlestick"
          | "histogram"
          | "line"
          | "matrix"
          | "pie"
          | "scatter"
          | "treemap"
          | "unsupported"
        >;
    data: Array<number | DataPoint> | Record<string, Array<number | DataPoint> | null>;
    element: HTMLElement | SVGElement;
    lang?: string;
    axes?: {
      x?: AxisData;
      y?: AxisData;
      y2?: AxisData;
    };
    title?: string;
    cc?: HTMLElement;
    audioEngine?: AudioEngine;
    options?: C2MOptions;
    info?: {
      notes?: string[];
      annotations?: Array<{
        x: number;
        label: string;
      }>;
    };
  };

  export type AxisData = {
    minimum?: number;
    maximum?: number;
    label?: string;
    format?: (value: number) => string;
    type?: "linear" | "log10";
    valueLabels?: string[];
    continuous?: boolean;
  };

  export type DataPoint = {
    x: number;
    y?: number;
    y2?: number;
    high?: number;
    low?: number;
    open?: number;
    close?: number;
    q1?: number;
    q3?: number;
    median?: number;
    outlier?: number[];
    label?: string;
    children?: string;
    custom?: unknown;
  };

  export type AudioEngine = {
    masterGain: number;
    playDataPoint(frequency: number, panning: number, duration: number): void;
    playNotification?(notificationType: string, panning?: number, duration?: number): void;
  };

  export type C2MCallback = {
    slice: string;
    index: number;
    point: DataPoint;
  };

  export type TranslationCallbackOptions = {
    language: string;
    id: string;
    evaluators: Record<string, string | number | boolean>;
  };

  export type CustomHotkeyRegistration = {
    key: {
      key: string;
      shiftKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    };
    callback: (point: C2MCallback) => void;
    title?: string;
    keyDescription?: string;
    description?: string;
    force?: boolean;
  };

  export type C2MOptions = {
    enableSound?: boolean;
    enableSpeech?: boolean;
    onFocusCallback?: (point: C2MCallback) => void;
    onSelectCallback?: (point: C2MCallback) => void;
    live?: boolean;
    maxWidth?: number;
    customHotkeys?: CustomHotkeyRegistration[];
    hertzes?: number[];
    stack?: boolean;
    root?: null | string;
    translationCallback?: (options: TranslationCallbackOptions) => string | false;
    modifyHelpDialogText?: (lang: string, text: string) => string;
    modifyHelpDialogKeyboardListing?: (
      lang: string,
      headers: string[],
      shortcuts: string[][]
    ) => string[][];
  };

  export class c2m {
    cleanUp(): void;
    setData(data: C2MChartConfig["data"], axes?: C2MChartConfig["axes"]): void;
    getCurrent(): {
      index: number;
      group: string;
      point: DataPoint;
      stat: string;
    };
  }

  export type C2MReturn = {
    err: string | null;
    data?: c2m;
  };

  const c2mChart: (input: C2MChartConfig) => C2MReturn;
  export { c2mChart };
  export default c2mChart;
}
