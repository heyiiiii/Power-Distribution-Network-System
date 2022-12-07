import {ObjectId} from 'mongodb';
import {Document, model, Schema} from 'mongoose';
import XFormItem, {IXFormItem} from './item';

interface IXForm extends Document {
  name: string;
  key: string;
  width: string;
  height: string;
  className: string;
  rowCount: number;
  colCount: number;
  labelPosition: string;
  scriptBefore?: ObjectId;
  scriptAround?: ObjectId;
  scriptAfter?: ObjectId;
  title: string;
  footer: string;
  rows: IXFormItem[][];
}

const XFormSchema = new Schema({
  name: String,
  key: {
    type: String,
    default: '',
    index: true
  },
  width: {
    type: String,
    required: true,
    default: '100%'
  },
  height: {
    type: String,
    required: true,
    default: '400px'
  },
  className: {
    type: String
  },
  rowCount: {
    type: Number,
    required: true,
    default: 1
  },
  colCount: {
    type: Number,
    required: true,
    default: 1
  },
  labelPosition: {
    type: String,
    default: 'left'
  },
  scriptBefore: {
    type: Schema.Types.ObjectId,
    ref: 'XScript'
  },
  scriptAround: {
    type: Schema.Types.ObjectId,
    ref: 'XScript'
  },
  scriptAfter: {
    type: Schema.Types.ObjectId,
    ref: 'XScript'
  },
  title: {
    type: String,
    default: ''
  },
  footer: {
    type: String,
    default: ''
  },
  rows: {
    type: [[XFormItem]],
    required: true,
    _id: false
  }
}, {
  collection: 'xform',
  collation: {
    locale: 'zh'
  }
});

export default model<IXForm>('XForm', XFormSchema);
export {
  IXForm,
  XFormItem,
  IXFormItem,
  XFormSchema
};
