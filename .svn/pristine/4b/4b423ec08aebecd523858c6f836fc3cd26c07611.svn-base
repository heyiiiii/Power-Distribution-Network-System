// 导线型号
import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface IConductorType extends Document {
  name: string; // 名称
  description: string; // 描述
  overhead: boolean; // 是否为架空线(可能根据该字段筛选)
  gvalMR: number; // 几何均距
  rvalPerKM: number; // 每公里电阻
  xvalPerKM: number; // 每公里电抗
  rvalDivR0: number; // 零序正序电阻比
  xvalDivX0: number; // 零序正序电抗比
  safeCurrent: number; // 安全电流
  modifier: ObjectId;// 修改人用户ID
  createdAt: Date;// 创建时间
  updatedAt: Date;// 更新时间
}

export const ConductorTypeSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  description: String,
  overhead: Boolean,
  gvalMR: Number,
  rvalPerKM: Number,
  xvalPerKM: Number,
  rvalDivR0: Number,
  xvalDivX0: Number,
  safeCurrent: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.conductor-type',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IConductorType>('ConductorType', ConductorTypeSchema);
