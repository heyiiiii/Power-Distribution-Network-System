import { Document, model, Schema } from 'mongoose';

export interface IProtectModelMetadata {
  modifyLogs: any[];
  dzdCount: number;
  officeKey: string;
  // 地区号
  areaCode: number;
  // 创建人
  creator: string;
  // 创建时间
  createTime: Date;
  // 修改人
  modifier: string;
  // 修改时间
  modifyTime: Date;
  // 型号
  modelNumber: string;
  // 校验码
  checkCode: string;
  // 版本
  version: string;
  // 是否为六统一模板
  flag6: boolean;
  // 厂家
  factory: string;
  // 文件扩展名(.xlsx或.docx)
  extname: string;
  // 电压等级
  baseVoltageName: string;
  // 保护类型(线路、侧路、切换、变压器、站用变、中性点、断路器、母线、母联、录波器、备自投、电容器、电抗器、短引线、10kV线路、远方跳闸)
  protectType: string;
  // 接口列表
  interfaces: string[],
  // 参数检查表
  argChecks: any[],
  script: Buffer
}

export interface IProtectModel extends Document {
  filename: string;
  chunkSize: number;
  length: number;
  uploadDate: Date;
  metadata: IProtectModelMetadata;
}

export const ProtectModelSchema = new Schema({
  filename: String,
  contentType: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: {
    modifyLogs: {
      type: [Object],
      default: []
    },
    dzdCount: Number,
    officeKey: String,
    // 地区号
    areaCode: Number,
    // 创建人
    creator: String,
    // 创建时间
    createTime: Date,
    // 修改人
    modifier: String,
    // 修改时间
    modifyTime: Date,
    // 型号
    modelNumber: String,
    // 校验码
    checkCode: String,
    // 版本
    version: String,
    // 是否为六统一模板
    flag6: Boolean,
    // 厂家
    factory: String,
    // 文件扩展名(.xlsx或.docx)
    extname: String,
    // 电压等级
    baseVoltageName: String,
    // 保护类型(线路、侧路、切换、变压器、站用变、中性点、断路器、母线、母联、录波器、备自投、电容器、电抗器、短引线、10kV线路、远方跳闸)
    protectType: String,
    // 接口列表
    interfaces: [String],
    // 参数检查表
    argChecks: {
      type: [{
        field: String,
        max: Number,
        min: Number
      }],
      default: []
    },
    script: 'Buffer'
  }
}, {
  collection: 'dz-template.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IProtectModel>('ProtectModel', ProtectModelSchema);
