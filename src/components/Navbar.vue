<template>
  <div class="hello">
    <b-navbar type="dark" variant="dark" toggleable="lg">
      <a
          href="https://github.com/ctcuff/UCFParking-Web"
          target="_blank"
          title="View source on GitHub"
          id="github-icon"
          class="fa fa-github"></a>
      <b-navbar-brand>Garage Data</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse is-nav id="nav-collapse">
        <b-navbar-nav style="flex: 1">
          <b-nav-item
              @click="
              activeNavItem = 'today'
              emitLoad('/today')
              "
              :class="{ 'nav-active': activeNavItem === 'today' }"
          >
            Today
          </b-nav-item>
          <b-nav-item-dropdown
              :text="selectedWeek || 'View week'"
              class="scrollable-menu"
              :class="{ 'nav-active': activeNavItem === 'week' }"
          >
            <b-dropdown-item
                @click="
                selectedWeek = 'This week'
                activeNavItem = 'week'
                emitLoad('/week')
                "
            >
              This week
            </b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item
                v-for="(week, index) in weeks"
                @click="
                selectedWeek = week.name
                activeNavItem = 'week'
                emitLoad(`/week/${index}?year=${week.year}`)
                "
                :key="index"
            >
              {{ week.name }} <span class="text-muted date-range">{{ week.range }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item-dropdown
              class="scrollable-menu"
              :text="selectedMonth || 'View month'"
              :class="{ 'nav-active': activeNavItem === 'month' }"
          >
            <b-dropdown-item
                v-for="(month, index) in months"
                :key="index"
                @click="
                selectedMonth = month.name
                activeNavItem = 'month'
                emitLoad(`/month/${(index + 1) % 12}?year=${month.year}`)
                "
            >
              {{ month.name }}  <span class="text-muted date-range">{{ month.year }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item
              @click="
              activeNavItem = 'all'
              emitLoad('/all')
              "
              :class="{ 'nav-active': activeNavItem === 'all' }"
          >
            All
          </b-nav-item>
          <b-nav-item-dropdown text="Options">
            <b-dropdown-item
                v-for="(option, index) in options"
                :key="index"
                @click="option.action"
            >
              {{ option.text }}
            </b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
        <div class="datepicker-wrapper">
          <img
              title="View specific date"
              id="calendar-icon"
              src="../assets/calendar.svg"
              alt=""
              @click="openDatepicker"
          />
          <datetime
              input-id="datetime-input"
              v-model="selectedDate"
              value-zone="local"
              :auto="true"
              :week-start="0"
              :min-datetime="startDate"
              :max-datetime="new Date().toISOString()"
          />
        </div>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
  import eventBus, { events } from '@/util/eventBus';
  import moment from 'moment/src/moment';
  import { Datetime } from 'vue-datetime';
  import {
    BNavbar,
    BNavbarToggle,
    BNavbarBrand,
    BCollapse,
    BNavbarNav,
    BNavItem,
    BNavItemDropdown,
    BDropdownItem,
    BDropdownDivider
  } from 'bootstrap-vue';
  import 'vue-datetime/dist/vue-datetime.css';

  export default {
    components: {
      'b-navbar': BNavbar,
      'b-navbar-toggle': BNavbarToggle,
      'b-navbar-brand': BNavbarBrand,
      'b-collapse': BCollapse,
      'b-navbar-nav': BNavbarNav,
      'b-nav-item': BNavItem,
      'b-nav-item-dropdown': BNavItemDropdown,
      'b-dropdown-item': BDropdownItem,
      'b-dropdown-divider': BDropdownDivider,
      'datetime': Datetime
    },
    data: function () {
      // The first date in the garages database
      const startDate = '2019-01-02T08:00:49.000Z';
      const today = moment();
      const weeks = [];
      const months = [];
      let firstDate = moment(startDate);
      const numWeeks = today.diff(firstDate, 'weeks');
      const numMonths = today.diff(firstDate, 'months');

      // Adds weeks 0 to the current week to the week nav dropdown
      for (let i = 0; i <= today.diff(startDate, 'weeks'); i++) {
        const start = firstDate.format('MMM DD');
        const startYear = firstDate.year();

        // The first week has to be treated differently since it starts on Wednesday
        const end = firstDate.add({ days: i === 0 ? 3 : 6 }).format('MMM DD');
        const endYear = firstDate.year();

        weeks.push({
          name: `Week ${(i % 52) + 1}`,
          range: `${start}, ${startYear} - ${end}, ${endYear}`,
          year: startYear
        });

        firstDate.add({ days: 1 });
      }

      firstDate = moment(startDate);

      // Adds January to the current month to the month nav dropdown
      for (let i = 0; i < numMonths + 1; i++) {
        months.push({
          name: firstDate.format('MMMM'),
          year: firstDate.format('YYYY')
        });
        firstDate.add({ months: 1 });
      }

      return {
        startDate: startDate,
        selectedDate: new Date().toISOString(),
        selectedWeek: null,
        selectedMonth: null,
        activeNavItem: 'today',
        options: [
          {
            text: 'Toggle all lines',
            action: () => eventBus.$emit(events.OPTION_CHANGE, { option: events.TOGGLE_VISIBILITY })
          },
          {
            text: 'Toggle tooltip',
            action: () => eventBus.$emit(events.OPTION_CHANGE, { option: events.TOGGLE_TOOLTIP })
          },
          {
            text: 'Toggle fill',
            action: () => eventBus.$emit(events.OPTION_CHANGE, { option: events.TOGGLE_FILL })
          },
          {
            text: 'Toggle slider',
            action: () => eventBus.$emit(events.OPTION_CHANGE, { option: events.TOGGLE_SLIDER })
          }
        ],
        weeks: weeks,
        months: months
      };
    },
    watch: {
      selectedDate: function (curr, prev) {
        if (curr.slice(0, 10) === prev.slice(0, 10)) {
          // Makes sure clicking on the same date
          // doesn't trigger a load
          return;
        }
        const currentDate = moment(curr);
        const month = currentDate.month() + 1;
        const day = currentDate.date();
        const year = currentDate.year();

        eventBus.$emit(events.LOAD_CHART_DATA, `/data/month/${month}/day/${day}?year=${year}`);
      }
    },
    methods: {
      emitLoad: function (route) {
        eventBus.$emit(events.LOAD_CHART_DATA, route);
      },
      openDatepicker: function () {
        document.getElementById('datetime-input').click();
      }
    }
  };
</script>

<!--suppress CssInvalidPseudoSelector -->
<style lang="scss" scoped>
  * {
    user-select: none;
  }

  #github-icon {
    font-size: 34px;
    color: white;
    margin-right: 16px;
    text-decoration: none;
  }

  ::v-deep .nav-active a:not(.dropdown-item), span:not(.date-range) {
    color: white !important;
  }

  ::v-deep .vdatetime input {
    background: transparent;
    color: white;
    cursor: pointer;
    border: none;
    border-bottom: 1px solid #ffffff80;

    &:hover {
      border-bottom: 1px solid #fff;
    }
  }

  ::v-deep .date-range {
    font-size: 13px;
  }

  #calendar-icon {
    $size: 22px;
    margin-right: 14px;
    width: $size;
    height: $size;
  }

  ::v-deep .scrollable-menu {
    & ul {
      height: auto;
      max-height: 400px;
      overflow-x: hidden;

      @media screen and (max-width: 991px) {
        height: auto;
        max-height: 200px;
        overflow-x: hidden;
      }
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    ::-webkit-scrollbar-thumb {
      background: #b7b7b7;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #838383;
    }
  }

  .datepicker-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;

    @media screen and (max-width: 991px) {
      margin: 10px 0;
    }
  }

  ::v-deep .vdatetime-popup__actions__button--confirm {
    display: none;
  }

  ::v-deep .vdatetime-popup {
    // Fixes blurry calendar in Chrome
    -webkit-transform: translate(-50%, -50.1%);
  }
</style>
