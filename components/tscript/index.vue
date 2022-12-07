<template>
  <div>
    <el-dialog :title="impedanceGraphicDialog.title" :visible.sync="impedanceGraphicDialog.visible" width="60%" top="0"
      :before-close="onCloseImpedanceGraph" :close-on-click-modal="false">
      <span slot="footer" class="dialog-footer">
        <span v-if="impedanceGraphicDialog.autoConfirm">将在{{ impedanceGraphicDialog.timeout }}秒后自动确认</span>
        <el-button type="primary" @click="confirmGraphic">{{ impedanceGraphicDialog.confirmButtonText }}</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="planGraphDialog.title" :visible.sync="planGraphDialog.visible" :width="planGraphDialog.width"
      destroy-on-close :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <plan-graph ref="plan" :panelHeight="planGraphDialog.graph.panelHeight" :uri="planGraphDialog.graph.uri"
        :svg="planGraphDialog.graph.svg" :title="planGraphDialog.graph.title" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelPlan">取 消</el-button>
        <el-button type="primary" @click="confirmPlan">确 定</el-button>
      </span>
    </el-dialog>
    <js-dialog :title="inputsDialog.title" :width="inputsDialog.width" :visible="inputsDialog.visible"
      @on-cancel="cancelInputs" @on-confirm="confirmInputs">
      <table class="param-table fill-width" style="width: 100%">
        <tbody>
          <tr v-if="inputsDialog.header && inputsDialog.header.length > 0">
            <th v-for="(item, index) of inputsDialog.header" :key="index">
              <span>{{ inputsDialog.header[index] }}</span>
            </th>
          </tr>
          <tr v-for="(item, itemIndex) of inputsDialog.items" :key="itemIndex">
            <th>
              <div v-if="item.html" v-html="item.html"></div>
              <span v-else>{{ item.label }}</span>
            </th>
            <td v-if="!Array.isArray(item.value)" style="padding: 5px">
              <div v-if="item.needInput">
                <el-input v-model="item.value" :placeholder="item.placeholder" :disabled="item.disabled"
                  :type="item.type" @input="onInputChange(item)">
                </el-input>
              </div>
              <!-- 添加单选按钮 -->
              <div class="ai-tab-change" v-if="item.needRadio">
                <!-- <el-radio v-for="(radioLabel, index) of item.radioLabels" :key="index" v-model="item.radioValue"
                  class="radioBtn" :label="radioLabel" boder>{{ radioLabel }}
                </el-radio> -->
                <el-radio-group v-for="(radioLabel, index) of item.radioLabels" :key="index" v-model="item.radioValue">
                  <el-radio class="radioBtn" :label="radioLabel" boder>{{ radioLabel }}</el-radio>
                </el-radio-group>
              </div>
              <span class="description-font" v-html="item.description"></span>
            </td>
            <td v-else v-for="(item1, index) in item.value" :key="index" style="padding: 5px">
              <el-input v-model="item1.value" :placeholder="item1.placeholder" :disabled="item1.disabled"
                :type="item1.type" @input="onInputChange(item1)">
              </el-input>
              <span class="description-font" v-html="item1.description"></span>
            </td>
          </tr>
        </tbody>
      </table>
    </js-dialog>
    <el-dialog :title="inputsGroupDialog.title" :visible.sync="inputsGroupDialog.visible"
      :width="inputsGroupDialog.width" destroy-on-close :show-close="false" :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div style="overflow: auto">
        <el-collapse v-model="inputsGroupDialog.activeName">
          <el-collapse-item v-for="inputs of inputsGroupDialog.member" :key="inputs.title" :title="inputs.title"
            :name="inputs.title">
            <table class="param-table fill-width" style="width: 100%">
              <tbody>
                <template v-if="inputs.header && inputs.header.length > 0">
                  <tr>
                    <th v-for="(item, index) of inputs.header" :key="index">
                      <span>{{ inputs.header[index] }}</span>
                    </th>
                  </tr>
                </template>
                <tr v-for="(option, opIndex) of inputs.options" :key="opIndex">
                  <th>
                    <div v-if="option.html" v-html="option.html" />
                    <span v-else>{{ option.label }}</span>
                  </th>
                  <td v-if="!Array.isArray(option.value)" style="padding: 5px">
                    <el-input v-model="option.value" :placeholder="option.placeholder" :disabled="option.disabled"
                      @input="onInputChange(option)" />
                    <span class="description-font" v-html="option.description" />
                  </td>
                  <td v-else v-for="(item1, index) in option.value" :key="index" style="padding: 5px">
                    <el-input v-model="item1.value" :placeholder="item1.placeholder" :disabled="item1.disabled"
                      @input="onInputChange(item1)" />
                    <span class="description-font" v-html="item1.description" />
                  </td>
                </tr>
              </tbody>
            </table>
          </el-collapse-item>
        </el-collapse>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelInputsGroup">取 消</el-button>
        <el-button type="primary" @click="confirmInputsGroup">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="checksDialog.title" :visible.sync="checksDialog.visible" :width="checksDialog.width"
      destroy-on-close :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <div style="max-height: 800px; overflow: auto">
        <div v-for="(item, index) of checksDialog.items" :key="index" :style="{
          width: item.width ? item.width : '280px',
          float: 'left'
        }">
          <el-checkbox class="m-r-10 m-b-5" v-model="item.checked" :key="item.label">{{ item.label }}</el-checkbox>
          <template v-if="item.divider">
            <el-divider />
          </template>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelChecks">取 消</el-button>
        <el-button type="primary" @click="confirmChecks">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="radioDialog.title" :visible.sync="radioDialog.visible" :width="radioDialog.width"
      destroy-on-close :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <div style="max-height: 800px; overflow: auto">
        <div v-for="(item, index) of radioDialog.items" :key="index" :style="{
          width: item.width ? item.width : '280px',
          float: 'left'
        }">
          <!-- <el-radio-group v-model="radio">
            <el-radio :label="item.value" :key="item.value" border>{{ item.label }}</el-radio>
          </el-radio-group> -->
          <div style="margin-top: 20px">
            <el-radio-group v-model="radioDialog.radio">
              <el-radio :label="item.label" :key="index">{{ item.label }}
              </el-radio>
            </el-radio-group>
            <template v-if="item.divider">
              <el-divider />
            </template>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelRadio">取 消</el-button>
        <el-button type="primary" @click="confirmRadio">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="progressDialog.title" :visible.sync="progressDialog.visible" width="600px" destroy-on-close
      :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false" center>
      <el-progress :percentage="progressDialog.percentage" />
      <span v-show="!percentage" slot="footer" class="dialog-footer">
        <el-button type="primary" @click="forceClose" style="text-align: center">
          强 制 结 束
        </el-button>
      </span>
      <span v-show="percentage" slot="footer" class="dialog-footer">
        <el-button type="primary" @click="percentageClose" style="text-align: center">
          关 闭
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Globals from '@/assets/js/globals';
import PlanGraph from '~/components/graph/go/plan';
import JsDialog from '~/components/tscript/compoents/dialog';

