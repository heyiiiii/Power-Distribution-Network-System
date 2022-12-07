import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

export interface IFlowStateSetting extends Document {
  name: string;
  operationBtn: any[];
  color: string;
  mark: string;
  time: Date;
  batchExecute: boolean;
  examine: boolean;
  approve: boolean;
  cancel: boolean;
  feedback: boolean;
  calculate: boolean;
  executed: boolean;
  choiceColumns: any[];
  cancelStatus: string;
  recallColumns: string;
  index: number;
}

export const FlowStateSettingSchema = new Schema({
  name: String,
  operationBtn: Array,
  color: String,
  mark: String,
  time: Date,
  batchExecute: Boolean,
  examine: Boolean,
  approve: Boolean,
  cancel: Boolean,
  feedback: Boolean,
  calculate: Boolean,
  executed: Boolean,
  choiceColumns: [],
  cancelStatus: String,
  recallColumns: String,
  index: Number
}, {
  collection: 'setting.flow-state',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model<IFlowStateSetting>('FlowStateSetting', FlowStateSettingSchema);
