import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 电容电流
 * @author lh
 * @date 2022/9/14
 */

export interface ICurrent extends Document {
  // xml-电压等级对应ID
  voltage: string;
  // 横截面积
  area: number;
  // 电容电流值
  value: number;
  // 描述
  description: string;
  // 地区码
  areaCode: number;
  // 修改人用户ID
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const CurrentSchema = new Schema({
  voltage: String,
  area: Number,
  value: Number,
  description: String,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.current',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ICurrent>('Current', CurrentSchema);
