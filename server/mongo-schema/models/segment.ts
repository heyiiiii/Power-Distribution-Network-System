import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 线路段
 * @author lh
 * @date 2022/9/14
 */

export interface ILineSegment extends Document {
  // 名称
  name: string;
  // 线路铺设类型（架空线：取值overhead，电缆线：取值cable）
  lineType: string;
  // 导线型号ID，关联conductor-type对象
  conductorType: ObjectId;
  // 长度（km）
  length: number;
  // 线路段在线路中的顺序序位置
  index: number;
  // 截面积（mm）
  sectionSurface: number;
  // 是否有架空地线(只有lineType为overhead时该字段有效）
  ground: boolean;
  // 是否同杆塔双回线（只有lineType为overhead时该字段有效）
  circuit: boolean;
  // 起端设备id
  startDeviceId: ObjectId;
  // 起端设备类型
  startDeviceType: string;
  // 终端设备id
  endDeviceId: ObjectId;
  // 终端设备类型
  endDeviceType: string;
  // 正序电阻（Ω）
  valR1: number;
  // 正序电抗（Ω）
  valX1: number;
  // 零序电阻（Ω）
  valR0: number;
  // 零序电抗（Ω）
  valX0: number;
  // svg关联id，例如：PD_30500000_63770
  svg: string;
  // 所属线路图关联id
  line: ObjectId;
  // 地区码
  areaCode: number;
  // 修改人用户ID
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const LineSegmentSchema = new Schema({
  name: String,
  lineType: String,
  conductorType: {
    type: Schema.Types.ObjectId,
    ref: 'ConductorType'
  },
  length: Number,
  index: Number,
  sectionSurface: Number,
  ground: Boolean,
  circuit: Boolean,
  startDeviceId: Schema.Types.ObjectId,
  startDeviceType: String,
  endDeviceId: Schema.Types.ObjectId,
  endDeviceType: String,
  valR1: Number,
  valX1: Number,
  valR0: Number,
  valX0: Number,
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
  collection: 'model.line-segment',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ILineSegment>('LineSegment', LineSegmentSchema);
