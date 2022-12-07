<template>
  <div class="import-button">
    <el-button type="primary" icon="el-icon-upload2" @click="onImport">
      {{ text }}
    </el-button>
    <el-dialog :title="title" width="420px" :close-on-click-modal="false" :visible.sync="importVisible">
      <el-upload drag :action="action" :data="data" :on-success="onSuccess" :show-file-list="false">
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'button-import',
  props: {
    text: {
      type: String,
      default: '导入'
    },
    title: {
      type: String,
      default: '导入'
    },
    action: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: () => { }
    }
  },
  computed: {
    ...mapGetters([
    ])
  },
  data() {
    return {
      importVisible: false
    };
  },
  methods: {
    onImport() {
      this.importVisible = true;
    },
    onSuccess(res) {
      this.$emit('on-success', res);
    }
  }
};
</script>

<style scoped>
.import-button {
  margin: 0 0 0 5px;
}
</style>
