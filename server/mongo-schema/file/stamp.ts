import {Document, model, Schema} from 'mongoose';
import StampMetadataSchema, {IStampMetadata} from './stamp-metadata';

interface IStamp extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IStampMetadata;
}

export const StampSchema = new Schema({
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
  metadata: StampMetadataSchema
}, {
  collection: 'stamp.files',
  collation: {
    locale: 'zh'
  }
});

export {IStamp, IStampMetadata};
export default model<IStamp>('Stamp', StampSchema);
