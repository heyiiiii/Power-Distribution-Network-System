import * as mongoose from 'mongoose';
import {Document, Schema} from 'mongoose';

export interface IConfig extends Document {
  serviceId: string;
  key: string;
  value: string;
  name: string;
  description: string;
  backendOnly: boolean;
}

export const ConfigSchema = new Schema({
  serviceId: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  backendOnly: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'sys.config',
  collation: {
    locale: 'zh'
  },
  timestamps: true
});

const model = mongoose.model<IConfig>('Config', ConfigSchema);

export async function getConfigValueByKeyAndServiceId(serviceId: string, key: string, defaultValue: any | undefined) {
  const config = await model.findOne({
    serviceId,
    key
  }, {
    value: 1
  }).lean();

  return config ? config.value : defaultValue;
}

export async function getConfigValueByKey(key: string, defaultValue: any | undefined) {
  const config = await model.findOne({
    key
  }, {
    value: 1
  }).lean();
  return config ? config.value : defaultValue;
}

export async function getConfigNumberValue({key, serviceId, min, max, defaultValue}: {key: string, serviceId?: string, min: number, max: number, defaultValue: number}): Promise<number> {
  try {
    const condition: any = {key};
    if (serviceId) {
      condition.serverId = serviceId;
    }
    const config = await model.findOne(condition, {
      value: 1
    }).lean();

    let ret = defaultValue;
    if (config) {
      ret = Number(config.value);
      if (isNaN(ret)) {
        ret = defaultValue;
      }
    }

    if (ret < min) {
      ret = min;
    } else if (ret > max) {
      ret = max;
    }

    return ret;
  } catch (err: any) {
    console.error(err);
    return defaultValue;
  }
}

export default model;
