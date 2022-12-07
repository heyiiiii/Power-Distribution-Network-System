<!--meta:{"index":14,"label":"配置管理","auths":["admin","master"],"roles":"any"}-->
<template>
  <container
    v-loading.fullscreen.lock="importMongodbLoading"
    element-loading-text="系统数据导入中"
    element-loading-spinner="el-icon-loading">
    <el-tabs v-model="activeName" @tab-click="handleClick" type="border-card">
<!--      <el-tab-pane label="导线型号管理" name="conductorType">-->
<!--        <div class="buttons">-->
<!--          <el-button type="success" icon="el-icon-plus" @click="openConductorTypeDialog">新增</el-button>-->
<!--          <export-button @on-export="onExportConductor" />-->
<!--          <import-button ref="importConductorButton" action="/models/conductor-types/import" @on-success="onImportConductor" />-->
<!--        </div>-->
<!--        <el-table ref="conductorTypeTable" :data="conductorTypes" stripe highlight-current-row border>-->
<!--          <el-table-column property="name" label="名称" width="200" />-->
<!--          <el-table-column property="overhead" label="是否为架空线" width="120">-->
<!--            <template slot-scope="{row}">-->
<!--              <span>{{ row.overhead ? '是' : '否' }}</span>-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column property="gvalMR" label="几何均距" width="120" />-->
<!--          <el-table-column property="rvalPerKM" label="每公里电阻" width="120" />-->
<!--          <el-table-column property="xvalPerKM" label="每公里电抗" width="120" />-->
<!--          <el-table-column property="rvalDivR0" label="零序正序电阻比" width="120" />-->
<!--          <el-table-column property="xvalDivX0" label="零序正序电抗比" width="120" />-->
<!--          <el-table-column property="safeCurrent" label="安全电流" width="120" />-->
<!--          <el-table-column property="description" label="描述" width="140" />-->
<!--          <el-table-column label="操作">-->
<!--            <template slot-scope="{row}">-->
<!--              <el-tooltip class="item" effect="dark" content="编辑" placement="left">-->
<!--                <el-button type="text" icon="el-icon-edit" @click="openConductorEditDialog(row._id)" />-->
<!--              </el-tooltip>-->
<!--              <el-tooltip class="item" effect="dark" content="删除" placement="right">-->
<!--                <el-button type="text" class="color-red" icon="el-icon-delete" @click="onConductorDelete(row._id)" />-->
<!--              </el-tooltip>-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--        </el-table>-->
<!--      </el-tab-pane>-->
      <el-tab-pane label="电容电流管理" name="current">
        <div class="buttons">
          <el-button type="success" icon="el-icon-plus" @click="openCurrentCreateDialog">新增</el-button>
        </div>
        <el-table
          ref="currentTable"
          :data="current.table"
          row-key="_id"
          max-height="760px"
          :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
          stripe
          highlight-current-row
          border>
          <el-table-column property="voltage" label="电压等级" width="200">
            <template slot-scope="{ row }">
              <span>{{ row.voltage | voltageFormat(xmlVoltages) }}</span>
            </template>
          </el-table-column>
          <el-table-column property="area" label="截面面积" width="120" />
          <el-table-column property="value" label="电容电流" width="120" />
          <el-table-column property="description" label="描述" width="140" />
          <el-table-column label="操作">
            <template slot-scope="{ row }" v-if="row.area">
              <el-tooltip class="item" effect="dark" content="编辑" placement="left">
                <el-button type="text" icon="el-icon-edit" @click="openCurrentEditDialog(row)" />
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="删除" placement="right">
                <el-button type="text" class="color-red" icon="el-icon-delete" @click="onCurrentDelete(row._id)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="数据管理" name="data">
        <div style="display:flex;padding-top: 10px">
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>系统数据</span>
            </div>
            <span>数据导入</span>
            <el-upload
              drag
              action="/database/import-mongodb"
              accept=".7z"
              :multiple="false"
              :before-upload="onMongodbProgress"
              :on-success="onMongodbSuccess"
              :show-file-list="false">
              <i class="el-icon-upload" />
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em><br>只能选择.7z文件</div>
            </el-upload>
            <div @click="onExportData">
              <el-card shadow="hover" class="import-card">
                <i v-if="exportLoading" class="el-icon-loading" />
                <span v-else>数据导出</span>
              </el-card>
            </div>
          </el-card>
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>图形数据</span>
            </div>
            <span>数据导入</span>
            <el-upload
              drag
              action="/models/data/import"
              :headers="getAxiosHeader"
              accept=".zip"
              :multiple="false"
              :on-success="onSuccess"
              :show-file-list="false">
              <i class="el-icon-upload" />
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em><br>只能选择.zip文件</div>
            </el-upload>
          </el-card>
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>XML拓扑</span>
            </div>
            <span>数据导入</span>
            <el-upload
              drag
              action="/models/xml-structure/import"
              accept=".zip"
              :multiple="false"
              :on-success="onSuccess"
              :show-file-list="false">
              <i class="el-icon-upload" />
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em><br>只能选择.zip文件</div>
            </el-upload>
          </el-card>
        </div>
        <el-card class="box-card" style="width: 1210px">
          <div slot="header" class="clearfix">
            <span>远程数据</span>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="系统参数管理" name="parameter">
        <div class="buttons">
          <el-button type="success" icon="el-icon-plus" @click="openSystemCreateDialog">新增</el-button>
          <export-button @on-export="onExportSystem" />
          <import-button ref="importConfigButton" action="/setting/system-config/import" @on-success="onImportSystem" />
        </div>
        <el-table ref="systemTable" :data="systemConfigs" stripe highlight-current-row border max-height="720px">
          <el-table-column property="name" label="名称" width="200" />
          <el-table-column property="value" label="值" width="200" />
          <el-table-column property="description" label="描述" width="200" />
          <el-table-column label="操作">
            <template slot-scope="{row}">
              <el-tooltip class="item" effect="dark" content="编辑" placement="left">
                <el-button type="text" icon="el-icon-edit" @click="onConfigEdit(row._id)" />
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="删除" placement="right">
                <el-button type="text" class="color-red" icon="el-icon-delete" @click="onConfigDelete(row._id)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <el-dialog :title="voltageDialog.title" :visible.sync="voltageDialog.visible" width="500px" :modal="false">
      <el-form label-width="80px" :model="voltageForm" :rules="voltageRules" ref="voltageForm">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="voltageForm.name" ref="voltageDialogNameInput" />
        </el-form-item>
        <el-form-item label="基准电压" prop="ubase">
          <el-input v-model.trim="voltageForm.ubase" @change="onUBaseChange" type="number">
            <template slot="suffix">kV</template>
          </el-input>
        </el-form-item>
        <el-form-item label="电压上限" prop="ubaseMax">
          <el-input v-model.trim="voltageForm.ubaseMax" type="number">
            <template slot="suffix">kV</template>
          </el-input>
        </el-form-item>
        <el-form-item label="电压下限" prop="ubaseMin">
          <el-input v-model.trim="voltageForm.ubaseMin" type="number">
            <template slot="suffix">kV</template>
          </el-input>
        </el-form-item>
        <el-form-item label="基准电流" prop="ibase">
          <el-input readonly v-model.trim="voltageForm.ibase">
            <template slot="suffix">kA</template>
          </el-input>
        </el-form-item>
        <el-form-item label="基准电抗" prop="zbase">
          <el-input readonly v-model.trim="voltageForm.zbase">
            <template slot="suffix">Ω</template>
          </el-input>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="voltageForm.color" size="mini" :predefine="[
                '#854747', '#EA4646', '#FF0000', '#FF8000', '#05AAFA', '#FF8040', '#007979',
                '#009100', '#DB8EA7', '#A03203', '#DC8545', '#CA3FF8', '#5274EB', '#0000A0',
                '#78C653', '#1AEAFB', '#8BFD60'
              ]" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" :rows="2" placeholder="请输入电压等级描述"
                    v-model.trim="voltageForm.description" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="voltageDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmVoltageDialog">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="conductorTypeDialog.title" :visible.sync="conductorTypeDialog.visible" width="500px" :modal="false">
      <el-form label-width="110px" :model="conductorTypeForm" :rules="conductorTypeRules" ref="conductorTypeForm">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="conductorTypeForm.name" ref="conductorTypeDialogNameInput" />
        </el-form-item>
        <el-form-item label="是否为架空线" prop="overhead">
          <el-checkbox v-model="conductorTypeForm.overhead" />
        </el-form-item>
        <el-form-item label="几何均距" prop="gvalMR">
          <el-input v-model.trim="conductorTypeForm.gvalMR" type="number" />
        </el-form-item>
        <el-form-item label="每公里电阻" prop="rvalPerKM">
          <el-input v-model.trim="conductorTypeForm.rvalPerKM" type="number" />
        </el-form-item>
        <el-form-item label="每公里电抗" prop="xvalPerKM">
          <el-input v-model.trim="conductorTypeForm.xvalPerKM" type="number" />
        </el-form-item>
        <el-form-item label="零序正序电阻比" prop="rvalDivR0">
          <el-input v-model.trim="conductorTypeForm.rvalDivR0" type="number" />
        </el-form-item>
        <el-form-item label="零序正序电抗比" prop="xvalDivX0">
          <el-input v-model.trim="conductorTypeForm.xvalDivX0" type="number" />
        </el-form-item>
        <el-form-item label="安全电流" prop="safeCurrent">
          <el-input v-model.trim="conductorTypeForm.safeCurrent" type="number" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" :rows="2" placeholder="请输入导线型号描述"
                    v-model.trim="conductorTypeForm.description" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="conductorTypeDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmConductorTypeDialog">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="system.dialog.title" :visible.sync="system.dialog.visible" width="500px" :modal="false">
      <el-form label-width="80px" :model="system.form" :rules="system.rules" ref="systemForm">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="system.form.name" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model.trim="system.form.value" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" :rows="2" placeholder="请输入描述"
                    v-model.trim="system.form.description" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="system.dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmSystem">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="current.dialog.title" :visible.sync="current.dialog.visible" width="500px" :modal="false">
      <el-form label-width="120px" :model="current.form" :rules="current.rules" ref="currentForm">
        <el-form-item label="CIME电压等级" prop="voltage">
          <el-select v-model.trim="current.form.voltage">
            <el-option v-for="item in xmlVoltages" :key="item.svg" :label="item.name" :value="item.svg" />
          </el-select>
        </el-form-item>
        <el-form-item label="截面面积" prop="area">
          <el-input v-model.trim="current.form.area" type="number" />
        </el-form-item>
        <el-form-item label="电容电流" prop="value">
          <el-input v-model.trim="current.form.value" type="number" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" :rows="2" placeholder="请输入描述"
                    v-model.trim="current.form.description" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="current.dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="onConfirmCurrent">确 定</el-button>
      </span>
    </el-dialog>
  </container>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import Container from '~/components/container';
