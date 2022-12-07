import { Document, model, ObjectId, Schema } from 'mongoose';

/**
 * @desc 图形拓扑
 * @author lh
 * @date 2022/9/14
 */

export interface IStructureMetadata {
  // svg关联Id, 例如PD_10000100_99217
  svgId: string;
  // 地区码
  areaCode: number;
  // 修改人
  modifier: ObjectId;
}

export interface IStructure extends Document {
  // 文件名称
  filename: string;
  // 数据块大小
  chunkSize: number,
  // 文件大小
  length: number,
  // 上传日期
  uploadDate: Date,
  // 元数据
  metadata: IStructureMetadata
}

export const StructureMetadataSchema = new Schema({
  svgId: String,
  areaCode: Number,
  modifierId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  _id: false,
  id: false
});

export const StructureSchema = new Schema({
  filename: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: StructureMetadataSchema
}, {
  collection: 'model.structure.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IStructure>('Structure', StructureSchema);
