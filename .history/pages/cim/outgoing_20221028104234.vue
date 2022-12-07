<!--meta:{"index":19,"label":"出线索引","auths":"any","roles":"any"}-->
<template>
  <container>
    <div class="editButton">
      <el-button type="primary" @click="setOutLet">设置出线</el-button>
    </div>
    <el-card>
      <ag-grid-vue :modules="$agGridModules" class="ag-theme-alpine clear-line"
        :style="{ height: contentHeight - 122 + 'px' }" :gridOptions="grid.options" :columnDefs="grid.columnDefs"
        :cellValueChanged="grid.options.onCellValueChanged" :rowData="rowData" :rowSelection="rowSelection" />
    </el-card>
  </container>
</template>
        
<script>
import { mapGetters } from 'vuex';
import Container from '~/components/container';
import Globals from 'assets/js/globals';
export default {
  name: 'cim-outgoing-line',
  components: {
    Container
  },
  head() {
    return {
      title: this.currentRouteText
    };
  },
  created() {
    this.rowSelection = 'multiple';
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight'
    ]),
    contentHeight() {
      return this.getClientHeight;
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
      return route ? route.label : '出线索引';
    }
  },
  data() {
    return {
      grid: {
        options: {
          rowSelection: 'single',
          defaultColDef: {
            sortable: true,
            resizable: true,
            floatingFilter: true
          },
          localeText: Globals.agGridLocaleText,
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          columnTypes: {
            numberColumn: {
              width: 192,
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
            });
          }
        },
        columnDefs: [{
          headerName: '序号',
          suppressMenu: true,
          width: 80,
          filter: false,
          cellRenderer: params => {
            return params.rowIndex + 1;
          },
          cellStyle: {
            'text-align': 'center'
          }
        },
        {
          headerName: '名称',
          field: 'name',
          filter: 'agTextColumnFilter',
          width: 200
        },
        {
          headerName: '线路',
          field: 'line.name',
          filter: 'agTextColumnFilter',
          width: 250
        },
        {
          headerName: '母线',
          width: 250,
          field: 'bus.name',
          filter: 'agTextColumnFilter'
        },
        {
          headerName: '厂站',
          field: 'substation.name',
          filter: 'agTextColumnFilter',
          width: 250
        },
        {
          headerName: '过流Ⅱ段电流定值(A)',
          field: 'overCurrentIISetting',
          type: 'numberColumn'
        },
        {
          headerName: '过流Ⅱ段时间定值(s)',
          field: 'overCurrentIITime',
          type: 'numberColumn'
        },
        {
          headerName: '过流Ⅲ段电流定值(A)',
          field: 'overCurrentIIISetting',
          type: 'numberColumn'
        },
        {
          headerName: '过流Ⅲ段时间定值(s)',
          field: 'overCurrentIIITime',
          type: 'numberColumn'
        }
        ]
      },
      rowSelection: null
    };
  },
  async asyncData({ $axios }) {
    const { result = [] } = await $axios.$post('/models/outgoing-line/list', {
      outletTypeList: ['outlet']
    });
    return {
      rowData: result
    };
  },
  methods: {
    numberValueParser({ oldValue, newValue }) {
      if (!Number(newValue) || Number.isNaN(newValue)) {
        this.$message.warning('输入内容必须是合法数字');
        return oldValue;
      }
      return Number(newValue);
    },
    async updateCalculate({ id, update }) {
      const { data } = await this.$axios.post(`/models/breaker/update/${id}`, update);
      if (!data.succ) {
        this.$message.error('更新索引异常');
      }
    },
    setOutLet() {
      this.$confirm('是否将所有母线的第一个断路器设置为出线开关？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        customClass: 'del-model',
        type: 'warning'
      }).then(() => {
        this.getFirstBreaker();
        this.$message({
          type: 'success',
          message: '设置成功!'
        });
        this.refreshData();
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消设置'
        });
      });
    },
    async getFirstBreaker() {
      class Base {
        // id 例如 PD_30000000_60894
        id = '';
        // 查找关联时使用的id, 例如 #PD_30000000_60894
        sId = '';
        // 不含PD前缀的id,例如 30000000_60894
        mRID = '';
        // 名称
        name = '';

        constructor(data) {
          this.id = data.$['rdf:ID'];
          this.sId = `#${data.$['rdf:ID']}`;
          this.mRID = data['cim:IdentifiedObject.mRID'][0];
          this.name = data['cim:IdentifiedObject.name'][0];
        }
      }
      // 查出所有线路的svg
      const { data: lineData } = await this.$axios.post('/models/allLine/list');
      let lineSvgList = [];
      for (const line of lineData.result) {
        lineSvgList.push(line.svg);
      }

      // 查出所有的母线的svg
      const { data: busData } = await this.$axios.post('/models/allBuses/list');
      let busSvgList = [];
      for (const item of busData.result) {
        busSvgList.push(item.svg);
      }

      // 根据[所有线路的svg] 进行[获取路径]
      const { data: structureData } = await this.$axios.post('/models/xml-structures/list', {
        lineSvgList
      });
      let svgData = [];
      for (const key of structureData.result) {
        for (const busSvg of busSvgList) {
          let filterData = key.xml.filter(x => new Base(x.from).id === busSvg);
          if (filterData.length > 0) {
            svgData.push(filterData);
          }
        }
      }
      let filtedBreakerSvg = [];
      for (const structure of svgData) {
        filtedBreakerSvg.push(Object.values(structure[0].from.$));
      }
      let afterFilterSvg = [];
      for (const key of filtedBreakerSvg) {
        afterFilterSvg.push(key[0]);
      }
      const { data: breakerUpdate } = await this.$axios.post('/models/updateBreaker/svgList', {
        afterFilterSvg
      });
      if (!breakerUpdate || !breakerUpdate.succ) {
        this.$message.error('更新出线失败');
        return false;
      }
    },
    async refreshData() {
      const data = await $axios.$post('/models/outgoing-line/list', {
        outletTypeList: ['outlet']
      });
      if (!data || !data.succ) {
        this.$message.error('获取出线列表异常');
        return;
      }
      this.rowData = data.result;
    }
  }
};
</script>

<style scoped>
.editButton {
  padding-bottom: 10px
}
</style>
