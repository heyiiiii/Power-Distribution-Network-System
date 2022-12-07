import {Document, model, Schema} from 'mongoose';

// @ts-ignore
export interface IFlowStep extends Document {
  id: number|string;
  name: string;
  num: number;
  users: string[];
  groups: string[];
  roles: string[];
  edit: boolean;
  sign: boolean;
  unameKeyword: string;
  taskType: string;
  pointProperty: string;
  nextDzdStateId: string;
  type: string;
  formId: string;
  formShow: string;
  function: string;
  scriptId: string;
  loadCancelFrame: boolean;
  forceCheckFeedbackAndDispatch: boolean;
  lastStepIds: any[];
  nextStepIds: any[];
}

export interface IFlow extends Document {
  name: string;
  graph: string;
  modifyUser: any;
  modifyTime: Date;
  startStepKeys: number[];
  endStepKeys: number[];
  steps: IFlowStep[];
}

const FlowStepSchema = new Schema({
  id: Schema.Types.Mixed,
  name: String,
  num: Number,
  users: Array,
  groups: Array,
  roles: Array,
  edit: Boolean,
  sign: Boolean,
  unameKeyword: String,
  taskType: String,
  pointProperty: String,
  type: String,
  formId: String,
  formShow: String,
  function: String,
  scriptId: String,
  loadCancelFrame: Boolean,
  forceCheckFeedbackAndDispatch: Boolean,
  lastStepIds: Array,
  nextStepIds: Array
}, {
  id: true
});

export const FlowSchema = new Schema({
  name: String,
  graph: Object,
  modifyUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  modifyTime: Date,
  startStepKeys: Array,
  endStepKeys: Array,
  steps: [FlowStepSchema]
}, {
  collection: 'flow.graph',
  collation: {
    locale: 'zh'
  }
});

export default model<IFlow>('Flow', FlowSchema);
