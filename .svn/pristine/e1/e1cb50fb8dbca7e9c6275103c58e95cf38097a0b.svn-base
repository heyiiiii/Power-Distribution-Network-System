import {model, Schema} from 'mongoose';

const TaskStepSchema = new Schema({
  name: String,
  num: String,
  users: Array,
  groups: Array,
  roles: Array,
  taskType: String,
  pointProperty: String,
  type: String,
  formId: String,
  function: String,
  scriptId: String,
  lastStepIds: Array,
  nextStepIds: Array,
  hasLast: Boolean,
  hasNext: Boolean,
  finished: Boolean,
  createTime: Date,
  finishTime: Date,
  status: String,
  remark: String,
  formdata: Object, // 当前步骤处理后的表单数据
  executor: Array
}, {
  id: true
});

const FeedbackSchema = new Schema({
  substationName: String,
  deviceName: String,
  protectType: String,
  protectModelNumber: String,
  subDutyUser: String,
  repairName: String,
  auditTime: Date,
  dzFit: String,
  feedbackName: String,
  feedback: String,
  feedbackTime: Date
}, {
  id: true
});

const AuditSchema = new Schema({
  substationName: String,
  deviceName: String,
  protectType: String,
  protectModelNumber: String,
  scenceName: String,
  auditTime: Date,
  auditor: String,
  auditorName: String,
  dzFit: String,
  auditCondition: String
}, {
  id: true
});

export const TaskSchema = new Schema({
  name: String,
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'DzdFile'
  }, // 文件id
  flowId: String, // 使用流程id
  currentStepId: String, // 当前步骤id
  currentStep: Object, // 当前步骤信息
  currentStateId: String, // 当前所在状态id
  currentFinishStateId: String, // 当前已完成状态id
  executors: Array, // 当前需要执行的人员
  allUsers: Array, // 所有参与人员
  steps: [TaskStepSchema], // 流转详情
  isDelete: Boolean, // 是否作废
  isFinish: Boolean, // 是否归档
  calcUserId: String, // 计算人  脚本控制
  calcTime: Date, // 计算时间  脚本控制
  checkUserId: String, // 审核人  脚本控制
  checkTime: Date, // 审核时间  脚本控制
  doUserId: String, // 执行人  脚本控制
  doTime: Date, // 执行时间  脚本控制
  authUserId: String, // 批准人  脚本控制
  authTime: Date, // 批准时间  脚本控制
  signUserId: String, // 签发人  脚本控制
  signTime: Date, // 签发时间  脚本控制
  verifyUserId: String, // 核对人  脚本控制
  verifyTime: String, // 核对时间  脚本控制
  formdata: Object, // 当前步骤的表单数据
  formId: String,
  createTime: Date,
  createUserId: String,
  createUserName: String,
  finishTime: Date,
  finishUserId: String,
  remark: String,
  status: Boolean, // 当前任务是否为删除任务  不同于作废
  feedbackInfo: FeedbackSchema,
  auditInfo: AuditSchema
}, {
  collection: 'flow.task',
  collation: {
    locale: 'zh'
  }
});

export default model('Task', TaskSchema);
