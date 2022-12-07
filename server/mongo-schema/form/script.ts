import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

export interface IScriptMetadata {
  _contentType: string;
  timeoutMS: number;
}

export interface IScript extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IScriptMetadata;
  timeoutMS?: number;
}

export const ScriptMetadata = new Schema({
  _contentType: String,
  timeoutMS: Number
}, {
  timestamps: true,
  _id: false
});

export const ScriptSchema = new Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  md5: String,
  filename: {
    type: String,
    alias: 'name'
  },
  contentType: String,
  aliases: [String],
  metadata: {
    type: ScriptMetadata,
    required: true,
    _id: false
  }
}, {
  collection: 'script.files',
  collation: {
    locale: 'zh'
  }
});

ScriptSchema.virtual('xformBefore', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptBefore',
  justOne: true
});

ScriptSchema.virtual('xformAround', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptAround',
  justOne: true
});

ScriptSchema.virtual('xformAfter', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptAfter',
  justOne: true
});

export default mongoose.model<IScript>('Script', ScriptSchema);

