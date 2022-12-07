import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

export interface IAddress extends Document {
  groups: string[];
  index: number;
  department: string;
  principle: string;
  phone: string;
  fax: string;
  address: string;
}

export const AddressSchema = new Schema({
  groups: [String],
  index: Number,
  department: String,
  principle: String,
  phone: String,
  fax: String,
  address: String
}, {
  collection: 'user.address',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model<IAddress>('Address', AddressSchema);
