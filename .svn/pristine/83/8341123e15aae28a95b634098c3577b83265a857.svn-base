import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc CIME导入设备类型
 * @author lh
 * @date 2022/9/14
 */

export interface IType extends Document {
  // 名称
  name: string[];
  // svg关联id，例如：PD_30500000_63770
  svg: string;
  // 地区码
  areaCode: number;
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const TypeSchema = new Schema({
  name: Array,
  svg: String,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.type',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IType>('Type', TypeSchema);
