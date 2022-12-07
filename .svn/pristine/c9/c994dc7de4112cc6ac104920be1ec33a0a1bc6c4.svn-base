import {Document, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IPdfCacheMetadata extends Document {
  _contentType: string;
  temporary: boolean;
  originalFileId: ObjectId;
  originalFileMd5: string;
  rawFilename: string;
  specified: boolean;
}

export const PdfCacheMetadata = new Schema({
  _contentType: String,
  temporary: {
    type: Boolean,
    default: false
  },
  originalFileId: {
    type: Schema.Types.ObjectId,
    index: true,
    default: ''
  },
  originalFileMd5: {
    type: String,
    default: ''
  },
  rawFilename: {
    type: String,
    default: ''
  },
  specified: {
    type: Boolean,
    default: false
  }
}, {
  id: false,
  _id: false
});

export default PdfCacheMetadata;
