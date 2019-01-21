const $loadingOverlay = $('#overlay-loading');
const lineChart = echarts.init(document.getElementById('chart'));
const margin = 50;
// Thinner lines look better on smaller screens
let lineWidth = $(window).width() <= 800 ? 2 : 4;

$(window).on('resize', function () {
  if (lineChart !== null && lineChart !== undefined) {
    lineChart.resize();
  }
});

function initLineChart(url) {
  // Hide the points on the line when showing a lot of data
  // to improve performance
  const showSymbol = (url === API_TODAY || url.includes('day'));
  const labels = {
    // Contains dates formatted as: 01/01/19
    original: [],
    // Contains dates formatted as: Tue Jan 8 12 AM
    formatted: []
  };
  const points = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  $loadingOverlay.css({ display: 'block' });
  lineChart.clear();

  // Hide the slider when view data for only one day
  window.showSlider = !(url === API_TODAY || url.includes('day'));
  $('#toggle-slider').text(window.showSlider ? 'Hide slider' : 'Show slider');

  $.get(url, res => {

    res.data.forEach(garage => {
      labels.original.push(moment(garage.date).format('MM/DD/YY'));
      labels.formatted.push(moment(garage.date).format('ddd MMM D - h A'));

      garage.garages.forEach((g, index) => {
        points[index].push(Math.floor(Math.round(g.percent_full)));
      });
    });

    lineChart.setOption({
      xAxis: {
        type: 'category',
        data: labels.original,
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
              0,  // Top
              0,  // Right
              15, // Bottom
              0   // Left
            ]
          }
        },
        {
          type: 'value',
        }
      ],
      // Only show the slider when showing large
      // amounts of data
      dataZoom: [
        {
          start: 0,
          end: window.showSlider ? 25 : 100,
          show: window.showSlider
        },
        {
          type: 'inside',
          moveOnMouseWheel: true,
          zoomOnMouseWheel: false,
          show: window.showSlider
        }
      ],
      color: ['#ff829d', '#ffb266', '#ffd778', '#53b96a', '#3333ff', '#ad85ff', '#5d6166'],
      legend: {
        type: 'plain',
        padding: [15, 5, 5, 5]
      },
      series: [
        {
          name: 'A',
          data: points[0],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          },
        },
        {
          name: 'B',
          data: points[1],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          },
        },
        {
          name: 'C',
          data: points[2],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          }
        },
        {
          name: 'D',
          data: points[3],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          }
        },
        {
          name: 'H',
          data: points[4],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          }
        },
        {
          name: 'I',
          data: points[5],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          }
        },
        {
          name: 'Libra',
          data: points[6],
          type: 'line',
          showSymbol: showSymbol,
          lineStyle: {
            width: lineWidth,
          }
        },
      ],
      grid: {
        top: margin,
        // Add more bottom margin when the slider is showing
        bottom: window.showSlider ? 80 : 40,
        left: margin,
        right: margin - 10
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          let date = labels.formatted[params[0].dataIndex];
          let str = `${date}<br/>`;

          for (let data of params) {
            const { dataIndex, marker, value, seriesName } = data;
            date = labels.formatted[dataIndex];
            str += `${marker}${seriesName}: ${value}% Full<br/>`;
          }
          return str;
        },
        axisPointer: {
          lineStyle: {
            color: '#000',
          }
        }
      }
    });
  }).always(() => $loadingOverlay.css({ display: 'none' }));
}

function toggleTooltip() {
  window.showToolTip = !window.showToolTip;
  lineChart.setOption({
    tooltip: {
      showContent: window.showToolTip
    }
  });
}

function toggleVisible() {
  window.showAllLines = !window.showAllLines;
  lineChart.setOption({
    legend: {
      selected: {
        A: window.showAllLines,
        B: window.showAllLines,
        C: window.showAllLines,
        D: window.showAllLines,
        H: window.showAllLines,
        I: window.showAllLines,
        Libra: window.showAllLines,
      }
    }
  });
}

function toggleFill() {
  window.fill = !window.fill;
  lineChart.setOption({
    series: [
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
      { areaStyle: window.fill ? {} : null },
    ]
  });
}

function toggleSlider() {
  window.showSlider = !window.showSlider;
  lineChart.setOption({
    dataZoom: [
      {
        show: window.showSlider,
        end: window.showSlider ? 25 : 100,
      },
      { show: window.showSlider },
    ],
    grid: {
      bottom: window.showSlider ? 80 : 40,
    }
  });
}

$(document).ready(() => {
  showFullscreenAlert();
  initLineChart(API_TODAY);
});
