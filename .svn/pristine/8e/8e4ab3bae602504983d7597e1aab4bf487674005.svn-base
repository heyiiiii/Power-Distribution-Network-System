import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';

export interface ILogData extends Document {
  time: Date;
  serverId: string;
  version: number;
  address: string;
  url: string;
  method: string;
  level: string;
  category: string;
  module: string;
  duration: number;
  userId?: ObjectId;
  error?: any;
  context?: string;
  description?: string;
  param?: any;
  headers?: any;
  query?: any;
  result?: any;
  succ?: string;
  message?: string;
  contentType?: string;
  contentLength?: string;
  resultType?: string;
}

export const LogSchema = new Schema({
  time: {
    type: Date,
    default: Date.now,
    index: {
      expires: '3d'
    }
  },
  serverId: String,
  version: Number,
  address: String,
  duration: Number,
  url: String,
  method: String,
  param: Object,
  headers: Object,
  query: String,
  module: String,
  level: String,
  category: String,
  error: Object,
  context: String,
  description: String,
  result: Object,
  succ: String,
  message: String,
  resultType: String,
  contentType: String,
  contentLength: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'sys.logs',
  collation: {
    locale: 'zh'
  }
});

LogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

export default model<ILogData>('Log', LogSchema);
