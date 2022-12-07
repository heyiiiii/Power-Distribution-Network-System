import {Document, model, Schema} from 'mongoose';
import MetadataSchema, {IDzdFileMetadata} from './dzd-metadata';

export interface IDzdFile extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IDzdFileMetadata;
  departmentName?: string;
  modifyNumMode?: string;
  index?: number;
  taskId?: string;
  flowId?: string;
  taskName?: string;
  lastUpdateStamp?: string;
}

export const DzdFileSchema = new Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  md5: String,
  filename: {
    type: String,
    unique: true
  },
  contentType: String,
  aliases: [String],
  metadata: {
    type: MetadataSchema,
    required: true,
    _id: false
  }
}, {
  collection: 'dzd.files',
  collation: {
    locale: 'zh'
  }
});

DzdFileSchema.virtual('task', {
  ref: 'DzdTask',
  localField: '_id',
  foreignField: 'file',
  justOne: true
});

DzdFileSchema.virtual('oldTask', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'fileId',
  justOne: true
});


export default model<IDzdFile>('DzdFile', DzdFileSchema);
