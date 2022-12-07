import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc 厂站
 * @author lh
 * @date 2022/9/14
 */

export interface ISubstation extends Document {
  // 名称
  name: string;
  // 关联的电压等级svg
  voltage: string;
  // 变电站类型
  subType: '变电站' | '火电厂' | '开关站' | '风电厂' | '水电站' | '核电站' | '光伏电站' | '抽水蓄能';
  // 描述
  description: string;
  // 站内10kV母线id列表，一对多关系
  buses: ObjectId[];
  // svg关联id，例如：PD_30500000_63770
  svg: string;
  // 图形区域
  geographicalRegions: object[];
  // 地区码
  areaCode: number;
  // 修改人用户id
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const SubstationSchema = new Schema({
  name: {
    type: String,
    unique: true
  },
  voltage: String,
  subType: String,
  description: String,
  buses: {
    type: [Schema.Types.ObjectId],
    ref: 'Bus'
  },
  svg: String,
  geographicalRegions: Array,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.substation',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<ISubstation>('Substation', SubstationSchema);
