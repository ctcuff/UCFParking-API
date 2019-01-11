$(document).ready(() => {

  window.showToolTip = true;
  window.hideAllLines = true;
  window.curved = false;
  window.fill = false;

  initLineChart();

  $('#toggle-tooltip').click(function () {
    window.showToolTip = !window.showToolTip;
    window.chart.options.tooltips.enabled = window.showToolTip;
    window.chart.update();
    $(this).text('Tooltip: ' + (window.showToolTip ? 'on' : 'off'));
  });

  $('#showAll').click(function () {
    window.hideAllLines = !window.hideAllLines;
    window.chart.data.datasets.forEach(ds => ds.hidden = window.hideAllLines);
    window.chart.update();

    $(this).text(window.hideAllLines ? 'Show all' : 'Hide all');
  });

  $('#toggle-fill').click(() => {
    window.fill = !window.fill;
    window.chart.data.datasets.forEach(ds => ds.fill = window.fill);
    window.chart.update();
  });
});
