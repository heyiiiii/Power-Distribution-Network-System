import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

interface IExecutorConfig {
  timeout: number;
  asyncTimeout: number;
  quantity: number;
  memoryQuota: number;
  cpuQuota: number;
  modules: string[];
}

export interface IXScript extends Document {
  name: string;
  script: string;
  executorConfig: IExecutorConfig;
  context?: any;
}

export const XScriptSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  script: {
    type: String,
    required: true,
    default: ''
  },
  executorConfig: {
    type: {
      timeout: {
        type: Number,
        default: 5000
      },
      asyncTimeout: {
        type: Number,
        default: 10000
      },
      quantity: {
        type: Number,
        default: 4
      },
      memoryQuota: {
        type: Number,
        default: 500
      },
      cpuQuota: {
        type: Number,
        default: 0.5
      },
      modules: [String]
    },
    default: {
      timeout: 5000,
      asyncTimeout: 10000,
      quantity: 4,
      memoryQuota: 500,
      cpuQuota: 0.5,
      modules: ['axios', 'jszip', 'fs', 'net', 'dgram', 'mongoose']
    }
  },
  context: Object
}, {
  collection: 'xscript',
  collation: {
    locale: 'zh'
  }
});

XScriptSchema.virtual('xformBefore', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptBefore',
  justOne: true
});

XScriptSchema.virtual('xformAround', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptAround',
  justOne: true
});

XScriptSchema.virtual('xformAfter', {
  ref: 'XForm',
  localField: '_id',
  foreignField: 'scriptAfter',
  justOne: true
});

export default mongoose.model<IXScript>('XScript', XScriptSchema);

