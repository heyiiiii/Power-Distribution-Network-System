import crypto from 'crypto';
import { Writable } from 'stream';
import consola from 'consola';
import mongoose, { ClientSession } from 'mongoose';
import { Db, GridFSBucket, GridFSBucketWriteStream, ObjectId } from 'mongodb';
import conf from '../../configs';
import sessionStore, { ISessInfo } from '../session-store';
import utils from '../utils';
import { defaultSystemConfigs, queryGridColumns, taskGridColumns } from './default-data';


import {
  CurveFile,
  CurveFileSchema,
  CurveLine,
  CurveLineSchema,
  HistorySchema,
  ICurveFile,
  ICurveFileMetadata,
  ICurveLine,
  IHistory,
  IJSFile,
  IJSFileMetadata,
  IJSTemplate,
  IJSTemporary,
  IProtectCalculation,
  IProtectCompute,
  IProtectModel,
  IProtectModelMetadata,
  IVariable,
  JSFile,
  JSFileMetadataSchema,
  JSTemplate,
  JSTemplateMetadataSchema,
  JSTemplateSchema,
  JSTemporary,
  JSTemporarySchema,
  ProtectCalculation,
  ProtectCalculationSchema,
  ProtectCompute,
  ProtectComputeSchema,
  ProtectModel,
  ProtectModelSchema,
  Variable,
  VariableSchema
} from './scripts';

import {
  IBreaker,
  IBus,
  IConductorType,
  ILine,
  ILineSegment,
  ILoad,
  ISubstation,
  ITower,
  ITPoint,
  ITransformer,
  IVoltage,
  ISvg,
  IXml,
  IType,
  IXmlVoltage,
  ICurrent,
  ICalculate,
  IStructure,
  Breaker,
  BreakerSchema,
  Bus,
  BusSchema,
  ConductorType,
  ConductorTypeSchema,
  Line,
  LineSchema,
  LineSegment,
  LineSegmentSchema,
  Load,
  LoadSchema,
  Substation,
  SubstationSchema,
  Tower,
  TowerSchema,
  TPoint,
  TPointSchema,
  Transformer,
  TransformerSchema,
  Voltage,
  VoltageSchema,
  Svg,
  SvgSchema,
  Xml,
  XmlSchema,
  Type,
  TypeSchema,
  XmlVoltage,
  XmlVoltageSchema,
  Current,
  CurrentSchema,
  Calculate,
  CalculateSchema,
  Structure,
  StructureSchema
} from './models';

import {
  Address,
  AddressSchema,
  Department,
  DepartmentSchema,
  IAddress,
  IColumnState,
  IDepartment,
  IFlowButton,
  IFlowState,
  ILoginLog,
  ISession,
  IUser,
  IUserAuth,
  IUserGroup,
  IUserRole,
  IViewRange,
  RouteSchema,
  SessionSchema,
  User,
  UserAuth,
  UserAuthSchema,
  UserGroup,
  UserGroupSchema,
  UserInfo,
  UserInfoSchema,
  UserRole,
  UserRoleSchema,
  UserSchema,
  UserSession
} from './user';

import {
  addCriticalLog,
  ClientAuth,
  ClientAuthSchema,
  Config,
  ConfigSchema,
  CriticalLog,
  CriticalLogSchema,
  getConfigNumberValue,
  getConfigValueByKey,
  getConfigValueByKeyAndServiceId,
  IClientAuth,
  IConfig,
  ICriticalLog,
  ICriticalLogParam,
  IImage,
  ILogData,
  Image,
  Log,
  LogSchema,
  ProtectType,
  ProtectTypeComponent,
  ProtectTypeComponentSchema,
  ProtectTypeSchema
} from './sys';

import {
  DzdFile,
  DzdFileOriginal,
  DzdFileOriginalSchema,
  DzdFileSchema,
  DzdValue,
  DzdValueSchema,
  FileShare,
  FileShareMetadataSchema,
  FileShareSchema,
  FormPrintTemplate,
  HtmlCache,
  IDzdFile,
  IDzdFileMetadata,
  IDzdValue,
  IFileShare,
  IFileShareMetadata,
  IFormPrintTemplate,
  IHtmlCache,
  IHtmlCacheMetadata,
  IPdfCache,
  IPdfCacheMetadata,
  IStamp,
  IStampMetadata,
  PdfCache,
  Stamp
} from './file';

import {
  IScript,
  IScriptMetadata,
  IXForm,
  IXFormItem,
  Script,
  ScriptMetadata,
  ScriptSchema,
  XForm,
  XFormItem,
  XFormSchema,
  XScript,
  XScriptSchema
} from './form';

import {
  DzdTask,
  IDzdTask,
  IDzdTaskO,
  IFormItem,
  IFormItemO,
  IRecord,
  IRecordO,
  IStep,
  IStepO,
  ITaskNotify,
  OldDzdTask,
  Task,
  TaskNotify,
  TaskNotifySchema,
  TaskSchema
} from './task';

import { DFlow, DFlowLink, DFlowMetadata, DFlowStep, DzdFlow, Flow, FlowSchema, IFlow, IFlowStep } from './flow';

import {
  FlowStateSetting,
  FlowStateSettingSchema,
  FlowStepSetting,
  FlowStepSettingSchema,
  IFlowStateSetting,
  SystemConfig,
  ISystemConfig,
  SystemConfigSchema
} from './setting';

