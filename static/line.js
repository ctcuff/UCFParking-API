// The default behavior is to load the data for today
function initLineChart(url = API_TODAY) {
  const canvas = document.getElementById('line-chart');
  const $loadingOverlay = $('#overlay-loading');

  // Makes sure the chart gets completely reset
  if (window.chart !== undefined)
    window.chart.destroy();

  let lineChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          fill: window.fill,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          label: 'A',
          data: [],
          hidden: false,
        },
        {
          fill: window.fill,
          borderColor: 'rgba(255, 159, 64, 0.8)',
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          label: 'B',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(255, 205, 86, 0.8)',
          backgroundColor: 'rgba(255, 205, 86, 0.8)',
          label: 'C',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(40, 167, 69, 0.8)',
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          label: 'D',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(0, 0, 255, 0.8)',
          backgroundColor: 'rgba(0, 0, 255, 0.8)',
          label: 'H',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(153, 102, 255, 0.8)',
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          label: 'I',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(52, 58, 64, 0.8)',
          backgroundColor: 'rgba(52, 58, 64, 0.8)',
          label: 'Libra',
          data: [],
          hidden: window.hideAllLines
        },
      ]
    },
    options: {
      animation: { duration: url === API_TODAY ? 1000 : 0 },
      hover: { animationDuration: url === API_TODAY ? 1000 : 0 },
      title: {
        display: true,
        text: 'Garage Availability',
      },
      tooltips: {
        position: 'average',
        mode: 'index',
        intersect: false,
        enabled: window.showToolTip,
        callbacks: {
          label: (tooltipItem, tooltipData) => {
            // Formats the tooltip text to be 'A - 56% Full'
            const { datasetIndex, index } = tooltipItem;
            const { label, data } = tooltipData.datasets[datasetIndex];
            return `${label} - ${data[index]}% Full`;
          },
          title: (tooltipItem) => {
            // Formats the date from 1/2/2019 - 7AM to Wed Jan 2 - 7 AM
            const { xLabel } = tooltipItem[0];
            const labelParts = xLabel.split(' ');
            const date = new Date(labelParts[0]);
            return `${date.toString().slice(0, 10)} - ${labelParts[2]} ${labelParts[3]}`;
          }
        }
      },
      legend: {
        position: 'bottom',
        onClick: legendClickListener,
      },
      elements: {
        line: { tension: window.curved ? 0.4 : 0 },
        point: {
          // Disabling the radius when multiple points are showing
          // improves load time and performance
          radius: url === API_TODAY ? 3 : 0,
          hitRadius: 10,
          hoverRadius: 5,
        }
      },
      scales: {
        yAxes: [{
          display: true,
          ticks: { min: 0, max: 100 },
          scaleLabel: {
            display: true,
            labelString: 'Average percent full'
          }
        }],
        xAxes: [{
          display: true,
          gridLines: { display: false },
          scaleLabel: { display: false, }
        }],
      },
    }
  });

  // The default legend click listener doesn't toggle the
  // clicked line's hidden state so it has to be done manually here
  function legendClickListener(event, legendItem) {
    let hidden = lineChart.data.datasets[legendItem.datasetIndex].hidden;
    lineChart.data.datasets[legendItem.datasetIndex].hidden = !hidden;
    lineChart.update();
  }

  function loadGarageData() {
    $loadingOverlay.css({ display: 'block' });

    $.get(url, resp => {
      if (resp.data.length === 0) {
        $('#overlay-no-data').css({ display: 'block' });
        return;
      }

      resp.data.forEach(data => {
        let time = new Date(data.date);
        // Format the date from 2019-01-02T13:01:15.330713 to 1/2/2019 - 1 PM
        lineChart.data.labels.push(
            time.toLocaleDateString() + ' - ' + time.toLocaleTimeString([], { hour: '2-digit' })
        );

        data.garage_data.garages.forEach((garage, index) => {
          lineChart.data.datasets[index].data.push(Math.round(garage.percent_full));
        });

      });
      lineChart.update();
    }).then(() => $loadingOverlay.css({ display: 'none' }));
  }

  loadGarageData();

  window.chart = lineChart;
}
