import { Document, model, ObjectId, Schema } from 'mongoose';

/**
 * @desc svg
 * @author lh
 * @date 2022/9/14
 */

export interface ISvgMetadata {
  // 线路关联id
  line: string;
  // 地区码
  areaCode: number;
  // 修改人
  modifier: ObjectId;
}

export interface ISvg extends Document {
  // 文件名称
  filename: string;
  // 数据块大小
  chunkSize: number,
  // 文件大小
  length: number,
  // 上传日期
  uploadDate: Date,
  // 元数据
  metadata: ISvgMetadata
}

export const SvgMetadataSchema = new Schema({
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

export const SvgSchema = new Schema({
  filename: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: SvgMetadataSchema
}, {
  collection: 'model.svg.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<ISvg>('Svg', SvgSchema);
