<template>
  <div id="app">
    <LoadingOverlay />
    <Navbar />
    <Chart />
  </div>
</template>

<script>
  import LoadingOverlay from '@/components/LoadingOverlay';
  import Navbar from '@/components/Navbar';
  import Chart from '@/components/Chart';
  import 'bootstrap/dist/css/bootstrap.css';
  import 'bootstrap-vue/dist/bootstrap-vue.css';

  export default {
    components: {
      Chart,
      Navbar,
      LoadingOverlay
    }
  };
</script>
