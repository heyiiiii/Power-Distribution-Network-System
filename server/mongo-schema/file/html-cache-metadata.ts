import {Document, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IHtmlCacheMetadata extends Document {
  _contentType: string;
  temporary: boolean;
  originalFileId: ObjectId;
  originalFileMd5: string;
  sheetIndex: number;
  rawFilename: string;
}

export const HtmlCacheMetadata = new Schema({
  _contentType: String,
  temporary: Boolean,
  originalFileId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  originalFileMd5: String,
  sheetIndex: Number,
  rawFilename: String
}, {
  id: false,
  _id: false
});

export default HtmlCacheMetadata;