let reconnectTimeout: NodeJS.Timeout | null = null;

function waitForConnectionOpen(conn: mongoose.Connection): Promise<Db> {
  return new Promise((resolve, reject) => {
    function errorHandler(err: Error) {
      conn.off('error', errorHandler);
      reject(err);
    }

    conn.on('error', errorHandler);
    conn.once('open', () => {
      resolve(conn.db as Db);
    });
  });
}

function connectMongodb() {
  return new Promise((resolve) => {
    mongoose.connect(`mongodb://${conf.mongodb.host}:${conf.mongodb.port}/${conf.mongodb.db}`, {
      user: conf.mongodb.uid ? conf.mongodb.uid : undefined,
      pass: conf.mongodb.pwd ? conf.mongodb.pwd : undefined,
      autoIndex: true,
      replicaSet: conf.mongodb.replicaSet,
      retryWrites: true
    }, async error => {
      if (error) {
        consola.error({
          message: 'mongodb连接失败',
          badge: true
        });
        consola.error(error);
        resolve(false);
      } else {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        consola.success({
          message: `mongodb连接成功, replicaSet[${conf.mongodb.replicaSet}], useTx[${conf.mongodb.useTransaction}], 准备检查数据`,
          badge: true
        });
        const result = await prepareSystemData();
        consola.success({
          message: '数据检查完成, 旧版本号: ' + result.oldSchemaVersion + ', 新版本号: ' + result.currentSchemaVersion,
          badge: true
        });
        await sessionStore.initCache();
        resolve(true);
      }
    });
  });
}

connectMongodb().then(result => {
  if (!result) {
    consola.error({
      message: 'mongodb连接失败，6秒后自动重连',
      badge: true
    });
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(connectMongodb, 6000);
  }
});

mongoose.connection.on('disconnected', () => {
  consola.error({
    message: 'mongodb连接断开，6秒后自动重连',
    badge: true
  });
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = setTimeout(connectMongodb, 6000);
});

async function prepareUserAuth() {
  if (!(await UserAuth.exists({ auth: 'admin' }))) {
    const auth = new UserAuth({
      auth: 'admin',
      name: '管理员',
      inner: true,
      description: '系统管理员权限，可管理用户、流程、数据等',
      index: 0
    });
    await auth.save();
  }

  if (!(await UserAuth.exists({ auth: 'master' }))) {
    const auth = new UserAuth({
      auth: 'master',
      name: '高级用户',
      inner: true,
      description: '高级用户权限，可管理流程、数据等',
      index: 1
    });
    await auth.save();
  }

  if (!(await UserAuth.exists({ auth: 'user' }))) {
    const auth = new UserAuth({
      auth: 'user',
      name: '普通用户',
      inner: true,
      description: '普通用户权限，可使用流程、访问数据',
      index: 2
    });
    await auth.save();
  }

  if (!(await UserAuth.exists({ auth: 'readonly' }))) {
    const auth = new UserAuth({
      auth: 'readonly',
      name: '只读用户',
      inner: true,
      description: '只读权限，只可访问流程、数据，不可修改',
      index: 3
    });
    await auth.save();
  }
}

async function prepareUserRole() {
  if (!(await UserRole.exists({ role: 'audit' }))) {
    const role = new UserRole({
      role: 'audit',
      name: '审核人',
      inner: true,
      description: '可以审核定值单',
      appAuths: [],
      executeAuths: [],
      columnStatesInQuery: queryGridColumns,
      stateConfigs: [],
      viewSelfDepartmentOnly: false,
      index: 0
    });
    await role.save();
  }

  if (!(await UserRole.exists({ role: 'launch' }))) {
    const role = new UserRole({
      role: 'launch',
      name: '计算人',
      inner: true,
      description: '负责发起流程，可对定值单进行签发、归档等操作',
      appAuths: [],
      executeAuths: [],
      columnStatesInQuery: queryGridColumns,
      stateConfigs: [],
      viewSelfDepartmentOnly: false,
      index: 1
    });
    await role.save();
  }

  if (!(await UserRole.exists({ role: 'repeal' }))) {
    const role = new UserRole({
      role: 'repeal',
      name: '回执人',
      inner: true,
      description: '可以查看文件并填写现场回执',
      appAuths: [],
      executeAuths: [],
      columnStatesInQuery: queryGridColumns,
      stateConfigs: [],
      viewSelfDepartmentOnly: false,
      index: 2
    });
    await role.save();
  }

  if (!(await UserRole.exists({ role: 'browse' }))) {
    const role = new UserRole({
      role: 'browse',
      name: '调度员',
      inner: true,
      description: '可以办理调度核对并办理任务',
      appAuths: [],
      executeAuths: [],
      columnStatesInQuery: queryGridColumns,
      stateConfigs: [],
      viewSelfDepartmentOnly: false,
      index: 3
    });
    await role.save();
  }
}

