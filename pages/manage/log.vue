<!--meta:{"index":15,"label":"日志管理","auths":["admin","master"],"roles":"any"}-->
<template>
  <container>
    <el-card class="box-card">
      <el-row>
        <el-col :span="4">
          <el-select v-model="getForm.method" placeholder="请求方式">
            <el-option
              v-for="item in methods"
              :key="item.label"
              :label="item.label"
              :value="item.label">
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="20">
          <el-button type="success" @click="onGet">查询</el-button>
          <el-button type="primary" @click="onReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>
    <el-card>
      <el-table
        size="medium"
        ref="logTable"
        :data="logs"
        border
        stripe highlight-current-row
        max-height="800px">
        <el-table-column property="serverId" label="服务" width="150" />
        <el-table-column property="url" label="调用接口" min-width="300" />
        <el-table-column property="method" label="请求方式" width="100" />
        <el-table-column property="module" label="操作模块" width="100" />
        <el-table-column property="address" label="操作地址" width="150" />
        <el-table-column property="user.name" label="操作用户" width="150" />
        <el-table-column property="succ" label="操作状态" width="100">
          <template slot-scope="{ row }">
            <el-tag v-if="row.succ === 'true'" type="success">成功</el-tag>
            <el-tag v-else-if="row.succ === 'false'" type="danger">失败</el-tag>
            <el-tag v-else type="info">无</el-tag>
          </template>
        </el-table-column>
        <el-table-column property="level" label="操作等级" width="100">
          <template slot-scope="{ row }">
            <el-tag v-if="row.level === 'info'" type="info">信息</el-tag>
            <el-tag v-else type="danger">错误</el-tag>
          </template>
        </el-table-column>
        <el-table-column property="time" label="操作时间" width="200" />
        <el-table-column label="操作" width="100">
          <template slot-scope="{ row }">
            <el-button type="text" icon="el-icon-view" @click="openLogDialog(row)">详细</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        @current-change="handleCurrentChange"
        :current-page="page.current"
        :page-size="page.size"
        layout="total, prev, pager, next, jumper"
        :total="page.count">
      </el-pagination>
    </el-card>
    <el-dialog title="日志详细" :visible.sync="logDialogVisible" width="800px" :modal="false">
      <el-descriptions class="margin-top" :title="log.url" :column="3" size="medium">
        <el-descriptions-item label="服务">
          {{ log.serverId }}
        </el-descriptions-item>
        <el-descriptions-item label="请求方式">
          {{ log.method }}
        </el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag v-if="log.succ === 'true'" type="success">成功</el-tag>
          <el-tag v-else-if="log.succ === 'false'" type="danger">失败</el-tag>
          <el-tag v-else type="info">无</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作地址">
          {{ log.address }}
        </el-descriptions-item>
        <el-descriptions-item label="操作用户">
          {{ log.user ? log.user.name : '' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作等级">
          <el-tag v-if="log.level === 'info'" type="info">信息</el-tag>
          <el-tag v-else type="danger">错误</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ log.time }}
        </el-descriptions-item>
        <el-descriptions-item label="消耗时间">
          {{ log.duration }} ms
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions :column="1" size="medium">
        <el-descriptions-item label="请求参数">
          <json-viewer :value="jsonParse(log.param)" copyable />
        </el-descriptions-item>
        <el-descriptions-item label="返回参数">
          <json-viewer :value="jsonParse(log.result)" copyable />
        </el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="logDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import JsonViewer from 'vue-json-viewer/ssr';
import Container from '~/components/container';
import 'vue-json-viewer/style.css';

export default {
  name: 'manage-log',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    Container,
    JsonViewer
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
      return route ? route.label : '日志管理';
    }
  },
  data() {
    return {
      getForm: {
        method: ''
      },
      methods: [{
        label: 'GET'
      }, {
        label: 'POST'
      }, {
        label: 'PUT'
      }, {
        label: 'DELETE'
      }],
      logs: [],
      page: {
        size: 13,
        count: 1,
        current: 1,
        params: {}
      },
      logDialogVisible: false,
      log: {}
    };
  },
  mounted() {
    this.getLogPage();
  },
  methods: {
    // 获取日志分页
    async getLogPage(index = 0) {
      const { data } = await this.$axios.post('/sys/query-logs', Object.assign({}, {
        startRow: index * this.page.size,
        endRow: (index + 1) * this.page.size
      }, this.page.params));
      if (!data.succ) {
        this.$message.error('查询日志异常');
        return;
      }
      this.logs = data.result.rows;
      this.page.count = data.result.count;
    },
    // 处理当前页面
    async handleCurrentChange(val) {
      await this.getLogPage(val - 1);
    },
    // 日志详细
    async openLogDialog({ _id }) {
      const { data } = await this.$axios.get(`/sys/single-log/${_id}`);
      if (!data.succ) {
        this.$message.error('查询详细异常');
        return;
      }
      this.log = data.result;
      this.$nextTick(() => {
        this.logDialogVisible = true;
      });
    },
    jsonParse(val) {
      return val ? JSON.parse(val) : {};
    },
    // 查询
    async onGet() {
      this.page.params = JSON.parse(JSON.stringify(this.getForm));
      await this.getLogPage();
    },
    // 重置
    onReset() {
      this.getForm = this.$options.data().getForm;
    }
  }
};
</script>

<style scoped>
:deep(.el-table td.el-table__cell div) {
  text-align: center;
}

:deep(.el-table th.el-table__cell.is-leaf) {
  text-align: center;
}

.box-card {
  margin: 5px 0 15px;
}
</style>
