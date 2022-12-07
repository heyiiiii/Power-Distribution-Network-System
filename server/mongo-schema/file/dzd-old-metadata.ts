import mongoose from 'mongoose';

export const DzdOldFileMetadata = new mongoose.Schema({
  _contentType: String,
  guid: String
});

export default DzdOldFileMetadata;
