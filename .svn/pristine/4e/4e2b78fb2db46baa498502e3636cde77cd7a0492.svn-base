import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * 系统参数
 */

export interface ISystemConfig extends Document {
  // 名称
  name: string;
  // 值
  value: string;
  // 描述
  description: string;
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const SystemConfigSchema = new Schema({
  name: String,
  value: String,
  description: String,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'setting.system',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ISystemConfig>('SystemConfig', SystemConfigSchema);
