<!--meta:{"index":18,"label":"装置类型管理","auths":"any","roles":"any"}-->
<template>
  <container>
    <split-left-right leftName="装置类型列表" :height="contentHeight" sid="10kV-model-l-r-1" :leftWidthInit="800">
      <div slot="left" slot-scope="{height}">
        <el-card :body-style="{height: height - 50 + 'px'}">
          <div slot="header">
            <el-button type="success" icon="el-icon-plus" @click="openCreateType">新增</el-button>
            <el-button v-if="selectedRow" type="primary" @click="openListSet">批量设置脚本</el-button>
          </div>
          <ag-grid-vue
            :modules="$agGridModules"
            class="ag-theme-balham clear-line"
            :style="{height: height - 80 + 'px'}"
            :gridOptions="grid.options"
            :columnDefs="grid.columnDefs"
            :rowData="grid.rowData"
          />
        </el-card>
      </div>
      <div slot="right" slot-scope="{height}">
        <el-card :body-style="{height: height - 50 + 'px'}">
          <div slot="header">
            <el-breadcrumb separator-class="el-icon-arrow-right">
              <el-breadcrumb-item style="line-height: 25px">
                <el-button v-if="selectedScriptId" type="success" @click="saveScript">保存</el-button>
                <span>脚本编辑</span>
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="selectedScriptId">
                <span style="line-height: 26px">{{ currentScriptName }}</span>
                <strong class="text-danger" v-show="dirty">*</strong>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div ref="sEditor" class="border-dark" :style="{height: height - 90 + 'px'}" />
        </el-card>
      </div>
    </split-left-right>
    <el-dialog title="新增装置类型" :visible.sync="protectType.dialog.visible" :modal="false" width="500px">
      <el-form ref="protectTypeForm" :model="protectType.form" :rules="protectType.rules" label-width="100px">
        <el-form-item label="厂家" prop="factory">
          <el-select v-model.trim="protectType.form.factory" filterable allow-create default-first-option clearable placeholder="选择或输入生产厂家">
            <el-option v-for="item in factories" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="modelNumber">
          <el-select v-model.trim="protectType.form.modelNumber" filterable allow-create default-first-option clearable placeholder="选择或输入装置型号">
            <el-option v-for="item in modelNumbers" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model.trim="protectType.form.version" clearable placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="校验码" prop="checkCode">
          <el-input v-model.trim="protectType.form.checkCode" clearable placeholder="请输入校验码" />
        </el-form-item>
        <el-form-item label="六统一" prop="flag6">
          <el-select style="width: 100%" v-model="protectType.form.flag6">
            <el-option :value="true" label="是" />
            <el-option :value="false" label="否" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传模板">
          <el-upload
            class="upload-demo"
            action="/"
            :on-change="onUploadChange"onUploadRemove
            :on-remove="onUploadRemove"
            :auto-upload="false"
            :file-list="protectType.form.fileList"
            :limit="1">
            <el-button type="primary">点击上传</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="模板名称" prop="filename">
          <el-input v-model.trim="protectType.form.filename" clearable placeholder="请输入模板名称" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="protectType.dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="onCreateType">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="批量设置脚本" :visible.sync="js.dialog.visible" :modal="false" width="500px">
      <el-input type="textarea" :rows="5" autosize v-model="js.script" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="js.dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="listSetScript">确定</el-button>
      </span>
    </el-dialog>
    <!--脚本-->
    <x-script ref="script" />
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import Vue from 'vue';
import Container from '~/components/container';
import SplitLeftRight from '~/components/splite/leftRight';
import SplitTopBottom from '~/components/splite/topBottom';
import XScript from '~/components/tscript';

const OpRender = Vue.extend({
  template: `
    <div v-if="params.node.data">
      <el-tooltip class="item" effect="dark" content="编辑" placement="top">
        <el-button type="text" icon="el-icon-edit" @click="onTypeEdit" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="下载模板" placement="top">
        <el-button type="text" icon="el-icon-download" @click="onDownload" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="删除" placement="top">
        <el-button type="text" class="color-red" icon="el-icon-delete" @click="onTypeDelete" />
      </el-tooltip>
    </div>
    `,
  methods: {
    onTypeEdit() {
      this.params.context.componentParent.onTypeEdit(this.params.node.data);
    },
    onDownload() {
      this.params.context.componentParent.onDownload(this.params.node.data);
    },
    onTypeDelete() {
      this.params.context.componentParent.onTypeDelete(this.params.node.data);
    }
  }
});

