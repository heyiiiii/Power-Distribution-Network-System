import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 配电线路
 * @author lh
 * @date 2022/9/14
 */

export interface ILine extends Document {
  // 名称
  name: string;
  // 关联的母线id，一对一关联
  bus: ObjectId;
  // 开断电流
  cutA: number;
  // 描述
  description: string;
  // 线路段id列表
  segments: ObjectId[];
  // svg关联
  svg: String;
  // 归属
  belong: 'city' | 'village';
  // 地区码
  areaCode: number,
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const LineSchema = new Schema({
  name: {
    type: String,
    index: true
  },
  bus: {
    type: Schema.Types.ObjectId,
    ref: 'Bus'
  },
  cutA: Number,
  description: String,
  segments: {
    type: [Schema.Types.ObjectId],
    ref: 'Segment'
  },
  svg: String,
  belong: String,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.line',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ILine>('Line', LineSchema);