async function prepareUserGroup() {
  let groupCount = await UserGroup.countDocuments();
  const adminAuth: any = await UserAuth.findOne({
    auth: 'admin'
  })
    .populate('groups')
    .select('_id')
    .lean();
  const masterAuth: any = await UserAuth.findOne({
    auth: 'master'
  })
    .populate('groups')
    .select('_id')
    .lean();
  const userAuth: any = await UserAuth.findOne({
    auth: 'user'
  })
    .populate('groups')
    .select('_id')
    .lean();
  // const readonlyAuth: any = await UserAuth.findOne({
  //   auth: 'readonly'
  // })
  // .populate('groups')
  // .select('_id')
  // .lean();

  if (adminAuth.groups.length === 0) {
    const rootUser = await User.findOne({
      account: 'root'
    }).lean();
    UserGroup.create({
      name: '管理员用户组',
      description: '具备管理员、高级用户、普通用户权限',
      index: groupCount++,
      inner: true,
      params: {},
      auths: [adminAuth._id, masterAuth._id, userAuth._id],
      roles: [],
      routes: [
        {
          name: 'index',
          path: '/',
          index: 1,
          label: '首页',
          auths: 'any',
          roles: 'any'
        },
        {
          name: 'manage-user',
          path: '/manage/user',
          index: 13,
          label: '用户管理',
          auths: [
            'admin',
            'master'
          ],
          roles: 'any'
        }
      ],
      users: rootUser ? [rootUser._id] : []
    }).then();
  }
  if (masterAuth.groups.length === 0) {
    UserGroup.create({
      name: '高级用户组',
      description: '具备高级用户与普通用户权限',
      index: groupCount++,
      inner: true,
      params: {},
      auths: [masterAuth._id, userAuth._id],
      roles: [],
      routes: [],
      users: []
    }).then();
  }
  if (userAuth.groups.length === 0) {
    UserGroup.create({
      name: '普通用户组',
      description: '具备普通用户权限',
      index: groupCount++,
      inner: true,
      params: {},
      auths: [userAuth._id],
      roles: [],
      routes: [],
      users: []
    }).then();
  }

  await User.updateMany({
    flows: {
      $exists: false
    }
  }, {
    flows: []
  });
  // if (readonlyAuth.groups.length === 0) {
  //   const group = new UserGroup({
  //     name: '只读用户组',
  //     description: '只具备只读权限',
  //     index: groupCount++,
  //     inner: false,
  //     params: {},
  //     auths: [readonlyAuth._id],
  //     roles: []
  //   });
  //   await group.save();
  // }
}

