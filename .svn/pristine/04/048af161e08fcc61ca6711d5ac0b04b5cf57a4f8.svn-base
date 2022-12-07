import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IValueMeta {
  Company: string;
  BranchType: string;
  Index: string;
  relayLocationUri: string;
  Station: string;
  OldIndex: string;
  Voltage: string;
  Calculator: string;
  BranchName: string;
  EquipmentName: string;
}

export interface IDzdValueItem {
  sheet: number;
  address: string;
  key: string;
  value: string;
  oldValue?: string;
}

export interface ModifyValueItem {
  modifier: string;
  modifyTime: Date;
  values: IDzdValueItem[];
}

export interface IDzdValue extends Document {
  metadata?: IValueMeta;
  values: IDzdValueItem[];
  remarks: IDzdValueItem[];
  deprecateNumber: string;
  templateInfoUrl: string;
  generateTime: Date;
  file: ObjectId;
  modifyList: ModifyValueItem[];
}

const MDSchema = new Schema({
  Company: String,
  BranchType: String,
  Index: String,
  relayLocationUri: String,
  Station: String,
  OldIndex: String,
  Voltage: String,
  Calculator: String,
  BranchName: String,
  EquipmentName: String
}, {
  _id: false
});

const ValSchema = new Schema({
  sheet: Number,
  sheetName: String,
  address: String,
  key: String,
  value: String
}, {
  _id: false
});

const ModifyValSchema = new Schema({
  sheet: Number,
  sheetName: String,
  modifyType: String,
  address: String,
  key: String,
  value: String,
  oldValue: String
}, {
  _id: false
});

const ModifyListSchema = new Schema({
  modifier: String,
  modifyTime: Date,
  values: [ModifyValSchema]
}, {
  _id: false
});

export const DzdValueSchema = new Schema({
  metadata: MDSchema,
  values: [ValSchema],
  remarks: [ValSchema],
  templateInfoUrl: String,
  generateTime: Date,
  deprecateNumber: String,
  file: {
    type: Schema.Types.ObjectId,
    ref: 'DzdFile',
    index: true
  },
  modifyList: [ModifyListSchema]
}, {
  collection: 'dzd.value',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IDzdValue>('DzdValue', DzdValueSchema);
