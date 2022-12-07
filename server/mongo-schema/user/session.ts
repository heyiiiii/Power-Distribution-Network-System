import {ObjectId} from 'mongodb';
import {model, Schema} from 'mongoose';

export interface ISession extends Document {
  key: string;
  updateTime: Date;
  departments: any[];
  expires: Date | number;
  maxAge: number;
  token: string;
  serial: number;
  data: any;
  user: ObjectId;
}

export const SessionSchema = new Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  updateTime: {
    type: Date,
    required: true
  },
  departments: [Object],
  expires: {
    type: Date,
    required: true,
    index: {
      expires: 10
    }
  },
  maxAge: Number,
  token: String,
  serial: Number,
  data: Object,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'user.session',
  collation: {
    locale: 'zh'
  }
});

export default model<ISession>('Session', SessionSchema);
