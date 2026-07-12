// Generated from the former all-chart-types gallery.
// @ts-nocheck

export type DemoExample = {
  type: string;
  category?: string;
  title?: string;
  option: Record<string, unknown>;
};

export const supportedByChart2Music = new Set(["bar", "boxplot", "candlestick", "effectScatter", "funnel", "heatmap", "line", "pie", "scatter", "sunburst", "tree", "treemap"]);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const values = [12, 19, 15, 24, 18, 28];
      const cartesianGrid = { top: 24, right: 18, bottom: 24, left: 14, containLabel: true };
      const lineAxis = {
        grid: cartesianGrid,
        xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
        yAxis: { type: "value" }
      };
      export const regionMap = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "North" },
            geometry: {
              type: "Polygon",
              coordinates: [[[-100, 42], [-88, 42], [-88, 50], [-100, 50], [-100, 42]]]
            }
          },
          {
            type: "Feature",
            properties: { name: "South" },
            geometry: {
              type: "Polygon",
              coordinates: [[[-100, 30], [-88, 30], [-88, 42], [-100, 42], [-100, 30]]]
            }
          },
          {
            type: "Feature",
            properties: { name: "East" },
            geometry: {
              type: "Polygon",
              coordinates: [[[-88, 30], [-76, 30], [-76, 50], [-88, 50], [-88, 30]]]
            }
          }
        ]
      };
