import {Schema} from 'mongoose';
import {ObjectId} from 'mongodb';
import {FormItemSchema, IFormItem} from '../task/dtask';

export interface IDzdFileMetadata {
  _contentType?: string;
  documentVersion?: string;
  guid?: string;
  rawFilename?: string;
  fileType?: string;
  lastModifier?: string;
  modifyTime?: Date,
  old?: boolean;
  localEditorGuid: string;
  // 检修票编号
  serviceNumber?: string;
  replaced?: boolean;
  status: string;
  hideForRepeal?: boolean;
  isFinish?: boolean;
  // 文件上传的时间
  startTime?: Date,
  endTime?: Date,
  // 计算人(上传人)
  creator?: ObjectId;
  rawFileId?: string;
  // 定值单前缀,格式?: 辽调继(2018-1223)号 | 东调继(2007-0396)号
  dzPrefix?: string;
  // 定值单号排序字段,只保留数字的前缀,辽调继(2020-临2001)号会处理为2020-2001
  prefixSort?: string;
  // 定制单号,格式?:2019-2203
  dzNumber?: string;
  // 定值单年份
  dzYear?: number;
  // 定值单编号(有可能存在'临221'这种情况)
  dzCode?: Schema.Types.Mixed;
  dzCodeN?: number;
  substationName: string;
  deviceName: string;
  deviceNameQuery?: string;
  // 所属部门
  department?: ObjectId;
  // 厂站与电压等级结合字段(查询用，配合user的viewRange做精准查询)例如: 鞍山变-220kV
  substationVoltage?: string;
  // 启动流程的时间
  createTime?: Date,
  // 审核人
  verifier?: ObjectId;
  // 审核时间
  verifyTime?: Date,
  // 调度核对人(记录执行任务节点的调度员id,不是表单中填写的调度员人名)
  auditor?: ObjectId;
  // 执行时间(调度员走流程已执行节点的时间,不是填写表单中的执行时间)
  auditTime?: Date,
  // 签发人
  sender?: ObjectId;
  sendTime?: Date,
  // 回执人
  feedback?: ObjectId;
  feedbackTime?: Date,
  invalid?: ObjectId;
  invalidTime?: Date,
  // 申请人
  applier?: ObjectId;
  // 计划执行时间
  planExecuteTime?: Date;
  // 申请时间
  applyTime?: Date,
  protectType: string;
  // 是否作废
  disabled?: boolean;
  // 作废时间
  disableTime?: Date,
  // 作废人
  disabler?: ObjectId;
  disableRemark?: string;
  // 保护型号
  protectModelNumber?: string;
  remark?: string;
  // 电压等级
  voltageLevel: string;
  // 是否签章
  stamped?: boolean;
  // 是否签名
  signed?: boolean;
  // 回执人是否查看过定值单
  repealViewed?: boolean;
  // 总查看次数
  viewCount?: number;
  // 回执人
  feedbackName?: string;
  // 定值单回执:现场保护装置的定值设置与定值单是否一致
  feedbackDzFit?: string;
  // 定值单回执?:厂站值班员
  substationOnDuty?: string;
  // 定值单回执?:运行检修（继电）人员
  maintainer?: string;
  // 定值单回执?:执行时间
  executeTime?: string;
  // 定值单回执?:填写回执时间
  receiptTime?: string;
  // 定值单调度?:省调值班调度员
  dispatcher?: string;
  // 现场已执行定值单与调度台待执行定值单是否一致
  dispatcherDzFit?: string;
  // 定值单调度?:现场接令值班员
  localeOnDuty?: string;
  // 定值单调度?:核对并执行时间
  checkTime?: string;
  // 定值单?:定值单执行情况
  executeStatus?: string;
  // 现场回执单已填写
  feedbackOver?: boolean;
  // 调度回执单已填写
  dispatchOver?: boolean;
  // 扩展字段
  extendProps?: any;
  // 表单信息
  formData?: IFormItem[];
}

