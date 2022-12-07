import {Document, model, Schema} from 'mongoose';

export interface IJSTemporary extends Document {
  filename: string;
  chunkSize: number;
  length: number;
  uploadDate: Date;
}

export const JSTemporarySchema = new Schema({
  filename: String,
  contentType: String,
  chunkSize: Number,
  length: Number,
  uploadDate: Date
}, {
  collection: 'js.temporary.files',
  versionKey: '',
  collation: {
    locale: 'zh'
  }
});

export default model<IJSTemporary>('JSTemporary', JSTemporarySchema);
