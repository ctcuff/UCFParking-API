<template>
  <div id="chart">
    <v-chart :options="line" autoresize />
  </div>
</template>

<script>
  import Vue from 'vue';
  import eventBus, { events } from '@/util/eventBus';
  import ECharts from 'vue-echarts';
  import moment from 'moment';
  import '@/util/connect';
  import 'echarts/lib/chart/line';
  import 'echarts/lib/chart/line';
  import 'echarts/lib/component/tooltip';
  import 'echarts/lib/component/title';
  import 'echarts/lib/component/dataZoom';
  import 'echarts/lib/component/legend';

  Vue.component('v-chart', ECharts);

  const chartOptions = {
    showAllLines: true,
    fill: false,
    defaultLineWidth: 4,
    thinLine: 2,
    showSlider: false,
    showTooltip: true,
    lineNames: ['A', 'B', 'C', 'D', 'H', 'I', 'Libra']
  };

  export default {
    components: {
      'v-chart': ECharts
    },
    created: function () {
      eventBus.$emit(events.LOAD_CHART_DATA, '/data/today');
      eventBus.$on(events.OPTION_CHANGE, this.updateChartConfig);
      eventBus.$on(events.CHART_DATA_LOADED, this.loadChartData);
    },
    data: function () {
      const { showSlider, showTooltip, defaultLineWidth, lineNames } = chartOptions;
      const colors = [
        '#ff829d',
        '#ffb266',
        '#ffd778',
        '#53b96a',
        '#3333ff',
        '#ad85ff',
        '#5d6166'
      ];

      return {
        isMobile: window.innerWidth <= 900,
        line: {
          xAxis: {
            type: 'category',
            boundaryGap: false
          },
          yAxis: [
            {
              type: 'value',
              min: 0,
              max: 100,
              name: 'Percent full',
              nameLocation: 'center',
              nameTextStyle: {
                padding: [
                  0, // Top
                  0, // Right
                  15, // Bottom
                  0 // Left
                ]
              }
            },
            {
              type: 'value'
            }
          ],
          tooltip: {
            trigger: 'axis',
            showContent: showTooltip,
          },
          series: lineNames.map((line, i) => ({
            type: 'line',
            color: colors[i],
            name: line,
            areaStyle: null,
            lineStyle: {
              width: defaultLineWidth
            }
          })),
          grid: {
            top: 50,
            bottom: 40,
            left: 50,
            right: 40
          },
          legend: {
            type: 'plain',
            padding: [15, 5, 5, 5],
            selected: {
              A: true,
              B: true,
              C: true,
              D: true,
              H: true,
              I: true,
              Libra: true
            },
          },
          dataZoom: [
            {
              start: 0,
              // Only show 10% of the slider when viewing large
              // amounts of data
              end: showSlider ? 10 : 100,
              show: showSlider
            },
            {
              type: 'inside',
              moveOnMouseWheel: true,
              zoomOnMouseWheel: false,
              show: showSlider
            }
          ]
        }
      };
    },
    methods: {
      updateChartConfig: function ({ option }) {
        const lineChart = this.line;

        switch (option) {
          case events.TOGGLE_VISIBILITY:
            chartOptions.showAllLines = !chartOptions.showAllLines;

            Object.keys(lineChart.legend.selected).forEach(key => {
              lineChart.legend.selected[key] = chartOptions.showAllLines;
            });
            break;

          case events.TOGGLE_FILL:
            chartOptions.fill = !chartOptions.fill;
            const { fill, defaultLineWidth, thinLine } = chartOptions;

            lineChart.series.forEach(line => {
              line.areaStyle = fill ? {} : null;
              line.lineStyle.width = fill ? thinLine : defaultLineWidth;
            });
            break;

          case events.TOGGLE_TOOLTIP:
            chartOptions.showTooltip = !chartOptions.showTooltip;
            lineChart.tooltip.showContent = chartOptions.showTooltip;
            break;

          case events.TOGGLE_SLIDER:
            chartOptions.showSlider = !chartOptions.showSlider;
            const { showSlider } = chartOptions;

            lineChart.dataZoom[0].end = showSlider ? 10 : 100;
            lineChart.dataZoom[0].show = showSlider;
            lineChart.dataZoom[1].show = showSlider;
            lineChart.grid.bottom = showSlider ? 80 : 40;

            break;
          default:
            console.error('Invalid event');
        }
      },
      loadChartData: function (resp) {
        const lineChart = this.line;
        chartOptions.showSlider = resp.count >= 200;

        const { lineNames, defaultLineWidth, thinLine, showSlider } = chartOptions;
        const labels = {
          // Contains dates formatted as: 01/01/19
          original: [],
          // Contains dates formatted as: Tue Jan 8 12 AM
          formatted: []
        };
        const points = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        const lineData = [];

        resp.data.forEach(entry => {
          const date = moment(entry.date);
          labels.original.push(date.format('MM/DD/YY'));
          labels.formatted.push(date.format('ddd MMM D - h A'));
          entry.garages.forEach((garage, index) => {
            points[index].push(Math.floor(Math.round(garage.percent_full)));
          });
        });

        lineNames.forEach((lineName, index) => {
          lineData.push({
            name: lineName,
            data: points[index],
            type: 'line',
            // If this is a mobile device, we'll want to hide all line points
            // since it increases mobile performance
            showSymbol: this.isMobile ? false : (resp.count <= 24),
            lineStyle: {
              // A thinner line looks better when the area under
              // the line is filled in or when there are more than 24 points
              width: this.isMobile ? thinLine : (resp.count > 24 ? thinLine : defaultLineWidth),
            },
            areaStyle: null
          });
        });

        lineChart.tooltip.formatter = function (params) {
          let date = labels.formatted[params[0].dataIndex];
          let tooltipText = `${date}<br/>`;

          params.forEach(param => {
            const { dataIndex, marker, value, seriesName } = param;
            date = labels.formatted[dataIndex];
            tooltipText += `${marker}${seriesName}: ${value}% Full<br/>`;
          });

          return tooltipText;
        };

        lineChart.dataZoom[0].end = showSlider ? 10 : 100;
        lineChart.dataZoom[0].show = showSlider;
        lineChart.dataZoom[1].show = showSlider;
        lineChart.grid.bottom = showSlider ? 80 : 40;

        lineChart.xAxis.data = labels.original;
        lineChart.series = lineData;
      }
    }
  };
</script>

<style scoped>
  #chart {
    height: calc(100vh - 56px);
  }

  .echarts {
    width: 100%;
    height: 100%;
  }
</style>
