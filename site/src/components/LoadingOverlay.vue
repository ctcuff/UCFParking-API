<template>
  <div id="overlay" v-if="isLoading">
    <div id="center">
      <b-spinner label="Spinning" id="spinner"></b-spinner>
    </div>
  </div>
</template>

<script>
  import eventBus, { events } from '@/util/eventBus';

  export default {
    data: function () {
      return {
        isLoading: false
      };
    },
    created: function () {
      const self = this;
      eventBus.$on(events.LOAD_STARTED, () => (self.isLoading = true));
      eventBus.$on(events.LOAD_FINISHED, () => (self.isLoading = false));
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
    justify-content: center;
    align-items: center;
  }

  #spinner {
    width: 3rem;
    height: 3rem;
  }
</style>
