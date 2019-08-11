import Vue from 'vue';

const eventBus = new Vue();

// When these events are emitted, the config of
// the chart in Chart.vue will update accordingly
const events = {
  OPTION_CHANGE: 'optionChange',
  DATE_CHANGE: 'onDateChange',
  TOGGLE_VISIBILITY: 'toggleVisibility',
  TOGGLE_TOOLTIP: 'toggleTooltip',
  TOGGLE_FILL: 'toggleFill',
  TOGGLE_SLIDER: 'toggleSlider',
  LOAD_CHART_DATA: 'loadChartData',
  LOAD_STARTED: 'onLoad',
  LOAD_FINISHED: 'onLoadFinished',
  CHART_DATA_LOADED: 'onChartDataLoaded',
  PROGRESS_UPDATE: 'onProgressUpdate',
  CANCEL_LOAD: 'cancelLoad'
};

export { eventBus as default, events };