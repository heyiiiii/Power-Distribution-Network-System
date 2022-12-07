<!--meta:{"label":"计算书脚本","hidden":false,"auths":["admin","master"],"roles":"any"}-->
<template>
  <container>
    <split-left-right :height="getClientHeight - 80" sid="tscript-l-r-1" :defaultWidth="300" leftName="模板列表"
      @onLayoutChanged="resizeGrid">
      <template #left="{ height }">
        <el-card>
          <div class="title" slot="header">
            <span>模板列表</span>
            <el-button-group>
              <el-button class="inline" type="primary" @click="showTemplateUpload">上传
              </el-button>
              <el-button class="inline" type="primary" @click="exportTemplates">导出
              </el-button>
              <el-button class="inline" type="primary" @click="importTemplates">导入
              </el-button>
            </el-button-group>
          </div>
          <ag-grid-vue class="ag-theme-alpine clear-line" style="width: 100%" :modules="$agGridModules"
            @rowDoubleClicked="onEditTemplate" :style="{ height: (height - 82) + 'px' }"
            :gridOptions="jsTemplateGridOptions" :rowData="jsTemplates" />
        </el-card>
      </template>
      <div slot="right">
        <split-left-right :height="getClientHeight - 80" sid="tscript-l-r-2" :defaultWidth="300" leftName="脚本列表"
          @onLayoutChanged="onLayoutChanged">
          <template #left="{ height: childHeight }">
            <el-card>
              <div class="title" slot="header">
                <span class="inline">脚本列表</span>
                <el-button-group>
                  <el-button class="inline" type="primary" @click="createJSFile">新增
                  </el-button>
                  <el-button class="inline" type="primary" @click="exportJSFiles">导出
                  </el-button>
                  <el-button class="inline" type="primary" @click="importJSFiles">导入
                  </el-button>
                </el-button-group>
              </div>
              <ag-grid-vue class="ag-theme-alpine clear-line" style="width: 100%" :modules="$agGridModules"
                :style="{ height: (childHeight - 82) + 'px' }" :gridOptions="jsFileGridOptions"
                @rowDoubleClicked="openScript" :rowData="jsFiles" />
            </el-card>
          </template>
          <template #right="{ height }">
            <el-card :body-style="{ height: height - 50 + 'px' }">
              <div slot="header">
                <el-breadcrumb separator-class="el-icon-arrow-right">
                  <el-breadcrumb-item style="line-height: 25px">脚本编辑</el-breadcrumb-item>
                  <el-breadcrumb-item v-if="selectedScriptId">
                    <span>{{ currentScriptName }}</span>
                    <strong class="text-danger" v-show="dirty">*</strong>
                    <el-button-group style="margin-left: 20px">
                      <el-button type="primary" class="inline" :loading="scriptRunning" @click="runScript">运行
                      </el-button>
                      <el-button type="success" class="inline" @click="saveScript">保存</el-button>
                      <el-button type="warning" class="inline" v-if="scriptRunning" @click="killScript">强制结束</el-button>
                    </el-button-group>
                  </el-breadcrumb-item>
                </el-breadcrumb>
              </div>
              <div ref="sEditor" class="border-dark" :style="{ height: height - 90 + 'px' }" />
            </el-card>
          </template>
        </split-left-right>
      </div>
    </split-left-right>
    <el-dialog title="查看模板" :visible.sync="templateEditDialog.visible" width="80%" top="0" :close-on-click-modal="false"
      @close="closeTemplateEditDialog">
      <div id="office-editor" style="height: 85vh; width: 100%"></div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeTemplateEditDialog">关 闭</el-button>
      </span>
    </el-dialog>
    <el-dialog title="上传模板文件" :visible.sync="jsTemplateDialog.visible" width="400px">
      <el-upload drag class="upload-demo" action="/" :limit="1" :auto-upload="false" ref="templateUploader"
        :file-list="jsTemplateDialog.fileList" :on-change="jsTemplateFileChange" :multiple="false">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
      </el-upload>
      <el-input v-model.trim="jsTemplateDialog.identifier" placeholder="输入文件ID">
        <template slot="prepend">
          文件ID
        </template>
      </el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsTemplateDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="jsTemplateDialog.uploading" @click="onTemplateUpload">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="导入计算模板包" :close-on-click-modal="false" :visible.sync="jsTemplateImportDialog.visible"
      width="400px">
      <el-upload drag class="upload-demo" :on-success="onJSTemplatePacketImported" :data="{ areaCode: getAreaCode }"
        action="/manage/import-js-templates" :limit="1" auto-upload :multiple="false">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          <p>
            将文件拖到此处，或<em>点击选择</em>
          </p>
          <p>
            选择文件后将自动开始导入
          </p>
        </div>
      </el-upload>
    </el-dialog>
    <el-dialog title="导入计算脚本包" :close-on-click-modal="false" :visible.sync="jsFileImportDialog.visible" width="400px">
      <el-upload drag class="upload-demo" :on-success="onJSFilePacketImported" :data="{ areaCode: getAreaCode }"
        action="/manage/import-js-files" :limit="1" auto-upload :multiple="false">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          <p>
            将文件拖到此处，或<em>点击选择</em>
          </p>
          <p>
            选择文件后将自动开始导入
          </p>
        </div>
      </el-upload>
    </el-dialog>
    <XScript ref="xscript" />
    <el-dialog title="脚本执行结果" :visible.sync="scriptResultDialog.visible" width="800px">
      <json-viewer :value="jsonParse(scriptResultDialog.result)" copyable />
    </el-dialog>
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import Vue from 'vue';
import JsonViewer from 'vue-json-viewer/ssr';
import Globals from '@/assets/js/globals';
import Container from '~/components/container';
import SplitLeftRight from '@/components/splite/leftRight';
import SplitTopBottom from '@/components/splite/topBottom';
import XScript from '@/components/tscript';
import 'vue-json-viewer/style.css';

