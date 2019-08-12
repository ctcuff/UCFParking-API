import eventBus, { events } from '@/util/eventBus';
import axios from 'axios';

let cancelRequest;
const CancelToken = axios.CancelToken;
const instance = axios.create({
  method: 'GET',
  baseURL: 'https://ucf-garages.herokuapp.com'
});

eventBus.$on(events.LOAD_CHART_DATA, url => {
  eventBus.$emit(events.LOAD_STARTED);

  instance
    .get(url, {
      // Need to generate a cancel token each request
      // See: https://github.com/axios/axios/issues/904#issuecomment-324414964
      cancelToken: new CancelToken(function executor(cancel) {
        cancelRequest = cancel;
      })
    })
    .then(resp => {
      eventBus.$emit(events.CHART_DATA_LOADED, resp.data);
    })
    .catch(err => {
      if (!axios.isCancel(err)) {
        console.log(err);
      }
    })
    .finally(() => {
      eventBus.$emit(events.LOAD_FINISHED);
    });
});

// Emit an event to tell the LoadingOverlay
// that a load was cancelled
eventBus.$on(events.CANCEL_LOAD, () => {
  cancelRequest('Load canceled by user');
});
