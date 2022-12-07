import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IFileShareMetadata {
  _contentType: string;
  rawFilename: string;
  fileType: string;
  department: ObjectId;
  shareName: string;
  uploadUserId: ObjectId;
  uploadUserName: string;
  uploadTime: Date;
  status: string;
  factory: string;
  modelNumber: string;
  version: string;
  serialNumber: string;
  protectType: string;
  voltageLevel: string;
  platform: string;
  releaseTime: Date;
  description: string;
  downloadCount: number;
  auditUserName: string;
  auditDescription: string;
  auditTime: Date;
}

export interface IFileShare extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IFileShareMetadata;
}

export const FileShareMetadataSchema = new Schema({
  _contentType: String,
  rawFilename: {
    type: String,
    index: true
  },
  fileType: String,
  shareName: String,
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  uploadUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadUserName: String,
  uploadTime: {
    type: Date,
    index: true
  },
  status: String,
  factory: {
    type: String,
    index: true
  },
  modelNumber: String,
  version: String,
  serialNumber: String,
  protectType: {
    type: String,
    index: true
  },
  voltageLevel: {
    type: String,
    index: true
  },
  platform: {
    type: String,
    index: true
  },
  description: String,
  releaseTime: {
    type: Date,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  auditUserName: String,
  auditDescription: String,
  auditTime: Date
}, {
  id: false,
  _id: false
});

export const FileShareSchema = new Schema({
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
  metadata: FileShareMetadataSchema
}, {
  collection: 'fh.files',
  collation: {
    locale: 'zh'
  }
});

export default model<IFileShare>('FileShare', FileShareSchema);
