<template>
  <div id="overlay" v-if="isLoading">
    <div id="center">
      <b-progress :value="progress" :max="100" variant="dark" animated />
      <b-button id="cancel" @click="cancelLoad">Cancel</b-button>
    </div>
  </div>
</template>

<script>
  import eventBus, { events } from '@/util/eventBus';

  export default {
    data: function () {
      return {
        isLoading: false,
        progress: 0
      };
    },
    created: function () {
      const self = this;
      eventBus.$on(events.LOAD_STARTED, () => {
        self.progress = 0;
        self.isLoading = true;
      });
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
    top: 56%;
    background-color: #1a1d20;
  }

  .progress {
    width: 80%;
    height: 9px;
  }
</style>