async function processSystemConfigs(schemaVersion: number) {
  if (await Config.countDocuments({}) === 0) {
    await Config.create(defaultSystemConfigs);
  }

  if (!await Config.exists({ key: 'drop-formula-before-upload' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'drop-formula-before-upload',
      value: 'false',
      name: '上传文件时自动删除公式',
      description: '只针对excel文档,在上传文件时调用虚拟机对单元格内的公式替换成文本',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'top-area-code' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'top-area-code',
      value: '210000',
      name: '顶层地区号',
      description: '影响模板共享库中的地区选择,如果配置为210200则只能选择大连下的地区,如果配置为210000则可以选择辽宁全省地区',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'auto-execute-script-schedule' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'auto-execute-script-schedule',
      value: '0 00 00 1/1 * ?',
      name: '自动执行脚本的执行时间',
      description: '默认为每天0点执行',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'auto-execute-script-name' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'auto-execute-script-name',
      value: '',
      name: '自动执行脚本的名称',
      description: '',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'top-area-code' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'top-area-code',
      value: '210000',
      name: '顶层地区号',
      description: '影响模板共享库中的地区选择,如果配置为210200则只能选择大连下的地区,如果配置为210000则可以选择辽宁全省地区',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'show-hidden-rows' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'show-hidden-rows',
      value: 'true',
      name: '转pdf时显示隐藏的行',
      description: 'excel文件转pdf、html时自动显示隐藏行',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'show-hidden-cols' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'show-hidden-cols',
      value: 'true',
      name: '转pdf时显示隐藏的列',
      description: 'excel文件转pdf、html时自动显示隐藏列',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'new-dzd-dir' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'new-dzd-dir',
      value: '',
      name: '系统外定值单路径',
      description: '新定值单在docker容器内的路径,通过SFTP传到服务器上后映射到docker内的路径',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'new-dzd-prefix' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'new-dzd-prefix',
      value: '盘调继',
      name: '系统外定值单前缀',
      description: '新定值单收到后自动上传的前缀',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'new-dzd-dir-encoding' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'new-dzd-dir-encoding',
      value: '',
      name: '系统外定值单文件名编码',
      description: '新定值单在docker容器内的文件名编码',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'new-dzd-xml-encoding' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'new-dzd-xml-encoding',
      value: 'utf8',
      name: '系统外定值单描述xml内容编码',
      description: '新定值单描述文件xml的内容编码',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'new-dzd-auto-delete' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'new-dzd-auto-delete',
      value: 'false',
      name: '新定值单自动删除',
      description: '被系统读取后的定值单自动在目录中删除',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'task-auto-refresh' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'task-auto-refresh',
      value: 'true',
      name: '办理任务后自动刷新相关人员的任务列表',
      description: '当某个任务被办理或驳回或撤回后，相关人员的待办任务页面会自动刷新',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'task-auto-refresh' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'task-auto-refresh',
      value: 'true',
      name: '办理任务后自动刷新相关人员的任务列表',
      description: '当某个任务被办理或驳回或撤回后，相关人员的待办任务页面会自动刷新',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'task-auto-notify' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'task-auto-notify',
      value: 'true',
      name: '办理任务后自动通知相关人员',
      description: '当某个任务被办理或驳回或撤回后，相关人员将收到一条通知消息',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'pwd-check-regex' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'pwd-check-regex',
      value: '^.{6,24}$',
      name: '密码复杂度检查',
      description: '正则表达式，用以检查用户密码复杂度，设置为空时不检查',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'pwd-check-message' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'pwd-check-message',
      value: '密码不可少于6位',
      name: '密码复杂度错误提示',
      description: '字符串，当密码不符合复杂度检查时的提示语',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'internet-disallow' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'internet-disallow',
      value: 'false',
      name: '联网的客户端不允许访问系统',
      description: '是否禁止连接互联网的电脑浏览器访问本系统',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'keyword-match-regex' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'keyword-match-regex',
      value: '\\{.+\\}',
      name: '关键词匹配正则表达式',
      description: '当excel中的单元格内容与该正则匹配时将会在生成pdf、html时自动清除之',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'use-pdf-cache' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'use-pdf-cache',
      value: 'false',
      name: '是否启用转换pdf缓存',
      description: '启用后将保留14天内的缓存',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'captcha-common-login' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'captcha-common-login',
      value: 'false',
      name: '常规登录界面是否启用验证码',
      description: '常规登录界面是否启用验证码',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'captcha-security-login' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'captcha-security-login',
      value: 'false',
      name: '安全登录界面是否启用验证码',
      description: '安全登录界面是否启用验证码',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'enable-register' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'enable-register',
      value: 'false',
      name: '登录界面允许注册',
      description: '是否在登录界面允许注册新用户',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'auto-drop-sheet-count' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'auto-drop-sheet-count',
      value: '0',
      name: 'xlsx转换成pdf时自动删除末尾sheet页数',
      description: '范围[0,1000)，转换xlsx为pdf时自动从后往前删n个sheet页到只剩1个sheet为止，例如有5个sheet，配置为8，则删除到剩1页为止（省公司应该配置为1000），该配置与regex配置会同时工作，不可随意更改，如果数值有变动必须清空pdf转换服务的缓存',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'auto-drop-sheet-regex' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'auto-drop-sheet-regex',
      value: '原则',
      name: 'xlsx转换成pdf时自动删除sheet名称与正则匹配的sheet页',
      description: '转换xlsx为pdf时匹配sheet名称，当匹配到时删除sheet页（省公司可置空），该配置一经确定不可随意更改，如果有变动必须清空pdf转换服务的缓存',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'upload-filename-script-name' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'upload-filename-script-name',
      value: '',
      name: '上传文件时的解析脚本名称',
      description: '可以在脚本管理中配置文件名解析脚本，如果该字段为空则使用内置的文件名解析',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'allow-upload-filename-regex' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'allow-upload-filename-regex',
      value: '\\.(docx|doc|xls|xlsx|pdf|html?|jpe?g|png|gif)$',
      name: '允许上传的文件扩展名正则匹配',
      description: '不可为空，上传文件时如果扩展名不匹配则不允许上传',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'convert-pdf-use-vm' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'convert-pdf-use-vm',
      value: 'false',
      name: '使用win虚拟机转换pdf',
      description: '配置为true使用老方式win虚拟机转换pdf',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'allow-upload-filename-message' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'allow-upload-filename-message',
      value: '只允许上传doc, docx, xls, xlsx, pdf, html, jpeg, png, gif类型的文件',
      name: '上传文件时如果扩展名不合法的报错信息',
      description: '上传文件时如果扩展名不合法的报错信息',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'common-login-clients' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'common-login-clients',
      value: '',
      name: '使用常规登录界面的客户端IP表',
      description: '每行一个IP，支持带子网的写法(192.168.1.0/24)，表明这些IP使用可以通过记住用户名密码的登录页面进入系统，其他不在范围内的IP将只能使用安全登录页',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'prefer-common-login' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'prefer-common-login',
      value: 'false',
      name: '配置为true后所有客户端都可以使用常规登录',
      description: '默认为false，表示按common-login-clients过滤允许常规登录的客户端',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'substation-name-unique' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'substation-name-unique',
      value: 'true',
      name: '新增厂站时检查同名同电压等级的厂站是否存在',
      description: '',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'enable-login-by-name' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'enable-login-by-name',
      value: 'false',
      name: '是否启用用户名登录接口',
      description: 'OMS内嵌页面专用，如果启用，可通过[http://.../oms/login?username=人名]登录系统，无需密码',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'preview-in-new-window' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'preview-in-new-window',
      value: 'true',
      name: '查看定值单时弹出新窗口',
      description: '指定浏览定值单文件时在页面内弹出浏览对话框还是弹出一个新窗口',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'task-form-auto-scroll' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'task-form-auto-scroll',
      value: 'true',
      name: '任务办理对话框自动滚动到底部',
      description: '办理带表单的任务节点时点击提交下一步同时自动将表单滚动到视图内',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'session-expire-hours' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'session-expire-hours',
      value: '8',
      name: '用户登录后临时session有效期',
      description: '以小时为单位，有效期间刷新页面无需重新登录，每次活跃操作都会顺延有效期，14天后强制失效，必须重新登录',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'login-bg-quality' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'login-bg-quality',
      value: '60',
      name: '登录背景清晰度',
      description: '登录界面背景图压缩jpeg清晰度',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'hidden-upload-dates' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'hidden-upload-dates',
      value: '',
      name: '隐藏指定上传日期的定值单',
      description: '每行一个日期，格式：2021-07-13 配置后，定值查询页面将对回执人、调度员角色隐藏该上传日期的定值单',
      backendOnly: true
    }]);
  }

  if (!await Config.exists({ key: 'login-title1' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'login-title1',
      value: `{
  "text": "----电力调度控制中心",
  "fontSize": "22px",
  "letterSpacing": "3px",
  "color": "#006569"
}`,
      name: '登录框主标题',
      description: '配置登录框主标题文字、大小、间距、颜色',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'login-title2' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'login-title2',
      value: `{
  "text": "继电保护配电网整定计算系统",
  "fontSize": "15px",
  "letterSpacing": "4px",
  "color": "#006569"
}`,
      name: '登录框副标题',
      description: '配置登录框副标题文字、大小、间距、颜色',
      backendOnly: false
    }]);
  }

  if (!await Config.exists({ key: 'login-bg-interval' })) {
    await Config.insertMany([{
      serviceId: '',
      key: 'login-bg-interval',
      value: '7',
      name: '登录背景切换时间',
      description: '登录界面背景图轮播间隔，以秒为单位',
      backendOnly: false
    }, {
      serviceId: '',
      key: 'login-bg-random',
      value: 'true',
      name: '登录背景切换随机',
      description: '登录界面背景图轮播是否随机',
      backendOnly: false
    }]);
  }

  if (schemaVersion < 4) {
    Config.updateMany({}, {
      $set: {
        backendOnly: false
      }
    }).exec();
    schemaVersion = 4;
  }

  return schemaVersion;
}

