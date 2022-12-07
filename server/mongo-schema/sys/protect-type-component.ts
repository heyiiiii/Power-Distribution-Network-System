import {Document, model, Schema} from 'mongoose';

export interface IProtectTypeComponent extends Document {
  name: string;
  remark: string;
  modifyTime: Date;
  modifyUser: string;
  protectTypeId: string;
}

export const ProtectTypeComponentSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  remark: String,
  modifyTime: Date,
  modifyUser: String,
  protectTypeId: {
    type: String,
    index: true
  }
}, {
  collection: 'sys.protect-type-component',
  collation: {
    locale: 'zh'
  }
});

export default model<IProtectTypeComponent>('ProtectTypeComponent', ProtectTypeComponentSchema);
