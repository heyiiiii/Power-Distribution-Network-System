import { Document, model, ObjectId, Schema } from 'mongoose';

/**
 * xml
 */

export interface IXmlMetadata {
  // 线路关联id
  line: string;
  // 地区码
  areaCode: number;
  // 修改人
  modifier: ObjectId;
}

export interface IXml extends Document {
  // 文件名称
  filename: string;
  // 数据块大小
  chunkSize: number,
  // 文件大小
  length: number,
  // 上传日期
  uploadDate: Date,
  // 元数据
  metadata: IXmlMetadata
}

export const XmlMetadataSchema = new Schema({
  line: String,
  areaCode: Number,
  modifierId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  _id: false,
  id: false
});

export const XmlSchema = new Schema({
  filename: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: XmlMetadataSchema
}, {
  collection: 'model.xml.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IXml>('Xml', XmlSchema);
