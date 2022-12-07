import {Document, model, Schema} from 'mongoose';

export interface IAddressInfo extends Document {
  index: number;
  // 联系人
  contact: string;
  // 电话
  phone: string[];
  // 职务
  headship: string[];
  // 备注
  description: string;
}

export interface IDepartment extends Document {
  code: string;
  name: string;
  parentCode: string;
  aliasName?: string;
  phone?: string;
  fax?: string;
  index: number;
  description?: string;
  headerTitle?: string;
  headerSubTitle?: string;
  indexTitle?: string;
  contactGroup: string;
  addressList: IAddressInfo[];
}

export const AddressInfoSchema = new Schema({
  index: Number,
  // 联系人
  contact: String,
  // 电话
  phone: String,
  // 职务
  headship: String,
  // 备注
  description: String
});

export const DepartmentSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  parentCode: {
    type: String,
    default: '0'
  },
  aliasName: {
    type: String,
    default: ''
  },
  phone: String,
  fax: String,
  index: Number,
  description: String,
  headerTitle: String,
  headerSubTitle: String,
  indexTitle: String,
  contactGroup: {
    type: String,
    default: ''
  },
  addressList: {
    type: [AddressInfoSchema],
    default: []
  }
}, {
  collection: 'user.department',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

DepartmentSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'departments',
  justOne: false
});

export default model<IDepartment>('Department', DepartmentSchema);