export default {
  name: 'XScript',
  components: {
    JsDialog,
    PlanGraph
  },
  props: {
    executing: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      myTime: '',
      percentage: false,
      planGraphDialog: {
        visible: false,
        title: '',
        runKey: '',
        width: '',
        eventKey: '',
        graph: {
          uri: '',
          svg: '',
          panelHeight: 800,
          title: ''
        }
      },
      impedanceGraphicDialog: {
        visible: false,
        substationUri: '',
        title: '',
        runKey: '',
        eventKey: '',
        confirmButtonText: '确认',
        autoConfirm: false,
        timeout: 0,
        interval: null
      },
      checksDialog: {
        width: '',
        runKey: '',
        eventKey: '',
        visible: false,
        title: '',
        items: []
      },
      radioDialog: {
        width: '',
        runKey: '',
        eventKey: '',
        visible: false,
        title: '',
        items: [],
        radio: ''
      },
      inputsDialog: {
        width: '',
        runKey: '',
        eventKey: '',
        visible: false,
        title: '',
        items: [],
        header: [],
        radio: ''
      },
      inputsGroupDialog: {
        width: '',
        runKey: '',
        eventKey: '',
        visible: false,
        title: '',
        member: [],
        activeName: [],
        radio: ''
      },
      progressDialog: {
        runKey: '',
        eventKey: '',
        visible: false,
        title: '',
        percentage: 0,
        items: []
      },
      curveSimpleDialog: {
        title: '',
        visible: false,
        runKey: '',
        eventKey: '',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        items: []
      },
      lastError: null,
      result: null,
      runKey: ''
    };
  },
  computed: {
    ...mapGetters([
      'getUserId',
      'getAllSubstations',
      'getAxiosHeader',
      'getAreaCode'
    ]),
    getDataSourceId() {
      return '';
    },
    getAppDataSourceId() {
      return '';
    }
  },
  methods: {
    percentageClose() {
      this.progressDialog.visible = false;
    },
    forceClose() {
      this.$confirm('确定强制结束生成吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false
      }).then(_ => {
        if (this.runKey) {
          this.kill();
          clearInterval(this.myTime);
        }
        this.progressDialog.visible = false;
      }).catch(_ => {
      });
    },
    onCloseImpedanceGraph(done) {
      if (this.$refs.impedanceGraphic) {
        this.$refs.impedanceGraphic.clear();
      }
      done();
      if (this.impedanceGraphicDialog.interval) {
        clearInterval(this.impedanceGraphicDialog.interval);
        this.impedanceGraphicDialog.interval = null;
      }
      this.$axios.post('/manage/response-event', {
        runKey: this.impedanceGraphicDialog.runKey,
        eventKey: this.impedanceGraphicDialog.eventKey,
        event: '$igConfirm',
        data: 'cancel',
        status: 'cancel'
      }).then();
    },
    confirmGraphic() {
      if (this.impedanceGraphicDialog.interval) {
        clearInterval(this.impedanceGraphicDialog.interval);
        this.impedanceGraphicDialog.interval = null;
      }
      const base64 = this.$refs.impedanceGraphic.generateJPEG();
      this.$axios.post('/manage/response-event', {
        runKey: this.impedanceGraphicDialog.runKey,
        eventKey: this.impedanceGraphicDialog.eventKey,
        event: '$igConfirm',
        data: base64,
        status: 'ok'
      }).then();

      this.impedanceGraphicDialog.visible = false;
      if (this.$refs.impedanceGraphic) {
        this.$refs.impedanceGraphic.clear();
      }
    },
    getError() {
      return this.lastError;
    },
    getResult() {
      return this.result;
    },
    setExecuting(executing) {
      if (!executing) {
        this.runKey = '';
      }
      this.$emit('update:executing', executing);
    },
    async initializeContext({ scriptId, param, timeoutMS, scriptContent }) {
      const { data: context } = await this.$axios.post('/manage/initialize-script-context', {
        scriptId,
        scriptContent,
        param,
        timeoutMS,
        userId: this.getUserId,
        dataSourceId: this.getDataSourceId,
        appDataSourceId: this.getAppDataSourceId,
        areaCode: this.getAreaCode
      });

      if (context.succ) {
        return context.runKey;
      }

      this.lastError = context.message;
      this.result = null;
      this.$emit('on-error', context.message);
      throw new Error(context.message);
    },
    async kill() {
      await this.$axios.get('/manage/kill-run/' + this.runKey);
      this.runKey = '';
    },
    async run({ scriptId, scriptContent = '', param, timeoutMS = 600000 }) {
      try {
        this.setExecuting(true);
        const runKey = await this.initializeContext({ scriptId, param, timeoutMS, scriptContent });
        this.runKey = runKey;
        return new Promise((resolve, reject) => {
          const es = new EventSource('/manage/sse-run-script/' + runKey, {
            withCredentials: true
          });

          es.onerror = (e) => {
            es.close();
            this.lastError = JSON.stringify(e);
            this.result = null;
            this.$emit('on-error', this.lastError);
            console.error('脚本执行错误: ' + JSON.stringify(e));
            this.setExecuting(false);
            reject(e);
          };

          es.onmessage = (e) => {
            try {
              const message = JSON.parse(Buffer.from(e.data, 'base64').toString('utf8'));
              if (message.status === 'FINISH') {
                es.close();
                this.result = message.result;
                this.lastError = null;
                this.$emit('on-finish', message.result);
                this.setExecuting(false);
                resolve(message.result);
              } else if (message.status === 'ERROR') {
                es.close();
                this.lastError = message.message;
                this.result = null;
                this.$emit('on-error', this.lastError);
                console.error('脚本执行错误: ' + message.message);
                this.setExecuting(false);
                reject(message.message);
              } else {
                this.processMessage(message, true);
              }
            } catch (err) {
              console.error(err);
              es.close();
              this.lastError = '响应脚本消息异常: ' + err.message;
              this.result = null;
              this.$emit('on-error', this.lastError);
              this.setExecuting(false);
              reject(err);
            }
          };
        });
      } catch (err) {
        this.setExecuting(false);
        console.error(err);
        this.$message.error('执行错误: ' + err.message);
        this.executeResult = JSON.stringify(err);
        throw err;
      }
    },
    async processMessage(message, interactive) {
      const h = this.$createElement;
      const $msgbox = this.$msgbox;
      const {
        runKey, /* status, */
        event,
        eventKey,
        param
      } = message;
      const {
        args,
        // timeout,
        // timeoutOk,
        inputPattern,
        inputErrorMessage,
        title,
        content,
        options,
        defaultValue,
        // defaultValues,
        type,
        desc,
        duration,
        // closable,
        value,
        initTime
      } = param;
      console.log(message, param);
      this.$emit('callback', type, param);
      switch (event) {
        case '$igConfirm': {
          const substation = this.getAllSubstations.find(x => x.uri === param.substationUri);
          this.impedanceGraphicDialog.substationUri = param.substationUri;
          this.impedanceGraphicDialog.title = substation.name + '阻抗图';
          this.impedanceGraphicDialog.visible = true;
          this.impedanceGraphicDialog.runKey = runKey;
          this.impedanceGraphicDialog.eventKey = eventKey;
          this.impedanceGraphicDialog.confirmButtonText = param.confirmButtonText;
          this.impedanceGraphicDialog.autoConfirm = param.autoConfirm;
          if (param.autoConfirm) {
            this.impedanceGraphicDialog.timeout = param.timeout;
            if (param.timeout > 0) {
              this.impedanceGraphicDialog.interval = setInterval(() => {
                if (--this.impedanceGraphicDialog.timeout <= 0) {
                  this.confirmGraphic();
                }
              }, 1000);
            }
          }
          this.$nextTick(async () => {
            if (this.$refs.impedanceGraphic) {
              await this.$refs.impedanceGraphic.createImpedanceGraph(param.fileId);
              if (param.timeout <= 0) {
                this.confirmGraphic();
              }
            }
          });
          break;
        }
        case '$download': {
          if (!param.dropUrl) {
            const a = document.createElement('a');
            a.href = param.url;
            a.style.display = 'none';
            if (param.filename) {
              a.download = param.filename;
            }
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else {
            const { data } = await this.$axios.get(param.url, { responseType: 'blob' });
            const blob = new Blob([data]);
            await this.$axios.delete(param.dropUrl).then();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = param.filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(a.href);
            a.remove();
          }
          break;
        }
        case '$log': {
          if (Array.isArray(args)) {
            console.log('脚本日志: ', ...args);
          } else {
            console.log('脚本日志: ', args);
          }
          break;
        }
        case '$eventSource': {
          const sse = new EventSource(param.uri, {
            withCredentials: true,
            headers: this.getAxiosHeader
          }
          );
          sse.onmessage = (event) => {
            const missions = JSON.parse(event.data);
            Globals.eventBus.$emit('mqMessage', { missions });
            for (const mission of missions) {
              sse.addEventListener(mission.name, (info) => {
                Globals.eventBus.$emit('mqMessage', JSON.parse(info.data));
              });
            }
          };
          sse.addEventListener('complete', (info) => {
            sse.close();
            const infoData = JSON.parse(info.data);
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$eventSource',
              data: infoData,
              status: 'ok'
            }).then();
          });
          sse.onerror = (err) => {
            console.error(err);
            sse.close();
          };
          break;
        }
        case '$message': {
          switch (type) {
            case 'success': {
              this.$message.success(content);
              break;
            }
            case 'warning': {
              this.$message.warning(content);
              break;
            }
            case 'error': {
              this.$message.error(content);
              break;
            }
            case 'info':
            default: {
              this.$message.info(content);
              break;
            }
          }
          break;
        }
        case '$notice': {
          switch (type) {
            case 'success': {
              this.$notify.success({
                title,
                context: desc,
                duration
              });
              break;
            }
            case 'warning': {
              this.$notify.warning({
                title,
                context: desc,
                duration
              });
              break;
            }
            case 'error': {
              this.$notify.error({
                title,
                context: desc,
                duration
              });
              break;
            }
            case 'info':
            default: {
              this.$notify.info({
                title,
                context: desc,
                duration
              });
              break;
            }
          }
          break;
        }
        case '$confirm': {
          this.$confirm(content, title, {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal: false,
            closeOnPressEscape: false
          }).then(() => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$confirm',
              data: 'ok',
              status: 'ok'
            }).then();
          }).catch(() => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$confirm',
              data: 'cancel',
              status: 'cancel'
            }).then();
          });
          break;
        }
        case '$inputs': {
          this.inputsDialog.width = param.width || '600px';
          this.inputsDialog.header = param.header || [];
          this.inputsDialog.items = options;
          this.inputsDialog.title = title;
          this.inputsDialog.eventKey = eventKey;
          this.inputsDialog.runKey = runKey;
          this.inputsDialog.visible = true;
          break;
        }
        case '$inputsGroup': {
          this.inputsGroupDialog.width = param.width || '600px';
          this.inputsGroupDialog.member = param.member;
          this.inputsGroupDialog.title = title;
          this.inputsGroupDialog.eventKey = eventKey;
          this.inputsGroupDialog.runKey = runKey;
          this.inputsGroupDialog.activeName = param.activeName;
          this.inputsGroupDialog.visible = true;
          break;
        }
        case '$planGraph': {
          this.planGraphDialog.width = param.width || '800px';
          this.planGraphDialog.runKey = runKey;
          this.planGraphDialog.eventKey = eventKey;
          this.planGraphDialog.graph = Object.assign({}, this.$options.data().planGraphDialog.graph, param.graph);
          this.planGraphDialog.title = param.title;
          this.planGraphDialog.visible = true;
          this.$nextTick(async () => {
            const { allDzResult } = param.graph;
            const { allBreaker, structure, svgData } = await this.getReadyData();
            const graphData = await this.$refs.plan.generateGraphData({ allBreaker, structure, allDzResult, svgData });
            this.planGraphDialog.graphData = { allBreaker, allDzResult };
            this.$refs.plan.load({ graphData, allDzResult, allBreaker, structure, svgData });
          });
          break;
        }
        case '$checks': {
          this.checksDialog.width = param.width || '650px';
          this.checksDialog.items = options;
          this.checksDialog.title = title;
          this.checksDialog.eventKey = eventKey;
          this.checksDialog.runKey = runKey;
          this.checksDialog.visible = true;
          break;
        }
        case '$radio': {
          this.radioDialog.width = param.width || '650px';
          this.radioDialog.items = options;
          this.radioDialog.title = title;
          this.radioDialog.eventKey = eventKey;
          this.radioDialog.runKey = runKey;
          this.radioDialog.visible = true;
          break;
        }
        case '$select': {
          const optionArray = [];
          for (const option of options) {
            optionArray.push(h('el-button', {
              props: {
                type: 'primary'
              },
              on: {
                click: () => {
                  $msgbox.close();
                  this.$axios.post('/manage/response-event', {
                    runKey,
                    eventKey,
                    event: '$select',
                    data: typeof option === 'string' ? option : option.value,
                    status: 'ok'
                  }).then();
                }
              }
            }, typeof option === 'string' ? option : option.label));
          }
          $msgbox({
            title,
            message: h('span', null, optionArray),
            showCancelButton: false,
            showConfirmButton: false,
            cancelButtonText: '取消 (停止执行)',
            closeOnClickModal: false,
            closeOnPressEscape: false
          }).then(action => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$select',
              data: defaultValue,
              status: 'cancel'
            }).then();
          }).catch(() => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$select',
              data: defaultValue,
              status: 'cancel',
              stop: true
            }).then();
          });
          break;
        }
        case '$input': {
          this.$prompt(content, title, {
            confirmButtonText: '确定',
            cancelButtonText: '取消 (停止执行)',
            closeOnClickModal: false,
            closeOnPressEscape: false,
            inputPattern: new RegExp(inputPattern),
            inputErrorMessage,
            inputValue: defaultValue
          }).then(({ value }) => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$input',
              data: value,
              status: 'ok'
            }).then();
          }).catch(() => {
            this.$axios.post('/manage/response-event', {
              runKey,
              eventKey,
              event: '$input',
              data: defaultValue,
              status: 'cancel',
              stop: true
            }).then();
          });
          break;
        }
        case '$progress': {
          const _this = this;
          clearInterval(this.myTime);
          if (value) {
            this.progressDialog.percentage = 0;
            this.percentage = false;
            this.progressDialog.title = title;
            this.progressDialog.visible = value;
            this.myTime = setInterval(function () {
              myPercentage();
            }, initTime);
          } else {
            this.progressDialog.percentage = 100;
            this.percentage = true;
          }

          function myPercentage() {
            if (_this.progressDialog.percentage < 99) {
              _this.progressDialog.percentage += 1;
            }
          }

          break;
        }
        case '$commentData': {
          this.$axios.post('/manage/response-event', {
            runKey,
            eventKey,
            event: '$commentData',
            data: {
              getAllSubstations: this.getAllSubstations
            },
            status: 'ok'
          }).then();
          break;
        }
        case '$curve': {
          this.curveSimpleDialog.deviceUri = value.deviceUri;
          this.curveSimpleDialog.runKey = runKey;
          this.curveSimpleDialog.eventKey = eventKey;
          this.curveSimpleDialog.confirmButtonText = value.confirmButtonText;
          this.curveSimpleDialog.cancelButtonText = value.cancelButtonText;
          this.curveSimpleDialog.visible = true;
          this.curveSimpleDialog.title = title;
          if (this.$refs.curve) {
            this.$nextTick(async () => {
              await this.$refs.curve.getCurveData(value.deviceUri);
            });
          }
          break;
        }
        default: {
          console.warn('忽略消息类型: ' + event);
          break;
        }
      }
    },
    cancelChecks() {
      this.$axios.post('/manage/response-event', {
        runKey: this.checksDialog.runKey,
        eventKey: this.checksDialog.eventKey,
        event: '$checks',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.checksDialog.visible = false;
    },
    cancelRadio() {
      this.$axios.post('/manage/response-event', {
        runKey: this.radioDialog.runKey,
        eventKey: this.radioDialog.eventKey,
        event: '$radio',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.radioDialog.visible = false;
    },
    confirmRadio() {
      this.$axios.post('/manage/response-event', {
        runKey: this.radioDialog.runKey,
        eventKey: this.radioDialog.eventKey,
        event: '$radio',
        data: this.radioDialog.items,
        status: 'ok'
      }).then();
      this.radioDialog.visible = false;
    },
    confirmChecks() {
      this.$axios.post('/manage/response-event', {
        runKey: this.checksDialog.runKey,
        eventKey: this.checksDialog.eventKey,
        event: '$checks',
        data: this.checksDialog.items,
        status: 'ok'
      }).then();
      this.checksDialog.visible = false;
    },
    cancelInputs() {
      this.$axios.post('/manage/response-event', {
        runKey: this.inputsDialog.runKey,
        eventKey: this.inputsDialog.eventKey,
        event: '$inputs',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.inputsDialog.visible = false;
    },
    confirmInputs() {
      this.$axios.post('/manage/response-event', {
        runKey: this.inputsDialog.runKey,
        eventKey: this.inputsDialog.eventKey,
        event: '$inputs',
        data: this.inputsDialog.items,
        status: 'ok'
      }).then();
      this.inputsDialog.visible = false;
    },
    cancelInputsGroup() {
      this.$axios.post('/manage/response-event', {
        runKey: this.inputsGroupDialog.runKey,
        eventKey: this.inputsGroupDialog.eventKey,
        event: '$inputsGroup',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.inputsGroupDialog.visible = false;
    },
    confirmInputsGroup() {
      this.$axios.post('/manage/response-event', {
        runKey: this.inputsGroupDialog.runKey,
        eventKey: this.inputsGroupDialog.eventKey,
        event: '$inputsGroup',
        data: this.inputsGroupDialog.member,
        status: 'ok'
      }).then();
      this.inputsGroupDialog.visible = false;
    },
    cancelCurve() {
      this.$axios.post('/manage/response-event', {
        runKey: this.curveSimpleDialog.runKey,
        eventKey: this.curveSimpleDialog.eventKey,
        event: '$curve',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.curveSimpleDialog.visible = false;
    },
    confirmCurve(selectLineId) {
      this.$axios.post('/manage/response-event', {
        runKey: this.curveSimpleDialog.runKey,
        eventKey: this.curveSimpleDialog.eventKey,
        event: '$curve',
        data: {
          selectLineId,
          curveData: this.$refs.curve.cureData,
          images: this.$refs.curve.getImagesBase64()
        },
        status: 'ok'
      }).then();
      this.curveSimpleDialog.visible = false;
    },
    cancelPlan() {
      this.$axios.post('/manage/response-event', {
        runKey: this.planGraphDialog.runKey,
        eventKey: this.planGraphDialog.eventKey,
        event: '$planGraph',
        data: [],
        status: 'cancel',
        stop: true
      }).then();
      this.planGraphDialog.visible = false;
    },
    confirmPlan() {
      this.$refs.plan.generateJpg();
      this.$axios.post('/manage/response-event', {
        runKey: this.planGraphDialog.runKey,
        eventKey: this.planGraphDialog.eventKey,
        event: '$planGraph',
        data: [],
        status: 'ok'
      }).then();
      this.planGraphDialog.visible = false;
    },
    async getReadyData() {
      const { svg, uri } = this.planGraphDialog.graph;
      const { data: structureRes } = await this.$axios.get(`/models/xml-structure/${svg}`);
      if (!structureRes.succ || !structureRes.result) {
        this.$message.error('获取图形拓扑失败');
        return {};
      }
      const { data: breakerRes } = await this.$axios.post('/models/breaker/condition/list', { line: uri });
      if (!breakerRes.succ || !breakerRes.result) {
        this.$message.error('获取开关失败');
        return {};
      }

      const { xml: structure, svg: svgData } = structureRes.result;
      const { result: allBreaker } = breakerRes;

      return { allBreaker, structure, svgData };
    },
    onInputChange(data) {
      data.value = data.regex ? data.value.replace(new RegExp(data.regex), '') : data.value;
    },
    onchange(val) {
      console.log('*****');
      console.log(val);
    }
  }
};
</script>

<style scoped>
.description-font {
  color: grey;
  font-size: small
}

.radioBtn {
  /* 单选按钮的间距 */
  margin-left: 30px
}
</style>
