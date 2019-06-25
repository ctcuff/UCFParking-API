const API_TODAY = 'https://ucf-garages.herokuapp.com/data/today';
const API_WEEK = 'https://ucf-garages.herokuapp.com/data/week';
const API_MONTH = 'https://ucf-garages.herokuapp.com/data/month';
const API_ALL = 'https://ucf-garages.herokuapp.com/data/all';

(function () {
  const $inputDate = $('#date-picker');
  const navItems = document.getElementById('nav-list-items').children;
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

  document.getElementById('view-current-week').onclick = ({ target }) => {
    setActive(target.closest('li'));
    initLineChart(API_WEEK);
    document.getElementById('span-week').innerText = 'This week';
  };

  // Add weeks 1 through the current week to the nav drop down
  for (let i = 0; i <= numWeeks; i++) {
    const startDate = firstDate.format('MMM DD');
    // The first week has to be treated differently since it starts on Wednesday
    const endDate = firstDate.add({ days: i === 0 ? 3 : 6 }).format('MMM DD');

    const span = document.createElement('span');

    span.classList.add('dropdown-item', 'pointer');
    span.setAttribute('id', `week-${i + 1}`);
    span.innerHTML = `Week ${i + 1} <small>${startDate} - ${endDate}</small>`;

    span.onclick = ({ target }) => {
      setActive(target.closest('li'));
      initLineChart(`${API_WEEK}/${i}`);
      document.getElementById('span-week').innerText = `Week ${i + 1}`;
    };

    document.getElementById('nav-dropdown-items-week').appendChild(span);
    firstDate.add({ days: 1 });
  }

  // Adds January to the current month to the nav drop down.
  // moment().month() returns 0 for January but the database is
  // indexed at 1 so 1 is added
  for (let i = 0; i < today.month() + 1; i++) {
    const span = document.createElement('span');
    span.classList.add('dropdown-item', 'pointer');
    span.setAttribute('id', `month-${i + 1}`);
    span.innerText = months[i];

    span.onclick = ({ target }) => {
      setActive(target.closest('li'));
      initLineChart(`${API_MONTH}/${i + 1}`);
      document.getElementById('span-month').innerText = months[i];
    };

    document.getElementById('nav-dropdown-items-month').appendChild(span);
  }

  document.getElementById('toggle-tooltip').onclick = () => toggleTooltip();
  document.getElementById('toggle-slider').onclick = () => toggleSlider();
  document.getElementById('toggle-fill').onclick = () => toggleFill();

  document.getElementById('nav-today').onclick = ({ target }) => {
    setActive(target.closest('li'));
    initLineChart(API_TODAY);
  };

  document.getElementById('nav-all').onclick = ({ target }) => {
    setActive(target.closest('li'));
    initLineChart(API_ALL);
  };

  document.getElementById('toggle-visibility').onclick = ({ target }) => {
    toggleVisible();
    target.innerText = window.showAllLines ? 'Hide all' : 'Show all';
  };

  $inputDate.click(function () {
    $(this).tooltip('hide')
  });

  $inputDate.datepicker({
    autoclose: true,
    todayHighlight: true,
    startDate: '1/2/2019',
    endDate: today.format('M/D/YYYY')
  }).on('changeDate', event => {

    Array.prototype.forEach.call(navItems, item => {
      item.classList.remove('active');
    });

    $('.navbar-collapse').collapse('hide');

    const date = moment(event.date);
    const [month, day] = [date.month() + 1, date.date()];
    initLineChart(`${API_MONTH}/${month}/day/${day}`);
  });

  $inputDate.datepicker('update', today.format('M/D/YYYY'));

  // Sets the selected nav bar item as active and removes
  // the active property from the rest of the nav bar items
  function setActive(element) {
    element.classList.add('active');

    Array.prototype.forEach.call(navItems, item => {
      if (item !== element) {
        item.classList.remove('active');
      }
    });

    // Makes sure the date picker's value resets to the current
    // day when it's not selected
    $inputDate.datepicker('update', today.format('M/D/YYYY'));
  }
})();