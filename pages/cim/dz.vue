<!--meta:{"index":17,"label":"定值索引","auths":"any","roles":"any"}-->
<template>
  <container>
    <split-left-right leftName="定值列表" :height="contentHeight" delay sid="survey-left-right">
      <template #left="{ height }">
        <el-card>
          <ag-grid-vue
            :modules="$agGridModules"
            class="ag-theme-alpine clear-line"
            :style="{height: height - 26 + 'px'}"
            :gridOptions="grid.options"
            :columnDefs="grid.columnDefs"
            :rowData="grid.rowData"
          />
        </el-card>
      </template>
      <div slot="right">
        <el-card :style="{ width: '400px' }">
          <div slot="header" class="clearfix">
            <template v-if="card.title">
              <span>{{ card.title }}</span>
              <el-switch
                v-model="card.locked"
                class="my-switch"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="onSwitchChange"
              />
            </template>
            <template v-else>
              <span>暂无数据</span>
            </template>
          </div>
          <div class="text item">
            <template v-if="card.title">
              <el-descriptions v-loading="card.loading" :title="`定值编号：${card.form.number}`" :column="1" border size="medium">
                <template v-for="(val, key) in card.form.params">
                  <el-descriptions-item :key="key" :label="getName(key)">
                    <el-input v-model="card.form.params[key]" type="Number" :disabled="!card.locked" />
                  </el-descriptions-item>
                </template>
              </el-descriptions>
            </template>
            <template v-else>
              <el-empty :style="{ padding: 0 }" description="暂无数据" />
            </template>
          </div>
        </el-card>
        <el-card :style="{ width: '400px'}" :body-style="{ height: '300px' }">
          <div slot="header" class="clearfix">
            <span>定值召回</span>
          </div>
          <template v-if="card.title">
            <div v-loading="card.dz.loading" element-loading-background="rgba(255, 255, 255, 1)" class="dz-recall">
              <el-steps :active="card.dz.active" direction="vertical" finish-status="success">
                <el-step title="定值召回" icon="el-icon-position" />
                <el-step title="远方召回结果" icon="el-icon-document" />
                <el-step title="定值下装" icon="el-icon-position" />
                <el-step title="远方修改结果" icon="el-icon-document" />
              </el-steps>
              <template v-if="card.dz.active === dzStatus.noRecall">
                <el-result class="dz-result" icon="warning" title="尚未定值召回">
                  <template slot="extra">
                    <el-button type="warning" size="medium" @click="dzRecall">定值召回</el-button>
                  </template>
                </el-result>
              </template>
              <template v-else-if="card.dz.active === dzStatus.recalling">
                <el-result class="dz-result" icon="info" title="正在等待远方召回结果">
                  <template slot="extra">
                    <el-button type="info" size="medium" @click="getRecallResult">刷新</el-button>
                  </template>
                </el-result>
              </template>
              <template v-else-if="card.dz.active === dzStatus.recalled">
                <template v-if="card.dz.recallResult.info">
                  <template v-if="card.dz.recallResult.info.result === '成功'">
                    <el-result class="dz-result" icon="success" title="定值召回成功">
                      <template slot="extra">
                        <el-button type="success" size="medium" @click="dzCompare">定值比对</el-button>
                      </template>
                    </el-result>
                  </template>
                  <template v-else-if="card.dz.recallResult.info.result === '失败'">
                    <el-result class="dz-result" icon="error" title="定值召回失败" :sub-title="card.dz.recallResult.reason">
                      <template slot="extra">
                        <el-button type="error" size="medium" @click="dzRecall">重新定值召回</el-button>
                      </template>
                    </el-result>
                  </template>
                </template>
                <template v-else-if="!card.dz.loading && !card.dz.recallResult.info">
                  <el-result class="dz-result" icon="warning" title="读取召回结果异常">
                    <template slot="extra">
                      <el-button type="warning" size="medium" @click="getRecallResult">刷新</el-button>
                      <el-button type="primary" size="medium" @click="dzRecall">重新定值召回</el-button>
                    </template>
                  </el-result>
                </template>
              </template>
              <template v-else-if="card.dz.active === dzStatus.modifying">
                <el-result class="dz-result" icon="info" title="正在等待远方修改结果">
                  <template slot="extra">
                    <el-button type="info" size="medium" @click="getSendResult">刷新</el-button>
                  </template>
                </el-result>
              </template>
              <template v-else-if="card.dz.active === dzStatus.modified">
                <template v-if="card.dz.modifyResult.info">
                  <template v-if="card.dz.modifyResult.info.result === '执行成功'">
                    <el-result class="dz-result" icon="success" title="执行成功" />
                  </template>
                  <template v-else-if="card.dz.modifyResult.info.result === '撤销成功'">
                    <el-result class="dz-result" icon="waring" title="撤销成功" />
                  </template>
                  <template v-else-if="card.dz.modifyResult.info.result === '执行失败'">
                    <el-result class="dz-result" icon="error" title="执行失败" :sub-title="card.dz.modifyResult.info.reason">
                      <template slot="extra">
                        <el-button type="danger" size="medium" @click="dzFail">失败详情</el-button>
                        <el-button type="primary" size="medium" @click="dzAgainCompare">重新定值下装</el-button>
                      </template>
                    </el-result>
                  </template>
                </template>
                <template v-else-if="!card.dz.loading && !card.dz.modifyResult.info">
                  <el-result class="dz-result" icon="warning" title="读取修改结果异常">
                    <template slot="extra">
                      <el-button type="warning" size="medium" @click="getSendResult">刷新</el-button>
                      <el-button type="primary" size="medium" @click="dzAgainCompare">重新定值下装</el-button>
                    </template>
                  </el-result>
                </template>
              </template>
            </div>
          </template>
          <template v-else>
            <el-empty :style="{ padding: 0 }" description="暂无数据" />
          </template>
        </el-card>
      </div>
    </split-left-right>
    <el-dialog title="定值比对" :visible.sync="card.dz.dialog.visible" :modal="false" width="500px">
      <el-table
        border
        stripe
        highlight-current-row
        :header-cell-style="{ padding: 0 }"
        :cell-style="{ padding: 0 }"
        :data="card.dz.tableData">
        <el-table-column label="名称" prop="name" />
        <el-table-column prop="value1">
          <template slot="header">
            <el-radio v-model="card.dz.source" label="remote">现运行定值</el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="value2">
          <template slot="header">
            <el-radio v-model="card.dz.source" label="local">计算定值</el-radio>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="card.dz.dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="dzSend">定值下装</el-button>
      </span>
    </el-dialog>
    <el-dialog title="失败详情" :visible.sync="card.fail.dialog.visible" :modal="false" width="500px">
      <el-table
        border
        stripe
        highlight-current-row
        :cell-style="{textAlign: 'center'}"
        :header-cell-style="{textAlign: 'center'}"
        :data="card.fail.tableData">
        <el-table-column prop="address" width="80" />
        <el-table-column label="名称" prop="name" />
        <el-table-column label="执行情况" prop="status">
          <template #default="scope">
            <template v-if="scope.row.status === '执行成功'">
              <el-tag type="success">{{ scope.row.status }}</el-tag>
            </template>
            <template v-else>
              <el-tag type="danger">{{ scope.row.status }}</el-tag>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="card.fail.dialog.visible = false">确认</el-button>
      </span>
    </el-dialog>
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import Globals from '../../assets/js/globals';
import Container from '~/components/container';
import SplitLeftRight from '~/components/splite/leftRight';

