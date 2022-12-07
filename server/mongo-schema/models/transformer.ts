import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 变压器
 * @author lh
 * @date 2022/9/14
 */

export interface ITransformer extends Document {
  // 名称
  name: string;
  // 类型
  type: string;
  // 描述
  description: string;
  // UK百分比
  uk: number;
  // 容量
  capacity: number;
  // svg关联id，例如：PD_30500000_63770
  svg: string;
  // 所属线路图关联id
  line: ObjectId;
  // 地区码
  areaCode: number;
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const TransformerSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  type: String,
  description: String,
  uk: Number,
  capacity: Number,
  svg: String,
  line: {
    type: Schema.Types.ObjectId,
    ref: 'Line'
  },
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.transformer',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ITransformer>('Transformer', TransformerSchema);