async function processRoleSchema(schemaVersion: number) {
  const roles = await UserRole.find({
    $or: [
      {
        stateConfigs: {
          $exists: false
        }
      },
      {
        columnStatesInQuery: {
          $exists: false
        }
      }
    ]
  });
  for (const role of roles) {
    role.stateConfigs = [];
    role.columnStatesInQuery = queryGridColumns;
    await role.save();
  }
  if (schemaVersion < 5) {
    schemaVersion = 5;
  }

  await User.updateMany({
    viewSelfDepartment: {
      $exists: false
    }
  }, {
    $set: {
      viewSelfDepartment: 'inherit'
    }
  });

  return schemaVersion;
}

async function prepareRootUser(rootDepartment: any) {
  const sha1 = crypto.createHash('sha1');
  sha1.update('root');
  const passwordSha1 = sha1.digest('hex');
  const sha256 = crypto.createHmac('sha256', 'root');
  sha256.update(passwordSha1);
  const password = sha256.digest('hex');

  await User.findOneAndUpdate({
    account: 'root'
  }, {
    name: '临时管理员',
    status: 'disabled',
    account: 'root',
    rawAccount: 'root',
    password,
    salt: 'root',
    departments: [rootDepartment._id],
    regTime: new Date()
  }, {
    upsert: true
  });
}

function prepareDepartment() {
  Department.updateMany({
    addressList: {
      $exists: false
    }
  }, {
    $set: {
      addressList: [],
      contactGroup: ''
    }
  }, {
    multi: true
  }, (err, raw) => {
    if (err) {
      console.log('为Department增加addressList字段失败');
      console.error(err);
    } else {
      if (raw.modifiedCount) {
        console.log('已为' + raw.modifiedCount + '条Department记录增加addressList字段');
      }
    }
  });
  Substation.updateMany({
    addressList: {
      $exists: false
    }
  }, {
    $set: {
      addressList: [],
      contactGroup: ''
    }
  }, {
    multi: true
  }, (err, raw) => {
    if (err) {
      console.log('为Substation增加addressList字段失败');
      console.error(err);
    } else {
      if (raw.modifiedCount) {
        console.log('已为' + raw.modifiedCount + '条Substation记录增加addressList字段');
      }
    }
  });
  return Department.findOneAndUpdate(
    {
      code: '0'
    },
    {
      code: '0',
      name: 'root',
      parentCode: '',
      aliasName: '根部门',
      index: 0
    },
    { upsert: true, new: true }
  ).lean();
}

async function getMongodbSchemaVersion(): Promise<number> {
  const dataVersionConfig: IConfig | null = await Config.findOne({
    key: 'data-version'
  }).lean();
  if (dataVersionConfig) {
    return Number(dataVersionConfig.value);
  }
  await Config.create({
    serviceId: '',
    key: 'data-version',
    value: '1',
    name: '数据版本',
    description: '数据库结构版本标识，勿删'
  });
  return 1;
}

async function setMongodbSchemaVersion(schemaVersion: number) {
  await Config.updateOne({
    key: 'data-version'
  }, {
    value: String(schemaVersion)
  });
}

