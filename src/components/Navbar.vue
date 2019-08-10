<template>
  <div class="hello">
    <b-navbar type="dark" variant="dark" toggleable="lg">
      <span href="#" id="github-icon" class="fa fa-github"></span>
      <b-navbar-brand>Garage Data</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse is-nav id="nav-collapse">
        <b-navbar-nav style="flex: 1">
          <b-nav-item
              @click="
              activeNavItem = 'today'
              emitLoad('/data/today')
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
                emitLoad('/data/week')
                "
            >
              This week
            </b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item
                v-for="(week, index) in weeks"
                @click="
                selectedWeek = week.title
                activeNavItem = 'week'
                emitLoad('/data/week/' + index)
                "
                :key="index"
            >
              {{ week.title }} <span class="text-muted date-range">{{ week.range }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item-dropdown
              :text="selectedMonth || 'View month'"
              :class="{ 'nav-active': activeNavItem === 'month' }"
          >
            <b-dropdown-item
                v-for="(month, index) in months"
                :key="index"
                @click="
                selectedMonth = month
                activeNavItem = 'month'
                emitLoad('/data/month/' + (index + 1))
                "
            >
              {{ month }}
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item
              @click="
              activeNavItem = 'all'
              emitLoad('/data/all')
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
          <img id="calendar-icon" src="../assets/calendar.svg" alt="" />
          <datetime
              v-model="selectedDate"
              :auto="true"
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
  import moment from 'moment';
  import Vue from 'vue';
  import Datetime from 'vue-datetime';
  import 'vue-datetime/dist/vue-datetime.css';

  Vue.use(Datetime);

  export default {
    data: function () {
      // The first date in the garages database
      const startDate = '2019-01-02T08:00:49.000Z';
      const weeks = [];
      const months = [];
      const today = moment();
      const numWeeks = parseInt(today.format('w')) - 1;
      const firstDate = moment(startDate.slice());

      for (let i = 0; i <= numWeeks; i++) {
        const startDate = firstDate.format('MMM DD');
        // The first week has to be treated differently since it starts on Wednesday
        const endDate = firstDate.add({ days: i === 0 ? 3 : 6 }).format('MMM DD');
        weeks.push({
          title: `Week ${i + 1}`,
          range: `${startDate} - ${endDate}`
        });
        firstDate.add({ days: 1 });
      }

      for (let i = 0; i < today.month() + 1; i++) {
        months.push(moment.months()[i]);
      }
      return {
        startDate: startDate,
        selectedDate: new Date().toISOString(),
        selectedWeek: null,
        selectedMonth: null,
        activeNavItem: 'today',
        options: (() => [
          {
            text: 'Hide all',
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
        ])(),
        weeks: weeks,
        months: months
      };
    },
    watch: {
      selectedDate: function (curr, prev) {
        if (curr.slice(0, 10) === prev.slice(0, 10)) {
          return;
        }
        const currentDate = moment(curr);
        const month = currentDate.month() + 1;
        const day = currentDate.date();

        eventBus.$emit(events.LOAD_CHART_DATA, `/data/month/${month}/day/${day}`);
      }
    },
    methods: {
      emitLoad: function (route) {
        eventBus.$emit(events.LOAD_CHART_DATA, route);
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
  }

  @media screen and (max-width: 900px) {
    ::v-deep .scrollable-menu {
      ul {
        height: auto;
        max-height: 200px;
        overflow-x: hidden;
      }
    }
  }
</style>
