import {ObjectId} from 'mongodb';

const taskGridColumns = [
  {
    colId: 'index',
    headerName: '序号',
    width: 70,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    colId: 'repealViewed',
    headerName: '接收状态',
    width: 80,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '定值单号',
    colId: 'dzKey',
    width: 150,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '保护类型',
    colId: 'protectType',
    width: 150,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '供电公司 / 电厂',
    colId: 'department',
    width: 140,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '厂站',
    colId: 'substationName',
    width: 120,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '元件',
    colId: 'deviceName',
    width: 120,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '装置型号',
    colId: 'protectModelNumber',
    width: 150,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '电压(kV)',
    colId: 'voltageLevel',
    width: 140,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '检修票编号',
    colId: 'serviceNumber',
    width: 120,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '计划日期',
    colId: 'planExecuteTime',
    width: 120,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '创建人',
    colId: 'creator',
    width: 100,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '创建日期',
    colId: 'createTime',
    width: 180,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '签发人',
    colId: 'sender',
    width: 100,
    suppressMenu: true,
    hide: true,
    index: 0,
    drop: false
  },
  {
    headerName: '签发日期',
    colId: 'sendTime',
    width: 180,
    suppressMenu: true,
    hide: true,
    index: 0,
    drop: false
  },
  {
    headerName: '申请人',
    colId: 'applier',
    width: 100,
    suppressMenu: true,
    hide: true,
    index: 0,
    drop: false
  },
  {
    headerName: '申请日期',
    colId: 'applyTime',
    width: 120,
    suppressMenu: true,
    hide: true,
    index: 0,
    drop: false
  },
  {
    headerName: '定值修改方式',
    colId: 'modifyNumMode',
    width: 130,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '现场回执',
    colId: 'hasLocaleFeedback',
    width: 100,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  },
  {
    headerName: '调度回执',
    colId: 'hasAuditorFeedback',
    width: 100,
    suppressMenu: true,
    hide: true,
    index: 0,
    drop: false
  },
  {
    headerName: '调度核对人',
    colId: 'dispatcher',
    hide: true,
    width: 100,
    suppressMenu: true,
    index: 0,
    drop: false
  },
  {
    headerName: '执行日期',
    colId: 'checkTime',
    hide: true,
    width: 120,
    suppressMenu: true,
    index: 0,
    drop: false
  },
  {
    headerName: '回执人',
    colId: 'feedbackName',
    hide: true,
    width: 100,
    suppressMenu: true,
    index: 0,
    drop: false
  },
  {
    headerName: '回执日期',
    colId: 'receiptTime',
    hide: true,
    width: 120,
    suppressMenu: true,
    index: 0,
    drop: false
  },
  {
    headerName: '备注',
    colId: 'remark',
    width: 240,
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false
  }
];

const queryGridColumns = [
  {
    headerName: '名称(编码)',
    colId: 'dzPrefix',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 155
  },
  {
    headerName: '装置型号',
    colId: 'protectModelNumber',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 140
  },
  {
    headerName: '厂站',
    colId: 'substationName',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 140
  },
  {
    headerName: '设备',
    colId: 'deviceName',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 150
  },
  {
    headerName: '保护类型',
    colId: 'protectType',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '供电公司/电厂',
    colId: 'departmentName',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 160
  },
  {
    headerName: '电压(kV)',
    colId: 'voltageLevel',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '创建时间',
    colId: 'createTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 160
  },
  {
    headerName: '检修票编号',
    colId: 'serviceNumber',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 140
  },
  {
    headerName: '计划日期',
    colId: 'planExecuteTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '签发人',
    colId: 'sender',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 100
  },
  {
    headerName: '签发日期',
    colId: 'sendTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '申请人',
    colId: 'applier',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 100
  },
  {
    headerName: '申请日期',
    colId: 'applyTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '调度核对人',
    colId: 'dispatcher',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 100
  },
  {
    headerName: '执行日期',
    colId: 'checkTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '回执人',
    colId: 'feedbackName',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 100
  },
  {
    headerName: '回执日期',
    colId: 'receiptTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '归档日期',
    colId: 'endTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 120
  },
  {
    headerName: '备注',
    colId: 'remark',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 180
  },
  {
    headerName: '作废说明',
    colId: 'disableRemark',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 140
  },
  {
    headerName: '作废人',
    colId: 'disabler',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 90
  },
  {
    headerName: '作废时间',
    colId: 'disableTime',
    suppressMenu: true,
    hide: false,
    index: 0,
    drop: false,
    width: 100
  }
];

