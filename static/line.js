const $loadingOverlay = $('#overlay-loading');
const lineChart = echarts.init(document.getElementById('chart'));
const margin = 50;
const thinLine = 2;
const defaultLineWidth = 4;
const lineNames = ['A', 'B', 'C', 'D', 'H', 'I', 'Libra'];
const isMobile = $(window).width() <= 900;

// Thinner lines look better on smaller screens
const lineWidth = isMobile ? thinLine : defaultLineWidth;

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

  $.get(url, (res) => {
    // Show the slider when the chart has 200 or more points
    window.showSlider = res.data.length >= 200;

    res.data.forEach((garage) => {
      labels.original.push(moment(garage.date).format('MM/DD/YY'));
      labels.formatted.push(moment(garage.date).format('ddd MMM D - h A'));

      garage.garages.forEach((g, index) => {
        points[index].push(Math.floor(Math.round(g.percent_full)));
      });
    });

    const lineData = [];

    lineNames.forEach((lineName, index) => {
      lineData.push({
        name: lineName,
        data: points[index],
        type: 'line',
        // If this is a mobile device, we'll want to hide all line points
        // since it increases mobile performance
        showSymbol: isMobile ? false : showSymbol,
        lineStyle: {
          // A thinner line looks better when the area under
          // the line is filled in or when there are more than 24 points
          width: (window.fill || res.data.length > 24) ? thinLine : lineWidth,
        },
        areaStyle: window.fill ? {} : null
      });
    });

    lineChart.setOption({
      url: url,
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
          // Only show 10% of the slider when viewing large
          // amounts of data
          end: window.showSlider ? 10 : 100,
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
        padding: [15, 5, 5, 5],
        selected: {
          A: window.showAllLines,
          B: window.showAllLines,
          C: window.showAllLines,
          D: window.showAllLines,
          H: window.showAllLines,
          I: window.showAllLines,
          Libra: window.showAllLines,
        }
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
        formatter: (params) => {
          let date = labels.formatted[params[0].dataIndex];
          let tooltipText = `${date}<br/>`;

          params.forEach((param) => {
            const { dataIndex, marker, value, seriesName } = param;
            date = labels.formatted[dataIndex];
            tooltipText += `${marker}${seriesName}: ${value}% Full<br/>`;
          });

          return tooltipText;
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
    tooltip: {
      showContent: window.showToolTip
    }
  });
}

function toggleFill() {
  window.fill = !window.fill;
  const chartData = lineChart.getOption();
  const numPoints = chartData.series[0].data.length;
  const options = [];

  for (let i = 0; i < lineNames.length; i++) {
    options.push({
      areaStyle: window.fill ? {} : null,
      lineStyle: {
        // Makes the chart's lines thin when the area underneath
        // is filled but returns it to its default width when
        // there is no fill
        width: (window.fill || numPoints > 24) ? thinLine : lineWidth
      }
    });
  }

  lineChart.setOption({ series: options });
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

function toggleSlider() {
  window.showSlider = !window.showSlider;
  lineChart.setOption({
    dataZoom: [
      {
        show: window.showSlider,
        start: 0,
        end: window.showSlider ? 10 : 100,
      },
      {
        show: window.showSlider
      },
    ],
    grid: {
      bottom: window.showSlider ? 80 : 40
    }
  });
}

$(document).ready(() => {
  initLineChart(API_TODAY);

  // Allows the chart to scroll / zoom based on
  // which arrow key was pressed
  $('body').keydown((key) => {
    let { start, end } = lineChart.getOption().dataZoom[0];

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

        // The chart is fully zoomed out so don't attempt
        // to zoom any further
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
