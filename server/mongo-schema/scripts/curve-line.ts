import {Document, model, Schema} from 'mongoose';

export interface ICurveLine extends Document {
  deviceUri: string;
  deviceName: string;
  name: string;
  lineName: string;
  key: string;
  data: any[];
  xMax: number;
  xMin: number;
  xMain: number;
  yMax: number;
  yMin: number;
  yMain: number;
  yMinor: number;
  xUnitName: string;
  xUnit: string;
  xLogTag: number;
  yLogTag: number;
  updateTime: Date;
  express: string;
  areaCode: number;
}

export const CurveLineSchema = new Schema({
  deviceUri: String, // 设备uri
  deviceName: String, // 设备名称
  name: String, // 曲线名称
  lineName: String, // 线段名称
  key: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  data: Array, // 曲线坐标数据
  xMax: Number, // x轴最大值
  xMin: Number, // x轴最小值
  xMain: Number, // x轴主要刻度
  xMinor: Number, // x轴次要刻度
  yMax: Number, // y轴最大值
  yMin: Number, // Y轴最小值
  yMain: Number, // y轴主要刻度
  yMinor: Number, // y轴次要刻度
  xUnitName: String, // x轴单位名称
  xUnit: String, // x轴单位
  yUnitName: String, // y轴单位名称
  yUnit: String, // y轴单位
  xLogTag: Number, // x轴对数标记
  yLogTag: Number, // y轴对数标记
  updateTime: Date, // 更新时间
  express: String, // 计算表达式
  areaCode: Number
}, {
  collection: 'dz.curveData',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<ICurveLine>('CurveLine', CurveLineSchema);
