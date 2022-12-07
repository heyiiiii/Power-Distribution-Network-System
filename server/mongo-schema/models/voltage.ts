import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 电压等级
 * @author lh
 * @date 2022/9/14
 */

export interface IVoltage extends Document {
  // 名称
  name: string;
  // 电压基准值(220)
  ubase: number,
  // 电压上限
  ubaseMax: number,
  // 电压下限
  ubaseMin: number,
  // 电流基准值
  ibase: number,
  // 阻抗基准值
  zbase: number,
  // 颜色值（#FF0000）
  color: string;
  // 描述
  description: string;
  // 修改人用户ID
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const VoltageSchema = new Schema({
  name: String,
  ubase: Number,
  ubaseMax: Number,
  ubaseMin: Number,
  ibase: Number,
  zbase: Number,
  color: String,
  description: String,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.voltage',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IVoltage>('Voltage', VoltageSchema);
