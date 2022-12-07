import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import {connect} from 'socket.io-client';

export default ({store}) => {
  const vueSocketIO = new VueSocketIO({
    connection: connect('/', {
      path: '/socket',
      reconnectionDelayMax: 5000,
      reconnection: true
    }),
    vuex: {
      store,
      mutationPrefix: 'SOCKET_',
      actionPrefix: 'SOCKET_'
    }
  });
  if (store.getters.getUserId) {
    vueSocketIO.io.emit('setUserInfo', store.getters.getUser);
  }
  Vue.use(vueSocketIO);
};
