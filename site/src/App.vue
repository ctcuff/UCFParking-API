<template>
  <div id="app">
    <LoadingOverlay />
    <Navbar />
    <Chart />
  </div>
</template>

<script>
  import Vue from 'vue';
  import LoadingOverlay from '@/components/LoadingOverlay';
  import Navbar from '@/components/Navbar';
  import Chart from '@/components/Chart';
  import BootstrapVue from 'bootstrap-vue';
  import 'bootstrap/dist/css/bootstrap.css';
  import 'bootstrap-vue/dist/bootstrap-vue.css';

  Vue.use(BootstrapVue);

  export default {
    components: {
      Chart,
      Navbar,
      LoadingOverlay
    }
  };
</script>
