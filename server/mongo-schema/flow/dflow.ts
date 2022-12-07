import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface DFlowStep extends Document {
  name: string;
  users: ObjectId[];
  groups: ObjectId[];
  roles: ObjectId[];
  edit: boolean; // 编辑
  sign: boolean; // 签名
  stamp: boolean; // 签章
  stepType: string; // task meeting
  form: ObjectId;
  script: ObjectId;
  scriptAfter: ObjectId;
  needDeprecate: boolean;
  stepLocate: string; // begin end normal
  waitForRF: boolean; // 调度与现场回执后才可提交
  fileState: ObjectId;
  finishType: string; // 结束标志：finish(走到这一步就结束流程), execute(走到这一步后可办理,办理后结束流程)
}

export interface DFlowLink extends Document {
  name: string;
  preferState: ObjectId;
  executeType: string;
  signKeyword: string;
  script: ObjectId;
  scriptAfter: ObjectId;
  checkStamp: boolean;
  clearKeywords: boolean;
  selectUser: boolean;
  multipleSelectUser: boolean;
  useUserSelector: boolean;
  from: ObjectId;
  to: ObjectId;
}

export interface DFlowMetadata {
  _contentType: string;
  name: string;
  modifier: ObjectId;
  modifyTime: Date;
  steps: DFlowStep[];
  links: DFlowLink[];
}

export interface DFlow extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: DFlowMetadata;
}

const DFlowStepSchema = new Schema({
  name: String,
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'UserGroup'
  }],
  roles: [{
    type: Schema.Types.ObjectId,
    ref: 'UserRole'
  }],
  edit: Boolean,
  sign: Boolean,
  stamp: Boolean,
  stepType: String,
  form: Schema.Types.ObjectId,
  script: Schema.Types.ObjectId,
  scriptAfter: Schema.Types.ObjectId,
  needDeprecate: Boolean,
  stepLocate: String,
  waitForRF: Boolean,
  fileState: Schema.Types.ObjectId,
  finishType: String
});

const DFlowLinkSchema = new Schema({
  name: String,
  preferState: {
    type: Schema.Types.ObjectId,
    ref: 'FlowStateSetting'
  },
  executeType: String,
  signKeyword: String,
  script: {
    type: Schema.Types.ObjectId,
    ref: 'Script'
  },
  scriptAfter: {
    type: Schema.Types.ObjectId,
    ref: 'Script'
  },
  checkStamp: Boolean,
  clearKeywords: Boolean,
  selectUser: Boolean,
  multipleSelectUser: Boolean,
  useUserSelector: Boolean,
  from: Schema.Types.ObjectId,
  to: Schema.Types.ObjectId
});

const DFlowMetadataSchema = new Schema({
  _contentType: String,
  name: String,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  modifyTime: Date,
  steps: [DFlowStepSchema],
  links: [DFlowLinkSchema]
}, {
  id: false,
  _id: false
});

const DFlowSchema = new Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  filename: {
    type: String,
    unique: true
  },
  contentType: String,
  aliases: [String],
  metadata: DFlowMetadataSchema
}, {
  collection: 'dzd.flow.files',
  collation: {
    locale: 'zh'
  }
});

export default model<DFlow>('DFlow', DFlowSchema);