export const DzdFileMetadata = new Schema<IDzdFileMetadata>({
  _contentType: String,
  documentVersion: String,
  guid: String,
  rawFilename: String,
  fileType: String,
  lastModifier: String,
  modifyTime: Date,
  old: {
    type: Boolean,
    default: false
  },
  localEditorGuid: {
    type: String,
    default: ''
  },
  // 检修票编号
  serviceNumber: {
    type: String,
    index: true
  },
  replaced: Boolean,
  status: {
    type: String,
    index: true
  },
  hideForRepeal: Boolean,
  isFinish: Boolean,
  // 文件上传的时间
  startTime: Date,
  endTime: Date,
  // 计算人(上传人)
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rawFileId: String,
  // 定值单前缀,格式: 辽调继(2018-1223)号 | 东调继(2007-0396)号
  dzPrefix: {
    type: String,
    index: true
  },
  prefixSort: {
    type: String,
    index: true
  },
  // 定制单号,格式:2019-2203
  dzNumber: {
    type: String,
    index: true
  },
  // 定值单年份
  dzYear: {
    type: Number
  },
  // 定值单编号(有可能存在'临221'这种情况)
  dzCode: {
    type: Schema.Types.Mixed,
    default: ''
  },
  dzCodeN: {
    type: Number
  },
  substationName: {
    type: String,
    index: true
  },
  deviceName: {
    type: String,
    index: true
  },
  deviceNameQuery: String,
  // 所属部门
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  // 启动流程的时间
  createTime: {
    type: Date,
    index: true
  },
  // 审核人
  verifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 审核时间
  verifyTime: {
    type: Date,
    index: true
  },
  // 调度核对人(记录执行任务节点的调度员id,不是表单中填写的调度员人名)
  auditor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 执行时间(调度员走流程已执行节点的时间,不是填写表单中的执行时间)
  auditTime: {
    type: Date,
    index: true
  },
  // 签发人
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sendTime: {
    type: Date,
    index: true
  },
  // 回执人
  feedback: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedbackTime: {
    type: Date,
    index: true
  },
  invalid: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  invalidTime: {
    type: Date,
    index: true
  },
  // 申请人
  applier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 计划执行日期
  planExecuteTime: {
    type: Date,
    index: true
  },
  // 申请时间
  applyTime: {
    type: Date,
    index: true
  },
  // 保护类型
  protectType: {
    type: String,
    index: true
  },
  // 是否作废
  disabled: Boolean,
  // 作废时间
  disableTime: {
    type: Date,
    index: true
  },
  // 作废人
  disabler: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 回执人是否查看过定值单
  repealViewed: Boolean,
  // 查看次数
  viewCount: Number,
  disableRemark: String,
  // 保护型号
  protectModelNumber: {
    type: String,
    index: true
  },
  remark: String,
  // 电压等级
  voltageLevel: {
    type: String,
    index: true
  },
  substationVoltage: {
    type: String,
    index: true
  },
  // 是否签章
  stamped: {
    type: Boolean,
    default: false
  },
  // 是否签名
  signed: {
    type: Boolean,
    default: false
  },
  // 回执人
  feedbackName: {
    type: String,
    default: ''
  },
  // 定值单回执:厂站值班员
  substationOnDuty: {
    type: String,
    default: ''
  },
  // 定值单回执:现场保护装置的定值设置与定值单是否一致
  feedbackDzFit: {
    type: String,
    default: ''
  },
  // 定值单回执:运行检修（继电）人员
  maintainer: {
    type: String,
    default: ''
  },
  // 定值单回执:执行时间
  executeTime: {
    type: String,
    index: true,
    default: ''
  },
  // 定值单回执:填写回执时间
  receiptTime: {
    type: String,
    index: true,
    default: ''
  },
  // 定值单调度:省调值班调度员
  dispatcher: {
    type: String,
    default: ''
  },
  // 定值单调度:现场接令值班员
  localeOnDuty: {
    type: String,
    default: ''
  },
  // 定值单调度:核对并执行时间
  checkTime: {
    type: String,
    default: ''
  },
  // 现场已执行定值单与调度台待执行定值单是否一致
  dispatcherDzFit: {
    type: String,
    default: ''
  },
  // 定值单调度:定值单执行情况
  executeStatus: {
    type: String,
    default: ''
  },
  // 现场回执单已填写
  feedbackOver: Boolean,
  // 调度回执单已填写
  dispatchOver: Boolean,
  // 扩展字段
  extendProps: Object,
  // 表单信息
  formData: [FormItemSchema]
}, {
  id: false,
  _id: false,
  timestamps: true
});

DzdFileMetadata.index({
  dzYear: 1,
  dzCodeN: 1
});

export default DzdFileMetadata;
