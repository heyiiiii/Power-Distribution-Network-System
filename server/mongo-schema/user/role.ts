import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';
import {IUserGroup} from './group';

export interface IColumnState {
  colId: string;
  headerName: string;
  width: number;
  suppressMenu: boolean;
  hide: boolean;
  index: number;
  drop: boolean;
}

export interface IFlowButton {
  index: number;
  size: string;
  text: string;
  fontSize: string;
  bold: boolean;
  backgroundColor: string;
  textColor: string;
  icon: string;
  iconColor: string;
  func: string;
  showMainForm: boolean;
  loading?: boolean;
  disabled?: boolean;
  additional?: string;
}

export interface IFlowState {
  state: ObjectId;
  taskCount?: number;
  availableInQuery: boolean;
  nameInQuery: string;
  indexInQuery: number;
  availableInTask: boolean;
  stepVisibleInTask: boolean;
  batchInTask: boolean;
  nameInTask: string;
  indexInTask: number;
  showPreviewInTaskProcess: boolean;
  showHistoryInTaskProcess: boolean;
  doubleClickActionInTask: string;
  formIdInTaskProcess: string;
  showCancelInTaskProcess: boolean;
  historyQueryStatusInTaskProcess: string;
  hideWhenEmptyInTask: boolean;
  buttonsInTask: IFlowButton[];
  availableInOwn: boolean;
  stepVisibleInOwn: boolean;
  batchInOwn: boolean;
  nameInOwn: string;
  indexInOwn: number;
  showPreviewInOwnProcess: boolean;
  showHistoryInOwnProcess: boolean;
  doubleClickActionInOwn: string;
  formIdInOwnProcess: string;
  showCancelInOwnProcess: boolean;
  historyQueryStatusInOwnProcess: string;
  hideWhenEmptyInOwn: boolean;
  buttonsInOwn: IFlowButton[];
  columnStatesInTask: IColumnState[];
  columnStatesInOwn: IColumnState[];
}

export interface IUserRole extends Document {
  role: string;
  name: string;
  inner: boolean;
  stateConfigs: IFlowState[];
  appAuths: ObjectId[];
  executeAuths: ObjectId[];
  enableUpload: boolean;
  executeFlow: boolean;
  viewCurrentAndHistoryStore: boolean;
  viewSelfDepartmentOnly: boolean;
  description: string;
  index: number;
  groups: IUserGroup[];
  columnStatesInQuery: IColumnState[];
}

export const FlowButton = new Schema({
  func: String,
  text: String,
  index: Number,
  size: {
    type: String,
    default: 'default'
  },
  fontSize: String,
  bold: Boolean,
  backgroundColor: String,
  textColor: String,
  icon: String,
  iconColor: String,
  showMainForm: Boolean,
  additional: String
}, {
  id: false,
  _id: false
});

export const ColumnState = new Schema({
  colId: String,
  headerName: String,
  width: Number,
  suppressMenu: Boolean,
  hide: Boolean,
  index: Number,
  drop: Boolean
}, {
  id: false,
  _id: false
});

export const FlowState = new Schema({
  state: {
    type: Schema.Types.ObjectId,
    ref: 'FlowStateSetting'
  },
  availableInQuery: Boolean,
  nameInQuery: String,
  indexInQuery: Number,
  availableInTask: Boolean,
  stepVisibleInTask: Boolean,
  batchInTask: Boolean,
  nameInTask: String,
  indexInTask: Number,
  showPreviewInTaskProcess: Boolean,
  showHistoryInTaskProcess: Boolean,
  doubleClickActionInTask: String,
  formIdInTaskProcess: String,
  showCancelInTaskProcess: Boolean,
  historyQueryStatusInTaskProcess: String,
  hideWhenEmptyInTask: Boolean,
  buttonsInTask: {
    type: [FlowButton],
    default: []
  },
  columnStatesInTask: {
    type: [ColumnState],
    default: []
  },
  availableInOwn: Boolean,
  stepVisibleInOwn: Boolean,
  batchInOwn: Boolean,
  nameInOwn: String,
  indexInOwn: Number,
  showPreviewInOwnProcess: Boolean,
  showHistoryInOwnProcess: Boolean,
  doubleClickActionInOwn: String,
  formIdInOwnProcess: String,
  showCancelInOwnProcess: Boolean,
  historyQueryStatusInOwnProcess: String,
  hideWhenEmptyInOwn: Boolean,
  buttonsInOwn: {
    type: [FlowButton],
    default: []
  },
  columnStatesInOwn: {
    type: [ColumnState],
    default: []
  }
}, {
  id: false,
  _id: false
});

export const UserRoleSchema = new Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    default: 'view',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  inner: {
    type: Boolean,
    default: false
  },
  stateConfigs: {
    type: [FlowState],
    default: []
  },
  columnStatesInQuery: {
    type: [ColumnState],
    default: []
  },
  appAuths: [
    {
      type: Schema.Types.ObjectId,
      ref: 'FlowStateSetting'
    }
  ],
  executeAuths: [
    {
      type: Schema.Types.ObjectId,
      ref: 'FlowStateSetting'
    }
  ],
  // 是否允许上传
  enableUpload: {
    type: Boolean,
    default: false
  },
  // 是否可办理任务
  executeFlow: {
    type: Boolean,
    default: true
  },
  // 是否可查看当前库/历史库
  viewCurrentAndHistoryStore: {
    type: Boolean,
    default: true
  },
  viewSelfDepartmentOnly: {
    type: Boolean,
    default: false
  },
  description: String,
  index: Number
}, {
  collection: 'user.role',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

UserRoleSchema.virtual('groups', {
  ref: 'UserGroup',
  localField: '_id',
  foreignField: 'roles',
  justOne: false
});

export default model<IUserRole>('UserRole', UserRoleSchema);
