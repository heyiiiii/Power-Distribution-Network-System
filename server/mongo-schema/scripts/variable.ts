import { Document, model, Schema } from 'mongoose';

// @ts-ignore
export interface IVariable extends Document {
  name: string;
  key: string;
  value: string | Object[];
  oldValue: string | Object[];
  updateTime: Date;
  description: string;
  model: string;
  areaCode: number;
}

export const VariableSchema = new Schema({
  name: String,
  key: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  value: Schema.Types.Mixed,
  oldValue: Schema.Types.Mixed,
  updateTime: Date,
  description: String,
  model: String,
  areaCode: Number
}, {
  collection: 'js.variables',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IVariable>('Variable', VariableSchema);
