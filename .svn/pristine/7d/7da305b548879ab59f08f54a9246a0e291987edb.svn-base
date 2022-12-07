import {Document, model, Schema} from 'mongoose';

export interface IFormPrintTemplateMetadata {
  _contentType: string;
  templateType: string;
  identifier: string;
}

export interface IFormPrintTemplate extends Document {
  length: number;
  chunkSize: number;
  uploadDate: Date;
  md5: string;
  filename: string;
  contentType: string;
  aliases: string[];
  metadata: IFormPrintTemplateMetadata;
}

export const FormPrintTemplateMetadataSchema = new Schema({
  _contentType: String,
  templateType: {
    type: String,
    default: 'all'
  },
  identifier: {
    type: String,
    unique: true
  }
}, {
  _id: false,
  id: false,
  timestamps: true
});

export const FormPrintTemplateSchema = new Schema({
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
  metadata: {
    type: FormPrintTemplateMetadataSchema,
    required: true,
    _id: false
  }
}, {
  collection: 'form-print-template.files',
  collation: {
    locale: 'zh'
  }
});


export default model<IFormPrintTemplate>('FormPrintTemplate', FormPrintTemplateSchema);
