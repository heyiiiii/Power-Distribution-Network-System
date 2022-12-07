<!--meta:{"index":2,"label":"配网参数","auths":"any","roles":"any"}-->
<template>
  <div>
    <split-left-right leftName="设备列表" :height="contentHeight" sid="10kV-model-l-r-1">
      <div slot="left" slot-scope="{height}">
        <el-card :body-style="{height: height - 55 + 'px', paddingLeft: 0}">
          <div slot="header">
            <el-button type="success" @click="selector.substation = true" icon="el-icon-folder-opened">打开图形</el-button>
            <template v-if="editableTabsValue">
              <el-dropdown style="float: right;padding: 3px 0" size="medium" @command="onDropdownClick">
                <span class="el-dropdown-link">
                  图形功能<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="property">属性</el-dropdown-item>
                  <el-dropdown-item command="plan">方案</el-dropdown-item>
                  <el-dropdown-item command="calculate">批量计算</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </div>
          <el-tabs v-model="unitActiveName" @tab-click="onUnitTabClick" tab-position="left" style="height: 100%">
            <el-tab-pane v-for="item of unit" :key="item.type" :label="item.label" :name="item.type">
              <ag-grid-vue :modules="$agGridModules" class="ag-theme-balham clear-line"
                :style="{height: height - 70 + 'px'}" :gridOptions="item.gridOptions" :columnDefs="item.columnDefs"
                :rowData="item.rowData" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
      <div slot="right" slot-scope="{height}">
        <split-left-right leftName="图形" :height="height" :leftWidthInit="1050" sid="10kV-model-l-r-2">
          <div slot="left">
            <el-card :body-style="{height: height - 6 + 'px'}">
              <template v-if="editableTabs.length > 0">
                <el-tabs v-model="editableTabsValue" type="border-card" closable @tab-remove="removeTab"
                  @tab-click="handleClick">
                  <el-tab-pane :key="item.name" v-for="(item) in editableTabs" :label="formatTabName(item)"
                    :name="item.uri">
                    <graph ref="graph" :panelHeight="height - 5" :uri="item.uri" :svg="item.svg" :lineSvg="item.svgId"
                      @on-select-svg="onSelectSvg" @on-calculate="onCalculate"
                      @on-general-calculate="onGeneralCalculate" @on-general-dz="onGeneralDz" />
                  </el-tab-pane>
                </el-tabs>
              </template>
            </el-card>
          </div>
          <div slot="right" slot-scope="{height}">
            <el-card style="width: 250px" :body-style="{height: height - 78 + 'px'}">
              <div class="header-buttons" slot="header">
                <template v-if="editInfo.form.name">
                  <span class="form-name">{{ editInfo.form.name }}</span>
                  <el-button-group v-if="editInfo.form.name">
                    <el-button type="success" @click="editInfo.disabled = false">编辑</el-button>
                    <el-button type="info" :disabled="editInfo.disabled" @click="onSave">保存</el-button>
                  </el-button-group>
                </template>
                <template v-else>
                  <span class="form-name">{{ '暂无数据' }}</span>
                </template>
              </div>
              <template v-if="editInfo.form.name">
                <el-row>
                  <el-col>
                    <el-tag class="m-b-10" effect="dark" type="info">
                      修改人: {{ formatUserName(editInfo.form.modifier) }}
                    </el-tag>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col>
                    <el-tag effect="dark" type="info">
                      修改时间: {{ editInfo.form.updatedAt | formatDate }}
                    </el-tag>
                  </el-col>
                </el-row>
                <el-divider />
              </template>
              <!-- 开关 -->
              <template v-if="editInfo.type === 'breaker'">
                <el-form size="mini" ref="breakerForm" :model="editInfo.form" :rules="editInfo.rules.breaker"
                  label-position="top" :disabled="editInfo.disabled">
                  <el-form-item label="类型" prop="breakerType">
                    <el-tag size="small" disable-transitions>{{ editInfo.form.breakerType }}</el-tag>
                  </el-form-item>
                  <el-form-item label="开关功能" prop="funcType">
                    <el-select v-model="editInfo.form.funcType" placeholder="无" clearable>
                      <el-option v-for="(item, index) in funcTypeList" :key="index" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="启用功能" prop="calculateType">
                    <el-radio v-model="editInfo.form.calculateType" label="">无</el-radio>
                    <el-radio v-model="editInfo.form.calculateType" label="protect">保护</el-radio>
                    <el-radio v-model="editInfo.form.calculateType" label="selfHealing">自愈</el-radio>
                  </el-form-item>
                  <!--保护-->
                  <el-form-item label="保护型号" prop="protect">
                    <template v-if="editInfo.form.protect">
                      <el-tag size="small" :closable="!editInfo.disabled" @close="onCloseProtectTag">
                        {{ editInfo.form.protectName }}
                      </el-tag>
                    </template>
                    <el-button type="primary" size="small" @click="openProtect">配置</el-button>
                  </el-form-item>
                  <!--自愈-->
                  <template v-if="editInfo.form.calculateType === 'selfHealing'">
                    <el-form-item label="短延时(s)" prop="shortTime">
                      <el-input v-model.trim="editInfo.form.shortTime" type="number" :min="0" />
                    </el-form-item>
                  </template>
                  <!--出线开关属性-->
                  <template v-if="editInfo.form.funcType === getOutletFuncType">
                    <el-form-item :label="breakerParams.overCurrentIISetting" prop="overCurrentIISetting">
                      <el-input v-model.trim="editInfo.form.overCurrentIISetting" type="number" :min="0" />
                    </el-form-item>
                    <el-form-item :label="breakerParams.overCurrentIITime" prop="overCurrentIITime">
                      <el-input v-model.trim="editInfo.form.overCurrentIITime" type="number" :min="0" />
                    </el-form-item>
                    <el-form-item :label="breakerParams.overCurrentIIISetting" prop="overCurrentIIISetting">
                      <el-input v-model.trim="editInfo.form.overCurrentIIISetting" type="number" :min="0" />
                    </el-form-item>
                    <el-form-item :label="breakerParams.overCurrentIIITime" prop="overCurrentIIITime">
                      <el-input v-model.trim="editInfo.form.overCurrentIIITime" type="number" :min="0" />
                    </el-form-item>
                  </template>
                  <el-form-item :label="breakerParams.ct01" prop="ct01">
                    <el-input v-model.trim="editInfo.form.ct01" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item :label="breakerParams.ct02" prop="ct02">
                    <el-input v-model.trim="editInfo.form.ct02" type="number" :min="0" />
                  </el-form-item>
                  <!--                  <el-form-item label="零序CT精度" prop="ct0Precision">-->
                  <!--                    <el-input v-model.trim="editInfo.form.ct0Precision" />-->
                  <!--                  </el-form-item>-->
                  <el-form-item :label="breakerParams.ct11" prop="ct11">
                    <el-input v-model.trim="editInfo.form.ct11" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item :label="breakerParams.ct12" prop="ct12">
                    <el-input v-model.trim="editInfo.form.ct12" type="number" :min="0" />
                  </el-form-item>
                  <!--                  <el-form-item label="正序CT精度" prop="ct1Precision">-->
                  <!--                    <el-input v-model.trim="editInfo.form.ct1Precision" />-->
                  <!--                  </el-form-item>-->
                  <el-form-item :label="breakerParams.totalCapacity" prop="totalCapacity">
                    <el-input v-model.trim="editInfo.form.totalCapacity" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item :label="breakerParams.maxCapacity" prop="maxCapacity">
                    <el-input v-model.trim="editInfo.form.maxCapacity" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item :label="breakerParams.maxMotorCapacity" prop="maxMotorCapacity">
                    <el-input v-model.trim="editInfo.form.maxMotorCapacity" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="描述" prop="description">
                    <el-input v-model.trim="editInfo.form.description" type="textarea" :rows="1" placeholder="请输入描述" />
                  </el-form-item>
                </el-form>
              </template>
              <!-- 母线 -->
              <template v-else-if="editInfo.type === 'bus'">
                <el-form ref="busForm" size="mini" :model="editInfo.form" :rules="editInfo.rules.bus"
                  label-position="top" :disabled="editInfo.disabled">
                  <el-form-item label="描述" prop="description">
                    <el-input v-model.trim="editInfo.form.description" type="textarea" :rows="2" placeholder="请输入描述" />
                  </el-form-item>
                </el-form>
              </template>
              <!-- 线路 -->
              <template v-else-if="editInfo.type === 'line'">
                <el-form ref="lineForm" size="mini" :model="editInfo.form" :rules="editInfo.rules.line"
                  label-position="top" :disabled="editInfo.disabled">
                  <el-form-item label="名称" prop="name">
                    <el-input :title="editInfo.form.name" v-model.trim="editInfo.form.name" />
                  </el-form-item>
                  <el-form-item label="描述" prop="description">
                    <el-input v-model.trim="editInfo.form.description" type="textarea" :rows="2" placeholder="请输入描述" />
                  </el-form-item>
                </el-form>
              </template>
              <!-- 线路段 -->
              <template v-else-if="editInfo.type === 'segment'">
                <el-form ref="acSegmentForm" size="mini" :model="editInfo.form" :rules="editInfo.rules.segment"
                  label-position="top" :disabled="editInfo.disabled">
                  <el-form-item label="长度（km）" prop="length">
                    <el-input v-model.trim="editInfo.form.length" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="截面积（mm）" prop="sectionSurface">
                    <el-input v-model.trim="editInfo.form.sectionSurface" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="正序电阻（Ω）" prop="valR1">
                    <el-input v-model.trim="editInfo.form.valR1" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="正序电抗（Ω）" prop="valX1">
                    <el-input v-model.trim="editInfo.form.valX1" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="零序电阻（Ω）" prop="valR0">
                    <el-input v-model.trim="editInfo.form.valR0" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="零序电抗（Ω）" prop="valX0">
                    <el-input v-model.trim="editInfo.form.valX0" type="number" :min="0" />
                  </el-form-item>
                </el-form>
              </template>
              <!-- 变压器 -->
              <template v-else-if="editInfo.type === 'transformer'">
                <el-form ref="transformerForm" size="mini" :model="editInfo.form" :rules="editInfo.rules.transformer"
                  label-position="top" :disabled="editInfo.disabled">
                  <el-form-item label="类型" prop="breakerType">
                    <el-tag size="small" disable-transitions>{{ editInfo.form.type }}</el-tag>
                  </el-form-item>
                  <el-form-item label="UK百分比" prop="uk">
                    <el-input v-model.trim="editInfo.form.uk" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="容量" prop="capacity">
                    <el-input v-model.trim="editInfo.form.capacity" type="number" :min="0" />
                  </el-form-item>
                  <el-form-item label="描述" prop="description">
                    <el-input v-model.trim="editInfo.form.description" type="textarea" :rows="2" placeholder="请输入描述" />
                  </el-form-item>
                </el-form>
              </template>
              <template v-else-if="editInfo.type === 'loading'">
                <el-skeleton :rows="12" animated />
              </template>
              <template v-else>
                <el-empty description="暂无数据" />
              </template>
            </el-card>
          </div>
        </split-left-right>
      </div>
    </split-left-right>
    <el-dialog title="属性" destroy-on-close :visible.sync="graph.dialog.visible" width="400px">
      <el-form size="mini" label-width="100px" :model="graph.form">
        <el-form-item label="所属地区" prop="belong">
          <el-select v-model="graph.form.belong" placeholder="请选择">
            <el-option v-for="item in graph.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="onSaveGraph">确定</el-button>
      </span>
    </el-dialog>
    <!-- 脚本 -->
    <js-script ref="script" />
    <!-- 厂站选择器 -->
    <sub-selector title="打开图形" :visible.sync="selector.substation" @on-open-graph="onOpenGraph" />
    <!-- 保护选择器 -->
    <protect-selector :visible.sync="selector.protect" @on-selected="onSelectedProtect" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import SplitLeftRight from '~/components/splite/leftRight';
