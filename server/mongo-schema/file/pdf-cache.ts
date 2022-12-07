import {Document, model, Schema} from 'mongoose';
import PdfCacheMetadataSchema, {IPdfCacheMetadata} from './pdf-cache-metadata';

export interface IPdfCache extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IPdfCacheMetadata;
}

export const PdfCacheSchema = new Schema({
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
  metadata: PdfCacheMetadataSchema
}, {
  collection: 'pdf.cache.files',
  collation: {
    locale: 'zh'
  }
});


export default model<IPdfCache>('PdfCache', PdfCacheSchema);
