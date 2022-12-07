import { Document, model, Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * @desc xml导入的电压等级
 * @author lh
 * @date 2022/9/14
 */

export interface IXmlVoltage extends Document {
  // 名称
  name: string;
  // svg关联id，例如：PD_BaseVoltage_8
  svg: string;
  // 电压值
  value: number;
  // 地区码
  areaCode: number;
  // 修改人用户ID
  modifier: ObjectId;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

export const XmlVoltageSchema = new Schema({
  name: String,
  svg: String,
  value: Number,
  areaCode: Number,
  modifier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'model.xml-voltage',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

export default model<IXmlVoltage>('XmlVoltage', XmlVoltageSchema);
