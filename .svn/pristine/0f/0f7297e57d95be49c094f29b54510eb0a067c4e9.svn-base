import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';
import {IUserGroup} from './group';
import {IUserRole} from './role';
import {IUserAuth} from './auth';
import {ISession} from './session';

export interface ILoginLog {
  time: Date;
  address: string;
  status: string;
  clientTime: Date;
  userAgent: string;
  message: string;
  url: string;
}

export interface IViewRange {
  substationName: string;
  voltageLevel: string;
  viewType: string; // all task query
}

export interface IUser extends Document {
  name: string;
  status: string;
  rawAccount: string;
  account: string;
  password: string;
  salt: string;
  departments: ObjectId[];
  flows: ObjectId[];
  regTime: Date;
  npId: string;
  npToken: string;
  viewSelfDepartment: string; // inherit yes no
  loginLogs: ILoginLog[];
  groups: IUserGroup[];
  sessions: ISession[];
  viewRange: IViewRange[];
  voltageLevels: string[];
  roles?: IUserRole[];
  auths?: IUserAuth[];
  routes?: any[];
  params?: any;
  roleIds?: string[];
  authIds?: string[];
}

export const ViewRangeSchema = new Schema({
  substationName: String,
  voltageLevel: String,
  viewType: String // all task query
}, {
  _id: false,
  id: false
});

export const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    default: 'disabled',
    enum: ['disabled', 'enabled', 'pwdreset', 'warning']
  },
  // @ts-ignore
  rawAccount: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  account: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 40
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  departments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    }
  ],
  flows: [
    {
      type: Schema.Types.ObjectId,
      ref: 'DFlow'
    }
  ],
  regTime: {
    type: Date,
    required: true
  },
  npId: {
    type: String,
    default: ''
  },
  npToken: {
    type: String,
    default: ''
  },
  viewSelfDepartment: {
    type: String,
    default: 'inherit'
  },
  viewRange: {
    type: [ViewRangeSchema],
    default: []
  },
  voltageLevels: {
    type: [String],
    default: []
  },
  loginLogs: [{
    time: Date,
    address: String,
    status: String,
    clientTime: Date,
    userAgent: String,
    message: String,
    url: String,
    _id: false
  }]
}, {
  collection: 'user',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

UserSchema.virtual('groups', {
  ref: 'UserGroup',
  localField: '_id',
  foreignField: 'users',
  justOne: false
});

UserSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

export default model<IUser>('User', UserSchema);
