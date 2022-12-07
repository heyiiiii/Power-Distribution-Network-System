import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';

export interface IUserInfo extends Document {
  user: ObjectId,
  phone: string;
  fax: string;
  email: string;
}

export const UserInfoSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    phone: String,
    fax: String,
    email: String
  },
  {
    collection: 'user.user-info',
    collation: {
      locale: 'zh'
    }
  }
);

export default model<IUserInfo>('UserInfo', UserInfoSchema);
