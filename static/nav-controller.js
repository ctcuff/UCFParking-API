const API_TODAY = 'https://ucf-garages.herokuapp.com/data/today';
const API_WEEK = 'https://ucf-garages.herokuapp.com/data/week';
const API_MONTH = 'https://ucf-garages.herokuapp.com/data/month';
const API_ALL = 'https://ucf-garages.herokuapp.com/data/all';

(function () {
  const $navToday = $('#nav-today');
  const $navMonth = $('#nav-current-month');
  const $navAll = $('#nav-all');
  const $inputDate = $('#date-picker');
  const $dropdownTitleWeek = $('#span-week');
  const $dropdownTitleMonth = $('#span-month');
  const $dropDownItemsWeek = $('#nav-dropdown-items-week');
  const $dropDownItemsMonth = $('#nav-dropdown-items-month');
  const $navItems = $('#nav-list-items');
  const today = moment();
  const firstDate = moment('2019-01-02T03:00:49.044984');
  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  // Get the current week of the year. Moment starts a 1 but
  // the database is indexed at 0.
  const numWeeks = Number.parseInt(today.format('w')) - 1;

  $('#view-current-week').click(function () {
    setActive($(this).closest('li'));
    $dropdownTitleWeek.text('This week');
    initLineChart(API_WEEK);
  });

  // Add weeks 1 through the current week to the nav drop down
  for (let i = 0; i <= numWeeks; i++) {
    const beginDate = firstDate.format('MMM DD');
    // The first week has to be treated differently since it starts on Wednesday
    const endDate = firstDate.add({ days: i === 0 ? 3 : 6 }).format('MMM DD');

    const $child = $(`<span class="dropdown-item pointer" id="week-${i + 1}"></span>`);
    $child.html(`Week ${i + 1} <small>${beginDate} - ${endDate}</small>`);

    $child.click(function () {
      setActive($(this).closest('li'));
      $dropdownTitleWeek.text(`Week ${i + 1}`);
      initLineChart(`${API_WEEK}/${i}`);
    });
    $dropDownItemsWeek.append($child);

    firstDate.add({ days: 1 });
  }

  // Adds January to the current month to the nav drop down.
  // moment().month() returns 0 for January but the database is
  // indexed at 1 so 1 is added
  for (let i = 0; i < today.month() + 1; i++) {
    const $child = $(`<span class="dropdown-item pointer" id="month-${i + 1}">${months[i]}</span>`);

    $child.click(function () {
      setActive($(this).closest('li'));
      $dropdownTitleMonth.text(months[i]);
      initLineChart(`${API_MONTH}/${i + 1}`)
    });
    $dropDownItemsMonth.append($child);
  }

  $navToday.click(function () {
    setActive(this);
    initLineChart(API_TODAY);
  });

  $navMonth.click(function () {
    setActive(this);
    initLineChart(API_MONTH);
  });

  $navAll.click(function () {
    setActive(this);
    initLineChart(API_ALL);
  });

  $('#toggle-fill').click(() => {
    toggleFill();
  });

  $('#toggle-visibility').click(function () {
    toggleVisible();
    $(this).text(window.showAllLines ? 'Hide all' : 'Show all');
  });

  $('#toggle-tooltip').click(() => {
    toggleTooltip();
  });

  $('#toggle-slider').click(() => {
    toggleSlider();
  });

  $inputDate.click(function () { $(this).tooltip('hide') });

  $inputDate.datepicker({
    autoclose: true,
    todayHighlight: true,
    startDate: '1/2/2019',
    endDate: today.format('M/D/YYYY')
  }).on('changeDate', event => {
    for (const child of $navItems.children())
      $(child).removeClass('active');

    $('.navbar-collapse').collapse('hide');

    const date = moment(event.date);
    const [month, day] = [date.month() + 1, date.date()];
    initLineChart(`${API_MONTH}/${month}/day/${day}`);
  });

  $inputDate.datepicker('update', today.format('M/D/YYYY'));

  // Sets the selected nav bar item as active and removes
  // the active property from the rest of the nav bar items
  function setActive(element) {
    const $element = $(element);
    // Don't reload the chart if this nav section
    // is already active
    if ($element.hasClass('active'))
      return;

    $element.addClass('active');

    for (const child of $navItems.children()) {
      const $child = $(child);
      if ($child.attr('id') !== $element.attr('id')) {
        $child.removeClass('active');
      }
    }
    // Makes sure the date picker's value resets to the current
    // day when it's not selected
    $inputDate.datepicker('update', today.format('M/D/YYYY'));
  }
})();