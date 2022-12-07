import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 母线
 * @author lh
 * @date 2022/9/14
 */

export interface IBus extends Document {
  // 名称
  name: string;
  // 电压等级id
  voltage: ObjectId;
  // 描述
  description: string;
  // 隶属厂站id，一对一关联
  substation: ObjectId;
  // 连接的线路id列表
  lines: ObjectId[];
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

export const BusSchema = new Schema({
  name: String,
  voltage: {
    type: Schema.Types.ObjectId,
    ref: 'Voltage'
  },
  description: String,
  substation: {
    type: Schema.Types.ObjectId,
    ref: 'Substation'
  },
  lines: {
    type: [Schema.Types.ObjectId],
    ref: 'Line'
  },
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
  collection: 'model.bus',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IBus>('Bus', BusSchema);
