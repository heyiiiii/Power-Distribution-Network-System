import {Document, model, Schema} from 'mongoose';
import HtmlCacheMetadataSchema, {IHtmlCacheMetadata} from './html-cache-metadata';

export interface IHtmlCache extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IHtmlCacheMetadata;
}

export const HtmlCacheSchema = new Schema({
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
  metadata: HtmlCacheMetadataSchema
}, {
  collection: 'html.cache.files',
  collation: {
    locale: 'zh'
  }
});


export default model<IHtmlCache>('HtmlCache', HtmlCacheSchema);