export default {
  name: 'manage-type',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    Container,
    XScript,
    SplitLeftRight,
    SplitTopBottom
  },
  data() {
    return {
      script: '',
      editor: '',
      selectedScriptId: '',
      currentScriptName: '',
      dirty: false,
      scriptRunning: false,
      selectedRow: null,
      grid: {
        options: {
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          accentedSort: true,
          animateRows: true,
          deltaRowDataMode: true,
          groupDefaultExpanded: 0,
          groupRowRenderer: 'agGroupCellRenderer',
          rememberGroupStateWhenNewData: true,
          rowBuffer: 100,
          rowSelection: 'single',
          context: {
            componentParent: this
          },
          autoGroupColumnDef: {
            headerName: '保护装置型号库',
            field: 'versionAndChkCode',
            tooltipField: 'versionAndChkCode',
            width: 200,
            sort: 'asc',
            cellRendererParams: {
              suppressCount: true
            }
          },
          getRowNodeId ({ _id }) {
            return _id;
          },
          getContextMenuItems({ node, context }) {
            return [];
          },
          onCellValueChanged({ colDef, newValue, data, context }) {
          },
          onRowSelected({ node, data, context }) {
            if (!node.selected) {
              return;
            }
            if (data) {
              context.componentParent.openScript(data);
              return;
            }
            context.componentParent.selectedRow = node;
          }
        },
        columnDefs: [{
          headerName: '厂家',
          field: 'factory',
          rowGroup: true,
          suppressMenu: true,
          hide: true
        }, {
          headerName: '型号',
          field: 'modelNumber',
          rowGroup: true,
          suppressMenu: true,
          hide: true
        }, {
          headerName: '模板',
          colId: 'filename',
          suppressMenu: true,
          field: 'filename'
        }, {
          headerName: '操作',
          suppressMenu: true,
          cellRendererFramework: OpRender
        }],
        rowData: []
      },
      protectType: {
        dialog: {
          update: false,
          visible: false
        },
        form: {
          factory: '',
          modelNumber: '',
          version: '',
          checkCode: '',
          flag6: false,
          filename: '',
          fileList: [],
          file: null
        },
        rules: {}
      },
      js: {
        dialog: {
          visible: false
        },
        script: ''
      }
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight',
      'getUserId'
    ]),
    contentHeight() {
      return this.getClientHeight - 80;
    },
    currentRouteText() {
      function findRoute(routes, name) {
        if (!routes) {
          return null;
        }
        for (const route of routes) {
          if (route.name === name) {
            return route;
          } else if (route.children) {
            const found = findRoute(route.children, name);
            if (found) {
              return found;
            }
          }
        }
      }
      const route = findRoute(this.getUserRoutes, this.$route.name);
      return route ? route.label : '装置类型管理';
    },
    factories() {
      const set = new Set();
      for (const protectModel of this.grid.rowData) {
        set.add(protectModel.factory);
      }
      return Array.from(set).sort((x, y) =>
        (typeof x === 'string' && typeof y === 'string') ? x.getQuanpin().localeCompare(y.getQuanpin()) : 0
      );
    },
    modelNumbers() {
      const set = new Set();
      for (const protectModel of this.grid.rowData) {
        set.add(protectModel.modelNumber);
      }
      return Array.from(set).sort((x, y) =>
        (typeof x === 'string' && typeof y === 'string') ? x.getQuanpin().localeCompare(y.getQuanpin()) : 0
      );
    }
  },
  mounted() {
    this.getTypeList();
  },
  methods: {
    openCreateType() {
      this.protectType.form = this.$options.data().protectType.form;
      this.protectType.dialog.update = false;
      this.$nextTick(() => {
        this.protectType.dialog.visible = true;
      });
    },
    // 模板-上传
    onUploadChange({ raw }) {
      this.protectType.form.file = raw;
    },
    // 模板-移除
    onUploadRemove() {
      this.protectType.form.file = '';
    },
    // 装置-新增、更新
    onCreateType() {
      this.$refs.protectTypeForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        this.protectType.dialog.visible = false;

        const formData = new FormData();
        this.protectType.form.userId = this.getUserId;
        for (const key of Object.keys(this.protectType.form)) {
          formData.append(key, this.protectType.form[key]);
        }

        const url = this.protectType.dialog.update ? `/manage/protectModel/${this.protectType.form._id}` : '/manage/protectModel';
        const { data } = await this.$axios.post(url, formData);

        const changedData = Object.assign({
          id: data._id,
          _id: data._id,
          filename: data.filename,
          versionAndChkCode: (data.metadata.version ? data.metadata.version : '') + (data.metadata.checkCode ? ` [${data.metadata.checkCode}]` : '')
        }, data.metadata);
        const index = this.grid.rowData.findIndex(x => x.id === changedData.id);
        if (index >= 0) {
          this.grid.rowData.splice(index, 1, changedData);
        } else {
          this.grid.rowData.push(changedData);
        }
        this.grid.options.api.refreshCells({
          force: true
        });

        const rowNode = this.grid.options.api.getRowNode(data._id);
        if (rowNode) {
          rowNode.setSelected(true);
          let iterator = rowNode.parent;
          while (iterator) {
            iterator.setExpanded(true);
            iterator = iterator.parent;
          }
        }

        this.$nextTick(() => {
          this.grid.options.api.ensureNodeVisible(rowNode);
        });
      });
    },
    // 获取所有装置
    async getTypeList() {
      const { data } = await this.$axios.get('/manage/protectModels/list');
      this.grid.rowData = data.map(row => {
        return Object.assign({
          id: row._id,
          _id: row._id,
          saving: false,
          versionAndChkCode: (row.metadata.version ? row.metadata.version : '') + (row.metadata.checkCode ? ` [${row.metadata.checkCode}]` : ''),
          filename: row.filename
        }, row.metadata);
      });
    },
    // 装置-编辑
    onTypeEdit(data) {
      this.protectType.form = JSON.parse(JSON.stringify(data));
      this.protectType.form.fileList = [{
        name: data.filename
      }];
      this.protectType.dialog.update = true;
      this.$nextTick(() => {
        this.protectType.dialog.visible = true;
      });
    },
    // 装置-下载模板
    onDownload({ _id }) {
      const a = document.createElement('a');
      a.href = `/manage/downloadProtectTemplate/${_id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    // 装置-删除
    onTypeDelete(data) {
      this.$confirm(`请确认是否删除定值单模板[${data.filename}]`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const { data: result } = await this.$axios.delete('/manage/protectModel/' + data._id);
          if (result.succ) {
            const index = this.grid.rowData.findIndex(x => x.id === data._id);
            if (index >= 0) {
              this.grid.rowData.splice(index, 1);
            }
            this.grid.options.api.updateRowData({ remove: [data] });
            this.selectedScriptId = '';
            this.currentScriptName = '';
            this.dirty = true;
            this.editor.dispose();
          }
        } catch (e) {
          console.error(e);
          this.$message.error(e.message);
        }
      }).catch(() => {});
    },
    // 批量设置脚本-打开
    openListSet() {
      this.js.script = this.$options.data().js.script;
      this.$nextTick(() => {
        this.js.dialog.visible = true;
      });
    },
    // 批量设置脚本-确定
    async listSetScript() {
      const { allLeafChildren } = this.selectedRow;
      try {
        await this.$axios.post('/manage/batchProtectModelScripts', {
          protectModelIds: allLeafChildren.map(x => x.id),
          script: JSON.stringify(this.js.script)
        });
        this.js.dialog.visible = false;
        await this.openJs({ _id: this.selectedScriptId, filename: this.currentScriptName });
      } catch (err) {
        this.$message.error(err.message);
      }
    },
    // 脚本-获取数据-打开
    async openJs({ _id, filename }) {
      const { data } = await this.$axios.get(`/manage/protectModel/script/${_id}`);
      if (!this.editor) {
        this.editor = monaco.editor.create(this.$refs.sEditor, {
          value: data,
          language: 'javascript',
          theme: 'vs',
          automaticLayout: true,
          tabSize: 2
        });
        this.editor.getModel().updateOptions({ tabSize: 2 });
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
          this.saveScript();
        });
        this.editor.onDidChangeModelContent(e => {
          this.dirty = true;
        });
        this.editor.focus();
      } else {
        this.editor.setValue(data);
      }
      this.currentScriptName = filename;
      this.dirty = false;
      this.selectedScriptId = _id;
    },
    // 脚本-展示
    async openScript(data) {
      if (!this.dirty || !this.selectedScriptId) {
        await this.openJs(data);
        return;
      }
      const found = this.jsFiles.find(x => x._id === this.selectedScriptId);
      this.$confirm('请确认是否保存已修改的脚本: ' + found.metadata.identifier + '？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        type: 'warning'
      }).then(async () => {
        await this.saveScript();
        await this.openJs(data);
      }).catch(async () => {
        await this.openJs(data);
      });
    },
    // 脚本-保存
    async saveScript() {
      try {
        const { data } = await this.$axios.post(`/manage/protectModel/script/${this.selectedScriptId}`, {
          script: this.editor.getValue()
        });
        if (!data.succ) {
          this.$message.error(data.message);
        }
        this.dirty = false;
      } catch (err) {
        console.error(err);
        this.$message.error(err.message);
      }
    }
  }
};
</script>

<style scoped>
.js-title {
  padding: 4px 5px;
}

.color-red {
  color: red;
}
</style>
