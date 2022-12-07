<!--meta:{"index":18,"label":"CT维护","auths":"any","roles":"any"}-->
<template>
  <div style="height: 100%">
    <div class="example-wrapper">
      <container>
        <div class="editButton">
          <el-button @click="editAll">批量修改</el-button>
          <el-button type="success" @click="selector.linestation = true" icon="el-icon-folder-opened">
            选择线路
          </el-button>
        </div>
        <ag-grid-vue :modules="$agGridModules" class="ag-theme-alpine clear-line" v-if="isReloadData"
          :style="{height: contentHeight - 122 + 'px'}" :gridOptions="grid.options" :columnDefs="grid.columnDefs"
          :rowData="rowData" @grid-ready="onGridReady" :rowSelection="rowSelection" />
        <el-dialog title="编辑" :visible.sync="edit.visible" width="500px" :modal="false">
          <div class="edit-body">
            <el-descriptions :title="edit.title" />
            <el-form ref="ctForm" :model="edit.form" :rules="edit.rules" label-width="130px">
              <el-form-item :label="breakerParams.ct01" prop="ct01">
                <el-input type="number" v-model.trim="edit.form.ct01" clearable />
              </el-form-item>
              <el-form-item :label="breakerParams.ct02" prop="ct02">
                <el-input type="number" v-model.trim="edit.form.ct02" clearable />
              </el-form-item>
              <el-form-item :label="breakerParams.ct11" prop="ct11">
                <el-input type="number" v-model.trim="edit.form.ct11" clearable />
              </el-form-item>
              <el-form-item :label="breakerParams.ct12" prop="ct12">
                <el-input type="number" v-model.trim="edit.form.ct12" clearable />
              </el-form-item>
            </el-form>
          </div>
          <span slot="footer">
            <el-button @click="edit.visible = false">取 消</el-button>
            <el-button type="primary" @click="onEdit">确 定</el-button>
          </span>
        </el-dialog> -->
        <line-selector title="选择线路" :visible.sync="selector.linestation" :rowData="rowData" @resultData="getFilter"
          @on-open-graph="onOpenGraph" />
      </container>
    </div>
  </div>
</template>