export const optionsByType = [
        {
          type: "line",
          title: "line: smooth",
          option: {
            ...lineAxis,
            series: [{ name: "Visits", type: "line", smooth: true, data: values }]
          }
        },
        {
          type: "line",
          title: "line: multiple series",
          option: {
            ...lineAxis,
            legend: { top: 0, right: 8 },
            grid: { ...cartesianGrid, top: 42 },
            series: [
              { name: "North", type: "line", data: [12, 19, 15, 24, 18, 28] },
              { name: "South", type: "line", data: [8, 14, 18, 16, 22, 26] },
              { name: "West", type: "line", data: [16, 11, 13, 19, 25, 21] }
            ]
          }
        },
        {
          type: "line",
          title: "line: gaps and jumps",
          option: {
            ...lineAxis,
            series: [
              {
                name: "Observed",
                type: "line",
                data: [12, null, 22, 7, null, 31],
                connectNulls: false,
                symbolSize: 9
              }
            ]
          }
        },
        {
          type: "line",
          title: "line: stepped",
          option: {
            ...lineAxis,
            series: [{ name: "Plan", type: "line", step: "middle", data: [8, 8, 16, 16, 22, 12] }]
          }
        },
        {
          type: "line",
          title: "line: area",
          option: {
            ...lineAxis,
            series: [
              {
                name: "Volume",
                type: "line",
                smooth: true,
                areaStyle: {},
                data: [5, 11, 9, 20, 17, 26]
              }
            ]
          }
        },
        {
          type: "line",
          title: "line: stacked area",
          option: {
            ...lineAxis,
            legend: { top: 0, right: 8 },
            grid: { ...cartesianGrid, top: 42 },
            series: [
              { name: "Email", type: "line", stack: "Total", areaStyle: {}, data: [6, 8, 9, 12, 10, 14] },
              { name: "Search", type: "line", stack: "Total", areaStyle: {}, data: [5, 7, 6, 8, 11, 10] },
              { name: "Direct", type: "line", stack: "Total", areaStyle: {}, data: [3, 4, 5, 5, 7, 8] }
            ]
          }
        },
        {
          type: "line",
          title: "line: marks",
          option: {
            ...lineAxis,
            series: [
              {
                name: "Temperature",
                type: "line",
                data: [18, 21, 25, 19, 28, 24],
                markPoint: { data: [{ type: "max", name: "Max" }, { type: "min", name: "Min" }] },
                markLine: { data: [{ type: "average", name: "Avg" }] },
                markArea: { data: [[{ xAxis: "Mar" }, { xAxis: "Apr" }]] }
              }
            ]
          }
        },
        {
          type: "line",
          title: "line: visual map",
          option: {
            ...lineAxis,
            visualMap: {
              show: false,
              dimension: 1,
              pieces: [
                { lte: 12, color: "#5470c6" },
                { gt: 12, lte: 22, color: "#91cc75" },
                { gt: 22, color: "#ee6666" }
              ]
            },
            series: [{ name: "Load", type: "line", data: [9, 15, 11, 24, 29, 18] }]
          }
        },
        {
          type: "bar",
          title: "bar: basic",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [{ name: "Revenue", type: "bar", data: values }]
          }
        },
        {
          type: "bar",
          title: "bar: grouped",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              { name: "North", type: "bar", data: [12, 18, 15, 20, 17, 23] },
              { name: "South", type: "bar", data: [9, 14, 17, 16, 20, 21] },
              { name: "West", type: "bar", data: [15, 10, 13, 18, 22, 19] }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: stacked",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              { name: "Email", type: "bar", stack: "Total", data: [6, 8, 9, 12, 10, 14] },
              { name: "Search", type: "bar", stack: "Total", data: [5, 7, 6, 8, 11, 10] },
              { name: "Direct", type: "bar", stack: "Total", data: [3, 4, 5, 5, 7, 8] }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: floating range",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              {
                name: "Offset",
                type: "bar",
                stack: "range",
                itemStyle: { borderColor: "transparent", color: "transparent" },
                emphasis: { disabled: true },
                data: [3, 5, 2, 8, 6, 9]
              },
              {
                name: "Range",
                type: "bar",
                stack: "range",
                data: [8, 10, 6, 11, 7, 13]
              }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: waterfall",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: ["Start", "Sales", "Costs", "Tax", "End"], axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              {
                name: "Base",
                type: "bar",
                stack: "total",
                itemStyle: { borderColor: "transparent", color: "transparent" },
                emphasis: { disabled: true },
                data: [0, 20, 35, 22, 0]
              },
              {
                name: "Change",
                type: "bar",
                stack: "total",
                label: { show: true, position: "top" },
                data: [20, 15, -13, -5, 17]
              }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: bar-line",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: [
              { type: "value", name: "Sales" },
              { type: "value", name: "Rate" }
            ],
            series: [
              { name: "Sales", type: "bar", data: [12, 19, 15, 24, 18, 28] },
              { name: "Conversion", type: "line", yAxisIndex: 1, smooth: true, data: [3, 4, 5, 4, 6, 7] }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: data labels",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              {
                name: "Revenue",
                type: "bar",
                label: { show: true, position: "top" },
                data: values
              }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: horizontal",
          option: {
            grid: { top: 18, right: 18, bottom: 18, left: 14, containLabel: true },
            xAxis: { type: "value" },
            yAxis: { type: "category", data: months, axisLabel: { hideOverlap: true } },
            series: [{ name: "Tickets", type: "bar", data: [8, 15, 13, 22, 19, 25] }]
          }
        },
        {
          type: "bar",
          title: "bar: negative values",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              {
                name: "Delta",
                type: "bar",
                data: [-8, 12, -4, 18, -10, 7],
                itemStyle: {
                  color: (params) => (params.value < 0 ? "#ee6666" : "#5470c6")
                }
              }
            ]
          }
        },
        {
          type: "bar",
          title: "bar: background",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: months, name: "Month", nameTextStyle: { color: "transparent" }, axisLabel: { hideOverlap: true } },
            yAxis: { type: "value" },
            series: [
              {
                name: "Completion",
                type: "bar",
                showBackground: true,
                backgroundStyle: { color: "rgba(180, 180, 180, 0.2)" },
                data: [48, 62, 55, 78, 69, 86]
              }
            ]
          }
        },
        {
          type: "pie",
          title: "pie: doughnut",
          option: {
            series: [
              {
                name: "Share",
                type: "pie",
                radius: ["35%", "68%"],
                data: months.slice(0, 4).map((name, index) => ({ name, value: values[index] }))
              }
            ]
          }
        },
        {
          type: "pie",
          title: "pie: rose",
          option: {
            series: [
              {
                name: "Segments",
                type: "pie",
                radius: [20, 110],
                center: ["50%", "52%"],
                roseType: "area",
                data: [
                  { name: "Alpha", value: 46 },
                  { name: "Beta", value: 24 },
                  { name: "Gamma", value: 14 },
                  { name: "Delta", value: 9 },
                  { name: "Epsilon", value: 7 }
                ]
              }
            ]
          }
        },
        {
          type: "pie",
          title: "pie: nested rings",
          option: {
            tooltip: { trigger: "item" },
            series: [
              {
                name: "Channel",
                type: "pie",
                selectedMode: "single",
                radius: [0, "38%"],
                label: { position: "inner", fontSize: 11 },
                data: [
                  { name: "Organic", value: 42 },
                  { name: "Paid", value: 32 },
                  { name: "Referral", value: 26 }
                ]
              },
              {
                name: "Source",
                type: "pie",
                radius: ["52%", "74%"],
                data: [
                  { name: "Search", value: 24 },
                  { name: "Social", value: 18 },
                  { name: "Display", value: 19 },
                  { name: "Email", value: 13 },
                  { name: "Partner", value: 26 }
                ]
              }
            ]
          }
        },
        {
          type: "pie",
          title: "pie: half doughnut",
          option: {
            series: [
              {
                name: "Progress",
                type: "pie",
                radius: ["45%", "72%"],
                center: ["50%", "68%"],
                startAngle: 180,
                endAngle: 360,
                data: [
                  { name: "Complete", value: 68 },
                  { name: "Remaining", value: 32, itemStyle: { color: "#d8dee9" } }
                ]
              }
            ]
          }
        },
        {
          type: "sunburst",
          category: "hierarchy",
          title: "sunburst: hierarchy",
          option: {
            series: [
              {
                type: "sunburst",
                radius: [0, "88%"],
                data: [
                  { name: "A", value: 10, children: [{ name: "A1", value: 4 }, { name: "A2", value: 6 }] },
                  { name: "B", value: 8, children: [{ name: "B1", value: 3 }, { name: "B2", value: 5 }] }
                ]
              }
            ]
          }
        },
        {
          type: "scatter",
          title: "scatter: basic",
          option: {
            grid: cartesianGrid,
            xAxis: {},
            yAxis: {},
            series: [
              {
                name: "Samples",
                type: "scatter",
                symbolSize: 12,
                data: [[1, 8], [2, 12], [3, 9], [4, 18], [5, 16], [6, 23]]
              }
            ]
          }
        },
        {
          type: "scatter",
          title: "scatter: colored",
          option: {
            grid: cartesianGrid,
            xAxis: {},
            yAxis: {},
            visualMap: {
              show: false,
              min: 0,
              max: 30,
              dimension: 2,
              inRange: { color: ["#5470c6", "#91cc75", "#fac858", "#ee6666"] }
            },
            series: [
              {
                name: "Colored samples",
                type: "scatter",
                symbolSize: 13,
                label: { show: true, formatter: "{b}", position: "right" },
                data: [
                  { name: "A", value: [1, 8, 6] },
                  { name: "B", value: [2, 12, 12] },
                  { name: "C", value: [3, 9, 9] },
                  { name: "D", value: [4, 18, 22] },
                  { name: "E", value: [5, 16, 18] },
                  { name: "F", value: [6, 23, 28] }
                ]
              }
            ]
          }
        },
        {
          type: "scatter",
          title: "scatter: categories",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: {},
            yAxis: {},
            series: [
              { name: "North", type: "scatter", symbolSize: 11, data: [[1, 9], [2, 11], [3, 15], [4, 18]] },
              { name: "South", type: "scatter", symbolSize: 11, data: [[1, 6], [2, 10], [3, 8], [4, 13]] }
            ]
          }
        },
        {
          type: "effectScatter",
          category: "scatter",
          title: "scatter: effect",
          option: {
            grid: cartesianGrid,
            xAxis: {},
            yAxis: {},
            series: [{ type: "effectScatter", rippleEffect: { scale: 3 }, data: [[1, 9], [2, 15], [3, 12], [4, 22]] }]
          }
        },
        {
          type: "scatter",
          title: "scatter: mixed effect",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: {},
            yAxis: {},
            series: [
              {
                name: "Samples",
                type: "scatter",
                symbolSize: 11,
                data: [[1, 8], [2, 12], [3, 9], [4, 18], [5, 16], [6, 23]]
              },
              {
                type: "effectScatter",
                rippleEffect: { scale: 3 },
                symbolSize: 14,
                data: [[2, 20], [5, 26]]
              }
            ]
          }
        },
        {
          type: "radar",
          title: "radar: basic",
          option: {
            radar: {
              indicator: [
                { name: "Speed", max: 100 },
                { name: "Reliability", max: 100 },
                { name: "Comfort", max: 100 },
                { name: "Cost", max: 100 }
              ]
            },
            series: [{ type: "radar", data: [{ value: [78, 88, 64, 55], name: "Model A" }] }]
          }
        },
        {
          type: "radar",
          title: "radar: multiple profiles",
          option: {
            legend: { top: 0, right: 8 },
            radar: {
              center: ["50%", "56%"],
              radius: "68%",
              indicator: [
                { name: "Speed", max: 100 },
                { name: "Reliability", max: 100 },
                { name: "Comfort", max: 100 },
                { name: "Safety", max: 100 },
                { name: "Cost", max: 100 }
              ]
            },
            series: [
              {
                type: "radar",
                data: [
                  { name: "Model A", value: [78, 88, 64, 82, 55] },
                  { name: "Model B", value: [62, 72, 84, 70, 76] },
                  { name: "Model C", value: [90, 66, 58, 74, 44] }
                ]
              }
            ]
          }
        },
        {
          type: "radar",
          title: "radar: different ranges",
          option: {
            radar: {
              center: ["50%", "55%"],
              radius: "66%",
              indicator: [
                { name: "Latency ms", min: 0, max: 500 },
                { name: "Revenue", min: 0, max: 1000000 },
                { name: "Error rate", min: 0, max: 5 },
                { name: "Satisfaction", min: 1, max: 10 },
                { name: "Coverage", min: 60, max: 100 }
              ],
              axisName: {
                formatter: (name, indicator) => {
                  const min = indicator?.min ?? 0;
                  const max = indicator?.max ?? "";
                  return `${name}\n${min}-${max}`;
                }
              }
            },
            series: [
              {
                name: "Product A",
                type: "radar",
                areaStyle: { opacity: 0.12 },
                data: [{ value: [180, 640000, 1.8, 8.7, 92], name: "Product A" }]
              }
            ]
          }
        },
        {
          type: "radar",
          title: "radar: circular area",
          option: {
            radar: {
              shape: "circle",
              splitNumber: 4,
              center: ["50%", "54%"],
              radius: "68%",
              splitArea: {
                areaStyle: {
                  color: ["rgba(84,112,198,0.08)", "rgba(145,204,117,0.08)"]
                }
              },
              indicator: [
                { name: "Design", max: 10 },
                { name: "Build", max: 10 },
                { name: "Docs", max: 10 },
                { name: "Tests", max: 10 },
                { name: "Ops", max: 10 },
                { name: "Support", max: 10 }
              ]
            },
            series: [
              {
                type: "radar",
                lineStyle: { width: 2 },
                areaStyle: { opacity: 0.22 },
                data: [
                  { name: "Current", value: [8, 7, 6, 9, 5, 7] },
                  { name: "Target", value: [9, 8, 8, 9, 8, 8] }
                ]
              }
            ]
          }
        },
        {
          type: "radar",
          title: "radar: negative ranges",
          option: {
            radar: {
              center: ["50%", "55%"],
              radius: "66%",
              indicator: [
                { name: "Growth", min: -20, max: 40 },
                { name: "Margin", min: -10, max: 30 },
                { name: "Cash flow", min: -50, max: 100 },
                { name: "Risk", min: -5, max: 5 },
                { name: "Sentiment", min: -100, max: 100 }
              ]
            },
            series: [
              {
                type: "radar",
                symbol: "circle",
                symbolSize: 5,
                data: [
                  { name: "Quarter 1", value: [12, 18, 36, -2, 42] },
                  { name: "Quarter 2", value: [28, 22, 64, 1, 58] }
                ]
              }
            ]
          }
        },
        {
          type: "map",
          title: "map: choropleth",
          option: {
            visualMap: { min: 0, max: 100, left: 10, bottom: 10, calculable: true },
            series: {
              type: "map",
              map: "demo-regions",
              data: [
                { name: "North", value: 72 },
                { name: "South", value: 46 },
                { name: "East", value: 88 }
              ]
            }
          }
        },
        {
          type: "map",
          title: "map: labels and selection",
          option: {
            tooltip: {},
            series: {
              type: "map",
              map: "demo-regions",
              selectedMode: "multiple",
              label: { show: true },
              select: { label: { show: true, color: "#18212f" }, itemStyle: { areaColor: "#fac858" } },
              emphasis: { label: { show: true }, itemStyle: { areaColor: "#91cc75" } },
              data: [
                { name: "North", value: 72, selected: true },
                { name: "South", value: 46 },
                { name: "East", value: 88, selected: true }
              ]
            }
          }
        },
        {
          type: "map",
          title: "map: piecewise regions",
          option: {
            tooltip: {},
            visualMap: {
              type: "piecewise",
              left: 10,
              bottom: 10,
              pieces: [
                { min: 80, label: "High", color: "#ee6666" },
                { min: 50, max: 79, label: "Medium", color: "#fac858" },
                { max: 49, label: "Low", color: "#91cc75" }
              ]
            },
            series: {
              type: "map",
              map: "demo-regions",
              roam: true,
              data: [
                { name: "North", value: 72 },
                { name: "South", value: 46 },
                { name: "East", value: 88 }
              ]
            }
          }
        },
        {
          type: "map",
          title: "map: geo scatter overlay",
          option: {
            tooltip: {},
            geo: {
              map: "demo-regions",
              roam: false,
              label: { show: true },
              itemStyle: { areaColor: "#edf2f7", borderColor: "#98a2b3" },
              emphasis: { itemStyle: { areaColor: "#d9e7ff" } }
            },
            visualMap: { show: false, min: 0, max: 100 },
            series: [
              {
                type: "scatter",
                coordinateSystem: "geo",
                symbolSize: (value) => Math.max(10, value[2] / 4),
                data: [
                  { name: "North hub", value: [-94, 46, 72] },
                  { name: "South hub", value: [-94, 36, 46] },
                  { name: "East hub", value: [-82, 40, 88] }
                ]
              }
            ]
          }
        },
        {
          type: "tree",
          category: "hierarchy",
          title: "tree: left-to-right",
          option: {
            series: [
              {
                type: "tree",
                top: "8%",
                bottom: "8%",
                symbolSize: 9,
                label: { position: "left" },
                data: [
                  {
                    name: "All",
                    children: [
                      { name: "Alpha", value: 12 },
                      { name: "Beta", children: [{ name: "Beta 1" }, { name: "Beta 2" }] }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "tree",
          category: "hierarchy",
          title: "tree: radial",
          option: {
            series: [
              {
                type: "tree",
                layout: "radial",
                symbolSize: 8,
                initialTreeDepth: 3,
                label: { rotate: 0 },
                data: [
                  {
                    name: "Root",
                    children: [
                      { name: "Alpha", children: [{ name: "Alpha 1" }, { name: "Alpha 2" }] },
                      { name: "Beta", children: [{ name: "Beta 1" }, { name: "Beta 2" }] },
                      { name: "Gamma", children: [{ name: "Gamma 1" }, { name: "Gamma 2" }] }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "tree",
          category: "hierarchy",
          title: "tree: collapsed branches",
          option: {
            series: [
              {
                type: "tree",
                top: "8%",
                bottom: "8%",
                left: "14%",
                right: "18%",
                orient: "LR",
                expandAndCollapse: true,
                initialTreeDepth: 1,
                symbolSize: 9,
                label: { position: "left" },
                leaves: { label: { position: "right" } },
                data: [
                  {
                    name: "Products",
                    children: [
                      { name: "Analytics", children: [{ name: "Dashboards" }, { name: "Reports" }] },
                      { name: "Automation", children: [{ name: "Rules" }, { name: "Alerts" }] },
                      { name: "Support", children: [{ name: "Tickets" }, { name: "Chat" }] }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "tree",
          category: "hierarchy",
          title: "tree: vertical org",
          option: {
            series: [
              {
                type: "tree",
                top: "10%",
                bottom: "14%",
                layout: "orthogonal",
                orient: "TB",
                symbol: "roundRect",
                symbolSize: [56, 22],
                label: { position: "inside", color: "#18212f" },
                lineStyle: { curveness: 0.5 },
                data: [
                  {
                    name: "CEO",
                    children: [
                      { name: "Design", children: [{ name: "UX" }, { name: "Brand" }] },
                      { name: "Data", children: [{ name: "ML" }, { name: "BI" }] },
                      { name: "Ops", children: [{ name: "QA" }, { name: "IT" }] }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "treemap",
          category: "hierarchy",
          title: "treemap: basic",
          option: {
            series: [
              {
                type: "treemap",
                roam: false,
                data: [
                  { name: "A", value: 34 },
                  { name: "B", value: 22 },
                  { name: "C", value: 18 },
                  { name: "D", value: 12 }
                ]
              }
            ]
          }
        },
        {
          type: "treemap",
          category: "hierarchy",
          title: "treemap: nested",
          option: {
            tooltip: {},
            series: [
              {
                type: "treemap",
                roam: false,
                breadcrumb: { show: true },
                data: [
                  {
                    name: "Hardware",
                    value: 42,
                    children: [
                      { name: "Sensors", value: 18 },
                      { name: "Displays", value: 14 },
                      { name: "Batteries", value: 10 }
                    ]
                  },
                  {
                    name: "Software",
                    value: 36,
                    children: [
                      { name: "Platform", value: 20 },
                      { name: "Apps", value: 16 }
                    ]
                  },
                  { name: "Services", value: 22 }
                ]
              }
            ]
          }
        },
        {
          type: "treemap",
          category: "hierarchy",
          title: "treemap: levels",
          option: {
            tooltip: {},
            series: [
              {
                type: "treemap",
                roam: false,
                leafDepth: 1,
                label: { show: true, formatter: "{b}" },
                upperLabel: { show: true, height: 22 },
                levels: [
                  { itemStyle: { borderWidth: 0, gapWidth: 4 } },
                  { colorSaturation: [0.35, 0.6], itemStyle: { borderWidth: 4, gapWidth: 2 } },
                  { colorSaturation: [0.5, 0.75], itemStyle: { borderWidth: 2, gapWidth: 1 } }
                ],
                data: [
                  {
                    name: "Acquisition",
                    value: 50,
                    children: [
                      { name: "Search", value: 22 },
                      { name: "Social", value: 16 },
                      { name: "Referral", value: 12 }
                    ]
                  },
                  {
                    name: "Retention",
                    value: 38,
                    children: [
                      { name: "Email", value: 18 },
                      { name: "Community", value: 11 },
                      { name: "Events", value: 9 }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "treemap",
          category: "hierarchy",
          title: "treemap: visual dimension",
          option: {
            tooltip: {},
            visualMap: { show: false, min: 0, max: 100, dimension: 1, inRange: { color: ["#91cc75", "#fac858", "#ee6666"] } },
            series: [
              {
                type: "treemap",
                roam: false,
                visualDimension: 1,
                data: [
                  { name: "A", value: [34, 82] },
                  { name: "B", value: [22, 64] },
                  { name: "C", value: [18, 38] },
                  { name: "D", value: [12, 24] }
                ]
              }
            ]
          }
        },
        {
          type: "graph",
          option: {
            series: [
              {
                type: "graph",
                layout: "force",
                roam: false,
                label: { show: true },
                force: { repulsion: 120 },
                data: ["One", "Two", "Three", "Four"].map((name) => ({ name, value: 10 })),
                links: [
                  { source: "One", target: "Two" },
                  { source: "One", target: "Three" },
                  { source: "Two", target: "Four" }
                ]
              }
            ]
          }
        },
        {
          type: "gauge",
          title: "gauge: progress",
          option: {
            series: [{ type: "gauge", progress: { show: true }, data: [{ value: 68, name: "Score" }] }]
          }
        },
        {
          type: "gauge",
          title: "gauge: multi pointer",
          option: {
            series: [
              {
                type: "gauge",
                anchor: { show: true, size: 12 },
                pointer: { show: true },
                progress: { show: true, overlap: true },
                data: [
                  { value: 72, name: "CPU" },
                  { value: 54, name: "Memory" },
                  { value: 38, name: "Disk" }
                ]
              }
            ]
          }
        },
        {
          type: "gauge",
          title: "gauge: speedometer",
          option: {
            series: [
              {
                type: "gauge",
                min: 0,
                max: 160,
                splitNumber: 8,
                axisLine: { lineStyle: { width: 12 } },
                detail: { formatter: "{value} mph" },
                data: [{ value: 86, name: "Speed" }]
              }
            ]
          }
        },
        {
          type: "funnel",
          title: "funnel: conversion",
          option: {
            series: [
              {
                type: "funnel",
                data: [
                  { name: "Visit", value: 100 },
                  { name: "Lead", value: 72 },
                  { name: "Trial", value: 44 },
                  { name: "Buy", value: 28 }
                ]
              }
            ]
          }
        },
        {
          type: "funnel",
          title: "funnel: sorted ascending",
          option: {
            series: [
              {
                type: "funnel",
                sort: "ascending",
                label: { position: "inside" },
                data: [
                  { name: "Aware", value: 38 },
                  { name: "Interested", value: 52 },
                  { name: "Trial", value: 68 },
                  { name: "Adopt", value: 86 }
                ]
              }
            ]
          }
        },
        {
          type: "funnel",
          title: "funnel: compare",
          option: {
            legend: { top: 0, right: 8 },
            series: [
              {
                name: "Actual",
                type: "funnel",
                left: "8%",
                width: "40%",
                top: 42,
                bottom: 12,
                data: [
                  { name: "Visit", value: 100 },
                  { name: "Lead", value: 64 },
                  { name: "Buy", value: 24 }
                ]
              },
              {
                name: "Goal",
                type: "funnel",
                left: "52%",
                width: "40%",
                top: 42,
                bottom: 12,
                data: [
                  { name: "Visit", value: 100 },
                  { name: "Lead", value: 76 },
                  { name: "Buy", value: 34 }
                ]
              }
            ]
          }
        },
        {
          type: "parallel",
          option: {
            parallelAxis: [
              { dim: 0, name: "Price" },
              { dim: 1, name: "Speed" },
              { dim: 2, name: "Quality" }
            ],
            parallel: { left: 46, right: 24, bottom: 30, top: 36 },
            series: [{ type: "parallel", data: [[12, 78, 88], [18, 64, 74], [8, 92, 65]] }]
          }
        },
        {
          type: "sankey",
          option: {
            series: [
              {
                type: "sankey",
                emphasis: { focus: "adjacency" },
                data: [{ name: "Traffic" }, { name: "Search" }, { name: "Signup" }, { name: "Purchase" }],
                links: [
                  { source: "Traffic", target: "Search", value: 8 },
                  { source: "Search", target: "Signup", value: 5 },
                  { source: "Signup", target: "Purchase", value: 3 }
                ]
              }
            ]
          }
        },
        {
          type: "boxplot",
          title: "boxplot: basic",
          option: {
            xAxis: { type: "category", data: ["A", "B", "C"] },
            yAxis: { type: "value" },
            series: [{ type: "boxplot", data: [[4, 7, 10, 14, 18], [6, 9, 12, 16, 21], [3, 8, 13, 17, 25]] }]
          }
        },
        {
          type: "boxplot",
          title: "boxplot: with outliers",
          option: {
            tooltip: { trigger: "item" },
            grid: cartesianGrid,
            xAxis: { type: "category", data: ["A", "B", "C"] },
            yAxis: { type: "value" },
            series: [
              {
                name: "Distribution",
                type: "boxplot",
                data: [[4, 7, 10, 14, 18], [6, 9, 12, 16, 21], [3, 8, 13, 17, 25]]
              },
              {
                name: "Outliers",
                type: "scatter",
                symbolSize: 11,
                data: [[0, 23], [1, 3], [1, 26], [2, 29]]
              }
            ]
          }
        },
        {
          type: "boxplot",
          title: "boxplot: grouped",
          option: {
            tooltip: { trigger: "item" },
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: { type: "category", data: ["A", "B", "C"] },
            yAxis: { type: "value" },
            series: [
              { name: "Control", type: "boxplot", data: [[4, 7, 10, 14, 18], [6, 9, 12, 16, 21], [3, 8, 13, 17, 25]] },
              { name: "Variant", type: "boxplot", data: [[5, 8, 11, 15, 20], [7, 11, 14, 18, 24], [4, 9, 15, 20, 28]] }
            ]
          }
        },
        {
          type: "boxplot",
          title: "boxplot: styled",
          option: {
            tooltip: { trigger: "item" },
            grid: cartesianGrid,
            xAxis: { type: "category", data: ["North", "South", "East", "West"] },
            yAxis: { type: "value", splitArea: { show: true } },
            series: [
              {
                type: "boxplot",
                boxWidth: ["18%", "58%"],
                itemStyle: { color: "#91cc75", borderColor: "#0f7b62", borderWidth: 2 },
                data: [[12, 18, 24, 30, 42], [9, 16, 19, 26, 34], [14, 21, 28, 36, 48], [8, 13, 17, 25, 31]]
              }
            ]
          }
        },
        {
          type: "candlestick",
          title: "candlestick: basic",
          option: {
            xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
            yAxis: { scale: true },
            series: [{ type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 38, 28, 42], [38, 32, 30, 40], [32, 42, 31, 46]] }]
          }
        },
        {
          type: "candlestick",
          title: "candlestick: moving average",
          option: {
            grid: { ...cartesianGrid, top: 42 },
            legend: { top: 0, right: 8 },
            xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
            yAxis: { scale: true },
            series: [
              {
                name: "OHLC",
                type: "candlestick",
                data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 38, 28, 42], [38, 32, 30, 40], [32, 42, 31, 46], [42, 45, 39, 49]]
              },
              {
                name: "MA",
                type: "line",
                smooth: true,
                symbol: "none",
                data: [27, 32, 34, 35, 37, 40]
              }
            ]
          }
        },
        {
          type: "candlestick",
          title: "candlestick: volume",
          option: {
            tooltip: { trigger: "axis" },
            grid: [
              { left: 36, right: 18, top: 20, height: 170 },
              { left: 36, right: 18, top: 214, height: 52 }
            ],
            xAxis: [
              { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"], axisLabel: { hideOverlap: true } },
              { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"], gridIndex: 1, axisLabel: { show: false } }
            ],
            yAxis: [{ scale: true }, { gridIndex: 1, splitNumber: 2 }],
            series: [
              { name: "OHLC", type: "candlestick", data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 38, 28, 42], [38, 32, 30, 40], [32, 42, 31, 46]] },
              { name: "Volume", type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: [120, 92, 140, 110, 160] }
            ]
          }
        },
        {
          type: "candlestick",
          title: "candlestick: marks and zoom",
          option: {
            tooltip: { trigger: "axis" },
            grid: { ...cartesianGrid, bottom: 52 },
            dataZoom: [{ type: "inside" }, { type: "slider", bottom: 10, height: 24 }],
            xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
            yAxis: { scale: true },
            series: [
              {
                type: "candlestick",
                itemStyle: { color: "#ee6666", color0: "#91cc75", borderColor: "#ee6666", borderColor0: "#91cc75" },
                data: [[20, 34, 10, 38], [34, 30, 28, 36], [30, 38, 28, 42], [38, 32, 30, 40], [32, 42, 31, 46], [42, 45, 39, 49], [45, 41, 37, 47]],
                markPoint: { data: [{ type: "max", name: "High" }, { type: "min", name: "Low" }] },
                markLine: { data: [{ yAxis: 36, name: "Reference" }] }
              }
            ]
          }
        },
        {
          type: "lines",
          option: {
            geo: {
              map: "demo-regions",
              roam: false,
              itemStyle: { areaColor: "#edf2f7", borderColor: "#98a2b3" }
            },
            series: [
              {
                type: "lines",
                coordinateSystem: "geo",
                effect: { show: true, symbolSize: 6 },
                lineStyle: { width: 2 },
                data: [
                  { coords: [[-97, 46], [-82, 36]] },
                  { coords: [[-96, 34], [-82, 45]] }
                ]
              }
            ]
          }
        },
        {
          type: "heatmap",
          title: "heatmap: matrix",
          option: {
            tooltip: {},
            xAxis: { type: "category", data: ["A", "B", "C", "D"] },
            yAxis: { type: "category", data: ["W", "X", "Y", "Z"] },
            visualMap: { min: 0, max: 10, left: 10, bottom: 10 },
            series: [{ type: "heatmap", data: [[0, 0, 5], [1, 0, 8], [2, 0, "-"], [2, 1, 3], [0, 2, null], [3, 2, 9], [1, 3, 6]] }]
          }
        },
        {
          type: "heatmap",
          title: "heatmap: calendar",
          option: {
            tooltip: {},
            visualMap: { min: 0, max: 100, orient: "horizontal", left: "center", bottom: 8 },
            calendar: {
              top: 54,
              left: 18,
              right: 18,
              cellSize: ["auto", 22],
              range: ["2026-01-01", "2026-01-31"]
            },
            series: [
              {
                type: "heatmap",
                coordinateSystem: "calendar",
                data: Array.from({ length: 31 }, (_item, index) => [
                  `2026-01-${String(index + 1).padStart(2, "0")}`,
                  Math.round(20 + Math.abs(Math.sin(index / 3)) * 70)
                ])
              }
            ]
          }
        },
        {
          type: "heatmap",
          title: "heatmap: labeled",
          option: {
            tooltip: {},
            grid: cartesianGrid,
            xAxis: { type: "category", data: ["Morning", "Midday", "Evening"] },
            yAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu"] },
            visualMap: { min: 0, max: 10, show: false },
            series: [
              {
                type: "heatmap",
                label: { show: true },
                data: [[0, 0, 3], [1, 0, 8], [2, 0, 5], [0, 1, 6], [1, 1, 9], [2, 1, 7], [0, 2, 4], [1, 2, 5], [2, 2, 8], [0, 3, 2], [1, 3, 6], [2, 3, 10]]
              }
            ]
          }
        },
        {
          type: "pictorialBar",
          title: "pictorialBar: repeat",
          option: {
            xAxis: { type: "category", data: ["A", "B", "C", "D"] },
            yAxis: {},
            series: [{ type: "pictorialBar", symbol: "rect", symbolRepeat: true, symbolSize: [18, 8], data: [6, 9, 4, 7] }]
          }
        },
        {
          type: "pictorialBar",
          title: "pictorialBar: symbols",
          option: {
            grid: cartesianGrid,
            xAxis: { type: "category", data: ["A", "B", "C", "D"] },
            yAxis: {},
            series: [
              {
                type: "pictorialBar",
                symbol: "diamond",
                symbolSize: [22, 16],
                symbolPosition: "end",
                data: [12, 19, 15, 24]
              }
            ]
          }
        },
        {
          type: "pictorialBar",
          title: "pictorialBar: horizontal",
          option: {
            grid: { top: 18, right: 18, bottom: 18, left: 14, containLabel: true },
            xAxis: { type: "value" },
            yAxis: { type: "category", data: ["Alpha", "Beta", "Gamma"] },
            series: [
              {
                type: "pictorialBar",
                symbol: "roundRect",
                symbolRepeat: "fixed",
                symbolMargin: 3,
                symbolClip: true,
                symbolSize: [12, 18],
                data: [64, 82, 48]
              }
            ]
          }
        },
        {
          type: "themeRiver",
          option: {
            singleAxis: { type: "time", bottom: 40 },
            series: [
              {
                type: "themeRiver",
                data: [
                  ["2026/01/01", 10, "Alpha"], ["2026/02/01", 14, "Alpha"], ["2026/03/01", 9, "Alpha"],
                  ["2026/01/01", 8, "Beta"], ["2026/02/01", 6, "Beta"], ["2026/03/01", 13, "Beta"]
                ]
              }
            ]
          }
        },
        {
          type: "custom",
          option: {
            xAxis: { type: "category", data: ["A", "B", "C", "D"] },
            yAxis: {},
            series: [
              {
                type: "custom",
                data: [[0, 5], [1, 9], [2, 6], [3, 12]],
                renderItem: (params, api) => {
                  const x = api.coord([api.value(0), api.value(1)])[0];
                  const y = api.coord([api.value(0), api.value(1)])[1];
                  return {
                    type: "circle",
                    shape: { cx: x, cy: y, r: 12 },
                    style: api.style({ fill: "#5470c6" })
                  };
                }
              }
            ]
          }
        }
      ];

      
