<template>
  <div>
    <nuxt></nuxt>
  </div>
</template>
<script>
import {mapMutations, mapGetters} from 'vuex';

export default {
  name: 'layout-empty',
  head() {
    return {
      script: [
        {src: this.getOnlyofficeApiUrl}
      ]
    };
  },
  mounted() {
    this.$on('onResize', this.onResize);
    $(window).on('resize', this.onResize);
    this.$emit('onResize');
  },
  computed: {
    ...mapGetters([
      'getOnlyofficeApiUrl'
    ])
  },
  methods: {
    ...mapMutations(['setWindowHeight', 'setClientHeight', 'setClientWidth', 'setUserAgent']),
    onResize() {
      const windowHeight = $(window).height();
      this.setWindowHeight(windowHeight);
      this.setClientHeight(windowHeight);
      this.setClientWidth($(window).width());
    }
  }
};
</script>
