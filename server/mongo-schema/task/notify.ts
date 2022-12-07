import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';

export interface ITaskNotify extends Document {
  time: Date;
  level: string;
  type: string;
  message: string;
  srcUserName: string;
  srcUserId: ObjectId;
  accepted: boolean;
  destUserName: string;
  destUserId: ObjectId;
  destRoles: string[];
  statusMark: string;
  filename: string;
  prefixSort: string;
  redirectPath: string;
  taskId: string;
  fileId: string;
}

export const TaskNotifySchema = new Schema({
  time: {
    type: Date,
    default: Date.now,
    index: {
      expires: '2d'
    }
  },
  level: String,
  type: String,
  message: String,
  srcUserName: String,
  srcUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  destUserName: String,
  destUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  accepted: Boolean,
  destRoles: [String],
  statusMark: String,
  filename: String,
  prefixSort: String,
  redirectPath: String,
  taskId: String,
  fileId: String
}, {
  collection: 'dzd.task.notify',
  collation: {
    locale: 'zh'
  }
});

export default mongoose.model<ITaskNotify>('TaskNotify', TaskNotifySchema);
