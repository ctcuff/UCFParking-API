$(document).ready(() => {
  const $toggleCurveBtn = $('#toggle-smooth');

  window.showToolTip = true;
  window.hideAllLines = true;
  window.curved = false;
  window.fill = false;

  initLineChart();

  $toggleCurveBtn.text(curved ? 'Straight' : 'Curved');

  $toggleCurveBtn.click(function () {
    window.curved = !window.curved;
    window.chart.options.elements.line.tension = window.curved ? 0.4 : 0.000001;
    window.chart.update();
    $(this).text(window.curved ? 'Straight' : 'Curved');
  });

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
