import {Document, model, Schema} from 'mongoose';

export interface IJSFileMetadata {
  areaCode: number;
  identifier: string;
  groupName: string;
  substationName: string;
}

export interface IJSFile extends Document {
  filename: string;
  chunkSize: number;
  length: number;
  uploadDate: Date;
  metadata: IJSFileMetadata;
}

export const JSFileMetadataSchema = new Schema({
  areaCode: Number,
  identifier: String,
  groupName: String,
  substationName: String
}, {
  _id: false,
  id: false
});

export const JSFileSchema = new Schema({
  filename: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: JSFileMetadataSchema
}, {
  collection: 'js.script.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IJSFile>('JSFile', JSFileSchema);
