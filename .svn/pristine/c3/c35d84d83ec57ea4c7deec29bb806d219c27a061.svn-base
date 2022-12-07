<template>
  <div class="container">
    <div class="height-40">
      <span class="route-name">{{ getCurrentRouteName }}</span>
    </div>
    <slot />
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: 'container-index',
  computed: {
    ...mapGetters([
      'getUserRoutes'
    ]),
    getCurrentRouteName() {
      const userRoute = this.getUserRoutes.find(x => x.path === this.$route.path);
      if (userRoute) {
        return userRoute.label;
      }
      return '';
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}

.height-40 {
  height: 40px;
}

.route-name {
  color: black;
  font-size: 20px;
  font-weight: 600;
}
</style>
