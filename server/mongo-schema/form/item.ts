import {Document, Schema} from 'mongoose';

export interface IXFormItem extends Document {
  key: string;
  inputType: string;
  colspan: number;
  rowspan: number;
  hide: boolean;
  mappingField: string;
  mappingType: string;
  label: string;
  labelWidth: number;
  labelOnly: false;
  fontSize: string;
  fontWeight: string;
  controlWidth: string;
  controlHeight: string;
  placeholder: string;
  textareaRowCount: number;
  subFormId: string;
  validator: string;
  initScript: string;
  optionScript: string;
  actionScript: string;
  needSign: boolean;
  selectOptions: [{
    label: any,
    value: any
  }],
  readonly: boolean;
  lineCount: number;
  required: boolean;
  defaultValue: string;
  width: string;
}

const XFormItem = new Schema({
  key: {
    type: String,
    default: ''
  },
  inputType: {
    type: String,
    default: 'none'
  },
  colspan: {
    type: Number,
    default: 1
  },
  rowspan: {
    type: Number,
    default: 1
  },
  mappingField: {
    type: String,
    default: ''
  },
  mappingType: {
    type: String,
    default: ''
  },
  hide: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  labelWidth: {
    type: Number,
    default: 60
  },
  labelOnly: {
    type: Boolean,
    default: false
  },
  fontSize: {
    type: String,
    default: 'inherit'
  },
  fontWeight: {
    type: String,
    default: 'inherit'
  },
  controlWidth: {
    type: String,
    default: '200px'
  },
  controlHeight: {
    type: String,
    default: '100%'
  },
  placeholder: String,
  textareaRowCount: {
    type: Number,
    default: 1
  },
  subFormId: String,
  validator: String,
  initScript: String,
  optionScript: String,
  actionScript: String,
  needSign: Boolean,
  selectOptions: [{
    label: Object,
    value: Object
  }],
  readonly: {
    type: Boolean,
    default: false
  },
  lineCount: {
    type: Number,
    default: 0
  },
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    required: true,
    default: '100%'
  }
}, {
  collection: 'xform',
  collation: {
    locale: 'zh'
  },
  _id: false
});

export default XFormItem;
