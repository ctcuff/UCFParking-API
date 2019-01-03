(function () {
  const $navToday = $('#nav-today');
  const $navMonth = $('#nav-current-month');
  const $navAll = $('#nav-all');
  const $inputDate = $('#date-picker');
  const $btnSubmit = $('#btn-submit');
  const month = new Date().getMonth() + 1;
  const API_ALL = '/data/all';
  const API_TODAY = '/data/today';
  const API_CURRENT_MONTH = `/data/month/${month}`;

  $navToday.click(function () {
    // Don't reload the chart if this nav section
    // is already active
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navMonth.removeClass('active');
    $navAll.removeClass('active');

    window.chart.destroy();
    initLineChart(API_TODAY);
  });

  $navMonth.click(function () {
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navAll.removeClass('active');
    $navToday.removeClass('active');

    window.chart.destroy();
    initLineChart(API_CURRENT_MONTH);
  });

  $navAll.click(function () {
    if ($(this).hasClass('active'))
      return;

    $(this).addClass('active');
    $navToday.removeClass('active');
    $navMonth.removeClass('active');

    window.chart.destroy();
    initLineChart(API_ALL);
  });

  $inputDate.attr({ placeholder: new Date().toLocaleDateString() });
  $inputDate.datepicker({
    autoclose: true,
    startDate: '1/2/2019',
    endDate: '12/31/2019'
  });
  // Disable / re-enable the search button when text is typed
  // into the input
  $inputDate.on('change paste keyup', function () {
    if ($(this).val().length > 0) {
      $btnSubmit.removeAttr('disabled');
    } else {
      $btnSubmit.attr({ disabled: 'disabled' });
    }
  });

  $btnSubmit.click(function (event) {
    // Don't let the page refresh
    event.preventDefault();
    const date = new Date($inputDate.val());
    const [month, day] = [date.getMonth() + 1, date.getDate()];
    const url = `/data/month/${month}/day/${day}`;

    // The date was invalid so just return
    if (!month || !day) {
      return;
    }

    // Clear the input but set it's selected value as the placeholder
    $inputDate.attr({ placeholder: $inputDate.val() });
    $inputDate.val('');

    $navToday.removeClass('active');
    $navMonth.removeClass('active');
    $navAll.removeClass('active');

    window.chart.destroy();
    initLineChart(url);
  });
})();