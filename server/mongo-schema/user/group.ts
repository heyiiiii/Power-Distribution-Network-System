import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';
import {IUserAuth} from './auth';
import {IUserRole} from './role';
import {IUser} from './user';

export interface IRoute extends Document {
  label: string;
  description: string;
  icon: string;
  name: string;
  path: string;
  params: any;
  index: number;
  parentId: ObjectId;
}

export interface IUserGroup extends Document {
  name: string;
  description: string;
  index: number;
  inner: boolean;
  params: any,
  routes: IRoute[];
  users: ObjectId[] | IUser[];
  auths: ObjectId[] | IUserAuth[];
  roles: ObjectId[] | IUserRole[];
}

export const RouteSchema = new Schema(
  {
    label: {
      type: String,
      required: true
    },
    description: String,
    icon: String,
    name: String,
    path: String,
    params: Object,
    index: Number,
    parentId: {
      type: Schema.Types.ObjectId
    }
  },
  {
    id: true
  }
);

export const UserGroupSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    description: String,
    index: Number,
    inner: {
      type: Boolean,
      default: false
    },
    params: Object,
    routes: [RouteSchema],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    auths: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserAuth'
      }
    ],
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserRole'
      }
    ]
  },
  {
    collection: 'user.group',
    collation: {
      locale: 'zh'
    }
  }
);

export default model<IUserGroup>('UserGroup', UserGroupSchema);
