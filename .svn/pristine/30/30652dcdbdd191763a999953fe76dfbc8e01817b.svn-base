import {Document, model, Schema} from 'mongoose';
import {ObjectId} from 'mongodb';
import {Context} from 'koa';
import {ISessInfo} from '../../session-store';
import {IDzdFile} from '../file';
import {IDzdTask} from '../task';
import {DFlow, DzdFlow} from '../flow';
import conf from '../../../configs';

export interface ICriticalLog extends Document {
  time: Date;
  serverId: string;
  level: string;
  option: string;
  api: string;
  executeType: string;
  message: string;
  description: string;
  succ: boolean;
  mark: string;
  roles: string[];
  username: string;
  filename: string;
  taskName: string;
  flowName: string;
  stepName: string;
  pathName: string;
  flowId?: ObjectId;
  taskId?: ObjectId;
  fileId?: ObjectId;
}

export const CriticalLogSchema = new Schema({
  time: {
    type: Date,
    default: Date.now,
    index: {
      expires: '32d'
    }
  },
  serverId: String,
  level: String,
  option: String,
  api: String,
  executeType: String,
  message: String,
  description: String,
  succ: Boolean,
  mark: String,
  username: String,
  roles: [String],
  filename: String,
  taskName: String,
  flowName: String,
  stepName: String,
  pathName: String,
  flowId: {
    type: Schema.Types.ObjectId,
    ref: 'DFlow'
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'DzdTask'
  },
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'DzdFile'
  }
}, {
  collection: 'sys.logs.critical',
  collation: {
    locale: 'zh'
  }
});

const CriticalLog = model<ICriticalLog>('CriticalLog', CriticalLogSchema);

export interface ICriticalLogParam {
  level: string;
  option: string;
  executeType: string;
  message: string;
  description: string;
  pathName: string;
  succ: boolean;
  ctx?: Context;
  file?: IDzdFile;
  task?: IDzdTask;
}

const flows: DFlow[] = [];

function refreshFlows() {
  DzdFlow.find({}, (err: any, res: any) => {
    if (err) {
      console.error('error: 95');
      console.error(err);
    } else {
      if (res && Array.isArray(res)) {
        flows.splice(0, flows.length);
        flows.push(...res);
      }
    }
  });
}

setInterval(refreshFlows, 20000);
setTimeout(refreshFlows, 2000);

export function addCriticalLog(logData: ICriticalLogParam) {
  const session = logData.ctx ? logData.ctx.session as unknown as ISessInfo : null;
  if (logData.task) {
    // @ts-ignore
    const flow = flows.find(x => x._id.equals(logData.task.flow));
    // @ts-ignore
    const step = flow ? flow.metadata.steps.find(x => x._id.equals(logData.task.step.stepId)) : null;
    CriticalLog.create({
      time: new Date(),
      serverId: conf.service.id,
      level: logData.level,
      api: logData.ctx ? logData.ctx.path : '',
      option: logData.option,
      executeType: logData.executeType,
      message: logData.message,
      description: logData.description,
      succ: logData.succ,
      mark: logData.file ? logData.file.metadata.status : '',
      username: session ? session.user.name : '',
      roles: session ? session.roles : [],
      filename: logData.file ? logData.file.filename : '',
      taskName: logData.task.name,
      stepName: step ? step.name : '',
      flowName: flow ? flow.metadata.name : '',
      pathName: logData.pathName,
      taskId: logData.task._id,
      fileId: logData.file ? logData.file._id : undefined,
      flowId: flow ? flow._id : undefined
    }, (err, log) => {
      if (err) {
        console.error('保存流程日志失败');
        console.error(err);
      } else {
        console.log('已存储流程日志: ' + log.message + ' ' + log.description);
      }
    });
  } else {
    CriticalLog.create({
      time: new Date(),
      serverId: conf.service.id,
      level: logData.level,
      api: logData.ctx ? logData.ctx.path : '',
      option: logData.option,
      executeType: logData.executeType,
      message: logData.message,
      description: logData.description,
      succ: logData.succ,
      mark: logData.file ? logData.file.metadata.status : '',
      username: session ? session.user.name : '',
      roles: session ? session.roles : [],
      filename: logData.file ? logData.file.filename : '',
      taskName: '',
      stepName: '',
      flowName: '',
      pathName: logData.pathName,
      fileId: logData.file ? logData.file._id : undefined
    }, (err, log) => {
      if (err) {
        console.error('保存文件日志失败');
        console.error(err);
      } else {
        console.log('已存储文件日志' + log.message + ' ' + log.description);
      }
    });
  }
}

export default CriticalLog;