import ExportButton from '@/components/buttons/export/index.vue';
import ImportButton from '@/components/buttons/import/index.vue';

export default {
  name: 'manage-setup',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    Container,
    ExportButton,
    ImportButton
  },
  data() {
    return {
      importMongodbLoading: false,
      exportLoading: false,
      activeName: 'current',
      basepower: 1000,
      voltages: [],
      voltageDialog: {
        id: '',
        title: '',
        visible: false
      },
      voltageForm: {
        name: '',
        ubase: '',
        ubaseMax: '',
        ubaseMin: '',
        ibase: '',
        zbase: '',
        color: '',
        description: ''
      },
      voltageRules: {
        name: [
          { required: true, message: '名称不可为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (this.voltageDialog.id) {
                if (this.voltages.some(x => x.name === value && x._id !== this.voltageDialog.id)) {
                  callback(new Error('已存在同名电压等级'));
                }
                callback();
              }
              if (this.voltages.some(x => x.name === value)) {
                callback(new Error('已存在同名电压等级'));
              }
              callback();
            },
            trigger: 'blur'
          }
        ],
        ubase: [
          { required: true, message: '基准电压值不可为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (isNaN(value)) {
                callback(new Error('请输入一个合法的数值'));
              }
              if (this.voltageDialog.id) {
                if (this.voltages.some(x => x.ubase === value && x._id !== this.voltageDialog.id)) {
                  callback(new Error('已存在相同的基准电压值'));
                }
                callback();
              }
              if (this.voltages.some(x => x.ubase === Number(value))) {
                callback(new Error('已存在相同的基准电压值'));
              }
              callback();
            },
            trigger: 'blur'
          }
        ],
        ubaseMax: [
          { required: true, message: '基准电压上限不可为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (isNaN(value)) {
                callback(new Error('请输入一个合法的数值'));
              }
              const ubase = Number(this.voltageForm.ubase);
              if (!isNaN(ubase) && Number(value) < ubase) {
                callback(new Error('上限不可小于基准电压值'));
              }
              callback();
            },
            trigger: 'blur'
          }
        ],
        ubaseMin: [
          { required: true, message: '基准电压下限不可为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (isNaN(value)) {
                callback(new Error('请输入一个合法的数值'));
              }
              const ubase = Number(this.voltageForm.ubase);
              if (!isNaN(ubase) && Number(value) > ubase) {
                callback(new Error('下限不可大于基准电压值'));
              }
              if (!isNaN(this.voltageForm.ubaseMax) && Number(value) > Number(this.voltageForm.ubaseMax)) {
                callback(new Error('下限不可大于上限'));
              }
              callback();
            },
            trigger: 'blur'
          }
        ],
        color: [
          { required: true, message: '颜色不可为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value)) {
                callback(new Error('请输入一个格式为“#RRGGBB”的颜色值'));
              }
              callback();
            },
            trigger: 'blur'
          }
        ]
      },
      conductorTypes: [],
      conductorTypeDialog: {
        id: '',
        title: '',
        visible: false
      },
      conductorTypeForm: {
        name: '',
        overhead: false,
        gvalMR: '',
        rvalPerKM: '',
        xvalPerKM: '',
        rvalDivR0: '',
        xvalDivX0: '',
        safeCurrent: '',
        description: ''
      },
      conductorTypeRules: {
        name: [{ required: true, message: '名称不可为空', trigger: 'blur' }]
      },
      current: {
        table: [],
        form: {
          voltage: '',
          area: '',
          value: '',
          description: ''
        },
        rules: {
          area: [{ required: true, message: '横截面积不可为空', trigger: 'blur' }],
          value: [{ required: true, message: '电容电流不可为空', trigger: 'blur' }]
        },
        dialog: {
          id: '',
          title: '',
          visible: false
        }
      },
      systemConfigs: [],
      xmlVoltages: [],
      system: {
        dialog: {
          id: '',
          title: '',
          visible: false
        },
        form: {
          name: '',
          value: '',
          description: ''
        },
        rules: {
          name: [{ required: true, message: '名称不可为空', trigger: 'blur' }]
        }
      }
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getAxiosHeader'
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
      return route ? route.label : '配置管理';
    }
  },
  filters: {
    voltageFormat(val, xmlVoltages) {
      const found = xmlVoltages.find(x => x.svg === val);
      if (found) {
        return found.name;
      }
      return '未知电压等级';
    }
  },
  mounted() {
    this.getConductorTypes();
  },
  methods: {
    ...mapMutations([
      'setConductorType',
      'setSettingSystem'
    ]),
    async handleClick({ name }) {
      switch (name) {
        case 'voltage': {
          await this.getVoltageList();
          break;
        }
        case 'conductorType': {
          await this.getConductorTypes();
          break;
        }
        case 'current': {
          await this.getXmlVoltageList();
          await this.getCurrentList();
          break;
        }
        case 'parameter': {
          await this.getSystemConfig();
          break;
        }
      }
    },
    // 获取所有电压等级
    async getVoltageList() {
      const { data } = await this.$axios.get('/models/voltage/list');
      if (!data.succ) {
        this.$message.error('获取电压等级失败');
        return;
      }
      this.voltages = data.result;
    },
    // 打开新增电压等级弹框
    openVoltageCreateDialog() {
      this.voltageDialog.id = '';
      this.voltageDialog.title = '新增电压等级';
      this.voltageDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.voltageForm.resetFields();
      });
    },
    // 打开编辑电压等级弹框
    openVoltageEditDialog(id) {
      this.voltageDialog.title = '编辑电压等级';
      this.voltageDialog.id = id;
      this.voltageDialog.visible = true;
      this.$nextTick(() => {
        const found = this.voltages.find(x => x._id === id);
        Object.assign(this.voltageForm, {
          name: found.name,
          ubase: found.ubase,
          ubaseMax: found.ubaseMax,
          ubaseMin: found.ubaseMin,
          ibase: found.ibase,
          zbase: found.zbase,
          color: found.color,
          description: found.description
        });
        this.$refs.voltageForm.validate();
      });
    },
    // 删除电压等级
    onVoltageDelete(id) {
      const found = this.voltages.find(x => x._id === id);
      this.$confirm('此操作将永久删除电压等级“' + found.name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/models/voltage/delete/' + id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        await this.getVoltageList();
      });
    },
    // 电压等级弹框确认按钮
    onConfirmVoltageDialog() {
      this.$refs.voltageForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        if (this.voltageDialog.id) {
          // 更新
          const { data } = await this.$axios.post('/models/voltage/update/' + this.voltageDialog.id, this.voltageForm);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
        } else {
          // 新增
          const { data } = await this.$axios.post('/models/voltage/create', this.voltageForm);
          if (!data.succ) {
            this.$message.error('操作异常');
            return false;
          }
        }
        this.voltageDialog.visible = false;
        await this.getVoltageList();
      });
    },
    // 根据基准电压计算基准电流和基准电抗
    async onUBaseChange(val) {
      if (isNaN(val) || isNaN(this.basepower)) {
        this.voltageForm.ibase = '';
        this.voltageForm.zbase = '';
        return;
      }
      const ubase = Number(val);
      const { data } = await this.$axios.post('/models/voltage/calc-izvalue-base', {
        ubase,
        basepower: this.basepower
      });
      this.voltageForm.ibase = data.ibase;
      this.voltageForm.zbase = data.zbase;
    },
    // 获取所有导线型号
    async getConductorTypes() {
      const { data } = await this.$axios.get('/models/conductor-types/list');
      if (!data.succ) {
        this.$message.error('获取导线型号库失败');
        return;
      }
      this.conductorTypes = data.result;
      this.setConductorType(data.result);
    },
    // 打开导线型号弹框
    openConductorTypeDialog() {
      this.conductorTypeDialog.id = '';
      this.conductorTypeDialog.title = '新增导线型号';
      this.conductorTypeDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.conductorTypeForm.resetFields();
      });
    },
    // 打开编辑导线型号弹框
    openConductorEditDialog(id) {
      this.conductorTypeDialog.title = '编辑导线型号';
      this.conductorTypeDialog.id = id;
      this.conductorTypeDialog.visible = true;
      this.$nextTick(() => {
        const found = this.conductorTypes.find(x => x._id === id);
        Object.assign(this.conductorTypeForm, {
          name: found.name,
          overhead: found.overhead,
          gvalMR: found.gvalMR,
          rvalPerKM: found.rvalPerKM,
          xvalPerKM: found.xvalPerKM,
          rvalDivR0: found.rvalDivR0,
          xvalDivX0: found.xvalDivX0,
          safeCurrent: found.safeCurrent,
          description: found.description
        });
        this.$refs.conductorTypeForm.validate();
      });
    },
    // 删除导线型号
    onConductorDelete(id) {
      const found = this.conductorTypes.find(x => x._id === id);
      this.$confirm('此操作将永久删除导线型号“' + found.name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/models/conductor-types/delete/' + id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        await this.getConductorTypes();
      });
    },
    // 点击导线型号弹框确认按钮
    onConfirmConductorTypeDialog() {
      this.$refs.conductorTypeForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        if (this.conductorTypeDialog.id) {
          // 更新
          const { data } = await this.$axios.post('/models/conductor-types/update/' + this.conductorTypeDialog.id, this.conductorTypeForm);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
        } else {
          // 新增
          const { data } = await this.$axios.post('/models/conductor-types/create', this.conductorTypeForm);
          if (!data.succ) {
            this.$message.error('操作异常');
            return false;
          }
        }
        this.conductorTypeDialog.visible = false;
        await this.getConductorTypes();
      });
    },
    // 导出电压等级
    onExportVoltage() {
      const a = document.createElement('a');
      const blob = new Blob([JSON.stringify(this.voltages)]);
      a.href = URL.createObjectURL(blob);
      a.download = '电压等级.text';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    // 导入电压等级
     async onImportVoltage(res) {
      if (!res.succ) {
        this.$message.error('导入异常');
        return;
      }
      this.$refs.importVoltageButton.importVisible = false;
      await this.getVoltageList();
    },
    // 导出导线型号
    onExportConductor() {
      const a = document.createElement('a');
      const blob = new Blob([JSON.stringify(this.conductorTypes)]);
      a.href = URL.createObjectURL(blob);
      a.download = '导线型号.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    // 导入导线型号
    async onImportConductor(res) {
      if (!res.succ) {
        this.$message.error('导入异常');
        return;
      }
      this.$refs.importConductorButton.importVisible = false;
      await this.getConductorTypes();
    },
    onSuccess(res) {
      if (!res.succ) {
        this.$message.error('导入异常');
        return;
      }
      this.$message.success('导入完成');
    },
    // 查询系统参数
    async getSystemConfig() {
      const { data } = await this.$axios.get('/setting/system-config/list');
      if (!data.succ) {
        this.$message.error('查询系统参数异常');
        return;
      }
      this.systemConfigs = data.result;
      this.setSettingSystem(data.result);
    },
    // 系统参数弹框
    openSystemCreateDialog() {
      this.system.dialog.id = '';
      this.system.dialog.title = '新增系统参数';
      this.system.dialog.visible = true;
      this.$nextTick(() => {
        this.$refs.systemForm.resetFields();
      });
    },
    // 导出系统参数
    onExportSystem() {
      const a = document.createElement('a');
      const blob = new Blob([JSON.stringify(this.systemConfigs)]);
      a.href = URL.createObjectURL(blob);
      a.download = '系统参数.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    // 导入系统参数
    async onImportSystem(res) {
      if (!res.succ) {
        this.$message.error('导入异常');
        return;
      }
      this.$refs.importConfigButton.importVisible = false;
      await this.getSystemConfig();
    },
    // 确认系统参数
    onConfirmSystem() {
      this.$refs.systemForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        if (this.system.dialog.id) {
          // 更新
          const { data } = await this.$axios.post('/setting/system-config/update/' + this.system.dialog.id, this.system.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
        } else {
          // 新增
          const { data } = await this.$axios.post('/setting/system-config/create', this.system.form);
          if (!data.succ) {
            this.$message.error('操作异常');
            return false;
          }
        }
        this.system.dialog.visible = false;
        await this.getSystemConfig();
      });
    },
    // 系统参数-编辑
    onConfigEdit(id) {
      this.system.dialog.id = id;
      this.system.dialog.title = '编辑系统参数';
      this.system.dialog.visible = true;
      this.$nextTick(() => {
        const { name, value, description } = this.systemConfigs.find(x => x._id === id);
        Object.assign(this.system.form, { name, value, description });
        this.$refs.systemForm.validate();
      });
    },
    // 系统参数-删除
    onConfigDelete(id) {
      const found = this.systemConfigs.find(x => x._id === id);
      this.$confirm('此操作将永久删除系统参数“' + found.name + '”，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/setting/system-config/delete/' + id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        await this.getSystemConfig();
      });
    },
    // 系统数据-导出
    async onExportData() {
      this.exportLoading = true;
      const { data } = await this.$axios.get('/database/export-mongodb');
      this.exportLoading = false;
      if (!data.succ) {
        this.$message.error(data.message);
        return;
      }
      const a = document.createElement('a');
      a.href = `/database/download-dump-package/${data.guid}`;
      document.body.appendChild(a);
      a.click();
      window.removeElement(a);
    },
    // 导入mongodb时
    onMongodbProgress() {
      this.importMongodbLoading = true;
    },
    // 导入mongodb成功
    onMongodbSuccess(res) {
      this.importMongodbLoading = false;
      if (res.succ) {
        this.$message.success('导入成功');
      } else {
        this.$message.error(res.message);
      }
    },
    // 电容电流-查询
    async getCurrentList() {
      const { data } = await this.$axios.get('/models/current/list');
      if (!data.succ) {
        this.$message.error('');
        return;
      }
      const table = [];
      for (const current of data.result) {
        const found = table.find(x => x.voltage === current.voltage);
        if (found) {
          found.children.push(current);
          continue;
        }
        table.push({
          _id: current.voltage,
          voltage: current.voltage,
          children: [current]
        });
      }
      this.current.table = table;
    },
    // 电容电流-编辑
    openCurrentEditDialog(row) {
      this.current.dialog.id = row._id;
      this.current.dialog.title = '编辑电容电流';
      this.current.dialog.visible = true;
      this.$nextTick(() => {
        Object.assign(this.current.form, row);
        this.$refs.currentForm.validate();
      });
    },
    // 电容电流-新增
    openCurrentCreateDialog() {
      this.current.dialog.id = '';
      this.current.dialog.title = '新增电容电流';
      this.current.dialog.visible = true;
      this.$nextTick(() => {
        this.$refs.currentForm.resetFields();
      });
    },
    // 电容电流-删除
    onCurrentDelete(id) {
      this.$confirm('此操作将永久删除该数据，是否继续？', '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const { data } = await this.$axios.delete('/models/current/delete/' + id);
        if (!data.succ || data.result.deletedCount === 0) {
          this.$message.error('操作异常');
          return;
        }
        await this.getCurrentList();
      });
    },
    // 电容电流-确认
    onConfirmCurrent() {
      this.$refs.currentForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }
        if (this.current.dialog.id) {
          // 更新
          const { data } = await this.$axios.post('/models/current/update/' + this.current.dialog.id, this.current.form);
          if (!data.succ || data.result.modifiedCount !== 1) {
            this.$message.error('操作异常');
            return false;
          }
        } else {
          // 新增
          const { data } = await this.$axios.post('/models/current/create', this.current.form);
          if (!data.succ) {
            this.$message.error('操作异常');
            return false;
          }
        }
        this.current.dialog.visible = false;
        await this.getCurrentList();
      });
    },
    // 电容电流-xml-电压等级
    async getXmlVoltageList() {
      const { data } = await this.$axios.get('/models/xml-voltage/list');
      if (!data.succ) {
        this.$message.error('查询CIME电压等级异常');
        return;
      }
      this.xmlVoltages = data.result;
    }
  }
};
</script>

<style scoped>
.buttons {
  display: flex;
  padding: 10px 0;
}

.margin-left-20 {
  margin-left: 20px;
}

.color-red {
  color: red;
}

.clearfix {
  font-size: 18px;
}

.box-card {
  width: 390px;
  margin-bottom: 20px;
  margin-right: 20px;
}

.import-card {
  width: 360px;
  text-align: center;
  background: linear-gradient(313deg, #006c8c, #20867f, #20a082, #07a781);
  color: white;
  cursor: pointer;
}
</style>