import SplitTopBottom from '~/components/splite/topBottom';
import JsScript from '~/components/tscript';
import SubSelector from '~/components/selector/substation';
import ProtectSelector from '~/components/selector/protect';
import Graph from '~/components/graph/svg';
import Globals from '@/assets/js/globals';

export default {
  name: 'cim-model',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    SplitLeftRight,
    SplitTopBottom,
    SubSelector,
    ProtectSelector,
    JsScript,
    Graph
  },
  data() {
    return {
      funcTypeList: [{
        label: '出线开关',
        value: 'outlet'
      }, {
        label: '联络开关',
        value: 'loop'
      }],
      selector: {
        substation: false,
        protect: false
      },
      graph: {
        dialog: {
          visible: false
        },
        form: {
          belong: ''
        },
        options: [{
          value: 'city',
          label: '城网'
        }, {
          value: 'village',
          label: '农网'
        }]
      },
      unitActiveName: 'bus',
      editableTabsValue: '',
      editableTabs: [],
      tabIndex: 2,
      editInfo: {
        type: '',
        disabled: true,
        form: {},
        rules: {
          bus: {},
          breaker: {},
          line: {},
          segment: {},
          transformer: {}
        }
      },
      graphData: {
        nodeDataArray: [],
        linkDataArray: []
      },
      svg: '',
      unit: [{
        type: 'bus',
        label: '母线',
        rowData: [],
        columnDefs: [
          {
            headerName: '',
            suppressMenu: true,
            width: 50,
            cellRenderer: params => {
              return params.rowIndex + 1;
            }
          },
          {
            headerName: '名称',
            field: 'name',
            flex: 1,
            filter: 'agTextColumnFilter',
            floatingFilter: true
          }
        ],
        gridOptions: {
          rowSelection: 'single',
          localeText: Globals.agGridLocaleText,
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openDetail(data, 'bus');
          },
          getContextMenuItems() {
            return [];
          }
        }
      }, {
        type: 'breaker',
        label: '断路器',
        rowData: [],
        columnDefs: [
          {
            headerName: '',
            suppressMenu: true,
            width: 50,
            cellRenderer: params => {
              return params.rowIndex + 1;
            }
          },
          {
            headerName: '名称',
            field: 'name',
            flex: 1,
            filter: 'agTextColumnFilter',
            floatingFilter: true
          }
        ],
        gridOptions: {
          rowSelection: 'single',
          localeText: Globals.agGridLocaleText,
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openBreaker(data);
          },
          getContextMenuItems() {
            return [];
          }
        }
      }, {
        type: 'line',
        label: '线路',
        rowData: [],
        columnDefs: [
          {
            headerName: '',
            suppressMenu: true,
            width: 50,
            cellRenderer: params => {
              return params.rowIndex + 1;
            }
          },
          {
            headerName: '名称',
            field: 'name',
            flex: 1,
            filter: 'agTextColumnFilter',
            floatingFilter: true
          }
        ],
        gridOptions: {
          rowSelection: 'single',
          localeText: Globals.agGridLocaleText,
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openDetail(data, 'line');
          },
          getContextMenuItems() {
            return [];
          }
        }
      }, {
        type: 'segment',
        label: '线路段',
        rowData: [],
        columnDefs: [
          {
            headerName: '',
            suppressMenu: true,
            width: 50,
            cellRenderer: params => {
              return params.rowIndex + 1;
            }
          },
          {
            headerName: '名称',
            field: 'name',
            flex: 1,
            filter: 'agTextColumnFilter',
            floatingFilter: true
          }
        ],
        gridOptions: {
          rowSelection: 'single',
          localeText: Globals.agGridLocaleText,
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openDetail(data, 'segment');
          },
          getContextMenuItems() {
            return [];
          }
        }
      }, {
        type: 'transformer',
        label: '变压器',
        rowData: [],
        columnDefs: [
          {
            headerName: '',
            suppressMenu: true,
            width: 50,
            cellRenderer: params => {
              return params.rowIndex + 1;
            }
          },
          {
            headerName: '名称',
            field: 'name',
            flex: 1,
            filter: 'agTextColumnFilter',
            floatingFilter: true
          }
        ],
        gridOptions: {
          rowSelection: 'single',
          localeText: Globals.agGridLocaleText,
          defaultColDef: {
            sortable: true,
            resizable: true,
            filter: true
          },
          animateRows: true,
          context: {
            componentParent: this
          },
          getRowNodeId({ _id }) {
            return _id;
          },
          async onRowSelected({ node, data, context }) {
            if (!data || !node.selected) {
              return;
            }
            const _this = context.componentParent;
            await _this.openDetail(data, 'transformer');
          },
          getContextMenuItems() {
            return [];
          }
        }
      }]
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight',
      'getAllUsers',
      'getSystemParams',
      'getSettingConfig'
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
      return route ? route.label : '配网参数';
    },
    currentTab() {
      return this.editableTabs.find(x => x.uri === this.editableTabsValue) || {};
    },
    breakerParams() {
      return this.getSystemParams.breaker;
    },
    getOutletFuncType() {
      const found = this.funcTypeList.find(x => x.label === '出线开关');
      return found ? found.value : 'outlet';
    }
  },
  filters: {
    formatDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  mounted() {
  },
  methods: {
    // 获取
    async getBusList() {
      const { data } = await this.$axios.get('/models/bus/list/' + this.editableTabsValue);
      if (!data.succ) {
        this.$message.error('获取母线异常');
        return;
      }
      const bus = this.unit.find(x => x.type === 'bus');
      if (bus) {
        bus.rowData = data.result;
      }
    },
    async getBreakerList() {
      const { data } = await this.$axios.get('/models/breaker/list/' + this.editableTabsValue);
      if (!data.succ) {
        this.$message.error('获取断路器异常');
        return;
      }
      const breaker = this.unit.find(x => x.type === 'breaker');
      if (breaker) {
        breaker.rowData = data.result;
      }
    },
    async getLineList() {
      const { data } = await this.$axios.post('/models/Line/list', [this.editableTabsValue]);
      if (!data.succ) {
        this.$message.error('获取线路异常');
        return;
      }
      const line = this.unit.find(x => x.type === 'line');
      if (line) {
        line.rowData = data.result;
      }
    },
    async getSegmentList() {
      const { data } = await this.$axios.get('/models/segment/list/' + this.editableTabsValue);
      if (!data.succ) {
        this.$message.error('获取线路段异常');
        return;
      }
      const segment = this.unit.find(x => x.type === 'segment');
      if (segment) {
        segment.rowData = data.result;
      }
    },
    async getTransformerList() {
      const { data } = await this.$axios.get('/models/transformer/list/' + this.editableTabsValue);
      if (!data.succ) {
        this.$message.error('获取变压器异常');
        return;
      }
      const transformer = this.unit.find(x => x.type === 'transformer');
      if (transformer) {
        transformer.rowData = data.result;
      }
    },
    // 通过svg获取断路器属性
    async getBreakerBySvg({ svg, line }) {
      this.editInfo = this.$options.data().editInfo;
      this.editInfo.type = 'loading';
      this.editInfo.form = {};
      const { data } = await this.$axios.get(`/models/breaker/${line}/${svg}`);
      if (!data.succ) {
        this.$message.error('获取断路器属性异常');
        this.editInfo.type = '';
        return;
      }
      this.editInfo.type = 'breaker';
      this.editInfo.form = data.result;
    },
    // 修改提示-保存
    async save() {
      await this.$confirm('当前编辑内容尚未保存，是否保存', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '放弃',
        type: 'warning'
      }).then(async () => {
        await this.onSave();
      }).catch(() => { });
    },
    // 右侧设备属性-保存
    async onSave() {
      switch (this.editInfo.type) {
        case 'bus': {
          await this.updateBus();
          break;
        }
        case 'breaker': {
          await this.updateBreaker();
          break;
        }
        case 'line': {
          await this.updateLine();
          break;
        }
        case 'segment': {
          await this.updateSegment();
          break;
        }
        case 'transformer': {
          await this.updateTransformer();
          break;
        }
      }
    },
    // 更新
    async updateBus() {
      await this.$refs.busForm.validate(async (valid) => {
        if (valid) {
          const { data } = await this.$axios.post(`/models/bus/update/${this.editInfo.form._id}`, this.editInfo.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
          this.editInfo.disabled = true;
        } else {
          return false;
        }
      });
    },
    async updateBreaker() {
      await this.$refs.breakerForm.validate(async (valid) => {
        if (valid) {
          const { data } = await this.$axios.post(`/models/breaker/update/${this.editInfo.form._id}`, this.editInfo.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
          this.editInfo.disabled = true;
        } else {
          return false;
        }
      });
    },
    async updateLine() {
      await this.$refs.lineForm.validate(async (valid) => {
        if (valid) {
          const { data } = await this.$axios.post(`/models/line/update/${this.editInfo.form._id}`, this.editInfo.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
          this.editInfo.disabled = true;
        } else {
          return false;
        }
      });
    },
    async updateSegment() {
      await this.$refs.acSegmentForm.validate(async (valid) => {
        if (valid) {
          const { data } = await this.$axios.post(`/models/segment/update/${this.editInfo.form._id}`, this.editInfo.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
          this.editInfo.disabled = true;
        } else {
          return false;
        }
      });
    },
    async updateTransformer() {
      await this.$refs.transformerForm.validate(async (valid) => {
        if (valid) {
          const { data } = await this.$axios.post(`/models/transformer/${this.editInfo.form._id}`, this.editInfo.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
          this.editInfo.disabled = true;
        } else {
          return false;
        }
      });
    },
    // 移除标签
    removeTab(targetName) {
      const tabs = this.editableTabs;
      let activeName = this.editableTabsValue;
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.uri === targetName) {
            const nextTab = tabs[index + 1] || tabs[index - 1];
            if (nextTab) {
              activeName = nextTab.uri;
            }
          }
        });
      }
      this.editableTabs = tabs.filter(tab => tab.uri !== targetName);
      this.editableTabsValue = this.editableTabs.length === 0 ? this.$options.data().editableTabsValue : activeName;
      this.onUnitTabClick({ name: this.unitActiveName });
    },
    // 点击标签
    handleClick() {
      this.onUnitTabClick({ name: this.unitActiveName });
    },
    // 定值计算
    async onCalculate(lineId, id, lineSvg) {
      await this.callJsScript('整定计算', {
        xmlId: lineId, breakerSId: id, lineSvg
      });
      this.$message.info('计算完成');
    },
    // 生成定值单
    async onGeneralDz(lineId, breakerSvg, lineSvg) {
      let protectId = '';
      if (this.editInfo.form.svg === breakerSvg) {
        protectId = this.editInfo.form.protect;
      } else {
        const { data: listRes } = await this.$axios.post('/models/breaker/condition/list', {
          svgList: [breakerSvg]
        });
        if (!listRes.succ) {
          return;
        }
        protectId = listRes.result[0].protect;
      }
      const { data: scriptRes } = await this.$axios.get('/manage/protectModel/script/' + protectId);
      await this.$refs.script.run({
        param: {
          xmlId: lineId,
          breakerSId: breakerSvg,
          lineSvg
        },
        scriptContent: scriptRes
      });
    },
    // 生成计算书
    async onGeneralCalculate(lineId, id, lineSvg) {
      const { data } = await this.$axios.get(`/models/calculate/${id}`);
      if (!data.succ) {
        this.$message.error('生成异常');
      }
      if (!data.result) {
        this.$message.info('不存在计算结果，请完成整定计算');
        return;
      }
      await this.callJsScript('整定计算书', {
        xmlId: lineId, breakerSId: id, lineSvg
      });
      this.$message.info('生成完成');
    },
    // 调用脚本
    async callJsScript(identifier, param) {
      const { data: jsFiles } = await this.$axios.get('/manage/js-files');
      const js = jsFiles.find(x => x.metadata.identifier === identifier);
      if (!js) {
        this.$message.error('未找到脚本文件');
        return;
      }
      await this.$refs.script.run({
        scriptId: js._id,
        param
      });
    },
    // 点击设备标签
    async onUnitTabClick({ name }) {
      if (!this.editableTabsValue) {
        const found = this.unit.find(x => x.type === name);
        if (found) {
          found.rowData = [];
        }
        return;
      }
      switch (name) {
        case 'bus': {
          await this.getBusList();
          break;
        }
        case 'breaker': {
          await this.getBreakerList();
          break;
        }
        case 'line': {
          await this.getLineList();
          break;
        }
        case 'segment': {
          await this.getSegmentList();
          break;
        }
        case 'transformer': {
          await this.getTransformerList();
          break;
        }
      }
    },
    async openBreaker(data) {
      if (!this.editInfo.disabled) {
        await this.save();
      }
      await this.getBreakerBySvg(data);
    },
    async openDetail(data, type) {
      if (!this.editInfo.disabled) {
        await this.save();
      }
      this.editInfo = this.$options.data().editInfo;
      this.editInfo.type = type;
      this.editInfo.form = data;
    },
    // 选中svg
    async onSelectSvg({ id, type, lineId }) {
      switch (type) {
        case 'breaker': {
          await this.openBreaker({ svg: id, line: lineId });
          break;
        }
        case 'bus': {
          const { data } = await this.$axios.get(`/models/bus/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          await this.openDetail(data.result, 'bus');
          break;
        }
        case 'transformer': {
          const { data } = await this.$axios.get(`/models/transformer/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          await this.openDetail(data.result, 'transformer');
          break;
        }
        case 'segment': {
          const { data } = await this.$axios.get(`/models/segment/${id}`);
          if (!data.succ) {
            this.$message.error('查询异常');
            break;
          }
          if (!data.result) {
            this.$message.warning('模型缺失');
            break;
          }
          await this.openDetail(data.result, 'segment');
          break;
        }
      }
    },
    // 打开图形
    async onOpenGraph({ _id, svg, name, belong }) {
      this.selector.substation = false;
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
    // 打开保护列表
    openProtect() {
      this.selector.protect = true;
    },
    // 选中保护
    onSelectedProtect({ _id, modelNumber }) {
      this.$set(this.editInfo.form, 'protect', _id);
      this.editInfo.form.protectName = modelNumber;
    },
    // 删除保护装置标签
    onCloseProtectTag() {
      this.editInfo.form.protect = null;
    },
    // 编辑图形属性
    editGraphProperty() {
      this.graph.dialog.visible = true;
      const { belong } = this.editableTabs.find(x => x.uri === this.editableTabsValue);
      this.graph.form.belong = belong;
    },
    // 批量整定计算
    async batchCalculate() {
      const { svgId: lineSvg } = this.editableTabs.find(x => x.uri === this.editableTabsValue);
      await this.callJsScript('批量计算', {
        xmlId: this.editableTabsValue,
        lineSvg
      });
    },
    // 图形功能-下拉菜单
    onDropdownClick(command) {
      const event = {
        property: this.editGraphProperty,
        plan: this.getPlan,
        calculate: this.batchCalculate
      };
      event[command]();
    },
    // 保存图形属性
    async onSaveGraph() {
      this.graph.dialog.visible = false;
      const { data } = await this.$axios.post(`/models/line/update/${this.editableTabsValue}`, this.graph.form);
      if (!data.succ || data.result.modifiedCount !== 1) {
        this.$message.error('操作异常');
        return;
      }
      const editableTab = this.editableTabs.find(x => x.uri === this.editableTabsValue);
      editableTab.belong = JSON.parse(JSON.stringify(this.graph.form.belong));
    },
    // 获取一线一案
    async getPlan() {
      const editableTab = this.editableTabs.find(x => x.uri === this.editableTabsValue);
      if (editableTab) {
        const { uri, svgId: svg, name } = editableTab;
        await this.callJsScript('方案图', { uri, svg, name });
      }
    },
    // 格式化修改人
    formatUserName(id) {
      const user = this.getAllUsers.find(x => x._id === id);
      return user ? user.name : '该用户不存在';
    },
    // 格式化图形标签名
    formatTabName({ name, belong }) {
      let tabName = '';
      switch (belong) {
        case 'city': {
          tabName = `${name}(城网)`;
          break;
        }
        case 'village': {
          tabName = `${name}(农网)`;
          break;
        }
        default: {
          tabName = name;
        }
      }
      return tabName;
    }
  }
};
</script>

<style scoped>
.padding-left-5 {
  padding-left: 5px;
}

.padding-top-5 {
  padding-top: 5px;
}

.header-buttons {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
}

.info-font {
  font-size: 13px;
  color: #5e6d82;
}

.form-name {
  font-size: 16px;
  font-weight: bold;
}

:deep(.el-form-item--mini) {
  margin-bottom: 0;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
}

.el-icon-arrow-down {
  font-size: 12px;
}
</style>
