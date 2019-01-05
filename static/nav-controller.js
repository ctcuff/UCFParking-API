(function () {
  const $navToday = $('#nav-today');
  const $navWeek = $('#nav-current-week');
  const $navMonth = $('#nav-current-month');
  const $navAll = $('#nav-all');
  const $inputDate = $('#date-picker');
  const $btnSubmit = $('#btn-submit');
  const today = new Date();
  const API_TODAY = '/data/today';
  const API_WEEK = '/data/week';
  const API_CURRENT_MONTH = `/data/month/${today.getMonth() + 1}`;
  const API_ALL = '/data/all';

  $navToday.click(function () {
    // Don't reload the chart if this nav section
    // is already active
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navMonth.removeClass('active');
    $navAll.removeClass('active');
    $navWeek.removeClass('active');

    window.chart.destroy();
    // Makes sure the date picker's value resets to the current
    // day when it's not selected
    $inputDate.attr({ placeholder: today.toLocaleDateString() });
    initLineChart(API_TODAY);
  });

  $navWeek.click(function () {
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navToday.removeClass('active');
    $navMonth.removeClass('active');
    $navAll.removeClass('active');

    window.chart.destroy();
    $inputDate.attr({ placeholder: today.toLocaleDateString() });
    initLineChart(API_WEEK);
  });

  $navMonth.click(function () {
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navAll.removeClass('active');
    $navToday.removeClass('active');
    $navWeek.removeClass('active');

    window.chart.destroy();
    $inputDate.attr({ placeholder: today.toLocaleDateString() });
    initLineChart(API_CURRENT_MONTH);
  });

  $navAll.click(function () {
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navToday.removeClass('active');
    $navMonth.removeClass('active');
    $navWeek.removeClass('active');

    window.chart.destroy();
    $inputDate.attr({ placeholder: today.toLocaleDateString() });
    initLineChart(API_ALL);
  });

  $inputDate.attr({ placeholder: today.toLocaleDateString() });
  $inputDate.datepicker({
    autoclose: true,
    todayHighlight: true,
    startDate: '1/2/2019',
    endDate: today.toLocaleDateString()
  });

  $btnSubmit.click(function (event) {
    // Don't let the page refresh
    event.preventDefault();
    $(this).blur();
    // Prevent submitting an empty date search
    if ($inputDate.datepicker('getDate') === null)
      return;

    const date = $inputDate.datepicker('getDate');
    const [month, day] = [date.getMonth() + 1, date.getDate()];
    const url = `/data/month/${month}/day/${day}`;

    // Clear the input but set it's selected value as the placeholder
    $inputDate.attr({ placeholder: $inputDate.val() });
    $inputDate.datepicker('update', '');

    $navToday.removeClass('active');
    $navWeek.removeClass('active');
    $navMonth.removeClass('active');
    $navAll.removeClass('active');

    window.chart.destroy();
    initLineChart(url);
  });
})();