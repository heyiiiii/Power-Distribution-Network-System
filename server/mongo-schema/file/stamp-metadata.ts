import {Document, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface IStampMetadata extends Document {
  _contentType: string;
  stampType: string;
  user: ObjectId;
  rawWidth: number;
  rawHeight: number;
  targetWidth: number;
  targetHeight: number;
  keyword: string;
}

const StampMetadataSchema = new Schema({
  _contentType: String,
  stampType: String, // apply或user对应定值单批准签章和用户签章
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rawWidth: Number,
  rawHeight: Number,
  targetWidth: Number,
  targetHeight: Number,
  keyword: String
}, {
  id: false,
  _id: false
});

export default StampMetadataSchema;
