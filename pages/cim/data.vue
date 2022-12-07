<!--meta:{"index":16,"label":"数据维护","auths":["admin","master"],"roles":"any"}-->
<template>
  <container>
    <el-tabs v-model="activeName" @tab-click="handleClick" type="border-card">
      <el-tab-pane label="厂站" name="graph">
        <el-table
          ref="graphTable"
          :data="graphTable"
          v-loading="loading.graph"
          stripe highlight-current-row
          border>
          <el-table-column property="name" label="名称" width="200" />
          <el-table-column property="svg" label="对应ID" width="200" />
          <el-table-column label="操作">
            <template slot-scope="{row}">
              <el-tooltip class="item" effect="dark" content="删除" placement="right">
                <el-button type="text" class="color-red" icon="el-icon-delete" @click="onGraphDelete(row)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          @current-change="handleGraphChange"
          :current-page.sync="page.current"
          :page-size="page.size"
          layout="total, prev, pager, next, jumper"
          :total="page.count">
        </el-pagination>
      </el-tab-pane>
      <el-tab-pane label="设备类型" name="type">
        <el-table
          ref="typeTable"
          :data="typeTable"
          v-loading="loading.type"
          stripe highlight-current-row
          border>
          <el-table-column property="name" label="名称" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.name | nameFormat }}</span>
            </template>
          </el-table-column>
          <el-table-column property="svg" label="对应ID" />
        </el-table>
        <el-pagination
          background
          @current-change="handleCurrentChange"
          :current-page.sync="page.current"
          :page-size="page.size"
          layout="total, prev, pager, next, jumper"
          :total="page.count">
        </el-pagination>
      </el-tab-pane>
      <el-tab-pane label="电压等级" name="voltage">
        <el-table
          ref="voltageTable"
          :data="voltageTable"
          v-loading="loading.voltage"
          stripe highlight-current-row
          border>
          <el-table-column property="name" label="名称" width="200" />
          <el-table-column property="value" label="电压值(kV)" width="200" />
          <el-table-column property="svg" label="对应ID" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import Container from '~/components/container';

export default {
  name: 'cim-data',
  components: {
    Container
  },
  head() {
    return {
      title: this.currentRouteText
    };
  },
  data() {
    return {
      activeName: 'graph',
      loading: {
        graph: true,
        type: false,
        voltage: false
      },
      graphTable: [],
      typeTable: [],
      voltageTable: [],
      page: {
        size: 15,
        count: 1,
        current: 1
      }
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes'
    ]),
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
      return route ? route.label : '数据维护';
    }
  },
  filters: {
    nameFormat(val) {
      if (val instanceof Array) {
        let name = '';
        for (const v of val) {
          if (name) {
            name += `、${v}`;
            continue;
          }
          name = v;
        }
        return name;
      }
      return val;
    }
  },
  mounted() {
    this.getGraphList();
  },
  methods: {
    async handleClick({ name }) {
      switch (name) {
        case 'graph': {
          await this.getGraphList();
          break;
        }
        case 'type': {
          await this.getTypeList();
          break;
        }
        case 'voltage': {
          await this.getVoltageList();
          break;
        }
      }
    },
    async handleCurrentChange(val) {
      await this.getTypeList(val - 1);
    },
    async handleGraphChange(val) {
      await this.getGraphList(val - 1);
    },
    async getGraphList(index = 0) {
      this.loading.graph = true;

      const { size } = this.page;
      const { data } = await this.$axios.post('/models/substation/list', {
        startRow: index * size,
        endRow: (index + 1) * size
      });
      const { succ = false, result = {} } = data;
      if (!succ) {
        this.loading.graph = false;
        this.$message.error('获取厂站异常');
        return;
      }
      const { count, rows = [] } = result;
      this.graphTable = rows;
      this.page.count = count;

      this.loading.graph = false;
    },
    async getTypeList(index = 0) {
      this.loading.type = true;

      const { data } = await this.$axios.post('/models/type/list', {
        startRow: index * this.page.size,
        endRow: (index + 1) * this.page.size
      });
      if (!data.succ) {
        this.loading.type = false;
        this.$message.error('查询设备类型异常');
        return;
      }
      this.typeTable = data.result.rows;
      this.page.count = data.result.count;

      this.loading.type = false;
    },
    async getVoltageList() {
      this.loading.voltage = true;

      const { data } = await this.$axios.get('/models/xml-voltage/list');
      if (!data.succ) {
        this.loading.voltage = false;
        this.$message.error('查询电压等级异常');
        return;
      }
      this.voltageTable = data.result;

      this.loading.voltage = false;
    },
    onGraphDelete({ _id }) {
      this.$confirm('此操作将永久删除该厂站下的所有数据，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete(`/models/substation/delete/${_id}`);
        const { succ = false, result = {} } = data;
        if (!succ || result.deletedCount === 0) {
          this.$message.error('删除厂站异常');
          return;
        }
        this.$message.success('删除成功');
        await this.getGraphList(this.page.current - 1);
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>

</style>
