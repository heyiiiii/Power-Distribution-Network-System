<!--meta:{"index":13,"label":"用户管理","auths":["admin","master"],"roles":"any"}-->
<template>
  <div>
    <split-left-right :height="getClientHeight" sid="u-l-r">
      <div slot="left">
        <split-top-bottom :height="getClientHeight" sid="u-l-b-t">
          <div slot="top" slot-scope="{height}">
            <el-card>
              <div slot="header">
                <span>用户组</span>
              </div>
              <ag-grid-vue
                class="ag-theme-balham"
                :modules="$agGridModules"
                @dragover.native="groupsGridDragOver"
                @drop.native="groupsGridDragDrop"
                @rowSelected="onUserGroupSelected"
                :style="{height: height - 70 + 'px'}"
                :gridOptions="groupsGridOptions"
                :rowData="groups"
              />
            </el-card>
          </div>
          <div slot="bottom" slot-scope="{height}">
            <el-card>
              <div slot="header">
                <span>页面</span>
                <div class="buttons" v-if="selectedGroup">
                  <export-button @on-export="onExportRoute" />
                  <import-button
                    ref="importRouteButton"
                    :data="importRouteData"
                    action="/user/import-group-route"
                    @on-success="onImportRoute"
                  />
                </div>
              </div>
              <ag-grid-vue
                class="ag-theme-balham"
                :modules="$agGridModules"
                :style="{height: height - 80 + 'px'}"
                :gridOptions="routesGridOptions"
                :rowData="routes"
              />
            </el-card>
          </div>
        </split-top-bottom>
      </div>
      <div slot="right">
        <split-top-bottom :height="getClientHeight" sid="u-r-l-r">
          <div slot="top" slot-scope="{height}">
            <el-card>
              <div slot="header">
                <span>公司 / 厂站</span>
              </div>
              <ag-grid-vue
                class="ag-theme-balham"
                @rowSelected="onDepartmentSelected"
                :modules="$agGridModules"
                :style="{height: height - 70 + 'px'}"
                :gridOptions="departmentTreeGridOptions"
                :rowData="areas"
              />
            </el-card>
<!--            <split-left-right :height="height" sid="u-r-t-b">-->
<!--              <div slot="left">-->
<!--              </div>-->
<!--              <div slot="right">-->
<!--                <el-card>-->
<!--                  <div slot="header">-->
<!--                    <span>角色</span>-->
<!--                  </div>-->
<!--                  <ag-grid-vue-->
<!--                    class="ag-theme-balham"-->
<!--                    :modules="$agGri dModules"-->
<!--                    :style="{height: height - 70 + 'px'}"-->
<!--                    :gridOptions="rolesGridOptions"-->
<!--                    :rowData="roles"-->
<!--                    @rowSelected="onRoleSelected"-->
<!--                  />-->
<!--                </el-card>-->
<!--              </div>-->
<!--            </split-left-right>-->
          </div>
          <div slot="bottom" slot-scope="{height}">
            <el-card>
              <div slot="header">
                <span>用户</span>
              </div>
              <ag-grid-vue
                class="ag-theme-balham"
                :modules="$agGridModules"
                :style="{height: height - 70 + 'px'}"
                :gridOptions="usersGridOptions"
                :rowData="filteredUserList"
              />
            </el-card>
          </div>
        </split-top-bottom>
      </div>
    </split-left-right>
    <el-dialog :title="areaDialogTitle"
               :visible.sync="areaDialog.visible"
               width="420px">
      <el-form ref="departmentForm"
               :model="areaFormData"
               :rules="areaFormRule"
               hide-required-mark
               @submit.native.prevent
               label-width="60px">
        <el-form-item prop="code"
                      label="编号">
          <el-input v-model.trim="areaFormData.code"
                    type="text"
                    :disabled="areaFormData.id !== null"></el-input>
        </el-form-item>
        <el-form-item prop="name"
                      label="名称">
          <el-input v-model.trim="areaFormData.name"
                    type="text"></el-input>
        </el-form-item>
        <el-form-item prop="aliasName"
                      label="别名">
          <el-input v-model.trim="areaFormData.aliasName"
                    type="text"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer"
            class="dialog-footer">
        <el-button @click="areaDialog.visible = false">取 消</el-button>
        <el-button type="primary"
                   @click="confirmDepartment">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :visible.sync="registerDialog.visible"
               :title="registerDialog.title"
               :loading="registerDialog.loading"
               width="420px">
      <el-form ref="registerForm"
               :model="registerFormData"
               :rules="registerFormRule"
               @submit.native.prevent
               label-width="100px">
        <el-form-item prop="name"
                      label="姓名">
          <el-input v-model.trim="registerFormData.name"
                    @on-change="generateAccount"
                    type="text"
                    :maxlength="24"></el-input>
        </el-form-item>
        <el-form-item prop="account"
                      label="登录账号">
          <el-input v-model.trim="registerFormData.account"
                    @on-focus="registerDialog.accountChanged = true"
                    type="text"
                    :maxlength="24"
                    show-word-limit></el-input>
        </el-form-item>
        <el-form-item prop="departments"
                      label="运行单位">
          <el-select v-model="registerFormData.departments"
                     multiple>
            <el-option v-for="item in departmentOptions"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="groups"
                      label="用户组">
          <el-select v-model="registerFormData.groups"
                     multiple>
            <el-option v-for="item in userGroupOptions"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="password"
                      label="密码">
          <el-input v-model.trim="registerFormData.password"
                    type="password"
                    password
                    :maxlength="24"></el-input>
        </el-form-item>
        <el-form-item prop="password2"
                      label="重复密码">
          <el-input v-model.trim="registerFormData.password2"
                    type="password"
                    :maxlength="24"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small"
                   type="primary"
                   :loading="registerDialog.loading"
                   @click="doRegister">注册
        </el-button>
      </div>
    </el-dialog>
    <el-dialog title="选择归属用户组与部门"
               :visible.sync="userGroupSelectDialog.visible"
               width="420px">
      <el-form ref="departmentForm"
               :model="userGroupSelectDialog.form"
               :rules="userGroupSelectDialog.rules"
               @submit.native.prevent
               label-width="100px">
        <el-form-item prop="departments"
                      label="运行单位">
          <el-select v-model="userGroupSelectDialog.form.departments">
            <el-option v-for="item in departmentOptions"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="groups"
                      label="用户组">
          <el-select v-model="userGroupSelectDialog.form.groups">
            <el-option v-for="item in userGroupOptions"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer"
            class="dialog-footer">
        <el-button @click="userGroupSelectDialog.visible = false">取 消</el-button>
        <el-button type="primary"
                   @click="onConfirmDepartment">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="'为 (' + newRouteDialog.groupName + ') 增加页面'"
               :visible.sync="newRouteDialog.visible"
               width="800px">
      <el-table border
                :data="routeMetas"
                height="500px"
                @selection-change="onRouteSelected"
                ref="routeTable">
        <el-table-column type="selection"
                         width="55">
        </el-table-column>
        <el-table-column header-align="center"
                         label="名称">
          <template slot-scope="{$index}">
            <el-input v-model="newRouteDialog.routeLabels[$index].label"></el-input>
          </template>
        </el-table-column>
