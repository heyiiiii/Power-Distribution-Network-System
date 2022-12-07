import mongoose, {Document, Schema} from 'mongoose';

export interface IImage extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: {
    _contentType: string;
    imageType: string;
    width: number;
    height: number;
  };
}

export const ImageSchema = new Schema({
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  md5: String,
  filename: String,
  contentType: String,
  aliases: [String],
  metadata: {
    type: {
      _contentType: String,
      imageType: String,
      width: Number,
      height: Number
    },
    required: true,
    _id: false
  }
}, {
  collection: 'sys.image.files',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model<IImage>('Image', ImageSchema);
