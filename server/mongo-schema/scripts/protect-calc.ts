import {Document, model, Schema} from 'mongoose';

/**
 * 计算书历史表
 */

export interface IHistory {
  // 历史文件id
  id: string;
  // 历史文件名称
  name: string;
}

export interface IProtectCalculation extends Document {
  // 保护装置id
  protectId: number;
  // 保护装置名称
  protectName: string;
  // 保护类型
  protectType: string,
  // 关联设备id
  unitId: number;
  // 关联设备名称
  unitName: string;
  // 所属厂站id
  substationId: number;
  // 所属厂站名称
  substationName: string;
  // 保护计算书记录
  protectHistory: IHistory[];
  // 定值校验记录
  validateHistory: IHistory[];
  // 地区码
  areaCode: number;
  // 修改时间
  modifyTime: Date;
  // 修改人id
  modifierId: number;
  // 修改人名称
  modifierName: string;
}

export const HistorySchema = new Schema({
  id: String,
  name: String
}, {
  _id: false,
  timestamps: true
});

export const ProtectCalculationSchema = new Schema({
  protectId: {
    type: Number,
    required: true
  },
  protectName: {
    type: String,
    required: true
  },
  protectType: String,
  unitId: Number,
  unitName: String,
  substationId: Number,
  substationName: String,
  protectHistory: {
    type: [HistorySchema],
    default: []
  },
  validateHistory: {
    type: [HistorySchema],
    default: []
  },
  areaCode: Number,
  modifierId: Number,
  modifierName: String
}, {
  collection: 'protectCalculation',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IProtectCalculation>('ProtectCalculation', ProtectCalculationSchema);
