import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 负荷
 * @author lh
 * @date 2022/9/14
 */

/**
 * @deprecated
 */
export interface ILoad extends Document {
  name: string; // 负载名称
  description: string; // 描述
  modifier: ObjectId; // 修改人用户id
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

/**
 * @deprecated
 */
export const LoadSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  description: String,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.load',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ILoad>('Load', LoadSchema);
