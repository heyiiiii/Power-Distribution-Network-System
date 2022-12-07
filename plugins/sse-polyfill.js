import {EventSourcePolyfill, NativeEventSource} from 'event-source-polyfill';

export default function(ctx) {
  if (process.client) {
    const EventSource = NativeEventSource || EventSourcePolyfill;
    global.EventSource = EventSource;
    window.EventSource = EventSource;
  }
}

