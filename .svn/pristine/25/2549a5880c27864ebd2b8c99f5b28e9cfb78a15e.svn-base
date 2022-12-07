import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';
import {IUserGroup} from './group';

export interface IUserAuth extends Document {
  auth: string;
  name: string;
  inner: boolean;
  description: string;
  index: number;
  groups: IUserGroup[];
}

export const UserAuthSchema = new Schema({
  auth: {
    type: String,
    required: true,
    unique: true,
    default: 'user',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  inner: {
    type: Boolean,
    default: false
  },
  description: String,
  index: Number
}, {
  collection: 'user.auth',
  collation: {
    locale: 'zh'
  }
});

UserAuthSchema.virtual('groups', {
  ref: 'UserGroup',
  localField: '_id',
  foreignField: 'auths',
  justOne: false
});

export default mongoose.model<IUserAuth>('UserAuth', UserAuthSchema);
