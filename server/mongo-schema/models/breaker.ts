import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 开关
 * @author lh
 * @date 2022/9/14
 */

export interface IBreaker extends Document {
  // 开关名称
  name: string;
  // 开关类型
  breakerType: string;
  // 开关功能 (loop 联络 outlet 出线)
  funcType: string;
  // 计算类型 (protect 保护 selfHealing 自愈)
  calculateType: string;
  // 控制器型号
  ctrlModelNumber: string;
  // 零序CT变比分子，例如：20
  ct01: number;
  // 零序CT变比分母，例如：1
  ct02: number;
  // 零序CT精度，例如：5P20
  ct0Precision: string;
  // 正序CT变比分子，例如：600
  ct11: number;
  // 正序CT变比分母，例如：5
  ct12: number;
  // 正序CT精度，例如：5P20
  ct1Precision: string;
  // 总配变容量(kVA)
  totalCapacity: number;
  // 最大配变容量(kVA)
  maxCapacity: number;
  // 最大电动机容量(kVA)
  maxMotorCapacity: number;
  // 保留字段
  pmsid: string;
  // svg关联id，例如：PD_30500000_63770
  svg: string;
  // 过流Ⅱ段电流定值
  overCurrentIISetting: number;
  // 过流Ⅱ段时间定值
  overCurrentIITime: number;
  // 过流Ⅲ段电流定值
  overCurrentIIISetting: number;
  // 过流Ⅲ段时间定值
  overCurrentIIITime: number;
  // 长延时 二次重合闸时间
  reclosingTime: number;
  // 短延时（一次重合闸时间）
  shortTime: number;
  // 所属线路关联id
  line: ObjectId;
  // 保护型号关联id
  protect: ObjectId;
  // 地区码
  areaCode: number;
  // 描述
  description: string;
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const BreakerSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  breakerType: String,
  funcType: String,
  calculateType: String,
  ctrlModelNumber: String,
  ct01: Number,
  ct02: Number,
  ct0Precision: String,
  ct11: Number,
  ct12: Number,
  ct1Precision: String,
  totalCapacity: Number,
  maxCapacity: Number,
  maxMotorCapacity: Number,
  pmsid: String,
  svg: String,
  overCurrentIISetting: Number,
  overCurrentIITime: Number,
  overCurrentIIISetting: Number,
  overCurrentIIITime: Number,
  reclosingTime: Number,
  shortTime: Number,
  line: {
    type: Schema.Types.ObjectId,
    ref: 'Line'
  },
  protect: {
    type: Schema.Types.ObjectId,
    ref: 'ProtectModel'
  },
  description: String,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.breaker',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IBreaker>('Breaker', BreakerSchema);
