<template>
  <div id="overlay" v-if="isLoading">
    <div id="center">
      <b-spinner label="Spinning" id=spinner></b-spinner>
      <b-button id="cancel" @click="cancelLoad">
        Cancel
      </b-button>
    </div>
  </div>
</template>

<script>
  import eventBus, { events } from '@/util/eventBus';
  import { BSpinner, BButton } from 'bootstrap-vue';

  export default {
    components: {
      'b-spinner': BSpinner,
      'b-button': BButton
    },
    data: function () {
      return {
        isLoading: false 
      };
    },
    created: function () {
      const self = this;
      eventBus.$on(events.LOAD_STARTED, () => (self.isLoading = true));
      eventBus.$on(events.LOAD_FINISHED, () => (self.isLoading = false));
      eventBus.$on(events.PROGRESS_UPDATE, progress => (self.progress = progress));
    },
    methods: {
      cancelLoad: function () {
        eventBus.$emit(events.CANCEL_LOAD);
      }
    }
  };
</script>

<style scoped>
  #overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    top: 0;
    z-index: 2;
  }

  #center {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  #cancel {
    position: absolute;
    top: 60%;
    background-color: #1a1d20;
  }

  #spinner {
    width: 3em;
    height: 3em;
  }
</style>
