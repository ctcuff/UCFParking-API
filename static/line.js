// The default behavior is to load the data for today
function initLineChart(url = '/data/today') {
  const canvas = document.getElementById('line-chart');
  const $loadingOverlay = $('#overlay-loading');

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
          borderColor: 'rgba(75, 192, 192, 0.8)',
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          label: 'D',
          data: [],
          hidden: window.hideAllLines
        },
        {
          fill: window.fill,
          borderColor: 'rgba(54, 162, 235, 0.8)',
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
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
          borderColor: 'rgba(201, 203, 207, 0.8)',
          backgroundColor: 'rgba(201, 203, 207, 0.8)',
          label: 'Libra',
          data: [],
          hidden: window.hideAllLines
        },
      ]
    },
    options: {
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
            let { datasetIndex, index } = tooltipItem;
            let { label, data } = tooltipData.datasets[datasetIndex];
            return `${label} - ${data[index]}% Full`;
          }
        }
      },
      legend: {
        position: 'bottom',
        onClick: legendClickListener
      },
      elements: {
        line: { tension: window.curved ? 0.4 : 0.000001 }
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
          scaleLabel: {
            display: true,
            labelString: 'Hour'
          }
        }]
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
    console.log(`Got url of ${url}`);
    $.get(url, resp => {
      if (resp.data.length === 0) {
        $('#overlay-no-data').css({ display: 'block' });
        return;
      }
      console.log('Continuing...');
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
