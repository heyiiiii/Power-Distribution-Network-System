import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';

export interface ISession extends Document {
  key: string;
  createTime: Date;
  expireTime: Date;
  domain: string;
  clientAddress: string;
  userAgent: string;
  uaHash: string;
  refreshTime: Date;
  temporary: boolean;
  user: ObjectId;
  data: any;
}

export const SessionSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  createTime: {
    type: Date,
    required: true,
    index: {
      expires: '14d'
    }
  },
  expireTime: {
    type: Date,
    required: true
  },
  domain: String,
  clientAddress: String,
  userAgent: String,
  uaHash: String,
  refreshTime: Date,
  temporary: Boolean,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  data: Object
}, {
  collection: 'user.session2',
  collation: {
    locale: 'zh'
  }
});

export default model<ISession>('Session', SessionSchema);