const defaultVoltages = [
  {
    areaCode: 0,
    name: '1000kV',
    uvalueBase: 1050,
    uvalueBaseMax: 1100,
    uvalueBaseMin: 900,
    ivalueBase: 0.549857,
    zvalueBase: 1102.5,
    color: '#0000FF'
  },
  {
    areaCode: 0,
    name: '750kV',
    uvalueBase: 765,
    uvalueBaseMax: 825,
    uvalueBaseMin: 675,
    ivalueBase: 0.754706,
    zvalueBase: 585.225,
    color: '#FA800A'
  },
  {
    areaCode: 0,
    name: '500kV',
    uvalueBase: 525,
    uvalueBaseMax: 550,
    uvalueBaseMin: 500,
    ivalueBase: 1.099715,
    zvalueBase: 275.625,
    color: '#FA0000'
  },
  {
    areaCode: 0,
    name: '330kV',
    uvalueBase: 345,
    uvalueBaseMax: 350,
    uvalueBaseMin: 300,
    ivalueBase: 1.673479,
    zvalueBase: 119.025,
    color: '#1E90FF'
  },
  {
    areaCode: 0,
    name: '220kV',
    uvalueBase: 230,
    uvalueBaseMax: 250,
    uvalueBaseMin: 200,
    ivalueBase: 2.510219,
    zvalueBase: 52.9,
    color: '#800080'
  },
  {
    areaCode: 0,
    name: '110kV',
    uvalueBase: 115,
    uvalueBaseMax: 125,
    uvalueBaseMin: 100,
    ivalueBase: 5.020437,
    zvalueBase: 13.225,
    color: '#F04155'
  },
  {
    areaCode: 0,
    name: '66kV',
    uvalueBase: 66,
    uvalueBaseMax: 69,
    uvalueBaseMin: 63,
    ivalueBase: 8.747731,
    zvalueBase: 4.356,
    color: '#FFCC00'
  },
  {
    areaCode: 0,
    name: '35kV',
    uvalueBase: 37,
    uvalueBaseMax: 39,
    uvalueBaseMin: 32,
    ivalueBase: 15.604061,
    zvalueBase: 1.369,
    color: '#FFFF00'
  },
  {
    areaCode: 0,
    name: '27kV',
    uvalueBase: 27,
    uvalueBaseMax: 28,
    uvalueBaseMin: 26,
    ivalueBase: 21.383343,
    zvalueBase: 0.729,
    color: '#F6CC46'
  },
  {
    areaCode: 0,
    name: '20kV',
    uvalueBase: 20,
    uvalueBaseMax: 25,
    uvalueBaseMin: 19.5,
    ivalueBase: 28.867513,
    zvalueBase: 0.4,
    color: '#E2AC06'
  },
  {
    areaCode: 0,
    name: '18kV',
    uvalueBase: 18,
    uvalueBaseMax: 18.5,
    uvalueBaseMin: 17.5,
    ivalueBase: 32.075015,
    zvalueBase: 0.324,
    color: '#DC8545'
  },
  {
    areaCode: 0,
    name: '15kV',
    uvalueBase: 15,
    uvalueBaseMax: 16,
    uvalueBaseMin: 15,
    ivalueBase: 38.490018,
    zvalueBase: 0.225,
    color: '#CA3FF8'
  },
  {
    areaCode: 0,
    name: '13kV',
    uvalueBase: 13,
    uvalueBaseMax: 14,
    uvalueBaseMin: 13,
    ivalueBase: 44.411559,
    zvalueBase: 0.169,
    color: '#5274EB'
  },
  {
    areaCode: 0,
    name: '10kV',
    uvalueBase: 10.5,
    uvalueBaseMax: 11,
    uvalueBaseMin: 10,
    ivalueBase: 54.98574,
    zvalueBase: 0.11025,
    color: '#00D200'
  },
  {
    areaCode: 0,
    name: '6kV',
    uvalueBase: 6.3,
    uvalueBaseMax: 7,
    uvalueBaseMin: 6,
    ivalueBase: 91.6429,
    zvalueBase: 0.03969,
    color: '#00008B'
  },
  {
    areaCode: 0,
    name: '3.6kV',
    uvalueBase: 3.6,
    uvalueBaseMax: 4,
    uvalueBaseMin: 3,
    ivalueBase: 160.375075,
    zvalueBase: 0.01296,
    color: '#1AEAFB'
  },
  {
    areaCode: 0,
    name: '0.4kV',
    uvalueBase: 0.38,
    uvalueBaseMax: 0.4,
    uvalueBaseMin: 0.3,
    ivalueBase: 1519.342814,
    zvalueBase: 0.000144,
    color: '#D2B48C'
  }
];

