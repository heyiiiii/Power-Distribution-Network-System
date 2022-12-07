import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IFormItemO {
  key: string;
  value: any;
  oldValue?: any;
  updateTime: Date;
  userId: string;
}

export interface IStepO {
  stepId: string;
  fileStatusMark: string;
  specifyUserIds: string[];
  commitUserIds: string[];
}

export interface IRecordO {
  stepId: string;
  userId: string;
  fileStatusMark: string;
  specifyUserIds: string[];
  commitUserIds: string[];
  optionTime: Date;
  // 驳回: reject, 提交: commit, 撤回: revoke
  executeType: string;
  targetStatusMark: string;
}

export interface IDzdTaskO extends Document {
  name: string;
  file: ObjectId;
  flow: ObjectId;
  step: IStepO;
  excludeUserIds: string[];
  excludeRoles: string[];
  formData: IFormItemO[],
  creator: ObjectId;
  createTime: Date;
  finishTime?: Date;
  records: IRecordO[];
  errorMessages: string[];
  messages: string[];
  lastUpdateStamp: string;
}

export const FormItemSchemaO = new Schema({
  key: String,
  value: Object,
  oldValue: Object,
  updateTime: Date,
  userId: String
}, {
  _id: false
});

export const RecordSchemaO = new Schema({
  stepId: String,
  userId: String,
  fileStatusMark: String,
  specifyUserIds: [String],
  commitUserIds: [String],
  optionTime: Date,
  executeType: String,
  targetStatusMark: String
}, {
  _id: false,
  timestamps: true
});

export const StepSchemaO = new Schema({
  stepId: String,
  fileStatusMark: String,
  specifyUserIds: [String],
  commitUserIds: [String]
}, {
  _id: false,
  timestamps: true
});

export const OldDzdTask = new Schema({
  name: String,
  file: {
    type: Schema.Types.ObjectId,
    ref: 'DzdFile',
    index: true,
    unique: true
  }, // 文件id
  flow: {
    type: Schema.Types.ObjectId,
    ref: 'DFlow'
  }, // 使用流程id
  step: StepSchemaO,
  excludeUserIds: [String],
  excludeRoles: [String],
  formData: [FormItemSchemaO],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createTime: Date,
  finishTime: Date,
  records: [RecordSchemaO],
  errorMessages: [String],
  messages: [String],
  lastUpdateStamp: String
}, {
  collection: 'dzd.tasks.old',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IDzdTaskO>('OldDzdTask', OldDzdTask);