async function normalizeDzdFiles(schemaVersion: number) {
  if (schemaVersion < 6) {
    const files = await DzdFile.find({
      'metadata.dzNumber': {
        $exists: false
      }
    }).cursor();
    for (let file = await files.next(); file; file = await files.next()) {
      await DzdTask.deleteMany({
        file: file._id
      });
      await Task.deleteMany({
        fileId: file._id
      });
      await DzdValue.deleteMany({
        file: file._id
      });

      const gridFS = getDzdGridFSBucket();
      gridFS.delete(file._id, err => {
        if (!err) {
          console.warn('已删除异常文件: ' + file.filename);
        } else {
          console.error('删除异常文件[' + file.filename + ']错误');
          console.error(err);
        }
      });
    }
    await files.close();
    schemaVersion = 6;
  }

  if (schemaVersion < 7) {
    const fields = [
      'metadata.applier',
      'metadata.planExecuteTime',
      'metadata.serviceNumber',
      'metadata.applyTime',
      'metadata.feedbackName',
      'metadata.substationOnDuty',
      'metadata.maintainer',
      'metadata.executeTime',
      'metadata.receiptTime',
      'metadata.dispatcher',
      'metadata.localeOnDuty',
      'metadata.checkTime',
      'metadata.executeStatus'
    ];
    const condition: any = {};
    for (const field of fields) {
      condition[field] = {
        $or: [
          {
            $exists: false
          },
          {
            $eq: ''
          },
          {
            $eq: null
          }
        ]
      };
    }

    function padding(num: string, length: number) {
      for (let len = num.length; len < length; len = num.length) {
        num = '0' + num;
      }
      return num;
    }

    const mime = require('mime');
    const cursor2 = DzdFile.find({}).lean().cursor();
    for (let file = await cursor2.next(); file; file = await cursor2.next()) {
      const mimeType = mime.getType(file.metadata.fileType) || 'binary/octet-stream';
      DzdFile.updateOne({
        _id: file._id
      }, {
        $set: {
          contentType: mimeType,
          'metadata._contentType': mimeType,
          'metadata.prefixSort': file.metadata.dzYear + '-' + padding(String(file.metadata.dzCodeN), 4),
          'metadata.extendProps': {},
          'metadata.formData': []
        }
      }).exec();
    }
    await cursor2.close();
    schemaVersion = 7;
  }

  return schemaVersion;
}

async function convertScript(schemaVersion: number) {
  if (schemaVersion < 8) {
    const gridFS = getScriptGridFSBucket();
    const scripts = await XScript.find({}).lean();
    for (const script of scripts) {
      await utils.deleteGridFile(gridFS, script._id);
      const stream = gridFS.openUploadStreamWithId(script._id, script.name, {
        metadata: {
          _contentType: 'text/javascript',
          timeoutMS: script.executorConfig.timeout
        }
      });
      stream.end(Buffer.from(script.script));
    }
    schemaVersion = 8;
  }

  return schemaVersion;
}

function convertStepVisibleField(schemaVersion: number) {
  if (schemaVersion < 9) {
    schemaVersion = 9;
  }

  return schemaVersion;
}

async function convertVoltageLevelField(schemaVersion: number) {
  if (schemaVersion < 10) {
    const voltages = await Voltage.find({});
    for (const v of voltages) {
      if (typeof v.name === 'number') {
        v.name = String(v.name);
        await v.save();
      }
    }

    const files = await DzdFile.find({}).lean().cursor();
    for (let file = await files.next(); file; file = await files.next()) {
      await DzdFile.updateOne({
        _id: file._id
      }, {
        $set: {
          'metadata.voltageLevel': String(file.metadata.voltageLevel || '')
        }
      });
    }
    schemaVersion = 10;
  }

  return schemaVersion;
}

async function addHideForRepealField(schemaVersion: number) {
  if (schemaVersion < 11) {
    await DzdFile.updateMany({}, {
      $set: {
        'metadata.hideForRepeal': false
      }
    });
    schemaVersion = 11;
  }

  return schemaVersion;
}

async function addViewRangeField(schemaVersion: number) {
  if (schemaVersion < 12) {
    await User.updateMany({
      viewRange: {
        $exists: false
      }
    }, {
      $set: {
        viewRange: [],
        voltageLevels: []
      }
    });

    await UserRole.updateOne({ role: 'brose2' }, { $set: { role: 'readonly' } });
    schemaVersion = 12;
  }

  const files = await DzdFile.find({
    'metadata.substationVoltage': {
      $exists: false
    }
  }).lean().cursor();
  for (let file = await files.next(); file; file = await files.next()) {
    await DzdFile.updateOne({
      _id: file._id
    }, {
      $set: {
        'metadata.substationVoltage': file.metadata.substationName + '-' + file.metadata.voltageLevel
      }
    });
  }
  await files.close();

  return schemaVersion;
}

async function reCalcDzdFileMD5(schemaVersion: number) {
  if (schemaVersion < 13) {
    const files = await DzdFile.find({
      md5: {
        $exists: false
      }
    }).lean().cursor();
    const gridFS = getDzdGridFSBucket();
    for (let file = await files.next(); file; file = await files.next()) {
      const s = gridFS.openDownloadStream(file._id);
      const fileData = await utils.readFile(s);
      const md5 = crypto.createHash('md5').update(fileData).digest('hex');
      await DzdFile.updateOne({ _id: file._id }, { md5 });
    }
    await files.close();
    schemaVersion = 13;
  }

  return schemaVersion;
}

