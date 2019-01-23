const $loadingOverlay = $('#overlay-loading');
const lineChart = echarts.init(document.getElementById('chart'));
const margin = 50;
const thinLine = 2;
const defaultLineWidth = 4;
// Thinner lines look better on smaller screens
const lineWidth = $(window).width() <= 800 ? thinLine : defaultLineWidth;

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

    const lineNames = ['A', 'B', 'C', 'D', 'H', 'I', 'Libra'];
    const lineData = [];

    for (let i = 0; i < lineNames.length; i++) {
      lineData.push({
        name: lineNames[i],
        data: points[i],
        type: 'line',
        showSymbol: showSymbol,
        lineStyle: {
          // A thinner line looks better when the area under
          // the line is filled in
          width: window.fill ? thinLine : lineWidth,
        },
        areaStyle: window.fill ? {} : null
      });
    }

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
      series: lineData,
      grid: {
        top: margin,
        // Add more bottom margin when the slider is showing
        bottom: window.showSlider ? 80 : 40,
        left: margin,
        right: margin - 10
      },
      tooltip: {
        trigger: 'axis',
        formatter: params => {
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
  }).always(() => {
    $loadingOverlay.css({ display: 'none' });
    showFullscreenAlert();
  });
}

function toggleTooltip() {
  window.showToolTip = !window.showToolTip;
  lineChart.setOption({
    tooltip: { showContent: window.showToolTip }
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
  const options = [];

  for (let i = 0; i < 7; i++) {
    options.push({
      areaStyle: window.fill ? {} : null,
      lineStyle: { width: window.fill ? thinLine : lineWidth }
    });
  }

  lineChart.setOption({ series: options });
}

function toggleSlider() {
  window.showSlider = !window.showSlider;
  lineChart.setOption({
    dataZoom: [
      {
        show: window.showSlider,
        end: window.showSlider ? 25 : 100,
      },
      {
        show: window.showSlider
      },
    ],
    grid: { bottom: window.showSlider ? 80 : 40 }
  });
}

$(document).ready(() => {
  initLineChart(API_TODAY);

  $('body').keydown(key => {
    let { start, end } = lineChart.getOption('dataZoom').dataZoom[0];

    switch (key.which) {
      case 39:  // Right pressed so scroll right
        if (end === 100)
          break;

        lineChart.dispatchAction({
          type: 'dataZoom',
          start: ++start,
          end: ++end
        });
        break;

      case 37:  // Left pressed so scroll left
        console.log(start, end);
        if (start <= 0)
          break;

        lineChart.dispatchAction({
          type: 'dataZoom',
          start: --start,
          end: --end
        });
        break;

      case 38:  // Up pressed so zoom in
        if (start === end)
          break;

        lineChart.dispatchAction({
          type: 'dataZoom',
          start: ++start,
          end: --end
        });
        break;

      case 40:  // Down pressed so zoom out
        if (start > 0)
          start--;

        if (end < 100)
          end++;

        if (start === 0 && end === 100)
          break;

        lineChart.dispatchAction({
          type: 'dataZoom',
          start: start,
          end: end
        });
        break;
    }
  });
});
