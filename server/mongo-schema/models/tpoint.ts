import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc T接点
 * @author lh
 * @date 2022/9/14
 */

/**
 * @deprecated
 */
export interface ITPoint extends Document {
  name: string; // T接点名称
  description: string; // 描述
  modifier: ObjectId; // 修改人用户id
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

/**
 * @deprecated
 */
export const TPointSchema = new Schema({
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
  collection: 'model.tpoint',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ITPoint>('TPoint', TPointSchema);
