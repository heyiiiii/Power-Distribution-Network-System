import {Document, model, Schema} from 'mongoose';

export interface IFlowStepSetting extends Document {
  name: string;
  stateId: string;
  color: string;
  time: Date;
  index: number;
}

export const FlowStepSettingSchema = new Schema({
  name: String,
  stateId: String,
  color: String,
  time: Date,
  index: Number
}, {
  collection: 'setting.flow-step',
  collation: {
    locale: 'zh'
  }
});

export default model<IFlowStepSetting>('FlowStepSetting', FlowStepSettingSchema);
