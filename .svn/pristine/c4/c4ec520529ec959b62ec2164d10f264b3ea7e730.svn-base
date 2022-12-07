import {Document, model, Schema} from 'mongoose';

/**
 * 保护计算书脚本关联表
 */

export interface IProtectCompute extends Document {
  // 菜单名称
  menuName: string;
  // 关联设备类型
  protectType: string;
  // 脚本类型
  computeType: string;
  // 关联脚本名称
  scriptName: string;
  // 关联脚本id
  scriptFileId: string;
  // 地区码
  areaCode: number;
  // 更新时间
  updateTime: Date;
}

export const ProtectComputeSchema = new Schema({
  menuName: String,
  protectType: String,
  computeType: String,
  scriptName: String,
  scriptFileId: String,
  areaCode: Number,
  updateTime: Date
}, {
  collection: 'dz.protectCompute',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IProtectCompute>('ProtectCompute', ProtectComputeSchema);
