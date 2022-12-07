import {Document, model, Schema} from 'mongoose';

export interface ICurveFileMetadata {
  deviceUri: string;
  deviceName: string;
  areaCode: number;
}

export interface ICurveFile extends Document {
  filename: string;
  chunkSize: number;
  length: number;
  uploadDate: Date;
  metadata: ICurveFileMetadata;
}

export const CurveFileSchema = new Schema({
  filename: String,
  contentType: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: {
    deviceUri: String,
    deviceName: String,
    areaCode: Number
  }
}, {
  collection: 'dz.curve.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<ICurveFile>('CurveFile', CurveFileSchema);