<script  type="module">
import { mapGetters } from 'vuex';
  mport Vue from 'vue';
  rt Globals from '../../assets/js/globals';
    ontainer from '~/components/container';
      elector from '~/components/selector/linestation';
      lt {
    'cim-ct',
    ents: {
      r,
      ctor
         {
    rn {
       this.currentRouteText
            ta() {
  return {
    ReloadData: true,
      {
      ble: false,
      literData: false,
      e: 'dd',
      : {
      d: '',
      01: '',
      02: '',
        cision: '',
        '',
        '',
      1Precision: ''
              Row: {
                
                    or: {
      station: false,
      ect: false
    
    gridApi: null,
    columnApi: null,
    id: {
      ons: {
      faultColDef: {
        able: true,
      resizable: true,
      floatingFilter: true,
      rowSelection: 'multiple',
        filterData: null,
        filteredPagerows: null,
      rowData: null
      
        Text: Globals.agGridLocaleText,
        eRows: true,
        t: {
      componentParent: this
      
      getRowId: (params) => params.data.id,
      columnTypes: {
      numberColumn: {
          width: 160,
            filter: false,
            editable: true,
          valueParser: this.numberValueParser
          }
        },
      onCellValueChanged({ colDef, newValue, data, context }) {
          const _this = context.componentParent;
          _this.updateCalculate({
          id: data._id,
        update: {
          [colDef.field]: newValue
        }
                            mnDefs: [{
      aderName: '序号',
      ppressMenu: true,
      dth: 100,
      lter: false,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      llRenderer: params => {
        return params.rowIndex + 1;
      },
          cellStyle: {
        'text-align': 'center'
      }
    }, {
      headerName: '名称',
      eld: 'name',
         312,
        : 'agTextColumnFilter'
              aderName: '断路器类型',
      eld: 'breakerType',
      dth: 160,
      lter: 'agTextColumnFilter'
    },
    {
      aderName: '零序CT变比一次值',
         'ct01',
        'numberColumn'
                  headerName: '零序CT变比二次值',
      field: 'ct02',
      type: 'numberColumn'
                  aderName: '正序CT变比一次值',
         'ct11',
        'numberColumn'
                      headerName: '正序CT变比二次值',
      eld: 'ct12',
      pe: 'numberColumn'
                                                        ction = 'multiple';
                                  g(this.rowNodeId);
    }
              {
      tters([
        utes',
        Height',
      ttingConfig',
      stemParams'
            eight() {
    turn this.getClientHeight;
          outeText() {
      on findRoute(routes, name) {
        tes) {
          l;
                  st route of routes) {
        ute.name === name) {
          oute;
          (route.children) {
        t found = findRoute(route.children, name);
        found) {
           found;
                                  route = findRoute(this.getUserRoutes, this.$route.name);
       route ? route.label : 'CT维护';
              s() {
        s.getSystemParams.breaker;
                  cData({ $axios }) {
      result = [] } = await $axios.$post('/models/ct/list', {
      ateTypeList: ['protect', 'selfHealing']
        rn {
      a: result
      
  methods: {
    numberValueParser({ oldValue, newValue }) {
      if (newValue === '' || isNaN(newValue)) {
        this.$message.warning('输入内容必须是合法数字');
        return oldValue;
      }
      return Number(newValue);
    },
    //  批量修改
    editAll() {
      const selRow = this.grid.options.api.getSelectedRows();
      if (selRow.length <= 0) {
        this.$message.warning('请选中至少一行数据');
      } else {
        const [first] = selRow;
        const { ct01 = 0 } = first;
        const { ct02 = 0 } = first;
        const { ct11 = 0 } = first;
        const { ct12 = 0 } = first;
        const { _id = null } = first;
        const ctvalue = { _id, ct01, ct02, ct11, ct12 };
        this.openEditDialog(ctvalue, selRow);
      }
    },
    openEditAllDialog() {
      this.params.context.componentParent.openEditAllDialog(this.params.value);
    },
    updateBreakerById(id, data) {
      return this.$axios.$post(`/models/breaker/update/${id}`, data);
    },
    batchUpdateBreaker([idList], data) {
      return this.$axios.$post('/models/breaker/batchUpdate', {
        idList,
        data
      });
    },
    onGridReady(params) {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
      const updateData = (data) => params.api.setRowData(data);
      return updateData;
    },
    copy(data) {
      window.console.assert(data, '拷贝对象不存在');
      return JSON.parse(JSON.stringify(data));
    },
    openEditDialog(ctvalue, selRow) {
      this.edit.title = '';
      this.edit.selectedRow = selRow;
      this.edit.form = ctvalue;
      this.$nextTick(() => {
        this.edit.visible = true;
      });
    },
    onEdit() {
      this.$refs.ctForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        const { ct01, ct02, ct11, ct12 } = this.edit.form;
        const ctData = { ct01, ct02, ct11, ct12 };
        // 遍历查询到的对象的id
        let idList = [];
        for (const key of this.edit.selectedRow) {
          idList.push(key._id);
        }
        const updateRes = await this.batchUpdateBreaker([idList], ctData);
        console.log('********************************');
        console.log(updateRes);
        if (!updateRes.succ) {
          this.$message.error('更新失败');
          return;
        }
        // 关闭弹框
        this.edit.visible = false;
        // 更新数据
        await this.upload();
      });
    },
    async updateCalculate({ id, update }) {
      const { data } = await this.$axios.post(`/models/breaker/update/${id}`, update);
      if (!data.succ) {
        this.$message.error('更新索引异常');
      }
    },
    // 打开图形
    async onOpenGraph({ _id, svg, name, belong }) {
      this.selector.linestation = false;
      if (this.editableTabs.some(x => x.uri === _id)) {
        this.editableTabsValue = _id;
        return;
      }
      const { data } = await this.$axios.get(`/models/svg/${svg}`);
      if (data instanceof Object) {
        this.$message.error('获取svg失败');
        return;
      }
      this.editableTabs.push({ uri: _id, name, svg: data, svgId: svg, belong });
      this.editableTabsValue = _id;
      this.$nextTick(() => {
        const found = this.$refs.graph.find(x => x.uri === _id);
        found && found.initSvg();
        // tab页数据刷新
        this.onUnitTabClick({ name: this.unitActiveName });
      });
    },
    reloadPart() {
      this.isReloadData = false;
      this.$nextTick(() => {
        this.isReloadData = true;
      });
    },
    //  刷新页面
    async upload() {
      if (this.edit.hasFliterData) {
        this.getAllRows();
        let filterIdList = [];
        for (const row of this.filteredPagerows) {
          filterIdList.push(row._id);
        }
        const data = await this.$axios.$post('/models/filterCt/list', filterIdList);
        if (!data.succ || !data) {
          this.$message.error('数据错误');
        }
        this.rowData = data.result;
      } else {
        const data = await this.$axios.$post('/models/ct/list', {
          calculateTypeList: ['protect', 'selfHealing']
        });
        if (!data || !data.succ) {
          this.$message.error('获取ctBreak异常');
          return;
        }
        this.rowData = data.result;
      }
    },
    getFilter(resultData) {
      // 对传入的数据进行过滤并显示。
      // const finalData = await this.$axios.$post('/models/fiterBreaker/list',resultData)
      this.edit.hasFliterData = true;
      let finalData = [];
      for (const breaker of resultData) {
        if (breaker.calculateType === ('protect') || breaker.calculateType === ('selfHealing')) {
          finalData.push(breaker);
        };
      }
      if (finalData.length <= 0) {
        this.$message.warning('该线路上暂无数据');
      }
      this.filterData = finalData;
      this.rowData = finalData;
    },
    // 拿到当前页面的所有行数据
    getAllRows() {
      let rowDatas = [];
      this.gridApi.forEachNode(node => rowDatas.push(node.data));
      this.filteredPagerows = rowDatas;
    }
  }

};
</script>

<style scoped>
.edit-body {
  margin: 0 auto;
  width: 400px;
}

.grid-columns {
  text-align: center;
}

.editButton {
  padding-bottom: 10px
}
</style>
