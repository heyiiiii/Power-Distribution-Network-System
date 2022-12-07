import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';

export interface IFormItem {
  key: string;
  value: any;
  oldValue?: any;
  updateTime: Date;
  userId: string;
}

export interface IStep {
  stepId: string;
  fileStatusMark: string;
  specifyUserIds: string[];
  commitUserIds: string[];
}

export interface IRecord {
  stepId: string;
  userId: string;
  fileStatusMark: string;
  specifyUserIds: string[];
  commitUserIds: string[];
  optionTime: Date;
  force: boolean;
  // 驳回: reject, 提交: commit, 撤回: revoke
  executeType: string;
  targetStatusMark: string;
}

export interface IDzdTask extends Document {
  name: string;
  file: ObjectId;
  flow: ObjectId;
  step: IStep;
  excludeUserIds: string[];
  excludeRoles: string[];
  formData: IFormItem[],
  creator: ObjectId;
  createTime: Date;
  finishTime?: Date;
  records: IRecord[];
  errorMessages: string[];
  messages: string[];
  lastUpdateStamp: string;
  localEditorGuid: string;
}

export const FormItemSchema = new Schema({
  key: String,
  value: Object,
  oldValue: Object,
  updateTime: Date,
  userId: String
}, {
  _id: false
});

export const RecordSchema = new Schema({
  stepId: String,
  userId: String,
  fileStatusMark: String,
  specifyUserIds: [String],
  commitUserIds: [String],
  optionTime: Date,
  force: Boolean,
  executeType: String
}, {
  _id: false,
  timestamps: true
});

export const StepSchema = new Schema({
  stepId: String,
  fileStatusMark: String,
  specifyUserIds: [String],
  commitUserIds: [String]
}, {
  _id: false,
  timestamps: true
});

export const DzdTaskSchema = new Schema({
  name: String,
  file: {
    type: Schema.Types.ObjectId,
    ref: 'DzdFile',
    unique: true
  }, // 文件id
  flow: {
    type: Schema.Types.ObjectId,
    ref: 'DFlow'
  }, // 使用流程id
  step: StepSchema,
  excludeUserIds: [String],
  excludeRoles: [String],
  formData: [FormItemSchema],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createTime: Date,
  finishTime: Date,
  records: [RecordSchema],
  errorMessages: [String],
  messages: [String],
  lastUpdateStamp: String
}, {
  collection: 'dzd.tasks',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IDzdTask>('DzdTask', DzdTaskSchema);