let monaco = null;
if (process.client) {
  monaco = require('monaco-editor');
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(model, position, context, token) {
      return {
        suggestions: [
          {
            label: '$axios',
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: '$axios',
            detail: 'http接口调用'
          },
          {
            label: '$log',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: '$log();',
            detail: '日志'
          },
          {
            label: '$input',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$input({
  title: '',// 标题
  content: '',// 内容
  defaultValue: ''// 默认值
});`,
            detail: '触发用户输入文本'
          },
          {
            label: '$select',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$select({
  title: '',// 标题
  content: '',// 内容
  options: [],// 可选项
  defaultValue: ''// 默认值
});`,
            detail: '触发用户选择'
          },
          {
            label: '$inputs',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$inputs({
  title: '',// 标题
  header: [], // 列标题
  options: [// 输入项
    {
      key: '',
      name: '',
      html: '',
      placeholder: '',
      needInput: true, //  激活输入框 默认值为true
      value: '',       //  输入框的值
      description: '',
      needRadio: false, //  激活单选 默认为false
      radioLabels:[''.true], //  单选框值
    }]
});`,
            detail: '触发用户输入多项文本'
          },
          {
            label: '$inputsGroup',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$inputsGroup({
  width: '', // 长度
  title: '',// 标题
  activeName: [],
  member: [
    {
      title: '单输入框',
      header: '',
      options: [
        {
          html: '',
          label: '',
          value: '',
          placeholder: '',
          disabled: false,
          description: ''
        }
      ]
    },
    {
      title: '多输入框',
      header: '',
      options: [
        {
          html: '',
          label: '',
          value: [
            {
              value: '',
              placeholder: '',
              disabled: false,
              description: ''
            }
          ]
        }
      ]
    }
  ]
});`,
            detail: '触发用户输入多项文本(折叠面板)'
          },
          {
            label: '$checks',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$checks({
  title: '',// 标题
  options: [// 勾选项
    {
      label: '',
      checked: true,
      description: '',
      width: '' // 长度 560px即换行
      divider: false // 底部横线
    }
  ]
});`,
            detail: '触发用户勾选'
          },
          {
            label: '$radio',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$radio({
  title: '',// 标题
  options: [
    {
      label: '',// 单选项
      width: '' ,// 长度 560px即换行
      divider: false // 底部横线
    }
  ]
});`,
            detail: '触发用户单选'
          },
          {
            label: '$call',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$call({
  param: {},// 参数
  script: ''. // 子脚本id
  scriptIdentifier: ''// 子脚本标识
});`,
            detail: '调用子脚本'
          },
          {
            label: '$triggerDownload',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$triggerDownload({
  url: '',// 文件下载链接
  filename: '',// 文件名
  dropUrl: ''// 删除url
});`,
            detail: '触发浏览器下载'
          },
          {
            label: '$igConfirm',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$igConfirm({
  substationUri: '',// 厂站uri
  confirmButtonText: '保存阻抗图',// 确认按钮文字
  autoConfirm: true,// 是否自动确认
  timeout: 5// 自动确认超时秒数
});`,
            detail: '触发用户确认厂站阻抗图'
          },
          {
            label: '$confirm',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$confirm({
  title: '',// 标题
  content: ''// 内容
});`,
            detail: '触发浏览器确认框'
          },
          {
            label: '$message',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$message({
  type: '',// 类型：success warning error info
  content: ''// 内容
});`,
            detail: '触发浏览器上方消息条'
          },
          {
            label: '$notice',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$notice({
  title: '',// 标题
  desc: '',// 内容
  type: '',// 类型：success warning error info
  duration: 5// 持续秒数
});`,
            detail: '触发浏览器右上角通知框'
          },
          {
            label: '$progress',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$progress({
  value: '',// 是否开启
  title: '',// 标题
  initTime: '',// 进度条速度
});`,
            detail: '进度条'
          },
          {
            label: '$planGraph',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: `$planGraph({
  title: '',// 标题
  width: '',// 宽度
  graph: {
    uri: '', // 线路id
    svg: '', // 线路svg
    panelHeight: 600 // 图高度
  }
});`,
            detail: '方案图'
          }
        ]
      };
    },
    triggerCharacters: ['$']
  });
}

export default {
  name: 't-script',
  layout: 'default',
  data() {
    return {
      dirty: false,
      templateEditDialog: {
        visible: false,
        templateId: ''
      },
      scriptResultDialog: {
        visible: false,
        result: ''
      },
      jsTemplateDialog: {
        id: '',
        visible: false,
        file: null,
        identifier: '',
        uploading: false,
        fileList: []
      },
      jsTemplateImportDialog: {
        visible: false
      },
      jsFileImportDialog: {
        visible: false
      },
      editing: true,
      scriptRunning: false,
      selectedScriptId: '',
      script: '',
      editor: null,
      editorSession: null,
      Range: null,
      editorOptions: {
        fontSize: '12pt',
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
      },
      jsTemplates: [],
      jsTemplateGridOptions: {
        defaultColDef: {
          resizable: true
        },
        animateRows: true,
        rowSelection: 'single',
        enableSorting: true,
        enableColResize: true,
        getRowNodeId(item) {
          return item._id;
        },
        localeText: Globals.agGridLocaleText,
        toolPanelSuppressSideButtons: true,
        enableFilter: true,
        overlayLoadingTemplate: `<div class="el-loading-spinner">
                                    <svg viewBox="25 25 50 50" class="circular">
                                        <circle cx="50" cy="50" r="20" fill="none" class="path"></circle>
                                    </svg>
                                    <p class="el-loading-text"><strong>正在加载数据...</strong></p>
                                </div>`,
        context: {
          componentParent: this
        },
        columnDefs: [
          {
            headerName: '文件名',
            field: 'filename',
            flex: 1
          },
          {
            headerName: '标识',
            field: 'metadata.identifier',
            width: 140
          },
          {
            headerName: '文件大小',
            field: 'length',
            width: 140
          },
          {
            headerName: '操作',
            width: 140,
            field: '_id',
            cellRendererFramework: Vue.extend({
              template: `<span>
                <a title="下载" @click="onDownload" class="text-primary">下载</a>
                <a title="替换" @click="onReplace" class="text-success m-l-5">替换</a>
                <a title="删除" @click="onDelete" class="text-danger m-l-5">删除</a>
                </span>`,
              methods: {
                onDownload() {
                  this.params.context.componentParent.downloadJSTemplate(this.params.value);
                },
                onDelete() {
                  this.params.context.componentParent.deleteJSTemplate(this.params.value);
                },
                onReplace() {
                  this.params.context.componentParent.replaceJSTemplate(this.params.value);
                }
              }
            })
          }
        ]
      },
      jsFiles: [],
      jsFileGridOptions: {
        defaultColDef: {
          resizable: true
        },
        animateRows: true,
        rowSelection: 'single',
        enableSorting: true,
        enableColResize: true,
        getRowNodeId(item) {
          return item._id;
        },
        getContextMenuItems(params) {
          if (!params.node) {
            return [];
          }

          params.node.setSelected(true);
          return [
            {
              name: '运行...',
              action() {
                params.context.componentParent.runExplicitScript(params.node.data);
              }
            }
          ];
        },
        localeText: Globals.agGridLocaleText,
        toolPanelSuppressSideButtons: true,
        enableFilter: true,
        overlayLoadingTemplate: `<div class="el-loading-spinner">
                                    <svg viewBox="25 25 50 50" class="circular">
                                        <circle cx="50" cy="50" r="20" fill="none" class="path"></circle>
                                    </svg>
                                    <p class="el-loading-text"><strong>正在加载数据...</strong></p>
                                </div>`,
        context: {
          componentParent: this
        },
        columnDefs: [
          {
            headerName: '标识',
            field: 'metadata.identifier',
            flex: 1
          },
          {
            headerName: '文件大小',
            field: 'length',
            width: 100
          },
          {
            headerName: '操作',
            width: 140,
            field: '_id',
            cellRendererFramework: Vue.extend({
              template: `<span>
                <a title="修改标识"
                   @click="onModifyIdentifier"
                   class="text-primary">修改标识</a>
                <a title="删除"
                   @click="onDelete"
                   class="text-danger m-l-5">删除</a>
                   </span>`,
              methods: {
                onDelete() {
                  this.params.context.componentParent.deleteJSFile(this.params.value);
                },
                onModifyIdentifier() {
                  this.params.context.componentParent.modifyJSFileIdentifier(this.params.value);
                }
              }
            })
          }
        ]
      }
    };
  },
  head() {
    return {
      title: this.currentRouteText,
      script: [
        { src: `http://${this.getConfigs.onlyoffice.host}:${this.getConfigs.onlyoffice.port}/web-apps/apps/api/documents/api.js` }
      ]
    };
  },
  components: {
    Container,
    SplitLeftRight,
    SplitTopBottom,
    XScript,
    JsonViewer
  },
  computed: {
    ...mapGetters([
      'getUserId',
      'getClientHeight',
      'getConfigs',
      'getUserRoutes'
    ]),
    getAreaCode() {
      return '0';
    },
    currentScriptName() {
      if (this.selectedScriptId) {
        const found = this.jsFiles.find(x => x._id === this.selectedScriptId);
        return found ? found.filename : '';
      }

      return '';
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
      return route ? route.label : '计算书脚本';
    }
  },
  async mounted() {
    const { data: jsTemplates } = await this.$axios.get('/manage/js-templates');
    this.jsTemplates = jsTemplates;
    const { data: jsFiles } = await this.$axios.get('/manage/js-files');
    this.jsFiles = jsFiles;
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  },
  methods: {
    onEditTemplate(param) {
      function isDocx(filename) {
        return !!filename.toLowerCase().trim().match(/\.docx?$/);
      }

      this.templateEditDialog.templateId = param.data._id;
      this.templateEditDialog.visible = true;
      let baseURL = '';
      if (!location || !location.origin) {
        baseURL = location.protocol + '//' + location.host;
      } else {
        baseURL = window.location.origin;
      }
      this.$nextTick(() => {
        window.docEditor2 = new DocsAPI.DocEditor('office-editor', {
          document: {
            fileType: isDocx(param.data.filename) ? 'docx' : 'xlsx',
            key: String(new Date().getTime()),
            title: param.data.filename,
            url: baseURL + '/manage/js-template/' + this.templateEditDialog.templateId
          },
          editorConfig: {
            lang: 'zh-CN',
            mode: 'view',
            // callbackUrl: this.getConfigs.axios.baseURL + '/manage/on-js-template-save',
            customization: {
              autosave: true,
              forcesave: true,
              zoom: 100
            }
          },
          documentType: isDocx(param.data.filename) ? 'text' : 'spreadsheet',
          height: (this.getClientHeight - 200) + 'px',
          width: '100%'
        });
      });
    },
    closeTemplateEditDialog() {
      this.templateEditDialog.visible = false;
      if (window.docEditor2) {
        window.docEditor2.destroyEditor();
        window.docEditor2 = null;
      }
    },
    downloadJSTemplate(id) {
      const a = document.createElement('a');
      a.href = '/manage/js-template/' + id;
      a.download = '123';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    deleteJSTemplate(id) {
      const file = this.jsTemplates.find(x => x._id === id);
      this.$confirm('请确认是否删除模板: ' + file.filename + '？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await this.$axios.delete('/manage/js-template/' + id);
        const index = this.jsTemplates.findIndex(x => x._id === id);
        this.jsTemplates.splice(index, 1);
      });
    },
    replaceJSTemplate(id) {
      const file = this.jsTemplates.find(x => x._id === id);
      this.jsTemplateDialog.file = null;
      this.jsTemplateDialog.identifier = file.metadata.identifier;
      this.jsTemplateDialog.id = id;
      if (this.$refs.templateUploader) {
        this.$refs.templateUploader.clearFiles();
      }
      this.jsTemplateDialog.visible = true;
    },
    resizeGrid() {
      this.jsFileGridOptions.api.sizeColumnsToFit();
      this.jsTemplateGridOptions.api.sizeColumnsToFit();
    },
    jsTemplateFileChange(file) {
      this.jsTemplateDialog.file = file;
    },
    exportTemplates() {
      const a = document.createElement('a');
      a.href = '/manage/export-js-templates';
      a.download = '123';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    importTemplates() {
      this.jsTemplateImportDialog.visible = true;
    },
    exportJSFiles() {
      const a = document.createElement('a');
      a.href = '/manage/export-js-files';
      a.download = '123';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    async onJSTemplatePacketImported(response) {
      if (response.succ) {
        this.$message.success({
          message: '已导入' + response.count + '个文件',
          showClose: true
        });
        const { data: jsTemplates } = await this.$axios.get('/manage/js-templates');
        this.jsTemplates = jsTemplates;
        this.jsTemplateImportDialog.visible = false;
      } else {
        this.$message.error('导入失败: ' + response.message);
      }
    },
    importJSFiles() {
      this.jsFileImportDialog.visible = true;
    },
    async onJSFilePacketImported(response) {
      if (response.succ) {
        this.$message.success({
          message: '已导入' + response.count + '个文件',
          showClose: true
        });
        const { data: jsFiles } = await this.$axios.get('/manage/js-files');
        this.jsFiles = jsFiles;
        this.jsFileImportDialog.visible = false;
      } else {
        this.$message.error('导入失败: ' + response.message);
      }
    },
    showTemplateUpload() {
      this.jsTemplateDialog.file = null;
      this.jsTemplateDialog.identifier = '';
      this.jsTemplateDialog.id = '';
      if (this.$refs.templateUploader) {
        this.$refs.templateUploader.clearFiles();
      }
      this.jsTemplateDialog.visible = true;
    },
    onLayoutChanged(gridWidth, scriptWidth) {

    },
    async onTemplateUpload() {
      try {
        this.jsTemplateDialog.uploading = true;
        if (!this.jsTemplateDialog.identifier) {
          this.$message.error('必须输入文件ID');
          return;
        }

        if (!this.jsTemplateDialog.file) {
          this.$message.error('必须选择一个文件');
          return;
        }

        const { data } = await this.$axios.post('/manage/test-js-template-identifier', {
          identifier: this.jsTemplateDialog.identifier,
          id: this.jsTemplateDialog.id
        });
        if (data.exists) {
          this.$message.error('输入的文件ID已经存在');
          return;
        }

        const formData = new FormData();
        if (this.jsTemplateDialog.id) {
          formData.append('id', this.jsTemplateDialog.id);
        }
        formData.append('file', this.jsTemplateDialog.file.raw, this.jsTemplateDialog.file.name);
        formData.append('identifier', this.jsTemplateDialog.identifier);
        formData.append('areaCode', this.getAreaCode);
        const { data: fileId } = await this.$axios.post('/manage/upload-js-template', formData);

        if (this.jsTemplateDialog.id) {
          const found = this.jsTemplates.find(x => x._id === this.jsTemplateDialog.id);
          found.filename = this.jsTemplateDialog.file.name;
          found.length = Globals.getFriendlyLength(this.jsTemplateDialog.file.size);
          found.metadata.identifier = this.jsTemplateDialog.identifier;
          const node = this.jsTemplateGridOptions.api.getRowNode(this.jsTemplateDialog.id);
          this.jsTemplateGridOptions.api.redrawRows({ rowNodes: [node] });
        } else {
          this.jsTemplates.push({
            _id: fileId,
            filename: this.jsTemplateDialog.file.name,
            length: Globals.getFriendlyLength(this.jsTemplateDialog.file.size),
            metadata: {
              identifier: this.jsTemplateDialog.identifier,
              areaCode: this.getAreaCode
            }
          });
        }
        this.jsTemplateDialog.visible = false;
      } catch (err) {
        console.error(err);
        this.$message.error(err.message);
      } finally {
        this.jsTemplateDialog.uploading = false;
      }
    },
    async doOpenScript(id) {
      this.selectedScriptId = '';
      this.editing = false;
      const { data } = await this.$axios.get('/manage/js-file/' + id, {
        responseType: 'text'
      });
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
      this.dirty = false;
      this.selectedScriptId = id;
    },
    openScript(param) {
      if (this.dirty && this.selectedScriptId) {
        const found = this.jsFiles.find(x => x._id === this.selectedScriptId);
        this.$confirm('请确认是否保存已修改的脚本: ' + found.metadata.identifier + '？', '提示', {
          confirmButtonText: '保存',
          cancelButtonText: '不保存',
          type: 'warning'
        }).then(async () => {
          await this.saveScript();
          await this.doOpenScript(param.data._id);
        }).catch(() => {
          this.doOpenScript(param.data._id).then();
        });
      } else {
        this.doOpenScript(param.data._id).then();
      }
    },
    deleteJSFile(id) {
      const index = this.jsFiles.findIndex(x => x._id === id);
      const found = this.jsFiles[index];
      this.$confirm('请确认是否删除脚本: ' + found.metadata.identifier + '？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await this.$axios.delete('/manage/js-file/' + id);
        this.jsFiles.splice(index, 1);
        if (this.selectedScriptId === id) {
          this.selectedScriptId = '';
        }
      });
    },
    modifyJSFileIdentifier(id) {
      this.$prompt('输入脚本唯一标识', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        inputValidator: async (value) => {
          const { data } = await this.$axios.post('/manage/test-js-file-identifier', {
            _id: id,
            identifier: value.trim()
          });
          if (data.exists) {
            return '输入的标识符已存在';
          } else {
            return true;
          }
        }
      }).then(async ({ value }) => {
        const { data } = await this.$axios.put('/manage/js-file/' + id, {
          identifier: value.trim(),
          areaCode: this.getAreaCode
        });
        if (data.modifiedCount === 1) {
          const found = this.jsFiles.find(x => x._id === id);
          found.filename = value.trim() + '.js';
          found.metadata.identifier = value.trim();
          const node = this.jsFileGridOptions.api.getRowNode(id);
          this.jsFileGridOptions.api.redrawRows({ rowNodes: [node] });
        }
      });
    },
    async onScriptLockChanged(editing) {
      if (!editing && this.selectedScriptId) {
        await this.saveScript();
      }
    },
    async saveScript() {
      const found = this.jsFiles.find(x => x._id === this.selectedScriptId);
      if (found) {
        const formData = new FormData();
        formData.append('file', new Blob([this.editor.getValue()]));
        const { data } = await this.$axios.post('/manage/js-file/' + this.selectedScriptId, formData);
        if (data.succ) {
          this.$notify.success({
            title: '保存成功',
            message: '脚本' + found.metadata.identifier + '已保存'
          });
          this.dirty = false;
        }
      }
    },
    createJSFile() {
      this.$prompt('输入脚本唯一标识', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false
      }).then(async ({ value }) => {
        const { data } = await this.$axios.post('/manage/test-js-file-identifier', {
          identifier: value.trim()
        });
        if (data.exists) {
          this.$alert('标识已存在!', '错误', {
            type: 'error',
            confirmButtonText: '确定',
            closeOnClickModal: true,
            closeOnPressEscape: true
          });
          return;
        }

        const script = `// 接口: $$timeout,$$timeoutOk,$axios,initMongodb(),$log,$input,$select,$checks,$radio,$inputs,$confirm,$notice,$message,$progress,$planGraph
// 参数: param,session:{dataSourceId,appDataSourceId,areaCode,userId}
`;
        const { data: _id } = await this.$axios.post('/manage/create-js-file', {
          identifier: value.trim(),
          areaCode: this.getAreaCode,
          script
        });
        this.jsFiles.push({
          _id,
          length: Globals.getFriendlyLength(script.length),
          metadata: {
            identifier: value.trim()
          }
        });
      });
    },
    killScript() {
      this.$refs.xscript.kill();
      this.scriptRunning = false;
    },
    async runScript() {
      try {
        await this.saveScript();
        this.scriptRunning = true;
        const result = await this.$refs.xscript.run({
          scriptId: this.selectedScriptId
        });
        console.log('脚本执行完毕', result);
        this.scriptResultDialog.result = JSON.stringify(result);
        this.scriptResultDialog.visible = true;
      } catch (err) {
        console.error(err);
        this.$message.error('执行脚本错误: ' + err.message);
      } finally {
        this.scriptRunning = false;
      }
    },
    runExplicitScript(data) {
      if (this.scriptRunning) {
        this.$message.error('当前正在执行脚本');
        return;
      }
      this.$confirm(`是否执行脚本：${data.metadata.identifier}?`, '请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          this.scriptRunning = true;
          const result = await this.$refs.xscript.run({
            scriptId: data._id
          });
          console.log('脚本执行完毕', result);
          this.scriptResultDialog.result = JSON.stringify(result);
          this.scriptResultDialog.visible = true;
        } catch (err) {
          console.error(err);
          this.$message.error('执行脚本错误: ' + err.message);
        } finally {
          this.scriptRunning = false;
        }
      });
    },
    jsonParse(val) {
      return val ? JSON.parse(val) : {};
    }
  }
};
</script>

<style scoped>
.title {
  display: flex;
  justify-content: space-between;
  padding: 4px 5px;
}

.js-title {
  padding: 4px 5px;
}
</style>
