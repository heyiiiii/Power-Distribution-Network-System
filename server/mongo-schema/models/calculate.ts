import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 计算定值
 * @author lh
 * @date 2022/9/14
 */

export interface ICalculate extends Document {
  // 计算参数
  params: Object;
  // 开关关联svg
  breakerSvg: string;
  // 召回状态 (0未召回 1已召回 2收到召回结果 3已发送定值单 4收到修改结果)
  status: number;
  // 召回结果
  recallResult: Object;
  // 修改定值单结果
  modifyResult: Object;
  // gisId
  gisId: string;
  // 定值单编号
  number: number;
  // 发送定值单时间
  sendTime: string;
  // 地区码
  areaCode: number;
  // 修改人用户ID
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const CalculateSchema = new Schema({
  params: Object,
  breakerSvg: String,
  status: Number,
  recallResult: Object,
  gisId: String,
  number: Number,
  sendTime: String,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.calculate',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ICalculate>('Calculate', CalculateSchema);
