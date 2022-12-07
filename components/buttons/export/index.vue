<template>
  <div class="export-button">
    <el-button type="primary" icon="el-icon-download" @click="onExport">
      {{ text }}
    </el-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'button-export',
  props: {
    text: {
      type: String,
      default: '导出'
    }
  },
  computed: {
    ...mapGetters([
    ])
  },
  methods: {
    onExport() {
      this.$emit('on-export');
    }
  }
};
</script>

<style scoped>
.export-button {
  margin: 0 0 0 5px;
}
</style>