async function prepareSystemData() {
  const now = new Date();
  getDzdOriginalGridFSBucket();
  let schemaVersion = await getMongodbSchemaVersion();
  const rootDepartment = await prepareDepartment();
  await prepareRootUser(rootDepartment);
  await prepareUserAuth();
  await prepareUserRole();
  await prepareUserGroup();
  const oldSchemaVersion = schemaVersion;
  schemaVersion = await processSystemConfigs(schemaVersion);
  console.log('processSystemConfigs');
  schemaVersion = await processRoleSchema(schemaVersion);
  console.log('processRoleSchema');
  schemaVersion = await normalizeDzdFiles(schemaVersion);
  console.log('normalizeDzdFiles');
  schemaVersion = await convertScript(schemaVersion);
  console.log('convertScript');
  schemaVersion = convertStepVisibleField(schemaVersion);
  console.log('convertStepVisibleField');
  schemaVersion = await convertVoltageLevelField(schemaVersion);
  console.log('convertVoltageLevelField');
  schemaVersion = await addHideForRepealField(schemaVersion);
  console.log('addHideForRepealField');
  schemaVersion = await addViewRangeField(schemaVersion);
  console.log('addViewRangeField');
  schemaVersion = await reCalcDzdFileMD5(schemaVersion);
  console.log('reCalcDzdFileMD5');
  await setMongodbSchemaVersion(schemaVersion);
  console.log('setMongodbSchemaVersion');

  await DzdValue.updateMany({ remarks: { $exists: false } }, {
    $set: {
      remarks: []
    }
  });

  await PdfCache.updateMany({
    'metadata.specified': {
      $exists: false
    }
  }, {
    $set: {
      'metadata.specified': false
    }
  });

  if (await ProtectType.countDocuments({}) === 0) {
    await ProtectType.create([
      {
        name: '线路保护',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '主变保护',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '录波器',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '母差及失灵',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '短引线',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '就地判别',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '断路器保护',
        modifyTime: now,
        modifyUser: ''
      },
      {
        name: '主变中性点保护',
        modifyTime: now,
        modifyUser: ''
      }
    ]);
  }

  return {
    oldSchemaVersion,
    currentSchemaVersion: schemaVersion
  };
}

async function getDepartmentSubstationVoltages(departmentIds: string[]): Promise<string[]> {
  const voltages = await Voltage.find({}).lean();
  const substations = await Substation.find({
    departmentId: {
      $in: departmentIds.map((x) => toObjectId(x))
    }
  }).populate('voltage').lean();
  const set = new Set<string>();
  for (const s of substations) {
    if (s.voltage) {
      set.add(s.name + '-' + (s.voltage as unknown as IVoltage).name);
    } else {
      for (const v of voltages) {
        set.add(s.name + '-' + v.name);
      }
    }
  }
  return Array.from(set);
}

function toObjectId(id: string | ObjectId): ObjectId {
  if (typeof id === 'string') {
    return ObjectId.createFromHexString(id);
  } else {
    return id;
  }
}

function generateObjectId(): ObjectId {
  return new ObjectId();
}

function getGridFSBucket(bucketName: string): GridFSBucket {
  // @ts-ignore
  return new GridFSBucket(mongoose.connection.db, { bucketName });
}

function getSvgFSBucket(): GridFSBucket {
  return getGridFSBucket('model.svg');
}

function getXmlFSBucket(): GridFSBucket {
  return getGridFSBucket('model.xml');
}

function getStructureBucket() {
  return getGridFSBucket('model.structure');
}

function getScriptGridFSBucket(): GridFSBucket {
  return getGridFSBucket('script');
}

function getDzdFlowGridFSBucket(): GridFSBucket {
  return getGridFSBucket('dzd.flow');
}

function getPdfCacheGridFSBucket(): GridFSBucket {
  return getGridFSBucket('pdf.cache');
}

function getStampGridFSBucket(): GridFSBucket {
  return getGridFSBucket('stamp');
}

function getDzdGridFSBucket(): GridFSBucket {
  return getGridFSBucket('dzd');
}

function getHtmlCacheGridFSBucket(): GridFSBucket {
  return getGridFSBucket('html.cache');
}

function getDzdOriginalGridFSBucket(): GridFSBucket {
  return getGridFSBucket('dzd.original');
}

function getDzdOldGridFSBucket(): GridFSBucket {
  return getGridFSBucket('dzd.old');
}

function getImageGridFSBucket(): GridFSBucket {
  return getGridFSBucket('sys.image');
}

function getFormPrintTemplateGridFSBucket(): GridFSBucket {
  return getGridFSBucket('form-print-template');
}

function getFileShareGridFSBucket(): GridFSBucket {
  return getGridFSBucket('fh');
}

function getJSTemporaryBucket() {
  return getGridFSBucket('js.temporary');
}

function getJSTemplateBucket() {
  return getGridFSBucket('js.template');
}

function getJSScriptBucket() {
  return getGridFSBucket('js.script');
}

function getCurveFileBucket() {
  return getGridFSBucket('dz.curve');
}

function getProtectModelGridFS() {
  return getGridFSBucket('dz-template');
}

function waitForWriteStream(stream: GridFSBucketWriteStream | Writable) {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve(stream);
    });
    stream.on('error', err => {
      reject(err);
    });
  });
}