export default {
  name: 'cim-dz-index',
  components: {
    Container,
    SplitLeftRight
  },
  head() {
    return {
      title: this.currentRouteText
    };
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
          columnTypes: {
            numberColumn: {
              width: 150,
              filter: false,
              editable: true,
              valueParser: this.numberValueParser
            }
          },
          localeText: Globals.agGridLocaleText,
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId ({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openDetail(data);
          },
          getContextMenuItems({ node, context }) {
            if (!node) {
              return [];
            }
            const _this = context.componentParent;
            return [{
              name: '删除',
              icon: '<i class="el-icon-delete text-error" />',
              action() {
                _this.deleteCalculate(node.data);
              }
            }];
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
          width: 50,
          filter: false,
          cellRenderer: params => {
            return params.rowIndex + 1;
          }
        }, {
          headerName: '名称',
          field: 'name',
          filter: 'agTextColumnFilter',
          width: 200
        }, {
          headerName: '厂站',
          field: 'substation.name',
          filter: 'agTextColumnFilter',
          width: 150
        }, {
          headerName: '线路',
          field: 'line.name',
          filter: 'agTextColumnFilter',
          width: 150
        }, {
          headerName: '开关类型',
          field: 'breakerType',
          filter: 'agTextColumnFilter',
          width: 150
        }, {
          headerName: '零序CT变比分子',
          field: 'ct01',
          type: 'numberColumn'
        }, {
          headerName: '零序CT变比分母',
          field: 'ct02',
          type: 'numberColumn'
        }, {
          headerName: '零序CT精度',
          field: 'ct0Precision',
          type: 'numberColumn'
        }, {
          headerName: '正序CT变比分子',
          field: 'ct11',
          type: 'numberColumn'
        }, {
          headerName: '正序CT变比分母',
          field: 'ct12',
          type: 'numberColumn'
        }, {
          headerName: '正序CT精度',
          field: 'ct1Precision',
          type: 'numberColumn'
        }, {
          headerName: '总配变容量(kVA)',
          field: 'totalCapacity',
          width: 150
        }, {
          headerName: '最大配变容量(kVA)',
          field: 'maxCapacity',
          width: 150
        }, {
          headerName: '最大电动机容量(kVA)',
          field: 'maxMotorCapacity',
          width: 180
        }, {
          headerName: '描述',
          field: 'description',
          width: 150,
          editable: true
        }],
        rowData: []
      },
      card: {
        disabled: false,
        loading: false,
        title: '',
        form: {
          gisId: '',
          sendTime: '',
          number: '',
          params: {}
        },
        dz: {
          loading: false,
          substationName: '',
          lineName: '',
          active: 0,
          recallResult: {},
          modifyResult: {},
          dialog: {
            visible: false
          },
          source: 'remote',
          tableData: []
        },
        fail: {
          dialog: {
            visible: false
          },
          tableData: [],
          visible: false
        }
      }
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight',
      'getSettingConfig',
      'getSystemParams'
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
      return route ? route.label : '定值索引';
    },
    dzStatus() {
      return Globals.dzStatus;
    }
  },
  mounted() {
    this.getCalculateList();
  },
  methods: {
    async getCalculateList() {
      const { data } = await this.$axios.post('/models/calculate/breaker/list');
      if (!data.succ) {
        this.$message.error('查询定值索引异常');
        return;
      }
      data.result.sort((a, b) => {
        return a.calc.number - b.calc.number;
      });
      this.grid.rowData = data.result;
    },
    async openDetail({ svg, name, substation, line }) {
      this.card.loading = true;
      this.card.dz.loading = true;
      const { data: detail } = await this.$axios.get(`/models/calculate/${svg}`);
      if (!detail.succ) {
        this.$message.error('查询定值详情异常');
        return;
      }

      this.card = this.$options.data().card;
      this.card.title = name;
      this.card.form = detail.result;
      this.card.dz.substationName = substation.name;
      this.card.dz.lineName = line.name;
      this.card.loading = false;

      const { noRecall, recalling, recalled, modifying, modified } = this.dzStatus;
      this.card.dz.active = detail.result.status || noRecall;
      if ([recalling, recalled].includes(this.card.dz.active)) {
        // 查询召回结果
        await this.getRecallResult();
      }
      if ([modifying, modified].includes(this.card.dz.active)) {
        // 查询下装结果
        await this.getSendResult();
      }
      this.card.dz.loading = false;
    },
    // 定值召回
    async dzRecall() {
      this.card.dz.loading = true;
      const { data } = await this.$axios.post('/models/dz/recall', {
        id: this.card.form._id,
        substationName: this.card.dz.substationName,
        lineName: this.card.dz.lineName,
        gisId: this.card.form.gisId
      });
      if (!data.succ) {
        this.$message.error('定值召回异常');
        this.card.dz.loading = false;
        return;
      }
      this.card.dz.active = data.result.status;
      this.card.dz.loading = false;
    },
    // 查询召回结果
    async getRecallResult() {
      this.card.dz.loading = true;
      const { data } = await this.$axios.post('/models/dz/recall/result', {
        id: this.card.form._id,
        gisId: this.card.form.gisId
      });
      if (!data.succ) {
        this.$message.error('查询召回结果异常');
        this.card.dz.loading = false;
        return;
      }
      if (data.result && data.result.recallResult) {
        this.card.dz.active = data.result.status;
        this.card.dz.recallResult = data.result.recallResult;
      }
      this.card.dz.loading = false;
    },
    // 失败详情
    dzFail() {
      this.card.fail.tableData = this.card.dz.modifyResult.data || [];
      this.$nextTick(() => {
        this.card.fail.dialog.visible = true;
      });
    },
    // 定值比对
    dzCompare() {
      const data = this.card.dz.recallResult.data || [];
      const local = this.getLocalParams();
      const tableData = [];
      for (const row of data) {
        const { name, value, address } = row;
        tableData.push({
          name,
          address,
          value1: value,
          value2: local[name] || ''
        });
      }
      this.card.dz.tableData = tableData;
      this.$nextTick(() => {
        this.card.dz.dialog.visible = true;
      });
    },
    // 重新定值比对
    async dzAgainCompare() {
      await this.getRecallResult();
    },
    getLocalParams() {
      const local = {};
      for (const key in this.card.form.params) {
        local[this.getName(key)] = this.card.form.params[key];
      }
      return local;
    },
    // 定值下装
    async dzSend() {
      this.card.dz.loading = true;
      const update = () => {
        if (this.card.dz.source === 'remote') {
          return this.card.dz.recallResult.data;
        }
        const localData = this.card.dz.tableData.filter(x => x.value2);
        return localData.map(x => {
          return {
            address: x.address,
            name: x.name,
            value: x.value2
          };
        });
      };

      const { data } = await this.$axios.post('/models/dz/modify', {
        id: this.card.form._id,
        substationName: this.card.dz.substationName,
        lineName: this.card.dz.lineName,
        breakerName: this.card.title,
        gisId: this.card.form.gisId,
        update: update()
      });
      if (!data.succ) {
        this.$message.error('定值召回异常');
        this.card.dz.loading = false;
        return;
      }
      const { status, number, sendTime } = data.result;
      this.card.form.number = number;
      this.card.form.sendTime = sendTime;
      this.card.dz.active = status;
      this.card.dz.dialog = false;
      this.card.dz.loading = false;
    },
    // 查询下装结果
    async getSendResult() {
      this.card.dz.loading = true;
      const { _id, number, gisId, sendTime } = this.card.form;
      const { data } = await this.$axios.post('/models/dz/modify/result', {
        id: _id, number, gisId, sendTime
      });
      if (!data.succ) {
        this.$message.error('查询召回下装异常');
        this.card.dz.loading = false;
        return;
      }
      if (data.result && data.result.modifyResult) {
        this.card.dz.active = data.result.status;
        this.card.dz.modifyResult = data.result.modifyResult;
      }
      this.card.dz.loading = false;
    },
    async onSwitchChange(val) {
      if (val) {
        return;
      }
      const { data } = await this.$axios.post(`/models/calculate/update/${this.card.form._id}`, {
        params: this.card.form.params
      });
      if (!data.succ || data.result.modifiedCount !== 1) {
        this.$message.error('保存异常');
      }
    },
    async updateCalculate({ id, update }) {
      const { data } = await this.$axios.post(`/models/breaker/update/${id}`, update);
      if (!data.succ) {
        this.$message.error('更新索引异常');
      }
    },
    deleteCalculate({ svg }) {
      this.$confirm('此操作将永久删除该索引，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.post(`/models/calculate/delete/${svg}`);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('删除索引异常');
          return;
        }
        if (this.card.form.breakerSvg === svg) {
          // 当前索引详情恢复为骨架屏
          this.card.title = '';
          this.card.form = {};
        }
        await this.getCalculateList();
      }).catch(() => {});
    },
    numberValueParser({ oldValue, newValue }) {
      if (!Number(newValue) || Number.isNaN(newValue)) {
        this.$message.warning('输入内容必须是合法数字');
        return oldValue;
      }
      return Number(newValue);
    },
    getName(key) {
      const config = this.getSettingConfig.find(x => x.name === key);
      if (config) {
        return config.value;
      }
      return this.getSystemParams.calculate[key] || key;
    }
  }
};
</script>

<style scoped>
.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.clearfix {
  font-size: 16px;
  font-weight: bold;
}

.clearfix:before, .clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}

.my-switch {
  float: right;
  padding: 3px 0
}

.dz-recall {
  height: 100%;
  display: flex;
}

.dz-result {
  margin: 0 auto;
  max-width: 260px;
}
</style>
