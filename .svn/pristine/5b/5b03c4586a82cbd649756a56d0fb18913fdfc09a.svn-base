import {Document, model, Schema} from 'mongoose';

export interface IJSTemplateMetadata {
  areaCode: number;
  identifier: string;
  groupName: string;
  substationName: string;
  editorKey: string;
}

export interface IJSTemplate extends Document {
  filename: string;
  chunkSize: number;
  length: number;
  uploadDate: Date;
  metadata: IJSTemplateMetadata;
}

export const JSTemplateMetadataSchema = new Schema({
  areaCode: Number,
  identifier: String,
  groupName: String,
  substationName: String,
  editorKey: String
}, {
  _id: false,
  id: false
});

export const JSTemplateSchema = new Schema({
  filename: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date,
  metadata: JSTemplateMetadataSchema
}, {
  collection: 'js.template.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IJSTemplate>('JSTemplate', JSTemplateSchema);
