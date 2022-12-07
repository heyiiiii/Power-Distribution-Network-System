export default function({route, store}) {
  const found = store.getters.getUserRoutes.find(x => x.name === route.name);
  if (found) {
    store.commit('setCurrentRouteId', found._id);
  }
}
