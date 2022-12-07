import mongoose from 'mongoose';
import MetadataSchema from './dzd-old-metadata';

export const DzdOldFileSchema = new mongoose.Schema({
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
  collection: 'dzd.old.files',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model('DzdOldFile', DzdOldFileSchema);
