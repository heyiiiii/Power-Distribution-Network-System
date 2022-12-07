<template>
  <el-dialog
    :title="title"
    :visible="visible"
    :width="width"
    destroy-on-close
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false">
    <div class="slot-div">
      <slot />
    </div>
    <span slot="footer">
      <el-button @click="onCancel">取 消</el-button>
      <el-button type="primary" @click="onConfirm">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 't-script-dialog',
  props: {
    title: {
      type: String,
      default: '',
      required: true
    },
    visible: {
      type: Boolean,
      default: false,
      required: true
    },
    width: {
      type: String,
      default: '50%',
      required: true
    }
  },
  data() {
    return {};
  },
  methods: {
    onCancel() {
      this.$emit('on-cancel');
    },
    onConfirm() {
      this.$emit('on-confirm');
    }
  }
};
</script>

<style scoped>
.slot-div {
  max-height: 800px;
  overflow: auto
}
</style>
