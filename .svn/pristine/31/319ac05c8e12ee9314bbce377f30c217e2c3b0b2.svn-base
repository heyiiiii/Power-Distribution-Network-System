import mongoose from 'mongoose';
import MetadataSchema from './dzd-metadata';

export const DzdFileOriginalSchema = new mongoose.Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  md5: String,
  filename: String,
  contentType: String,
  aliases: [String],
  metadata: {
    type: MetadataSchema,
    required: true
  }
}, {
  collection: 'dzd.original.files',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model('DzdFileOriginal', DzdFileOriginalSchema);
