import {Document, model, Schema} from 'mongoose';

export interface IProtectType extends Document {
  name: string;
  modifyTime: Date;
  modifyUser: string;
}

export const ProtectTypeSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  modifyTime: Date,
  modifyUser: String
}, {
  collection: 'sys.protect-type',
  collation: {
    locale: 'zh'
  }
});

export default model<IProtectType>('ProtectType', ProtectTypeSchema);