const defaultSystemConfigs = [{
  serviceId: '',
  value: 'gbk',
  description: '',
  key: 'sftp-file-encoding',
  name: 'sftp-file-encoding',
  backendOnly: false
}, {
  serviceId: '',
  value: '',
  description: '',
  key: 'sftp-dir',
  name: 'sftp-dir',
  backendOnly: false
}, {
  serviceId: '',
  value: '人名1:true;人名2:true;',
  description: '',
  key: 'advanceQuery',
  name: '高级查询',
  backendOnly: false
}, {
  key: 'officeZoom',
  serviceId: '',
  description: '',
  name: 'onlyoffice默认缩放',
  backendOnly: false,
  value: '100'
}, {
  key: 'LogLimitIgnoreResultUrls',
  serviceId: '',
  description: '',
  name: '日志忽略接口返回值',
  backendOnly: false,
  value: '/route-metas;/substation;/protecttype;/sys/department-tree;/sys/departments;/voltage/query;/dzd/metadata-group;/preview'
}, {
  key: 'LogLimitCalcResultSizeUrls',
  serviceId: '',
  __v: 0,
  description: '',
  name: '日志忽略接口只记录返回值大小',
  backendOnly: false,
  value: '/department/;department-id-map;/dzd/query-old-dzd;/user/list-users;/user/get-user-id-map;/flow/getFlow;/task/getTaskByType;/user/user-id-map;/flow/getAllFlow;/dzd/getFileCount;/task/getTaskByUserId;/dzd-task/list;/task/getOwnTaskByType'
}, {
  key: 'dzdDrop',
  serviceId: '',
  description: '',
  name: '定值单作废',
  backendOnly: false,
  value: '人名1:true;人名2:true;'
}, {
  key: 'addressModify',
  serviceId: '',
  description: '',
  name: '编辑通讯录',
  backendOnly: false,
  value: '人名1:true;人名2:true;'
}, {
  serviceId: '',
  value: '13',
  description: '数据库结构版本标识，勿删',
  key: 'data-version',
  name: '数据版本',
  backendOnly: false
}, {
  serviceId: '',
  value: '60',
  description: '登录界面背景图压缩jpeg清晰度',
  key: 'login-bg-quality',
  name: '登录背景清晰度',
  backendOnly: false
}, {
  serviceId: '',
  value: '\n{\n  "text": "辽宁电力调度控制中心",\n  "fontSize": "22px",\n  "letterSpacing": "3px",\n  "color": "#006569"\n}',
  description: '配置登录框主标题文字、大小、间距、颜色',
  key: 'login-title1',
  name: '登录框主标题',
  backendOnly: false
}, {
  serviceId: '',
  value: '\n{\n  "text": "继电保护定值单网络管理系统",\n  "fontSize": "15px",\n  "letterSpacing": "4px",\n  "color": "#006569"\n}',
  description: '配置登录框副标题文字、大小、间距、颜色',
  key: 'login-title2',
  name: '登录框副标题',
  backendOnly: false
}, {
  serviceId: '',
  value: '30',
  description: '登录界面背景图轮播间隔，以秒为单位',
  key: 'login-bg-interval',
  name: '登录背景切换时间',
  backendOnly: false
}, {
  serviceId: '',
  value: 'true',
  description: '登录界面背景图轮播是否随机',
  key: 'login-bg-random',
  name: '登录背景切换随机',
  backendOnly: false
}, {
  serviceId: '',
  value: 'true',
  description: '当某个任务被办理或驳回或撤回后，相关人员的待办任务页面会自动刷新',
  backendOnly: false,
  key: 'task-auto-refresh',
  name: '办理任务后自动刷新相关人员的任务列表',
  createdAt: '2021-03-02T10:09:25.608Z'
}, {
  serviceId: '',
  value: 'true',
  description: '当某个任务被办理或驳回或撤回后，相关人员将收到一条通知消息',
  backendOnly: false,
  key: 'task-auto-notify',
  name: '办理任务后自动通知相关人员',
  createdAt: '2021-03-02T10:09:25.629Z'
}, {
  serviceId: '',
  value: 'true',
  description: '指定浏览定值单文件时在页面内弹出浏览对话框还是弹出一个新窗口',
  backendOnly: false,
  key: 'preview-in-new-window',
  name: '查看定值单时弹出新窗口',
  createdAt: '2021-03-02T10:09:25.635Z'
}, {
  serviceId: '',
  value: 'true',
  description: '办理带表单的任务节点时点击提交下一步同时自动将表单滚动到视图内',
  backendOnly: false,
  key: 'task-form-auto-scroll',
  name: '任务办理对话框自动滚动到底部',
  createdAt: '2021-03-02T10:09:25.644Z'
}, {
  serviceId: '',
  value: '8',
  description: '以小时为单位，有效期间刷新页面无需重新登录，每次活跃操作都会顺延有效期，14天后强制失效，必须重新登录',
  backendOnly: false,
  key: 'session-expire-hours',
  name: '用户登录后临时session有效期',
  createdAt: '2021-03-02T10:09:25.652Z'
}, {
  serviceId: '',
  value: '人名1:true;人名2:true;',
  description: '',
  backendOnly: false,
  key: 'protectTypeFilter',
  name: '默认保护类型筛选',
  createdAt: '2021-04-16T09:41:34.429Z'
}, {
  serviceId: '',
  value: '人名1:true;人名2:true;',
  description: '',
  backendOnly: false,
  key: 'deviceNameFilter',
  name: '默认设备名称筛选',
  createdAt: '2021-04-16T09:42:21.609Z'
}, {
  serviceId: '',
  value: '.*',
  description: '正则表达式，用以检查用户密码复杂度，设置为空时不检查',
  backendOnly: false,
  key: 'pwd-check-regex',
  name: '密码复杂度检查',
  createdAt: '2021-06-24T10:04:13.610Z'
}, {
  serviceId: '',
  value: '密码必须包含字母和数字，且不短于6位',
  description: '字符串，当密码不符合复杂度检查时的提示语',
  backendOnly: false,
  key: 'pwd-check-message',
  name: '密码复杂度错误提示',
  createdAt: '2021-06-24T10:04:13.624Z'
}, {
  serviceId: '',
  value: 'false',
  description: '是否禁止连接互联网的电脑浏览器访问本系统',
  backendOnly: false,
  key: 'internet-disallow',
  name: '联网的客户端不允许访问系统',
  createdAt: '2021-06-24T10:04:13.629Z'
}, {
  serviceId: '',
  value: '\\{.+\\}',
  description: '当excel中的单元格内容与该正则匹配时将会在生成pdf、html时自动清除之',
  backendOnly: false,
  key: 'keyword-match-regex',
  name: '关键词匹配正则表达式',
  createdAt: '2021-06-24T10:04:13.634Z'
}, {
  serviceId: '',
  value: 'false',
  description: '启用后将保留14天内的缓存',
  backendOnly: false,
  key: 'use-pdf-cache',
  name: '是否启用转换pdf缓存',
  createdAt: '2021-06-24T10:04:13.638Z'
}, {
  serviceId: '',
  value: 'false',
  description: '常规登录界面是否启用验证码',
  backendOnly: false,
  key: 'captcha-common-login',
  name: '常规登录界面是否启用验证码',
  createdAt: '2021-06-24T10:04:13.643Z'
}, {
  serviceId: '',
  value: 'false',
  description: '安全登录界面是否启用验证码',
  backendOnly: false,
  key: 'captcha-security-login',
  name: '安全登录界面是否启用验证码',
  createdAt: '2021-06-24T10:04:13.648Z'
}, {
  serviceId: '',
  value: 'false',
  description: '是否在登录界面允许注册新用户',
  backendOnly: false,
  key: 'enable-register',
  name: '登录界面允许注册',
  createdAt: '2021-06-24T10:04:13.654Z'
}, {
  serviceId: '',
  value: '100',
  description: '范围[0,1000)，转换xlsx为pdf时自动从后往前删n个sheet页到只剩1个sheet为止，例如有5个sheet，配置为8，则删除到剩1页为止（省公司应该配置为1000），该配置与regex配置会同时工作，不可随意更改，如果数值有变动必须清空pdf转换服务的缓存',
  backendOnly: false,
  key: 'auto-drop-sheet-count',
  name: 'xlsx转换成pdf时自动删除末尾sheet页数',
  createdAt: '2021-06-24T10:04:13.659Z'
}, {
  serviceId: '',
  value: '原则',
  description: '转换xlsx为pdf时匹配sheet名称，当匹配到时删除sheet页（省公司可置空），该配置一经确定不可随意更改，如果有变动必须清空pdf转换服务的缓存',
  backendOnly: false,
  key: 'auto-drop-sheet-regex',
  name: 'xlsx转换成pdf时自动删除sheet名称与正则匹配的sheet页',
  createdAt: '2021-06-24T10:04:13.664Z'
}, {
  serviceId: '',
  value: '',
  description: '可以在脚本管理中配置文件名解析脚本，如果该字段为空则使用内置的文件名解析',
  backendOnly: false,
  key: 'upload-filename-script-name',
  name: '上传文件时的解析脚本名称',
  createdAt: '2021-06-24T10:04:13.668Z'
}, {
  serviceId: '',
  value: '\\.(docx|doc|xls|xlsx|pdf|html?|jpe?g|png|gif)$',
  description: '不可为空，上传文件时如果扩展名不匹配则不允许上传',
  backendOnly: false,
  key: 'allow-upload-filename-regex',
  name: '允许上传的文件扩展名正则匹配',
  createdAt: '2021-06-24T10:04:13.673Z'
}, {
  serviceId: '',
  value: 'false',
  description: '配置为true使用老方式win虚拟机转换pdf',
  backendOnly: false,
  key: 'convert-pdf-use-vm',
  name: '使用win虚拟机转换pdf',
  createdAt: '2021-06-24T10:04:13.677Z'
}, {
  serviceId: '',
  value: '只允许上传doc, docx, xls, xlsx, pdf, html, jpeg, png, gif类型的文件',
  description: '上传文件时如果扩展名不合法的报错信息',
  backendOnly: false,
  key: 'allow-upload-filename-message',
  name: '上传文件时如果扩展名不合法的报错信息',
  createdAt: '2021-06-24T10:04:13.682Z'
}, {
  serviceId: '',
  value: '10.21.13.0/24\n10.21.37.0/24\n172.18.0.0/24\n10.21.37.134\n192.168.0.0/16\n10.161.135.105',
  description: '每行一个IP，支持带子网的写法(192.168.1.0/24)，表明这些IP使用可以通过记住用户名密码的登录页面进入系统，其他不在范围内的IP将只能使用安全登录页',
  backendOnly: true,
  key: 'common-login-clients',
  name: '使用常规登录界面的客户端IP表',
  createdAt: '2021-06-24T10:04:13.686Z'
}, {
  serviceId: '',
  value: 'false',
  description: 'OMS内嵌页面专用，如果启用，可通过[http://.../oms/login?username=人名]登录系统，无需密码',
  backendOnly: true,
  key: 'enable-login-by-name',
  name: '是否启用用户名登录接口',
  createdAt: '2021-06-24T10:04:13.691Z'
}, {
  serviceId: '',
  value: '',
  description: '新定值单在docker容器内的路径,通过SFTP传到服务器上后映射到docker内的路径',
  backendOnly: true,
  key: 'new-dzd-dir',
  name: '系统外定值单路径',
  createdAt: '2021-09-24T04:08:12.660Z'
}, {
  serviceId: '',
  value: '盘调继',
  description: '新定值单收到后自动上传的前缀',
  backendOnly: true,
  key: 'new-dzd-prefix',
  name: '系统外定值单前缀',
  createdAt: '2021-09-24T04:08:12.746Z'
}, {
  serviceId: '',
  value: '',
  description: '新定值单在docker容器内的文件名编码',
  backendOnly: true,
  key: 'new-dzd-dir-encoding',
  name: '系统外定值单文件名编码',
  createdAt: '2021-09-24T04:08:12.753Z'
}, {
  serviceId: '',
  value: 'utf8',
  description: '新定值单描述文件xml的内容编码',
  backendOnly: true,
  key: 'new-dzd-xml-encoding',
  name: '系统外定值单描述xml内容编码',
  createdAt: '2021-09-24T04:08:12.759Z'
}, {
  serviceId: '',
  value: 'false',
  description: '被系统读取后的定值单自动在目录中删除',
  backendOnly: true,
  key: 'new-dzd-auto-delete',
  name: '新定值单自动删除',
  createdAt: '2021-09-24T04:08:12.763Z'
}, {
  serviceId: '',
  value: 'false',
  description: '默认为false，表示按common-login-clients过滤允许常规登录的客户端',
  backendOnly: true,
  key: 'prefer-common-login',
  name: '配置为true后所有客户端都可以使用常规登录',
  createdAt: '2021-09-24T04:08:12.797Z'
}, {
  serviceId: '',
  value: 'true',
  description: '',
  backendOnly: true,
  key: 'substation-name-unique',
  name: '新增厂站时检查同名同电压等级的厂站是否存在',
  createdAt: '2021-09-24T04:08:12.802Z'
}, {
  serviceId: '',
  value: '',
  description: '每行一个日期，格式：2021-07-13 配置后，定值查询页面将对回执人、调度员角色隐藏该上传日期的定值单',
  backendOnly: true,
  key: 'hidden-upload-dates',
  name: '隐藏指定上传日期的定值单',
  createdAt: '2021-09-24T04:08:12.814Z'
}, {
  serviceId: '',
  value: '',
  description: '多个用户用英文逗号分开',
  backendOnly: true,
  key: 'view-66-220',
  name: '只看所有单位66kV和220kV电压等级的定值单用户',
  createdAt: '2021-09-26T10:08:50.694Z'
}, {
  serviceId: '',
  value: 'true',
  description: 'excel文件转pdf、html时自动显示隐藏行',
  backendOnly: true,
  key: 'show-hidden-rows',
  name: '转pdf时显示隐藏的行',
  createdAt: '2021-09-26T10:08:50.777Z'
}, {
  serviceId: '',
  value: 'true',
  description: 'excel文件转pdf、html时自动显示隐藏列',
  backendOnly: true,
  key: 'show-hidden-cols',
  name: '转pdf时显示隐藏的列',
  createdAt: '2021-09-26T10:08:50.786Z'
}, {
  serviceId: '',
  name: '顶层地区号',
  key: 'top-area-code',
  value: '210000',
  description: '影响模板共享库中的地区选择,如果配置为210200则只能选择大连下的地区,如果配置为210000则可以选择辽宁全省地区',
  backendOnly: false,
  createdAt: '2021-10-27T03:52:51.701Z'
}, {
  serviceId: '',
  name: '上传文件时自动删除公式',
  key: 'drop-formula-before-upload',
  value: 'false',
  description: '只针对excel文档,在上传文件时调用虚拟机对单元格内的公式替换成文本',
  backendOnly: true,
  createdAt: '2021-11-02T08:41:56.269Z'
}];

export {
  taskGridColumns,
  queryGridColumns,
  defaultVoltages,
  defaultSystemConfigs
};
