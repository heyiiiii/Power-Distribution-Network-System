<template>
  <div>
    <el-dialog title="选择装置型号"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               destroy-on-close
               :append-to-body="true" :visible="visible" @close="onCloseDialog"
               width="500px">
      <table style="border-collapse:separate; border-spacing: 6px 10px; margin-top: -30px">
        <tbody>
        <tr>
          <th>厂家：</th>
          <td colspan="2">
            <el-select v-model="factoryFilter" multiple placeholder="筛选生产厂家" style="width: 100%" collapse-tags>
              <el-option
                v-for="item in factories"
                :key="item"
                :label="item"
                :value="item">
              </el-option>
            </el-select>
          </td>
        </tr>
        <tr>
          <th>型号：</th>
          <td>
            <el-input clearable placeholder="输入关键字进行筛选" v-model.trim="filterText">
            </el-input>
          </td>
          <td>
            <el-checkbox v-model="flag6" style="margin-bottom: 0">只显示六统一型号</el-checkbox>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="tree-div">
        <el-tree
          :data="treeData" :props="{children: 'children',label: 'label'}" highlight-current
          accordion
          :filter-node-method="filterNode"
          ref="tree"
          @node-click="handleNodeClick">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>{{ node.label }}</span>
            <span v-if="data.protectModel">{{ data.protectModel.baseVoltageName }}</span>
          </span>
        </el-tree>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="onConfirm" :disabled="!selectedProtectModel">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'SelectProtectModel',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    protectTypeFilter: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      typeFilter: [],
      factoryFilter: [],
      protectModels: [],
      flag6: false,
      selectedProtectModel: null,
      filterText: ''
    };
  },
  async mounted() {
    const { data } = await this.$axios.get('/manage/protectModels/list');
    this.protectModels = data.map(x => Object.assign({
      filename: x.filename,
      _id: x._id
    }, x.metadata));
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
    protectTypeFilter(val) {
      this.typeFilter = val.slice();
    }
  },
  computed: {
    ...mapGetters([
      'getConfigs',
      'getUserId'
    ]),
    protectTypes() {
      const set = new Set();
      for (const pm of this.protectModels) {
        set.add(pm.protectType);
      }

      const ret = Array.from(set);
      ret.sort((x, y) => x.getQuanpin().localeCompare(y.getQuanpin()));
      return ret;
    },
    factories() {
      const set = new Set();
      const array = this.typeFilter.length === 0 ? this.protectModels : this.protectModels.filter(x => this.typeFilter.includes(x.protectType));
      for (const pm of array) {
        set.add(pm.factory);
      }

      const ret = Array.from(set);
      ret.sort((x, y) => x.getQuanpin().localeCompare(y.getQuanpin()));
      return ret;
    },
    treeData() {
      let array = this.typeFilter.length === 0 ? this.protectModels : this.protectModels.filter(x => this.typeFilter.includes(x.protectType));
      array = this.factoryFilter.length === 0 ? array : array.filter(x => this.factoryFilter.includes(x.factory));
      if (this.flag6) {
        array = array.filter(x => x.flag6);
      }
      const result = [];
      array.sort((x, y) => x.factory.getQuanpin().localeCompare(y.factory.getQuanpin()));
      for (const obj of array) {
        if (!result.some(x => x.label === obj.factory)) {
          result.push({
            label: obj.factory,
            children: []
          });
        }
      }

      for (const obj of array) {
        const found = result.find(x => x.label === obj.factory);
        if (found) {
          if (!found.children.some(x => x.label === obj.modelNumber)) {
            found.children.push({
              label: obj.modelNumber,
              children: []
            });
          }
        }
      }

      for (const obj of array) {
        const level2 = result.find(x => x.label === obj.factory);
        const level3 = level2.children.find(x => x.label === obj.modelNumber);
        if (level3) {
          if (!level3.children.some(x => x.label === obj.version)) {
            const checkCode = obj.checkCode ? '(' + obj.checkCode + ')' : '';
            level3.children.push({
              label: obj.version ? obj.version + checkCode : '未定义',
              parent: obj.modelNumber,
              protectModel: obj
            });
          }
        }
      }

      function sortChildren(treeNode) {
        if (Array.isArray(treeNode.children)) {
          treeNode.children.sort((x, y) => x.label.getQuanpin().localeCompare(y.label.getQuanpin()));
          for (const node of treeNode.children) {
            sortChildren(node);
          }
        }
      }

      for (const treeNode of result) {
        sortChildren(treeNode);
      }

      return result;
    }
  },
  methods: {
    handleNodeClick(data) {
      if (data.protectModel) {
        this.selectedProtectModel = data.protectModel;
      }
    },
    onConfirm() {
      this.$emit('update:visible', false);
      console.log('选中装置型号', this.selectedProtectModel);
      this.$emit('on-selected', this.selectedProtectModel);
    },
    onCloseDialog() {
      this.$emit('update:visible', false);
      this.selectedProtectModel = null;
    },
    filterNode(value, data) {
      if (!value) {
        return true;
      }
      return data.label.toLowerCase().includes(value.toLowerCase()) || (data.parent && data.parent.toLowerCase().includes(value.toLowerCase()));
    }
  }
};
</script>

<style scoped>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 18px;
}

.tree-div {
  max-height: 400px;
  overflow: auto;
  border-top: 1px solid lightgrey;
  border-bottom: 1px solid lightgrey;
  margin-bottom: -30px
}
</style>
