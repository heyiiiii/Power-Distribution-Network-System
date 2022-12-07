import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

export const ClientAuthSchema = new Schema({
  ip: {
    type: String,
    required: true,
    unique: true
  },
  authTime: Date,
  authTryCount: Number,
  blocked: Boolean,
  token: String
}, {
  collection: 'client-auth',
  collation: {
    locale: 'zh'
  }
});

export interface IClientAuth extends Document {
  ip: string;
  authTime: Date;
  authTryCount?: number;
  blocked: boolean;
  token: string;
}

export default mongoose.model<IClientAuth>('ClientAuth', ClientAuthSchema);