export {
  mongoose,
  ObjectId,
  ClientSession,
  taskGridColumns,
  queryGridColumns,
  toObjectId,
  generateObjectId,
  waitForWriteStream,
  User,
  ILoginLog,
  IViewRange,
  IUser,
  UserGroup,
  UserRole,
  IUserRole,
  IFlowButton,
  IFlowState,
  IFlowStateSetting,
  IColumnState,
  UserAuth,
  IUserAuth,
  UserSession,
  ISession,
  IUserGroup,
  Address,
  IAddress,
  AddressSchema,
  UserSchema,
  UserAuthSchema,
  UserGroupSchema,
  RouteSchema,
  UserRoleSchema,
  SessionSchema,
  Log,
  ILogData,
  ICriticalLogParam,
  addCriticalLog,
  LogSchema,
  CriticalLog,
  ICriticalLog,
  CriticalLogSchema,
  IDepartment,
  Department,
  DepartmentSchema,
  UserInfo,
  UserInfoSchema,
  DzdFile,
  IDzdFile,
  IDzdFileMetadata,
  DzdFileSchema,
  DzdFileOriginal,
  DzdFileOriginalSchema,
  IHtmlCacheMetadata,
  HtmlCache,
  IHtmlCache,
  IDzdValue,
  DzdValue,
  DzdValueSchema,
  IFormItem,
  IRecord,
  IStep,
  IFlow,
  IFlowStep,
  getDzdGridFSBucket,
  getDzdOriginalGridFSBucket,
  getDzdOldGridFSBucket,
  GridFSBucket,
  Flow,
  FlowSchema,
  FlowStepSetting,
  FlowStateSetting,
  FlowStepSettingSchema,
  FlowStateSettingSchema,
  Stamp,
  IStamp,
  IStampMetadata,
  IXForm,
  IXFormItem,
  XForm,
  XFormSchema,
  XFormItem,
  XScript,
  XScriptSchema,
  Script,
  IScriptMetadata,
  IScript,
  ScriptMetadata,
  ScriptSchema,
  TaskNotify,
  ITaskNotify,
  TaskNotifySchema,
  Task,
  TaskSchema,
  IPdfCacheMetadata,
  PdfCache,
  IPdfCache,
  DzdTask,
  IDzdTask,
  OldDzdTask,
  IDzdTaskO,
  IFormItemO,
  IRecordO,
  IStepO,
  ProtectType,
  ProtectTypeComponent,
  ProtectTypeSchema,
  ProtectTypeComponentSchema,
  ClientAuth,
  IClientAuth,
  ClientAuthSchema,
  Config,
  IConfig,
  Image,
  IImage,
  DzdFlow,
  DFlow,
  DFlowLink,
  DFlowMetadata,
  DFlowStep,
  getConfigValueByKeyAndServiceId,
  getConfigValueByKey,
  getScriptGridFSBucket,
  getImageGridFSBucket,
  getHtmlCacheGridFSBucket,
  getPdfCacheGridFSBucket,
  getConfigNumberValue,
  getStampGridFSBucket,
  getDzdFlowGridFSBucket,
  getSvgFSBucket,
  getXmlFSBucket,
  ConfigSchema,
  prepareSystemData,
  ISessInfo,
  FormPrintTemplate,
  IFormPrintTemplate,
  FileShare,
  IFileShare,
  IFileShareMetadata,
  FileShareMetadataSchema,
  FileShareSchema,
  getFormPrintTemplateGridFSBucket,
  getDepartmentSubstationVoltages,
  getFileShareGridFSBucket,
  waitForConnectionOpen,
  JSFile,
  IJSFileMetadata,
  IJSFile,
  JSFileMetadataSchema,
  JSTemplate,
  IJSTemplate,
  JSTemplateMetadataSchema,
  JSTemplateSchema,
  JSTemporary,
  IJSTemporary,
  JSTemporarySchema,
  ProtectModel,
  IProtectModelMetadata,
  IProtectModel,
  ProtectModelSchema,
  Variable,
  IVariable,
  VariableSchema,
  ProtectCalculation,
  CurveFile,
  ICurveFileMetadata,
  ICurveFile,
  CurveFileSchema,
  CurveLine,
  ICurveLine,
  CurveLineSchema,
  IHistory,
  IProtectCalculation,
  HistorySchema,
  ProtectCalculationSchema,
  ProtectCompute,
  IProtectCompute,
  ProtectComputeSchema,
  getJSTemporaryBucket,
  getJSTemplateBucket,
  getJSScriptBucket,
  getCurveFileBucket,
  getProtectModelGridFS,
  getStructureBucket,
  Substation,
  ISubstation,
  SubstationSchema,
  Voltage,
  IVoltage,
  VoltageSchema,
  Breaker,
  IBreaker,
  BreakerSchema,
  Bus,
  IBus,
  BusSchema,
  ConductorType,
  IConductorType,
  ConductorTypeSchema,
  Line,
  ILine,
  LineSchema,
  Load,
  ILoad,
  LoadSchema,
  LineSegment,
  ILineSegment,
  LineSegmentSchema,
  Tower,
  ITower,
  TowerSchema,
  TPoint,
  ITPoint,
  TPointSchema,
  Transformer,
  ITransformer,
  TransformerSchema,
  ISvg,
  Svg,
  SvgSchema,
  IXml,
  Xml,
  XmlSchema,
  SystemConfig,
  ISystemConfig,
  SystemConfigSchema,
  IType,
  Type,
  TypeSchema,
  IXmlVoltage,
  XmlVoltage,
  XmlVoltageSchema,
  Current,
  ICurrent,
  CurrentSchema,
  Calculate,
  ICalculate,
  CalculateSchema,
  IStructure,
  Structure,
  StructureSchema
};
