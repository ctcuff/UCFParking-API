import eventBus, { events } from '@/util/eventBus';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://ucf-garages.herokuapp.com'
});

eventBus.$on(events.LOAD_CHART_DATA, url => {
  eventBus.$emit(events.LOAD_STARTED);

  instance.get(url)
    .then(resp => {
      eventBus.$emit(events.CHART_DATA_LOADED, resp.data);
    })
    .catch(err => console.err(err))
    .finally(() => {
      eventBus.$emit(events.LOAD_FINISHED);
    });
});