<!--        <el-table-column header-align="center"-->
<!--                         label="角色">-->
<!--          <template slot-scope="{row}">-->
<!--            <span>{{ row.roles ? getRoles2(row.roles) : '' }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->
        <el-table-column header-align="center"
                         label="权限">
          <template slot-scope="{row}">
            <span>{{ row.auths ? getAuths2(row.auths) : '' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary"
                   :disabled="newRouteDialog.selectedRoutes.length <= 0"
                   :loading="newRouteDialog.loading"
                   @click="addGroupRoute">确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import sha1 from 'crypto-js/sha1';
import SplitLeftRight from '@/components/splite/leftRight';
import SplitTopBottom from '@/components/splite/topBottom';
import Globals from '@/assets/js/globals';
import icons from '@/static/vendor/element-theme/icons';
import ExportButton from '@/components/buttons/export';
import ImportButton from '@/components/buttons/import';

const BooleanRender = Vue.extend({
  template: '<span>{{val}}</span>',
  computed: {
    val() {
      return this.params.value ? '是' : '否';
    }
  }
});

const IconRender = Vue.extend({
  template: `<i :class="params.value" />`
});

function rangeValidator(min, max) {
  return function (rule, value, callback) {
    if (Number(value) < min || Number(value) > max) {
      callback(new Error(`数值必须介于[${min}, ${max}]之间`));
    } else {
      callback();
    }
  };
}

export default {
  name: 'manage-user',
  components: {
    ExportButton,
    ImportButton,
    SplitTopBottom,
    SplitLeftRight
  },
  head() {
    return {
      title: this.currentRouteText
    };
  },
  data() {
    const vm = this;
    return {
      formIds: [],
      selectedGroup: '',
      userGroupSelectDialog: {
        visible: false,
        userIds: [],
        form: {
          departments: [],
          groups: []
        },
        rules: {
          departments: [
            {
              validator(rule, value, callback) {
                if (!Array.isArray(value) || value.length === 0) {
                  callback(new Error('请选择至少一个运行单位'));
                } else {
                  callback();
                }
              },
              trigger: 'blur'
            }
          ],
          groups: [
            {
              validator: (rule, value, callback) => {
                if (!Array.isArray(value) || value.length === 0) {
                  callback(new Error('请选择至少一个用户组'));
                } else {
                  const groups = this.groups.filter(x => value.includes(x._id));
                  const roles = [];
                  for (const g of groups) {
                    for (const r of g.roles) {
                      const rFound = this.roles.find(x => x._id === r);
                      if (rFound) {
                        if (!roles.includes(rFound.role)) {
                          roles.push(rFound.role);
                        }
                      }
                    }
                  }
                  if ((roles.includes('repeal') || roles.includes('browse') || roles.includes('readonly')) && roles.length > 1) {
                    callback(new Error('用户组关联的角色(回执人、调度员)必须唯一'));
                  } else {
                    callback();
                  }
                }
              },
              trigger: 'blur'
            }
          ]
        }
      },
      viewRangeDialog: {
        visible: false,
        title: '',
        substationNames: [],
        selectedSubstationNames: [],
        selectedVoltageLevels: [],
        viewType: 'all'
      },
      indexChange: {
        before: 0,
        after: 0,
        array: ''
      },
      rolesDialog: {
        visible: false,
        loading: false
      },
      rolesFormData: {
        role: '',
        name: '',
        description: ''
      },
      flowsDialog: {
        visible: false,
        userIds: [],
        selectedFlowId: [],
        flowTableColumns: [
          {
            type: 'selection',
            title: '选择',
            width: 60,
            align: 'center'
          },
          {
            title: '请选择流程',
            ellipsis: true,
            tooltip: true,
            key: 'flowName',
            slot: 'flowName'
          }
        ]
      },
      rolesFormRule: {
        role: [
          {
            required: true,
            message: '必须输入唯一标识',
            trigger: 'blur'
          },
          {
            validator(rule, value, callback) {
              if (vm.roles.some(x => x.role === value)) {
                callback(new Error('标识已存在'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        name: [
          {
            required: true,
            message: '必须输入角色名称',
            trigger: 'blur'
          }
        ]
      },
      authsDialog: {
        visible: false,
        loading: false
      },
      authsFormData: {
        auth: '',
        name: '',
        description: ''
      },
      authsFormRule: {
        auth: [
          {
            required: true,
            message: '必须输入唯一标识',
            trigger: 'blur'
          },
          {
            validator(rule, value, callback) {
              if (vm.roles.some(x => x.role === value)) {
                callback(new Error('标识已存在'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        name: [
          {
            required: true,
            message: '必须输入权限名称',
            trigger: 'blur'
          }
        ]
      },
      paramsDialog: {
        visible: false,
        groupId: '',
        loading: false
      },
      paramsFormData: {
        headerTitle: '',
        headerSubTitle: '',
        indexTitle: '',
        indexBackground: '#eee',
        headerHeight: 42,
        headerBackground: '#00787c',
        asideBackgroundColor: '#f2f4f5',
        asideCollapsed: 1,
        asideAutoCollapse: 0,
        asideWidth: 200,
        showDepartments: 0,
        indexPage: 'index'
      },
      paramsFormRule: {
        headerTitle: [
          {
            type: 'string',
            max: 40,
            message: '页面标题不可超过40个字符',
            trigger: 'blur'
          }
        ],
        headerSubTitle: [
          {
            type: 'string',
            max: 40,
            message: '页面副标题不可超过40个字符',
            trigger: 'blur'
          }
        ],
        indexTitle: [
          {
            type: 'string',
            max: 4096,
            message: '页面副标题不可超过4096个字符',
            trigger: 'blur'
          }
        ],
        headerHeight: [
          {
            validator: rangeValidator(30, 80),
            trigger: 'blur'
          }
        ],
        asideWidth: [
          {
            validator: rangeValidator(150, 300),
            trigger: 'blur'
          }
        ]
      },
      areaDialog: {
        visible: false,
        parentCode: '',
        code: '',
        index: 0,
        currentDepartmentId: ''
      },
      areaFormData: {
        id: null,
        code: '',
        name: '',
        aliasName: ''
      },
      areaFormRule: {
        code: [
          {
            required: true,
            message: '必须输入编号',
            trigger: 'blur'
          },
          {
            validator(rule, value, callback) {
              if (value === '0') {
                callback(new Error('编号不可为0'));
                return;
              }

              if (vm.areaDialog.currentDepartmentId) {
                const found = vm.areas.find(x => x._id !== vm.areaDialog.currentDepartmentId && x.code === value);
                if (found) {
                  callback(new Error('编号已被"' + (found.aliasName || found.name) + '"占用'));
                  return;
                }
              } else {
                const found = vm.areas.find(x => x.code === value);
                if (found) {
                  callback(new Error('编号已被"' + (found.aliasName || found.name) + '"占用'));
                  return;
                }
              }

              callback();
            },
            trigger: 'blur'
          }
        ],
        name: [
          {
            required: true,
            message: '名称不可为空',
            trigger: 'blur'
          }
        ]
      },
      groupSelectDialog: {
        visible: false,
        loading: false,
        userIds: 0,
        overNode: null,
        selectedGroups: [],
        tableColumns: [
          {
            type: 'selection',
            width: 60,
            align: 'center'
          },
          {
            title: '名称',
            key: 'name',
            width: 120
          },
          // {
          //   title: '角色',
          //   key: 'roles',
          //   slot: 'roles'
          // },
          {
            title: '权限',
            key: 'auths',
            slot: 'auths'
          }
        ]
      },
      registerDialog: {
        loading: false,
        visible: false,
        accountChanged: true,
        title: '注册新用户'
      },
      registerFormData: {
        name: '',
        account: '',
        areaName: '',
        departments: [],
        departmentNames: '',
        viewSelfDepartment: '',
        groups: [],
        groupNames: '',
        password: '',
        password2: ''
      },
      registerFormRule: {
        name: [{
          required: true,
          message: '请输入用户姓名',
          trigger: 'blur'
        }],
        departments: [
          {
            validator(rule, value, callback) {
              if (!Array.isArray(value) || value.length === 0) {
                callback(new Error('请选择至少一个运行单位'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        groups: [
          {
            validator: (rule, value, callback) => {
              if (!Array.isArray(value) || value.length === 0) {
                callback(new Error('请选择至少一个用户组'));
              } else {
                const groups = this.groups.filter(x => value.includes(x._id));
                const roles = [];
                for (const g of groups) {
                  for (const r of g.roles) {
                    const rFound = this.roles.find(x => x._id === r);
                    if (rFound) {
                      if (!roles.includes(rFound.role)) {
                        roles.push(rFound.role);
                      }
                    }
                  }
                }
                if ((roles.includes('repeal') || roles.includes('browse') || roles.includes('readonly')) && roles.length > 1) {
                  callback(new Error('用户组关联的角色(回执人、调度员)必须唯一'));
                } else {
                  callback();
                }
              }
            },
            trigger: 'blur'
          }
        ],
        account: [
          {
            required: true,
            message: '请输入登录账号',
            trigger: 'blur'
          },
          {
            validator(rule, value, callback) {
              vm.$axios
                .post('/auth/user-check', {
                  account: value
                })
                .then(({ data }) => {
                  if (data.exists) {
                    callback(new Error('登录账号已存在'));
                  } else {
                    callback();
                  }
                })
                .catch(err => {
                  callback(err);
                });
            },
            trigger: 'blur'
          }
        ],
        password: [
          {
            required: true,
            message: '请输入密码',
            trigger: 'blur'
          },
          {
            validator(rule, value, callback) {
              if (!value) {
                callback(new Error('密码不可为空'));
                return;
              }
              if (String(value).length < 4) {
                callback(new Error('密码不可少于4个字符'));
                return;
              }
              if (vm.getPasswordCheckRegex) {
                const reg = new RegExp(vm.getPasswordCheckRegex, 'g');
                if (!reg.test(value)) {
                  callback(new Error(vm.getPasswordCheckMessage));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        password2: [
          {
            validator(rule, value, callback) {
              if (vm.registerFormData.password !== value) {
                callback(new Error('两次输入的密码不一致'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      },
      departmentTreeGridOptions: {
        localeText: Globals.agGridLocaleText,
        defaultColDef: {
          resizable: true,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        rowSelection: 'single',
        treeData: true,
        animateRows: true,
        groupDefaultExpanded: -1,
        getDataPath(data) {
          return vm.getDepartmentTreePath(data);
        },
        getRowNodeId(item) {
          return item.code;
        },
        getContextMenuItems(params) {
          if (!params.node) {
            return [
              {
                name: '增加顶层单位',
                icon: '<i class="ivu-icon ivu-icon-md-add"></i>',
                action() {
                  vm.appendDepartment('0', vm.areas.length);
                }
              }
            ];
          }

          params.node.setSelected(true);
          return [
            {
              name: '增加顶层单位',
              icon: '<i class="ivu-icon ivu-icon-md-add"></i>',
              action() {
                vm.appendDepartment('0', vm.areas.length);
              }
            },
            'separator',
            {
              name: '增加下级单位',
              icon: '<i class="ivu-icon ivu-icon-md-add-circle text-primary"></i>',
              action() {
                vm.appendDepartment(params.node.data.code, params.node.data.index + 1);
              }
            },
            {
              name: '编辑',
              icon: '<i class="ivu-icon ivu-icon-md-create text-success"></i>',
              action() {
                vm.editDepartment(params.node.data._id, params.node.data.code, params.node.data.index);
              }
            },
            'separator',
            {
              name: '删除 ···',
              icon: '<i class="ivu-icon ivu-icon-md-close text-error"></i>',
              action() {
                vm.removeDepartment(params.node.data);
              }
            }
          ];
        },
        context: {
          componentParent: this
        },
        autoGroupColumnDef: {
          headerName: '运行单位',
          field: 'name',
          width: 240,
          cellRendererParams: {
            suppressCount: true
          }
        },
        columnDefs: [
          {
            headerName: '关联用户',
            field: 'code',
            colId: 'code',
            cellRendererFramework: Vue.extend({
              computed: {
                userCount() {
                  let count = 0;
                  for (const user of vm.users) {
                    if (user.departments.some(x => x.code === this.params.value)) {
                      count++;
                    }
                  }
                  return count > 0 ? count + '个' : '';
                }
              },
              template: '<span>{{userCount}}</span>'
            }),
            width: 100
          },
          {
            headerName: '编号',
            field: 'code',
            colId: 'code',
            width: 100
          },
          {
            headerName: '别名',
            field: 'aliasName',
            colId: 'aliasName',
            width: 160
          },
          {
            headerName: '操作',
            field: 'code',
            colId: 'option',
            cellRendererFramework: Vue.extend({
              computed: {
                upAvaliable() {
                  let prevNode = null;
                  this.params.api.forEachNode((current, index) => {
                    if (current.data.parentCode === this.params.node.data.parentCode && current.rowIndex < this.params.node.rowIndex) {
                      prevNode = current;
                    }
                  });
                  return !!prevNode;
                },
                downAvaliable() {
                  let nextNode = null;
                  this.params.api.forEachNode((current, index) => {
                    if (
                      !nextNode &&
                      current.data.parentCode === this.params.node.data.parentCode &&
                      current.rowIndex > this.params.node.rowIndex
                    ) {
                      nextNode = current;
                    }
                  });
                  return !!nextNode;
                }
              },
              methods: {
                moveUp() {
                  let prevNode = null;
                  this.params.api.forEachNode((current, index) => {
                    if (current.data.parentCode === this.params.node.data.parentCode && current.rowIndex < this.params.node.rowIndex) {
                      prevNode = current;
                    }
                  });
                  if (prevNode) {
                    const id = this.params.node.data._id;
                    const fromIndex = vm.areas.findIndex(x => x._id === id);
                    const toIndex = vm.areas.findIndex(x => x._id === prevNode.data._id);
                    vm.areas[fromIndex].index = toIndex;
                    vm.areas[toIndex].index = fromIndex;
                    const element = vm.areas[fromIndex];
                    vm.areas.splice(fromIndex, 1);
                    vm.areas.splice(toIndex, 0, element);
                    vm.$axios.post('/user/update-department-indexes', {
                      indexes: vm.refreshDepartmentIndexes()
                    });
                    vm.$nextTick(() => {
                      const node = vm.departmentTreeGridOptions.api.getRowNode(this.params.value);
                      node.setSelected(true);
                    });
                  }
                },
                moveDown() {
                  let nextNode = null;
                  this.params.api.forEachNode((current, index) => {
                    if (
                      !nextNode &&
                      current.data.parentCode === this.params.node.data.parentCode &&
                      current.rowIndex > this.params.node.rowIndex
                    ) {
                      nextNode = current;
                    }
                  });
                  if (nextNode) {
                    const id = this.params.node.data._id;
                    const fromIndex = vm.areas.findIndex(x => x._id === id);
                    const toIndex = vm.areas.findIndex(x => x._id === nextNode.data._id);
                    vm.areas[fromIndex].index = toIndex;
                    vm.areas[toIndex].index = fromIndex;
                    const element = vm.areas[fromIndex];
                    vm.areas.splice(fromIndex, 1);
                    vm.areas.splice(toIndex, 0, element);
                    vm.$axios.post('/user/update-department-indexes', {
                      indexes: vm.refreshDepartmentIndexes()
                    });
                    vm.$nextTick(() => {
                      const node = vm.departmentTreeGridOptions.api.getRowNode(this.params.value);
                      node.setSelected(true);
                    });
                  }
                }
              },
              template: `<span>
                <a :disabled="!upAvaliable"
                   @click="moveUp"
                   class="m-r-2"
                   title="向上移动"><i class="el-icon-top"/></a>
                <a :disabled="!downAvaliable"
                   @click="moveDown"
                   title="向下移动"><i class="el-icon-bottom"/></a>
                </span>`
            }),
            width: 120
          }
        ]
      },
      groupsGridOptions: {
        defaultColDef: {
          sortable: false,
          resizable: true,
          filterable: true,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        animateRows: true,
        rowSelection: 'single',
        editType: 'fullRow',
        rowDragManaged: true,
        enableCellChangeFlash: true,
        stopEditingWhenCellsLoseFocus: true,
        localeText: Globals.agGridLocaleText,
        rowClassRules: {
          'warning-bg': params => {
            return !params.node.data._id;
          }
        },
        context: {
          componentParent: this
        },
        getRowNodeId(item) {
          return item._id;
        },
        onRowDragEnter(params) {
          vm.indexChange.array = 'groups';
          vm.indexChange.before = params.overIndex;
        },
        onRowDragEnd(params) {
          vm.indexChange.array = 'groups';
          vm.indexChange.after = params.overIndex;
          vm.onIndexChanged();
        },
        getContextMenuItems(params) {
          const ret = [];
          if (params.node) {
            params.node.setSelected(true);
          }
          if (!params.context.componentParent.groups.some(x => !x._id)) {
            ret.push({
              name: '新建用户组',
              icon: '<i class="ivu-icon ivu-icon-md-add-circle"></i>',
              action() {
                params.context.componentParent.groups.push({
                  _id: '',
                  name: '用户组' + (params.context.componentParent.groups.length + 1),
                  description: '',
                  index: params.context.componentParent.groups.length,
                  users: [],
                  routes: [],
                  auths: [],
                  roles: []
                });
                params.context.componentParent.$nextTick(() => {
                  params.api.startEditingCell({
                    rowIndex: params.context.componentParent.groups.length - 1,
                    colKey: 'name'
                  });
                });
              }
            });
          }

          const rows = params.api.getSelectedRows();
          if (rows.length > 0) {
            // ret.push({
            //   name: '设置角色',
            //   icon: '<i class="ivu-icon ivu-icon-md-bookmark"></i>',
            //   subMenu: vm.roles.map(x => {
            //     return {
            //       name: x.name,
            //       checked: rows[0].roles.includes(x._id),
            //       action() {
            //         vm.setupUserGroupRole(rows[0], x);
            //       }
            //     };
            //   })
            // });
            ret.push({
              name: '设置系统权限',
              icon: '<i class="ivu-icon ivu-icon-md-bulb"></i>',
              subMenu: vm.auths.map(x => {
                return {
                  name: x.name,
                  checked: rows[0].auths.includes(x._id),
                  action() {
                    vm.setupUserGroupAuth(rows, x);
                  }
                };
              })
            });
            // ret.push({
            //   name: '设置参数',
            //   icon: '<i class="ivu-icon ivu-icon-md-options"></i>',
            //   action() {
            //     vm.paramsDialog.groupId = rows[0]._id;
            //     // vm.$refs.paramsForm.clearValidate();
            //     vm.paramsFormData = Object.assign(
            //       {
            //         headerTitle: '',
            //         headerSubTitle: '',
            //         indexTitle: '',
            //         indexBackground: '#eee',
            //         headerHeight: 42,
            //         asideWidth: 200,
            //         headerBackground: '#00787c',
            //         asideBackgroundColor: '#f2f4f5',
            //         asideCollapsed: true,
            //         asideAutoCollapse: 0,
            //         showDepartments: 0,
            //         indexPage: 'index'
            //       },
            //       rows[0].params
            //     );
            //     vm.paramsFormData.asideCollapsed = vm.paramsFormData.asideCollapsed ? 1 : 0;
            //     vm.paramsDialog.visible = true;
            //   }
            // });
            ret.push('separator');
            ret.push({
              name: '删除用户组 ···',
              icon: '<i class="ivu-icon ivu-icon-md-close text-error"></i>',
              action() {
                if (rows[0].inner) {
                  vm.$alert('内置用户组不可删除', '错误');
                } else {
                  params.context.componentParent.deleteUserGroups(rows);
                }
              }
            });
          }
          return ret;
        },
        onRowEditingStopped(params) {
          params.context.componentParent.updateUserGroup(params.node);
        },
        columnDefs: [
          {
            headerName: '名称',
            field: 'name',
            colId: 'name',
            tooltipField: 'name',
            editable: true,
            rowDrag: true,
            width: 130
          },
          {
            headerName: '用户',
            field: 'users',
            colId: 'users',
            width: 75,
            cellRendererFramework: Vue.extend({
              computed: {
                value() {
                  const count = this.params.value.filter(x => vm.users.map(y => y._id).includes(x)).length;
                  return count > 0 ? count + '个' : '';
                }
              },
              template: '<span :title="value">{{value}}</span>'
            })
          },
          // {
          //   headerName: '角色',
          //   field: 'roles',
          //   colId: 'roles',
          //   width: 110,
          //   cellRendererFramework: Vue.extend({
          //     computed: {
          //       roles() {
          //         return this.params.value.map(x => {
          //           const found = vm.roles.find(y => y._id === x);
          //           return found ? found.name : '';
          //         }).join('，');
          //       }
          //     },
          //     template: '<span :title="roles">{{roles}}</span>'
          //   })
          // },
          {
            headerName: '系统权限',
            field: 'auths',
            colId: 'auths',
            cellRendererFramework: Vue.extend({
              computed: {
                auths() {
                  return this.params.value.map(x => {
                    const found = vm.auths.find(y => y._id === x);
                    return found ? found.name : '';
                  }).join('，');
                }
              },
              template: '<span :title="auths">{{auths}}</span>'
            })
          },
          {
            headerName: '描述',
            field: 'description',
            colId: 'description',
            tooltipField: 'description',
            editable: true,
            width: 150
          },
          {
            headerName: '参数',
            field: 'params',
            colId: 'params',
            cellRendererFramework: Vue.extend({
              computed: {
                str() {
                  return this.params.value ? JSON.stringify(this.params.value) : '';
                }
              },
              template: '<span :title="str">{{str}}</span>'
            }),
            width: 150
          }
        ]
      },
      newRouteDialog: {
        visible: false,
        loading: false,
        groupId: '',
        groupName: '',
        parentRouteId: '',
        selectedRoutes: [],
        routeLabels: [],
        tableColumns: [
          {
            type: 'selection',
            width: 60,
            align: 'center'
          },
          {
            title: '名称',
            key: 'label',
            resizable: true,
            slot: 'label',
            width: 220
          },
          // {
          //   title: '角色',
          //   resizable: true,
          //   key: 'roles',
          //   slot: 'roles'
          // },
          {
            title: '权限',
            resizable: true,
            key: 'auths',
            slot: 'auths'
          }
        ]
      },
      routes: [],
      routeMetas: [],
      routesGridOptions: {
        localeText: Globals.agGridLocaleText,
        defaultColDef: {
          sortable: false,
          resizable: true,
          filterable: false,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        rowSelection: 'single',
        treeData: true,
        animateRows: true,
        editType: 'fullRow',
        rowDragManaged: false,
        groupDefaultExpanded: -1,
        stopEditingWhenCellsLoseFocus: true,
        getDataPath(data) {
          return vm.getRouteNodeTreePath(data);
        },
        getRowNodeId(item) {
          return item._id;
        },
        context: {
          componentParent: this
        },
        onRowDragMove({
                        api,
                        overNode,
                        node
                      }) {
          if (vm.newRouteDialog.overNode === overNode || node === overNode) {
            return;
          }

          const rowNodes = [];
          if (vm.newRouteDialog.overNode) {
            rowNodes.push(vm.newRouteDialog.overNode);
          }

          if (overNode && !overNode.data.path && overNode.data._id !== node.data.parentId) {
            rowNodes.push(overNode);
            vm.newRouteDialog.overNode = overNode;
          } else {
            vm.newRouteDialog.overNode = null;
          }

          if (overNode) {
            api.refreshCells({
              rowNodes,
              force: true
            });
          }
        },
        onRowDragEnd({
                       api,
                       node,
                       overNode,
                       overIndex
                     }) {
          const getParents = current => {
            const parents = [];
            if (current.parentId) {
              const parent = vm.routes.find(x => x._id === current.parentId);
              if (parent) {
                parents.unshift(parent);
                parents.unshift(...getParents(parent));
              }
            }
            return parents;
          };

          if (overNode) {
            const parents = getParents(overNode.data).map(x => x._id);
            if (parents.includes(node.data._id)) {
              return;
            }
          }

          if (vm.newRouteDialog.overNode) {
            const found = vm.routes.find(x => x._id === node.data._id);
            found.index = overIndex;
            found.parentId = vm.newRouteDialog.overNode.data._id;
          } else if (!overNode) {
            const found = vm.routes.find(x => x._id === node.data._id);
            found.index = overIndex < 0 ? vm.routes.length : 0;
            found.parentId = '';
          }

          vm.newRouteDialog.overNode = null;
          vm.routes.sort((x, y) => x.index - y.index);
          api.refreshCells({
            force: true
          });
          vm.refreshRouteIndexes();
          vm.$axios.put('/user/set-group-routes/' + vm.newRouteDialog.groupId, {
            routes: vm.routes
          });
        },
        onRowEditingStopped(params) {
          params.context.componentParent.updateRoute(params);
        },
        getContextMenuItems(params) {
          if (!vm.newRouteDialog.groupId) {
            vm.$message.error('请先选择一个用户组');
            return [];
          }
          const ret = [
            {
              name: '新建顶层菜单',
              icon: '<i class="ivu-icon ivu-icon-md-add-circle"></i>',
              action() {
                vm.newRouteDialog.parentRouteId = '';
                vm.newRouteDialog.selectedRoutes = [];
                vm.newRouteDialog.visible = true;
                vm.$nextTick(() => {
                  vm.$refs.routeTable.clearSelection();
                });
              }
            }
          ];
          if (params.node) {
            params.node.setSelected(true);
            if (params.node.rowIndex > 0) {
              let prevNode = null;
              params.api.forEachNode((current, index) => {
                if (current.data.parentId === params.node.data.parentId && current.rowIndex < params.node.rowIndex) {
                  prevNode = current;
                }
              });
              if (prevNode) {
                ret.push({
                  name: '上移',
                  icon: '<i class="ivu-icon ivu-icon-md-arrow-up"></i>',
                  action() {
                    const fromIndex = vm.routes.findIndex(x => x._id === params.node.data._id);
                    const toIndex = vm.routes.findIndex(x => x._id === prevNode.data._id);
                    vm.routes[fromIndex].index = toIndex;
                    vm.routes[toIndex].index = fromIndex;
                    const element = vm.routes[fromIndex];
                    vm.routes.splice(fromIndex, 1);
                    vm.routes.splice(toIndex, 0, element);
                    vm.refreshUserGroupRoutes();
                  }
                });
              }
            }

            if (params.node.rowIndex < vm.routes.length - 1) {
              let nextNode = null;
              params.api.forEachNode((current, index) => {
                if (!nextNode && current.data.parentId === params.node.data.parentId && current.rowIndex > params.node.rowIndex) {
                  nextNode = current;
                }
              });
              if (nextNode) {
                console.log(nextNode.data.label);
                ret.push({
                  name: '下移',
                  icon: '<i class="ivu-icon ivu-icon-md-arrow-down"></i>',
                  action() {
                    const fromIndex = vm.routes.findIndex(x => x._id === params.node.data._id);
                    const toIndex = vm.routes.findIndex(x => x._id === nextNode.data._id);
                    vm.routes[fromIndex].index = toIndex;
                    vm.routes[toIndex].index = fromIndex;
                    const element = vm.routes[fromIndex];
                    vm.routes.splice(fromIndex, 1);
                    vm.routes.splice(toIndex, 0, element);
                    vm.refreshUserGroupRoutes();
                  }
                });
              }
            }

            if (!params.node.data.path) {
              ret.push({
                name: '新建子菜单',
                icon: '<i class="ivu-icon ivu-icon-ios-arrow-down"></i>',
                action() {
                  vm.newRouteDialog.parentRouteId = params.node.data._id;
                  vm.newRouteDialog.selectedRoutes = [];
                  vm.newRouteDialog.visible = true;
                  vm.$nextTick(() => {
                    vm.$refs.routeTable.clearSelection();
                  });
                }
              });
            }
            ret.push('separator');
            ret.push({
              name: '删除',
              icon: '<i class="ivu-icon ivu-icon-md-close text-danger"></i>',
              action() {
                function findChildren(node) {
                  const childrenIds = [];
                  for (const route of vm.routes) {
                    if (route.parentId === node._id) {
                      childrenIds.push(route._id);
                      childrenIds.push(...findChildren(route));
                    }
                  }
                  return childrenIds;
                }

                vm.$confirm('是否删除菜单项？', '请确认').then(async () => {
                  const ids = [params.node.data._id, ...findChildren(params.node.data)];
                  const indexs = ids.map(x => vm.routes.findIndex(y => y._id === x));
                  indexs.sort((x, y) => y - x);
                  for (const i of indexs) {
                    vm.routes.splice(i, 1);
                  }
                  await vm.$axios.put('/user/remove-group-routes/' + vm.newRouteDialog.groupId, { ids });
                });
              }
            });
          }
          return ret;
        },
        autoGroupColumnDef: {
          rowDrag: true,
          headerName: '菜单项',
          editable: true,
          field: 'label',
          colId: 'label',
          tooltipField: 'label',
          width: 200,
          cellRendererParams: {
            suppressCount: true
          },
          cellClassRules: {
            'hover-over': params => {
              return params.node === vm.newRouteDialog.overNode;
            }
          }
        },
        columnDefs: [
          {
            headerName: '页面名称',
            editable: false,
            field: 'name',
            colId: 'name',
            tooltipField: 'name',
            width: 150
          },
          {
            headerName: 'URL',
            editable: false,
            field: 'path',
            colId: 'path',
            tooltipField: 'path',
            width: 150
          },
          {
            headerName: '图标',
            editable: true,
            field: 'icon',
            colId: 'icon',
            width: 100,
            cellRendererFramework: IconRender,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
              values: icons,
              cellRendererFramework: IconRender
            }
          },
          {
            headerName: '描述',
            editable: true,
            field: 'description',
            colId: 'description',
            tooltipField: 'description',
            width: 150
          }
          // {
          //   headerName: '参数',
          //   editable: false,
          //   field: 'params',
          //   colId: 'params',
          //   tooltipField: 'params',
          //   width: 150
          // }
        ]
      },
      selectedRoleId: '',
      rolesGridOptions: {
        defaultColDef: {
          sortable: false,
          resizable: true,
          filterable: true,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        animateRows: true,
        rowSelection: 'single',
        editType: 'fullRow',
        rowDragManaged: true,
        enableCellChangeFlash: true,
        stopEditingWhenCellsLoseFocus: true,
        localeText: Globals.agGridLocaleText,
        context: {
          componentParent: this
        },
        getRowNodeId(item) {
          return item._id;
        },
        onRowEditingStopped(params) {
          vm.updateRole(params.node);
        },
        onRowDragEnter(params) {
          vm.indexChange.array = 'roles';
          vm.indexChange.before = params.overIndex;
        },
        onRowDragEnd(params) {
          vm.indexChange.array = 'roles';
          vm.indexChange.after = params.overIndex;
          vm.onIndexChanged();
        },
        getContextMenuItems(params) {
          // const ret = [{
          //   name: '新建角色',
          //   icon: '<i class="ivu-icon ivu-icon-md-add-circle"></i>',
          //   action() {
          //     vm.rolesFormData.role = '';
          //     vm.rolesFormData.name = '';
          //     vm.rolesFormData.description = '';
          //     vm.$refs.rolesForm.clearValidate();
          //     vm.rolesDialog.visible = true;
          //     vm.rolesDialog.loading = false;
          //   }
          // }];
          const ret = [];
          if (params.node) {
            params.node.setSelected(true);
            const rows = params.api.getSelectedRows();
            ret.push(
              // {
              //   name: '设置权限',
              //   icon: '<i class="ivu-icon ivu-icon-md-eye"></i>',
              //   action() {
              //     vm.setViewAuths(rows[0]);
              //   }
              // },
              {
                name: '删除' + rows.length + '个角色',
                icon: '<i class="ivu-icon ivu-icon-md-close text-danger"></i>',
                action() {
                  const inner = rows.find(x => x.inner);
                  if (inner) {
                    vm.$alert('内置角色"' + inner.name + '"不可删除', '错误');
                    return;
                  }

                  vm.deleteRoles(rows.map(x => x._id));
                }
              }
            );
          }
          return ret;
        },
        columnDefs: [
          {
            headerName: 'ID',
            field: 'role',
            colId: 'role',
            tooltipField: 'role',
            rowDrag: true,
            width: 85
          },
          {
            headerName: '名称',
            field: 'name',
            colId: 'name',
            tooltipField: 'name',
            editable: true,
            width: 110
          },
          // {
          //   headerName: '上传文件',
          //   field: 'enableUpload',
          //   colId: 'enableUpload',
          //   editable: true,
          //   width: 90,
          //   cellRendererFramework: BooleanRender,
          //   cellEditor: 'agSelectCellEditor',
          //   cellEditorParams: {
          //     values: [true, false]
          //   }
          // },
          // {
          //   headerName: '办理任务',
          //   field: 'executeFlow',
          //   colId: 'executeFlow',
          //   editable: true,
          //   width: 110,
          //   cellRendererFramework: BooleanRender,
          //   cellEditor: 'agSelectCellEditor',
          //   cellEditorParams: {
          //     values: [true, false]
          //   }
          // },
          {
            headerName: '只看本单位定值',
            field: 'viewSelfDepartmentOnly',
            colId: 'viewSelfDepartmentOnly',
            editable: true,
            width: 110,
            cellRendererFramework: BooleanRender,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
              values: [true, false]
            }
          },
          // {
          //   headerName: '显示当前库/历史库',
          //   field: 'viewCurrentAndHistoryStore',
          //   colId: 'viewCurrentAndHistoryStore',
          //   editable: true,
          //   width: 120,
          //   cellRendererFramework: BooleanRender,
          //   cellEditor: 'agSelectCellEditor',
          //   cellEditorParams: {
          //     values: [true, false]
          //   }
          // },
          {
            headerName: '备注',
            field: 'description',
            colId: 'description',
            tooltipField: 'description',
            editable: true,
            width: 230
          },
          {
            headerName: '用户组',
            field: 'groups',
            colId: 'groups',
            width: 150,
            cellRendererFramework: Vue.extend({
              computed: {
                groups() {
                  return this.params.value.map(x => {
                    if (vm.groups) {
                      const found = vm.groups.find(y => y._id === x._id);
                      return found ? found.name : '';
                    } else {
                      return '';
                    }
                  }).join('，');
                }
              },
              template: '<span :title="groups">{{groups}}</span>'
            })
          }
        ]
      },
      usersGridOptions: {
        defaultColDef: {
          sortable: true,
          resizable: true,
          filterable: true,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        animateRows: true,
        editType: 'fullRow',
        rowSelection: 'single',
        rowClassRules: {
          'warning-bg': params => {
            return !params.node.data._id;
          }
        },
        localeText: Globals.agGridLocaleText,
        stopEditingWhenCellsLoseFocus: true,
        context: {
          componentParent: this
        },
        getRowNodeId(item) {
          return item._id;
        },
        getContextMenuItems(params) {
          const ret = [];
          if (params.node) {
            params.node.setSelected(true);
          }
          if (!vm.users.some(x => !x._id)) {
            ret.push({
              name: '创建新用户',
              icon: '<i class="el-icon-user"></i>',
              action() {
                vm.beginUserRegister();
              }
            });
            ret.push('separator');
          }
          const rows = params.api.getSelectedRows();
          if (rows.length > 0) {
            // ret.push({
            //   name: '设置关联电压等级',
            //   icon: '<i class="ivu-icon ivu-icon-md-funnel"></i>',
            //   action() {
            //     vm.onSetupUserVoltageLevels();
            //   }
            // });
            // ret.push({
            //   name: '设置关联厂站',
            //   icon: '<i class="ivu-icon ivu-icon-ios-apps"></i>',
            //   action() {
            //     vm.onSetupSubstationViewRange();
            //   }
            // });
            ret.push({
              name: '设置运行单位 / 用户组',
              icon: '<i class="el-icon-s-grid"></i>',
              action() {
                vm.chooseDepartments(rows);
              }
            });
            // ret.push({
            //   name: '指定流程',
            //   icon: '<i class="ivu-icon ivu-icon-md-send"></i>',
            //   action() {
            //     vm.bindFlows(rows.map(x => x._id));
            //   }
            // });
            // ret.push('excelExport');
            // ret.push('separator');
            ret.push({
              name: '删除' + rows.length + '个用户 ···',
              icon: '<i class="el-icon-close"></i>',
              action() {
                vm.deleteUsers(rows);
              }
            });
          }
          return ret;
        },
        onRowEditingStopped(params) {
          vm.updateUser(params.node);
        },
        columnDefs: [
          {
            headerName: '姓名',
            field: 'name',
            colId: 'name',
            tooltipField: 'name',
            editable: true,
            width: 100
          },
          {
            headerName: '账号',
            field: 'account',
            colId: 'account',
            editable: true,
            tooltipField: 'account',
            width: 100
          },
          {
            headerName: '状态',
            field: 'status',
            colId: 'status',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
              values: ['禁用', '启用', '密码重置', '异常']
            },
            valueSetter(param) {
              switch (param.newValue) {
                case '禁用': {
                  param.data.status = 'disabled';
                  break;
                }
                case '启用': {
                  param.data.status = 'enabled';
                  break;
                }
                case '密码重置': {
                  param.data.status = 'pwdreset';
                  break;
                }
                case '异常': {
                  param.data.status = 'warning';
                  break;
                }
              }
              return true;
            },
            valueGetter(param) {
              if (!param.data) {
                return '';
              }
              switch (param.data.status) {
                case 'disabled': {
                  return '禁用';
                }
                case 'enabled': {
                  return '启用';
                }
                case 'pwdreset': {
                  return '密码重置';
                }
                case 'warning':
                default: {
                  return '异常';
                }
              }
            },
            width: 80
          },
          {
            headerName: '运行单位',
            field: 'departments',
            colId: 'departments',
            valueGetter(param) {
              if (param.data.departments) {
                return param.data.departments.map(x => {
                  const found = vm.areas.find(y => y._id === x._id);
                  return found ? found.aliasName || found.name : '';
                }).join('，');
              } else {
                return '';
              }
            },
            width: 110
          },
          // {
          //   headerName: '定值查看范围',
          //   field: 'viewSelfDepartment',
          //   colId: 'viewSelfDepartment',
          //   width: 125,
          //   editable: true,
          //   cellEditor: 'agSelectCellEditor',
          //   cellEditorParams: {
          //     values: ['与所属角色一致', '只看本单位定值', '看全部单位定值']
          //   },
          //   valueSetter(param) {
          //     switch (param.newValue) {
          //       case '与所属角色一致': {
          //         param.data.viewSelfDepartment = 'inherit';
          //         break;
          //       }
          //       case '只看本单位定值': {
          //         param.data.viewSelfDepartment = 'yes';
          //         break;
          //       }
          //       case '看全部单位定值': {
          //         param.data.viewSelfDepartment = 'no';
          //         break;
          //       }
          //     }
          //     return true;
          //   },
          //   valueGetter(param) {
          //     if (!param.data) {
          //       return '';
          //     }
          //     switch (param.data.viewSelfDepartment) {
          //       case 'inherit': {
          //         return '与所属角色一致';
          //       }
          //       case 'yes': {
          //         return '只看本单位定值';
          //       }
          //       case 'no': {
          //         return '看全部单位定值';
          //       }
          //       default: {
          //         return '与所在角色一致';
          //       }
          //     }
          //   }
          // },
          {
            headerName: '用户组',
            field: 'groups',
            colId: 'groups',
            valueGetter(param) {
              if (param.data && param.data.groups) {
                return param.data.groups.map(x => {
                  const found = vm.groups.find(y => y._id === x._id);
                  return found ? found.name : '';
                }).join('，');
              } else {
                return '';
              }
            },
            width: 150
          },
          // {
          //   headerName: '角色',
          //   field: 'groups',
          //   colId: 'roles',
          //   width: 150,
          //   valueGetter(param) {
          //     if (param.data.groups) {
          //       const roles = param.data.groups.map(y => y.roles);
          //       const roleSet = new Set();
          //       for (const role of roles) {
          //         role.forEach(x => {
          //           const found = vm.roles.find(y => y.role === x.role);
          //           if (found) {
          //             roleSet.add(found.name);
          //           }
          //         });
          //       }
          //       return Array.from(roleSet).join('，');
          //     } else {
          //       return '';
          //     }
          //   }
          // },
          // {
          //   headerName: '流程',
          //   field: 'flows',
          //   colId: 'flows',
          //   width: 150,
          //   valueGetter(param) {
          //     if (param.data.flows) {
          //       return param.data.flows.map(x => x.metadata ? x.metadata.name : '').join('，');
          //     }
          //     return '';
          //   }
          // },
          // {
          //   headerName: '网厂用户ID',
          //   field: 'npId',
          //   colId: 'npId',
          //   width: 120,
          //   editable: true
          // },
          // {
          //   headerName: '网厂工号',
          //   field: 'npToken',
          //   colId: 'npToken',
          //   width: 120,
          //   editable: true
          // },
          // {
          //   headerName: '关联电压等级',
          //   field: 'voltageLevels',
          //   colId: 'voltageLevels',
          //   width: 120,
          //   valueGetter: param => {
          //     if (!param.data.voltageLevels || !param.data.voltageLevels.length) {
          //       return '';
          //     } else {
          //       return param.data.voltageLevels.join('，');
          //     }
          //   }
          // },
          // {
          //   headerName: '关联厂站',
          //   field: 'viewRange',
          //   colId: 'viewRange',
          //   width: 120,
          //   valueGetter: (param) => {
          //     if (!param.data.viewRange || !param.data.viewRange.length) {
          //       return '';
          //     } else {
          //       return Array.from(new Set(param.data.viewRange.map(x => x.substationName))).length + '个厂站，' + Array.from(new Set(param.data.viewRange.map(x => x.voltageLevel))).length + '个电压等级';
          //     }
          //   },
          //   cellRendererFramework: Vue.extend({
          //     template: `
          //       <Poptip trigger="hover" placement="left" v-if="hasViewRange" width="300px" word-wrap>
          //       <span>{{ params.value }}</span>
          //       <div slot="content" style="width: 300px; max-height: 500px; overflow: auto;">
          //         <div v-if="!!allViewRange">
          //           <Divider><strong>定值查询与待办任务</strong></Divider>
          //           <span style="word-wrap: break-word">{{ allViewRange }}</span>
          //         </div>
          //         <div v-if="!!queryViewRange">
          //           <Divider><strong>定值查询</strong></Divider>
          //           <span style="word-wrap: break-word">{{ queryViewRange }}</span>
          //         </div>
          //         <div v-if="!!taskViewRange">
          //           <Divider><strong>待办任务</strong></Divider>
          //           <span style="word-wrap: break-word">{{ taskViewRange }}</span>
          //         </div>
          //       </div>
          //       </Poptip><span v-else>{{ params.value }}</span>`,
          //     computed: {
          //       viewRange() {
          //         return this.params.data.viewRange || [];
          //       },
          //       hasViewRange() {
          //         return this.viewRange.length > 0;
          //       },
          //       allViewRange() {
          //         return this.viewRange.filter(x => x.viewType === 'all').map(x => x.substationName + ' (' + x.voltageLevel + ')').join('，');
          //       },
          //       queryViewRange() {
          //         return this.viewRange.filter(x => x.viewType === 'query').map(x => x.substationName + ' (' + x.voltageLevel + ')').join('，');
          //       },
          //       taskViewRange() {
          //         return this.viewRange.filter(x => x.viewType === 'task').map(x => x.substationName + ' (' + x.voltageLevel + ')').join('，');
          //       }
          //     }
          //   })
          // },
          {
            headerName: '系统权限',
            field: 'groups',
            colId: 'auths',
            valueGetter(param) {
              if (param.data.groups) {
                const auths = param.data.groups.map(y => y.auths);
                const authSet = new Set();
                for (const auth of auths) {
                  auth.forEach(x => {
                    const found = vm.auths.find(y => y.auth === x.auth);
                    if (found) {
                      authSet.add(found.name);
                    }
                  });
                }
                return Array.from(authSet).join('，');
              } else {
                return '';
              }
            }
          }
        ]
      },
      substationNamesGridOptions: {
        defaultColDef: {
          sortable: true,
          resizable: true,
          filterable: true,
          suppressMenu: false,
          comparator: Globals.comparator
        },
        animateRows: true,
        rowSelection: 'multiple',
        localeText: Globals.agGridLocaleText,
        context: {
          componentParent: this
        },
        getRowNodeId(item) {
          return item.name;
        },
        columnDefs: [
          {
            checkboxSelection: true,
            width: 50
          },
          {
            headerName: '厂站名称',
            field: 'name',
            colId: 'name',
            tooltipField: 'name',
            width: 165,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            filterParams: {
              textCustomComparator: (filter, value, filterText) => {
                const filterTextLowerCase = filterText.toLowerCase();
                const valueLowerCase = String(value).toLowerCase();
                if (/[\u4E00-\u9FA5]+/g.test(filterText)) {
                  switch (filter) {
                    case 'contains':
                      return valueLowerCase.includes(filterTextLowerCase);
                    case 'notContains':
                      return valueLowerCase.includes(filterTextLowerCase);
                    case 'equals':
                      return valueLowerCase === filterTextLowerCase;
                    case 'notEqual':
                      return valueLowerCase !== filterTextLowerCase;
                    case 'startsWith':
                      return valueLowerCase.startsWith(filterTextLowerCase);
                    case 'endsWith': {
                      return valueLowerCase.endsWith(filterTextLowerCase);
                    }
                    default: {
                      // should never happen
                      console.warn('invalid filter type ' + filter);
                      return false;
                    }
                  }
                } else {
                  const pinyinData = this.substationNames.find(x => x.name === value);
                  if (!pinyinData) {
                    switch (filter) {
                      case 'contains':
                        return valueLowerCase.includes(filterTextLowerCase);
                      case 'notContains':
                        return valueLowerCase.includes(filterTextLowerCase);
                      case 'equals':
                        return valueLowerCase === filterTextLowerCase;
                      case 'notEqual':
                        return valueLowerCase !== filterTextLowerCase;
                      case 'startsWith':
                        return valueLowerCase.startsWith(filterTextLowerCase);
                      case 'endsWith': {
                        return valueLowerCase.endsWith(filterTextLowerCase);
                      }
                      default: {
                        // should never happen
                        console.warn('invalid filter type ' + filter);
                        return false;
                      }
                    }
                  }
                  for (const fl of pinyinData.firstLetters) {
                    if (fl.includes(filterTextLowerCase)) {
                      return true;
                    }
                  }
                  return false;
                }
              }
            }
          },
          {
            headerName: '隶属单位',
            field: 'departments',
            colId: 'departments',
            floatingFilter: true,
            width: 220,
            filter: 'agSetColumnFilter',
            valueFormatter: params => params.value.join('，'),
            keyCreator: params => params.value
          }
        ]
      },
      selectedDepartmentCode: '',
      roleViewAuthsDialog: {
        visible: false,
        roleIds: [],
        executeFlowStateIds: [],
        checkedFlowStateIds: [],
        viewSelfDepartmentOnly: false
      }
    };
  },
  computed: {
    ...mapGetters([
      'getClientHeight',
      'getSystemConfigs',
      'getConfigs',
      'getUserId',
      'getRoutes',
      'getFlowStates',
      'isProvince',
      'getVoltages',
      'getAjaxPrefix',
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
      return route ? route.label : '用户管理';
    },
    importRouteData() {
      return { groupId: this.selectedGroup };
    },
    viewRangeDialogAll() {
      return this.viewRangeDialog.selectedSubstationNames.filter(x => x.viewType === 'all');
    },
    viewRangeDialogTask() {
      return this.viewRangeDialog.selectedSubstationNames.filter(x => x.viewType === 'task');
    },
    viewRangeDialogQuery() {
      return this.viewRangeDialog.selectedSubstationNames.filter(x => x.viewType === 'query');
    },
    getPasswordCheckRegex() {
      const found = this.getSystemConfigs.find(x => x.key === 'pwd-check-regex');
      return found ? found.value : '';
    },
    getPasswordCheckMessage() {
      const found = this.getSystemConfigs.find(x => x.key === 'pwd-check-message');
      return found ? found.value : '密码复杂度过低';
    },
    filteredUserList() {
      if (this.selectedDepartmentCode) {
        return this.users.filter(x => {
          const codes = x.departments.map(y => y.code);
          const parentCodes = x.departments.map(y => y.parentCode);
          return codes.includes(this.selectedDepartmentCode) || parentCodes.includes(this.selectedDepartmentCode);
        });
      } else {
        return this.users;
      }
    },
    selectedRoleName() {
      const found = this.roles.find(x => x._id === this.selectedRoleId);
      return found ? found.name : '';
    },
    selectedStateName() {
      const found = this.getFlowStates.find(x => x._id === this.selectedRoleStateId);
      return found ? found.name : '';
    },
    selectedStateColor() {
      const found = this.getFlowStates.find(x => x._id === this.selectedRoleStateId);
      return found ? found.color : '';
    },
    departmentOptions() {
      return this.areas.map(x => {
        return {
          value: x._id,
          label: x.aliasName || x.name
        };
      });
    },
    userGroupOptions() {
      return this.groups.map(x => {
        return {
          value: x._id,
          label: x.name
        };
      });
    },
    areaDialogTitle() {
      let ret = '';
      if (!this.areaDialog.currentDepartmentId) {
        ret += '新建';
      } else {
        ret += '编辑运行单位';
        return ret;
      }

      if (this.areaDialog.parentCode) {
        if (this.areaDialog.parentCode === '0') {
          ret += '顶层运行单位';
        } else {
          const found = this.areas.find(x => x.code === this.areaDialog.parentCode);
          ret += (found.aliasName || found.name) + '的下级运行单位';
        }
      } else {
        ret += '运行单位';
      }

      return ret;
    }
  },
  async asyncData({
                    $axios,
                    store,
                    error
                  }) {
    try {
      const { data: areas } = await $axios.get('/sys/departments');
      const { data: areaTree } = await $axios.get('/sys/department-tree');
      const { data: groups } = await $axios.get('/user/list-user-groups');
      const { data: auths } = await $axios.get('/user/list-user-auths');
      const { data: roles } = await $axios.get('/user/list-user-roles');
      const { data: users } = await $axios.get('/user/list-users');
      return {
        areaTree,
        areas,
        groups,
        auths,
        roles,
        users
      };
    } catch (err) {
      error({
        statusCode: 500,
        message: JSON.stringify(err)
      });
    }
  },
  methods: {
    onExportRoute() {
      const a = document.createElement('a');
      const blob = new Blob([JSON.stringify(this.routes)]);
      a.href = URL.createObjectURL(blob);
      a.download = '页面路由配置.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    async onImportRoute() {
      this.$refs.importRouteButton.importVisible = false;
      const { data: groups } = await this.$axios.get('/user/list-user-groups');
      this.groups = groups;
    },
    async generateAccount() {
      if (!this.registerDialog.accountChanged) {
        if (this.registerFormData.name.length > 0) {
          const { data } = await this.$axios.post('/sys/pinyin', {
            chinese: this.registerFormData.name.substr(0, 1)
          });
          let account = data;
          if (this.registerFormData.name.length > 1) {
            const { data: firstletter } = await this.$axios.post('/sys/firstletter', {
              chinese: this.registerFormData.name.substr(1)
            });
            account += String(firstletter).toLowerCase();
          }

          this.registerFormData.account = account;
        } else {
          this.registerFormData.account = '';
        }
      }
    },
    async refreshUserGroupRoutes() {
      const indexes = this.refreshRouteIndexes();
      await this.$axios.put('/user/update-group-route-indexes/' + this.newRouteDialog.groupId, { indexes });
    },
    getGroupName(id) {
      const found = this.groups.find(x => x._id === id);
      return found ? found.name : '';
    },
    deleteRoles(ids) {
      this.$confirm('是否删除选中的' + ids.length + '个角色？', '请确认').then(async () => {
        const { data } = await this.$axios.post('/user/delete-user-roles', { ids });
        if (data.succ) {
          this.$message.success('已删除' + data.deletedCount + '个角色');
          this.selectedRoleId = '';
          const { data: groups } = await this.$axios.get('/user/list-user-groups');
          this.groups = groups;
          const { data: users } = await this.$axios.get('/user/list-users');
          this.users = users;
          this.$nextTick(() => {
            this.roles = this.roles.filter(x => !ids.includes(x._id));
          });
        } else {
          this.$notify.error(data.message);
        }
      });
    },
    onIndexChanged() {
      const array = this[this.indexChange.array];
      if (array) {
        const obj = array[this.indexChange.before];
        array.splice(this.indexChange.before, 1);
        array.splice(this.indexChange.after, 0, obj);
        const indexes = [];
        for (let i = 0; i < array.length; ++i) {
          array[i].index = i;
          indexes.push({
            _id: array[i]._id,
            index: i
          });
        }

        switch (this.indexChange.array) {
          case 'roles': {
            this.$axios.put('/user/update-user-role-indexes', {
              indexes
            });
            break;
          }
          case 'auths': {
            this.$axios.put('/user/update-user-auth-indexes', {
              indexes
            });
            break;
          }
          case 'groups': {
            this.$axios.put('/user/update-user-group-indexes', {
              indexes
            });
            break;
          }
        }
      }
    },
    setViewAuths(role) {
      this.roleViewAuthsDialog.checkedFlowStateIds = role.appAuths || [];
      this.roleViewAuthsDialog.executeFlowStateIds = role.executeAuths || [];
      this.roleViewAuthsDialog.viewSelfDepartmentOnly = role.viewSelfDepartmentOnly;
      this.roleViewAuthsDialog.visible = true;
      this.roleViewAuthsDialog.roleIds = [role._id];
    },
    refreshRouteIndexes() {
      const resetIndexes = (parentId, indexBegin) => {
        const items = this.routes.filter(x => x.parentId === parentId);
        let childrenCount = 0;
        items.forEach((item, index) => {
          item.index = index + indexBegin;
          const offset = resetIndexes(item._id, item.index + 1);
          indexBegin += offset;
          childrenCount += offset;
        });
        return items.length + childrenCount;
      };
      this.routes.forEach(x => {
        if (!x.parentId) {
          x.parentId = '';
        }
      });
      this.routes.sort((x, y) => x.index - y.index);
      resetIndexes('', 0);
      this.routes.sort((x, y) => x.index - y.index);
      return this.routes.map(x => {
        return {
          _id: x._id,
          index: x.index
        };
      });
    },
    onConfirmDepartment() {
      this.$refs.departmentForm.validate(async v => {
        await this.setUserDepartments();
        await this.setUserGroups();
        this.userGroupSelectDialog.visible = false;
      });
    },
    doRegister() {
      this.$refs.registerForm.validate(async value => {
        if (value) {
          try {
            this.registerDialog.loading = true;
            const { data } = await this.$axios.post('/auth/register-user', {
              name: this.registerFormData.name,
              status: 'enabled',
              account: this.registerFormData.account.trim(),
              password: sha1(this.registerFormData.password).toString(),
              departments: this.registerFormData.departments,
              groups: this.registerFormData.groups,
              viewSelfDepartment: this.registerFormData.viewSelfDepartment
            });
            if (data.succ && data.userId) {
              this.$message.success('用户创建成功！');

              this.users.push(data.user);
              const groupNodes = [];
              for (const groupId of this.registerFormData.groups) {
                const found = this.groups.find(x => x._id === groupId);
                found.users.push(data.userId);
                groupNodes.push(this.groupsGridOptions.api.getRowNode(groupId));
              }
              this.$nextTick(() => {
                this.usersGridOptions.api.deselectAll();
                const node = this.usersGridOptions.api.getRowNode(data.userId);
                this.usersGridOptions.api.ensureIndexVisible(this.users.length - 1);
                node.setSelected(true);
                this.groupsGridOptions.api.redrawRows({ rowNodes: groupNodes });
                this.registerDialog.visible = false;
                this.registerDialog.loading = false;
              });
            } else {
              this.$message.error('用户创建失败，' + data.message);
              this.registerDialog.loading = false;
            }
          } catch (err) {
            console.error(err);
            this.$message.error('用户创建失败，' + err.message);
            this.registerDialog.loading = false;
          }
        }
      });
    },
    deleteUsers(users) {
      async function _deleteUsers(vm, logout) {
        const ids = users.map(x => x._id);
        const { data } = await vm.$axios.post('/user/delete-users', {
          ids,
          logout
        });
        if (!data.succ) {
          vm.$notify.error({
            title: '错误',
            message: data.message
          });
          return false;
        }
        for (const id of ids) {
          const index = vm.users.findIndex(x => x._id === id);
          if (index >= 0) {
            if (vm.users[index].account !== 'root') {
              vm.users.splice(index, 1);
            }
          }
        }
        return true;
      }

      if (users.map(x => x._id).includes(this.getUserId)) {
        this.$confirm('指定删除的' + users.length + '个用户中包括当前已登录的用户，删除后将自动退出，是否继续删除？', '请确认').then(async () => {
          if (await _deleteUsers(this, true)) {
            this.$router.push({ name: 'login' });
          }
        });
      } else {
        this.$confirm('是否删除选中的' + users.length + '个用户？', '请确认').then(async () => {
          if (await _deleteUsers(this, false)) {
            const groupIds = new Set();
            for (const group of this.groups) {
              for (const user of users) {
                const index = group.users.indexOf(user._id);
                if (index >= 0) {
                  group.users.splice(index, 1);
                  groupIds.add(group._id);
                }
              }
            }
            this.$nextTick(() => {
              const groupNodes = [];
              groupIds.forEach(x => groupNodes.push(this.groupsGridOptions.api.getRowNode(x)));
              if (groupNodes.length > 0) {
                this.groupsGridOptions.api.redrawRows({ rowNodes: groupNodes });
              }
            });
          }
        });
      }
    },
    beginUserRegister() {
      this.registerDialog.visible = true;
      this.registerDialog.title = '注册新用户';
      this.registerFormData.areaName = '';
      this.registerFormData.departments = [];
      this.registerFormData.departmentNames = '';
      this.registerFormData.groups = [];
      this.registerFormData.groupNames = '';
      this.registerFormData.viewSelfDepartment = 'inherit';
      if (this.selectedDepartmentCode) {
        const dep = this.areas.find(x => x.code === this.selectedDepartmentCode);
        if (dep) {
          this.registerFormData.departments = [dep];
          this.registerFormData.departmentNames = dep.name;
        }
      }

      this.$nextTick(() => {
        this.$refs.registerForm.resetFields();
      });
      this.registerDialog.accountChanged = false;
    },
    chooseDepartments(users = []) {
      this.userGroupSelectDialog.visible = true;
      this.userGroupSelectDialog.userIds = users.map(x => x._id);
      this.userGroupSelectDialog.form.groups = [];
      this.userGroupSelectDialog.form.departments = [];
      this.$nextTick(() => {
        this.$refs.departmentForm.clearValidate();
      });
      // this.$tree.show('请选择运行单位', {
      //   treeData: this.areaTree,
      //   showCheckbox: true,
      //   checkStrictly: true
      // }).then(async ({checked}) => {
      //   if (users.length === 0) {
      //     if (checked && checked.length > 0) {
      //       this.registerFormData.departments = checked;
      //       this.registerFormData.departmentNames = checked.map(x => x.aliasName || x.name).join('，');
      //     } else {
      //       this.registerFormData.departments = [];
      //       this.registerFormData.departmentNames = '';
      //     }
      //
      //     this.$refs.registerForm.validateField('departments');
      //   } else {
      //     for (const user of users) {
      //       const userId = user._id;
      //       await this.$axios.put('/user/set-user-departments/' + userId, {
      //         departments: checked
      //       });
      //       const found = this.users.find(x => x._id === userId);
      //       found.departments = checked;
      //       this.$nextTick(() => {
      //         const rowNode = this.usersGridOptions.api.getRowNode(userId);
      //         rowNode.setSelected(true);
      //         this.usersGridOptions.api.redrawRows({rowNodes: [rowNode]});
      //       });
      //     }
      //   }
      // });
    },
    async setUserDepartments() {
      for (const userId of this.userGroupSelectDialog.userIds) {
        await this.$axios.put('/user/set-user-departments/' + userId, {
          departments: this.userGroupSelectDialog.form.departments
        });
        const found = this.users.find(x => x._id === userId);
        found.departments = this.areas.filter(x => this.userGroupSelectDialog.form.departments.includes(x._id));
        this.$nextTick(() => {
          const rowNode = this.usersGridOptions.api.getRowNode(userId);
          rowNode.setSelected(true);
          this.usersGridOptions.api.redrawRows({ rowNodes: [rowNode] });
        });
      }
    },
    async setUserGroups() {
      try {
        const groups = this.groups.filter(x => this.userGroupSelectDialog.form.groups.includes(x._id));
        const roles = [];
        for (const g of groups) {
          for (const r of g.roles) {
            const rFound = this.roles.find(x => x._id === r);
            if (rFound) {
              if (!roles.includes(rFound.role)) {
                roles.push(rFound.role);
              }
            }
          }
        }
        if ((roles.includes('repeal') || roles.includes('browse') || roles.includes('readonly')) && roles.length > 1) {
          this.$Modal.error({
            title: '设置错误',
            content: '用户组关联的角色(回执人、调度员)必须唯一'
          });
          return;
        }

        const { data } = await this.$axios.post('/user/set-users-groups', {
          userIds: this.userGroupSelectDialog.userIds,
          groupIds: this.userGroupSelectDialog.form.groups
        });
        const userNodes = [];
        const groupNodes = [];
        for (const user of data.updatedUsers) {
          const index = this.users.findIndex(x => x._id === user._id);
          this.users.splice(index, 1, user);
          const node = this.usersGridOptions.api.getRowNode(user._id);
          if (node) {
            userNodes.push(node);
          }
        }
        for (const group of data.updatedGroups) {
          const index = this.groups.findIndex(x => x._id === group._id);
          this.groups.splice(index, 1, group);
          const node = this.groupsGridOptions.api.getRowNode(group._id);
          if (node) {
            groupNodes.push(node);
          }
        }
        this.$nextTick(() => {
          if (userNodes.length) {
            this.usersGridOptions.api.redrawRows({ rowNodes: userNodes });
          }
          if (groupNodes.length) {
            this.groupsGridOptions.api.redrawRows({ rowNodes: groupNodes });
          }
        });
      } catch (err) {
        console.error(err);
        return err.message;
      }
    },
    onDepartmentSelected({ node }) {
      this.usersGridOptions.api.deselectAll();
      if (node.selected) {
        this.selectedDepartmentCode = node.data.code;
      }
      // this.$nextTick(() => {
      //   const ids = this.users.filter(x => x.departments.map(y => y.code).includes(node.data.code)).map(x => x._id);
      //   const rowNodes = ids.map(x => this.usersGridOptions.api.getRowNode(x));
      //   rowNodes.forEach(x => {
      //     if (x) {
      //       x.setSelected(true);
      //     }
      //   });
      // });
    },
    async updateUser(node) {
      const user = node.data;
      const { data } = await this.$axios.put('/user/update-user/' + user._id, {
        name: user.name,
        status: user.status,
        account: user.account,
        npId: user.npId,
        npToken: user.npToken,
        viewSelfDepartment: user.viewSelfDepartment
      });
      if (data.succ) {
        const found = this.users.find(x => x._id === user._id);
        found.name = user.name;
        found.status = user.status;
        found.account = user.account;
        found.npId = user.npId;
        found.npToken = user.npToken;
        found.viewSelfDepartment = user.viewSelfDepartment;
        this.$nextTick(() => {
          this.usersGridOptions.api.redrawRows({
            rowNodes: [node]
          });
        });
      } else {
        this.$message.error(data.message);
        const index = this.users.findIndex(x => x._id === '');
        this.usersGridOptions.api.startEditingCell({
          rowIndex: index,
          colKey: 'name'
        });
      }
    },
    async onRoleSelected({ node }) {
      if (node.selected) {
        this.selectedRoleId = node.data._id;
        this.queryColumnStates = node.data.columnStatesInQuery.sort((x, y) => x.index - y.index);
        const { data } = await this.$axios.get('/user/role-states/' + node.data._id);
        if (data.succ) {
          this.roleStates = data.stateConfigs.sort((x, y) => x.index - y.index);
        } else {
          this.roleStates = [];
        }
        this.taskButtons = [];
        this.ownButtons = [];
        this.selectedRoleStateId = '';
      } else if (this.selectedRoleId === node.data._id) {
        this.selectedRoleId = '';
        this.selectedRoleStateId = '';
        this.queryColumnStates = [];
        this.roleStates = [];
        this.taskButtons = [];
        this.ownButtons = [];
      }
    },
    getRouteNodeTreePath(node) {
      const getParents = current => {
        const parents = [];
        if (current.parentId) {
          const parent = this.routes.find(x => x._id === current.parentId);
          if (parent) {
            parents.unshift(parent);
            parents.unshift(...getParents(parent));
          }
        }
        return parents;
      };
      const parents = [...getParents(node), node];
      return parents.map(x => x._id);
    },
    getDepartmentTreePath(node) {
      const path = [];
      let iterator = node;
      while (iterator) {
        path.unshift(iterator.code);
        iterator = this.areas.find(x => x.code === iterator.parentCode);
      }
      return path;
    },
    getRoles(ids) {
      return ids.map(x => {
        const r = this.roles.find(y => y._id === x);
        return r ? r.name : '';
      }).join('，');
    },
    getAuths(ids) {
      return ids.map(x => {
        const a = this.auths.find(y => y._id === x);
        return a ? a.name : '';
      }).join('，');
    },
    getRoles2(roles) {
      if (!roles) {
        return '全部';
      } else if (roles === 'any' || roles === 'all') {
        return '全部';
      }
      return roles.map(x => {
        const r = this.roles.find(y => y.role === x);
        return r ? r.name : '';
      }).join('，');
    },
    getAuths2(auths) {
      if (!auths) {
        return '全部';
      } else if (auths === 'any' || auths === 'all') {
        return '全部';
      }
      return auths.map(x => {
        const a = this.auths.find(y => y.auth === x);
        return a ? a.name : '';
      }).join('，');
    },
    groupsGridDragOver(e) {
      const dragSupported = e.dataTransfer.types.length;
      if (dragSupported) {
        e.dataTransfer.dropEffect = 'copy';
        e.preventDefault();
      }
    },
    groupsGridDragDrop(e) {
      e.preventDefault();
      const userAgent = window.navigator.userAgent;
      const isIE = userAgent.includes('Trident/');
      const jsonData = e.dataTransfer.getData(isIE ? 'text' : 'application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log(data);
      }
    },
    onUserGroupSelected({ node }) {
      this.usersGridOptions.api.deselectAll();
      // this.authsGridOptions.api.deselectAll();
      // this.rolesGridOptions.api.deselectAll();

      this.selectedGroup = node.data._id;

      if (!node.selected) {
        return;
      }

      this.departmentTreeGridOptions.api.deselectAll();
      this.selectedDepartmentCode = '';
      this.$nextTick(() => {
        const userIds = node.data.users;
        if (userIds) {
          for (const userId of userIds) {
            if (this.users.some(x => x._id === userId)) {
              const node = this.usersGridOptions.api.getRowNode(userId);
              if (node) {
                node.setSelected(true);
              }
            }
          }
        }

        // if (node.data.auths) {
        //   for (const auth of node.data.auths) {
        //     const node = this.authsGridOptions.api.getRowNode(auth);
        //     if (node) {
        //       node.setSelected(true);
        //     }
        //   }
        // }

        // if (node.data.roles) {
        //   for (const role of node.data.roles) {
        //     const node = this.rolesGridOptions.api.getRowNode(role);
        //     if (node) {
        //       node.setSelected(true);
        //     }
        //   }
        // }
      });

      this.newRouteDialog.groupName = node.data.name;
      this.$set(this, 'routes', node.data.routes);
      this.routeMetas.splice(0, this.routeMetas.length, ...this.getRoutes.filter(x => !x.hidden).map(x => Object.assign({}, x)));
      const group = this.groups.find(x => x._id === node.data._id);
      const auths = group.auths.map(x => this.auths.find(y => y._id === x).auth);
      const roles = group.roles.map(x => this.roles.find(y => y._id === x).role);
      for (const route of this.routeMetas) {
        if (!route.roles || route.roles === 'all' || route.roles === 'any') {
          route._disabled = false;
        } else {
          route._disabled = !roles.some(x => route.roles.includes(x));
        }

        if (!route.auths || route.auths === 'all' || route.auths === 'any') {
          route._disabled = false;
        } else {
          route._disabled = !auths.some(x => route.auths.includes(x));
        }
      }
      this.routeMetas.unshift({
        _disabled: false,
        label: '菜单组'
      });
      this.newRouteDialog.routeLabels.splice(
        0,
        this.newRouteDialog.routeLabels.length,
        ...this.routeMetas.map(x => {
          return {
            label: x.label,
            path: x.path
          };
        })
      );
      this.newRouteDialog.groupId = node.data._id;
    },
    onRouteSelected(routes) {
      this.newRouteDialog.selectedRoutes = routes;
    },
    async updateRoute(params) {
      console.log(params);
      await this.$axios.put('/user/set-group-route/' + this.newRouteDialog.groupId + '/' + params.node.data._id, params.node.data);
    },
    async addGroupRoute() {
      try {
        this.newRouteDialog.loading = true;
        const { data } = await this.$axios.get('/functional/mongo-id/' + this.newRouteDialog.selectedRoutes.length);
        const insertIndex = this.newRouteDialog.parentRouteId
          ? this.routes.findIndex(x => x._id === this.newRouteDialog.parentRouteId) + 1
          : this.routes.length;
        this.newRouteDialog.selectedRoutes.forEach((x, index) => {
          const found = this.newRouteDialog.routeLabels.find(y => y.path === x.path);
          x.parentId = this.newRouteDialog.parentRouteId;
          x._id = data[index];
          x.label = found.label;
        });
        this.routes.splice(insertIndex, 0, ...this.newRouteDialog.selectedRoutes);
        this.newRouteDialog.selectedRoutes.splice(0, this.newRouteDialog.selectedRoutes.length);
        this.refreshRouteIndexes();
        await this.$axios.put('/user/set-group-routes/' + this.newRouteDialog.groupId, {
          routes: this.routes
        });

        this.newRouteDialog.visible = false;
      } catch (err) {
        console.error(err);
      } finally {
        this.newRouteDialog.loading = false;
      }
    },
    setRouteMetaLabel($event, index) {
      this.routeMetas[index].label = $event.target.value;
    },
    confirmDepartment() {
      this.$refs.departmentForm.validate(async valid => {
        if (valid) {
          const { data } = await this.$axios.post('/user/update-department', {
            originalCode: this.areaDialog.code,
            code: this.areaFormData.code,
            name: this.areaFormData.name,
            index: this.areaDialog.index,
            parentCode: this.areaDialog.parentCode ? this.areaDialog.parentCode : '0',
            aliasName: this.areaFormData.aliasName
          });

          if (data.succ) {
            if (!this.areaDialog.code) {
              this.areas.push(data.result);
            } else {
              const found = this.areas.find(x => x.code === this.areaDialog.code);
              found.code = this.areaFormData.code;
              found.name = this.areaFormData.name;
              found.index = this.areaDialog.index;
              found.aliasName = this.areaFormData.aliasName;
            }

            await this.$axios.post('/user/update-department-indexes', {
              indexes: this.refreshDepartmentIndexes()
            });

            this.$nextTick(() => {
              const rowNode = this.departmentTreeGridOptions.api.getRowNode(data.result.code);
              rowNode.setSelected(true);
              this.departmentTreeGridOptions.api.ensureNodeVisible(rowNode);
              this.departmentTreeGridOptions.api.redrawRows({ rowNodes: [rowNode] });
              const userIds = this.users.filter(x => x.departments.some(y => y.code === data.result.code)).map(x => x._id);
              this.usersGridOptions.api.redrawRows({ rowNodes: userIds.map(x => this.usersGridOptions.api.getRowNode(x)) });
            });

            this.areaDialog.visible = false;
          } else {
            this.$message.error('错误：' + data.message);
          }
        }
      });
    },
    generateDepartmentTree() {
      const fetchChildren = node => {
        const children = this.areas
          .filter(x => x.parentCode === node.code)
          .map(x => {
            return Object.assign(
              {
                expand: false,
                title: x.aliasName || x.name
              },
              x
            );
          });
        for (const child of children) {
          child.children = fetchChildren(child);
        }
        return children;
      };
      const topics = this.areas
        .filter(x => x.parentCode === '0' || !this.areas.some(y => y.code === x.parentCode))
        .map(x => Object.assign({}, x));
      for (const node of topics) {
        node.expand = true;
        node.title = node.aliasName || node.name;
        node.children = fetchChildren(node);
      }

      this.areaTree = topics;
      return topics;
    },
    refreshDepartmentIndexes() {
      const resetIndexes = (parentCode, indexBegin) => {
        const items = this.areas.filter(x => x.parentCode === parentCode);
        let childrenCount = 0;
        items.forEach((item, index) => {
          item.index = index + indexBegin;
          const offset = resetIndexes(item.code, item.index + 1);
          indexBegin += offset;
          childrenCount += offset;
        });
        return items.length + childrenCount;
      };

      this.areas.sort((x, y) => x.index - y.index);
      const topics = this.areas.filter(x => x.parentCode === '0' || !this.areas.some(y => y.code === x.parentCode));
      let indexOffset = 0;
      topics.forEach(x => {
        x.index = indexOffset++;
        indexOffset += resetIndexes(x.code, indexOffset);
      });
      this.areas.sort((x, y) => x.index - y.index);
      this.generateDepartmentTree();

      return this.areas.map(x => {
        return {
          code: x.code,
          index: x.index
        };
      });
    },
    removeDepartment({
                       code,
                       aliasName,
                       name
                     }) {
      const hasChildren = this.areas.some(x => x.parentCode === code);
      this.$confirm('是否删除运行单位"' + (aliasName || name) + '"' + (hasChildren ? '和下属的所有运行单位' : '') + '？', '请确认').then(async () => {
        const { data } = await this.$axios.delete('/user/delete-department/' + code);
        if (!data.succ) {
          this.$message.error(data.message);
        } else {
          this.$set(
            this,
            'areas',
            this.areas.filter(x => !data.codes.includes(x.code))
          );
        }
      });
    },
    appendDepartment(parentCode, index) {
      this.areaDialog.visible = true;
      this.$nextTick(() => {
        this.areaDialog.code = '';
        this.areaDialog.index = index;
        this.areaDialog.parentCode = parentCode;
        this.areaDialog.currentDepartmentId = '';
        this.$refs.departmentForm.clearValidate();
        this.areaFormData.id = null;
        this.areaFormData.code = '';
        this.areaFormData.name = '';
        this.areaFormData.aliasName = '';
      });
    },
    editDepartment(id, code, index) {
      this.areaDialog.visible = true;
      const found = this.areas.find(x => x.code === code);
      this.$nextTick(() => {
        this.areaDialog.code = code;
        this.areaDialog.index = index;
        this.areaDialog.parentCode = found.parentCode;
        this.areaDialog.currentDepartmentId = found._id;
        this.$refs.departmentForm.clearValidate();
        this.areaFormData.id = id;
        this.areaFormData.code = code;
        this.areaFormData.name = found.name;
        this.areaFormData.aliasName = found.aliasName;
      });
    },
    async updateUserGroup(node) {
      const group = node.data;
      if (!group._id) {
        const { data } = await this.$axios.post('/user/create-user-group', {
          name: group.name,
          description: group.description,
          index: group.index
        });
        if (data.succ) {
          const index = this.groups.findIndex(x => x._id === '');
          this.groups.splice(index, 1, data.group);
          this.$nextTick(() => {
            this.groupsGridOptions.api.redrawRows({
              rowNodes: [node]
            });
          });
        } else {
          this.$message.error(data.message);
          const index = this.groups.findIndex(x => x._id === '');
          this.groupsGridOptions.api.startEditingCell({
            rowIndex: index,
            colKey: 'name'
          });
        }
      } else {
        const { data } = await this.$axios.put('/user/update-user-group/' + group._id, {
          name: group.name,
          description: group.description
        });
        if (!data.succ) {
          const found = this.groups.find(x => x._id === group._id);
          found.name = data.group.name;
          found.description = data.group.description;
          this.$nextTick(() => {
            this.groupsGridOptions.api.redrawRows({
              rowNodes: [node]
            });
          });
          this.$message.error(data.message);
        }
      }
    },
    deleteUserGroups(rows) {
      this.$confirm('是否删除选中的用户组？', '请确认').then(async () => {
        const ids = rows.map(x => x._id);
        const { data } = await this.$axios.post('/user/delete-user-groups', {
          ids
        });
        if (!data.succ) {
          this.$message.error(data.message);
          return;
        }
        for (const id of ids) {
          for (const role of this.roles) {
            const index = role.groups.findIndex(x => x._id === id);
            if (index >= 0) {
              role.groups.splice(index, 1);
            }
          }
          for (const auth of this.auths) {
            const index = auth.groups.findIndex(x => x._id === id);
            if (index >= 0) {
              auth.groups.splice(index, 1);
            }
          }
          const index = this.groups.findIndex(x => x._id === id);
          this.groups.splice(index, 1);
        }
      });
    },
    async setupUserGroupRole(group, role) {
      const { data } = await this.$axios.post('/user/set-group-roles/' + group._id, {
        roleId: role._id
      });
      if (data.succ) {
        const { data: roles } = await this.$axios.get('/user/list-user-roles');
        this.roles.splice(0, this.roles.length, ...roles);
        const found = this.groups.find(x => x._id === group._id);
        found.roles = data.roleIds;
        const userNodes = [];
        for (const user of this.users) {
          if (user.groups) {
            const userGroup = user.groups.find(x => x._id === found._id);
            if (userGroup) {
              userGroup.roles = data.roleIds.map(x => roles.find(y => y._id === x));
              userNodes.push(this.usersGridOptions.api.getRowNode(user._id));
            }
          }
        }
        this.$nextTick(() => {
          const node = this.groupsGridOptions.api.getRowNode(group._id);
          this.groupsGridOptions.api.redrawRows({
            rowNodes: [node]
          });
          this.usersGridOptions.api.redrawRows({ rowNodes: userNodes });
        });
      } else {
        this.$alert(data.message, '设置错误');
      }
    },
    async setupUserGroupAuth(groupNodes, auth) {
      for (const group of groupNodes) {
        const { data } = await this.$axios.put(`/user/set-group-auth/${group._id}/${auth._id}`);
        if (data.succ) {
          const found = this.groups.find(x => x._id === group._id);
          found.auths = data.auths;
          const userNodes = [];
          for (const user of this.users) {
            if (user.groups) {
              const userGroup = user.groups.find(x => x._id === found._id);
              if (userGroup) {
                userGroup.auths = data.auths.map(x => this.auths.find(y => y._id === x));
                userNodes.push(this.usersGridOptions.api.getRowNode(user._id));
              }
            }
          }
          this.$nextTick(() => {
            const node = this.groupsGridOptions.api.getRowNode(group._id);
            this.groupsGridOptions.api.redrawRows({
              rowNodes: [node]
            });
            this.usersGridOptions.api.redrawRows({ rowNodes: userNodes });
          });
          const { data: auths } = await this.$axios.get('/user/list-user-auths');
          this.auths.splice(0, this.auths.length, ...auths);
        }
      }
    }
  }
};
</script>

<style scoped>

.buttons {
  display: flex;
  float: right;
}
</style>
