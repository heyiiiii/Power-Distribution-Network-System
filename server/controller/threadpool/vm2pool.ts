import os from 'os';
import path from 'path';
import fs from 'fs';
import {Worker} from 'worker_threads';
import {transform as babelTransform} from 'babel-core';
import {v1 as uuidV1} from 'uuid';
import conf from '../../../configs';

export interface IVMTask {
  scriptFile?: string;
  script?: string;
  runKey: string;
  sandbox: any;
  param: any;
  interactive: boolean;
  timeout: number,
  runningCallback: (runKey: string, eventKey: string, event: string, param: any) => void;
  finishCallback: (runKey: string, result?: any) => void;
  errorCallback: (runKey: string, error: any) => void;
}

interface IWorker {
  key: string;
  threadId: number;
  worker: Worker;
  once: boolean;
  status: string;
  runKey: string;
  task?: IVMTask;
  // eslint-disable-next-line no-undef
  timeout?: NodeJS.Timeout;
}

interface IWorkerMessage {
  eventKey: string;
  event: string;
  data?: any;
  result?: any;
  error?: any;
  timeout?: number;
  defaultValue?: any;
}

export interface IReceipt {
  runKey: string;
  eventKey: string;
  event: string;
  data?: any;
  err?: unknown;
  status: string;
  stop?: boolean;
}


export interface ISandbox {
  configs: any;
  roles: any[];
  userId: string;
  token: string;
  flowProperty: any;
  context?: any;
  body?: any;
  user?: any;
}

export interface IScriptContext {
  scriptId: string;
  scriptFile: string;
  script?: string;
  formId?: string;
  flowProperty?: any;
  param?: any;
  user?: any;
  // eslint-disable-next-line no-undef
  timeout: NodeJS.Timeout;
  sandbox: ISandbox;
  timeoutMS: number;
}

export interface ICallbackParam {
  event: string;
  type: string;
  status: string;
  runKey: string;
  needWait?: boolean;
  title?: string;
  content?: string;
  options?: string[];
  defaultValue?: string;
  args?: any[];
  timeout?: number;
  result?: any;
}

export interface IExecuteMessage {
  runKey: string;
  status: string;
  message?: string;
  eventKey?: string;
  event?: string;
  // eslint-disable-next-line no-use-before-define
  param?: ICallbackParam;
  result?: any;
  during?: number;
}

export default class WorkerPool {
  readonly numberOfThreads: number;
  readonly tasks: IVMTask[];
  readonly workers: IWorker[];

  constructor(numberOfThreads: number = 4) {
    const {length: cpusLength} = os.cpus();
    this.numberOfThreads = Math.max(cpusLength / 2, numberOfThreads);
    this.tasks = [];
    this.workers = [];
    this.init();
  }

  init() {
    if (this.workers.length < this.numberOfThreads) {
      const buffer = fs.readFileSync(path.join(__dirname, 'vm2thread.js'), {encoding: 'utf8'});
      const script = buffer.toString();
      let i = 0;
      while (this.workers.length < this.numberOfThreads) {
        this.createThread(script, false);
        if (i++ >= this.numberOfThreads) {
          break;
        }
      }

      return i;
    } else if (this.workers.length > this.numberOfThreads) {
      let i = 0;
      let loop = this.workers.length;
      while (loop-- && this.workers.length > this.numberOfThreads) {
        const idles = this.workers.filter((x: any) => x.status === 'idle');
        idles.forEach((x: any) => {
          i--;
          this.removeWorker(x.key);
        });
      }

      return i;
    }

    return 0;
  }

  reset() {
    const keys = this.workers.map((x: any) => x.key);
    for (const key of keys) {
      this.removeWorker(key);
    }
    return this.init();
  }

  pushTask(task: IVMTask) {
    let started = false;
    for (const worker of this.workers) {
      if (worker.status === 'idle') {
        this.start(worker, task);
        started = true;
        break;
      }
    }

    if (!started) {
      this.tasks.push(task);
      setTimeout(() => {
        if (this.tasks.length > 0) {
          const buffer = fs.readFileSync(path.join(__dirname, 'vm2thread.js'), {encoding: 'utf8'});
          const script = buffer.toString();
          while (this.tasks.length > 0) {
            const task = this.tasks.pop();
            if (task) {
              const worker = this.createThread(script, true);
              this.start(worker, task);
            }
          }
        }
      }, 1500);
    }
  }

  kill(runKey: string) {
    const found = this.workers.find((x: any) => x.runKey === runKey);
    if (found) {
      this.removeWorker(found.key);
      this.init();
    }
  }

  onReceipt(message: IReceipt) {
    if (!message.event || !message.event.startsWith('$')) {
      return {
        succ: false,
        message: '消息event[' + message.event + ']不合法, 必须以$开头'
      };
    }
    const found = this.workers.find((x: any) => x.runKey === message.runKey);
    if (found) {
      found.worker.postMessage(JSON.stringify(message));
      return {
        succ: true
      };
    } else {
      return {
        succ: false,
        message: '未找到runKey[' + message.runKey + ']对应的线程'
      };
    }
  }

  protected createThread(script: string, once: boolean) {
    const workerKey = uuidV1();
    const _worker = new Worker(script, {
      eval: true,
      workerData: {
        key: workerKey
      }
    });

    const worker: IWorker = {
      threadId: _worker.threadId,
      worker: _worker,
      status: 'idle',
      runKey: '',
      key: workerKey,
      once
    };

    _worker.on('message', this.onWorkerMessage(worker));
    this.workers.push(worker);
    console.log('已创建VM2线程[' + worker.threadId + '][' + worker.key + ']');
    worker.worker.on('exit', (exitCode) => {
      if (worker.timeout) {
        clearTimeout(worker.timeout);
        worker.timeout = undefined;
      }

      console.log('收到VM2线程[' + worker.threadId + '][' + worker.key + '][exit]消息, 退出代码[' + exitCode + ']');
      if (worker.task) {
        console.log('向调用方回调finish-abort消息');
        worker.task.finishCallback(worker.task.runKey, {abort: true});
        delete worker.task;
      }

      worker.worker.removeAllListeners();
      const index = this.workers.findIndex((x: any) => x.key === worker.key);
      if (index >= 0) {
        this.workers.splice(index, 1);
      }

      this.init();
    });

    worker.worker.on('error', (err) => {
      console.log('收到VM2线程[' + worker.threadId + '][' + worker.key + '][error]消息, message[' + err.message + ']');
      console.error(err);
      if (worker.timeout) {
        clearTimeout(worker.timeout);
        worker.timeout = undefined;
      }
      if (worker.task) {
        console.log('向调用方回调error消息');
        worker.task.errorCallback(worker.task.runKey, err);
        delete worker.task;
      }

      worker.worker.removeAllListeners();
      const index = this.workers.findIndex((x: any) => x.key === worker.key);
      if (index >= 0) {
        this.workers.splice(index, 1);
      }

      this.init();
    });

    return worker;
  }

  protected removeWorker(key: string) {
    const index = this.workers.findIndex((x: any) => x.key === key);
    if (index >= 0) {
      const worker = this.workers[index];
      worker.worker.postMessage(JSON.stringify({event: 'exit'}));
      worker.worker.terminate().then();
      worker.worker.removeAllListeners();
      if (worker.timeout) {
        // @ts-ignore
        clearTimeout(worker.timeout);
        worker.timeout = undefined;
      }

      console.log('已删除VM2线程[' + worker.threadId + '][' + worker.key + ']');
      this.workers.splice(index, 1);
    }
  }

  protected onWorkerMessage(worker: IWorker) {
    return (m: string) => {
      if (!worker.task) {
        console.warn('worker线程不存在任务, 无法处理回调消息');
        return;
      }

      const param: IWorkerMessage = JSON.parse(m);
      if (param.event.startsWith('$')) {
        if (worker.task.runningCallback) {
          worker.task.runningCallback(worker.task.runKey, param.eventKey, param.event, param);
        }
      } else {
        switch (param.event) {
          case 'finish': {
            if (worker.timeout) {
              clearTimeout(worker.timeout);
              worker.runKey = '';
              delete worker.timeout;
            }
            console.log('线程' + worker.threadId + '的任务已执行完成');
            worker.task.finishCallback(worker.task.runKey, param.result);
            delete worker.task;
            worker.status = 'idle';
            if (worker.once) {
              this.removeWorker(worker.key);
            } else {
              this.pullTask(worker);
            }
            this.init();
            break;
          }
          case 'error': {
            if (worker.timeout) {
              clearTimeout(worker.timeout);
              worker.runKey = '';
              delete worker.timeout;
            }
            console.log('线程' + worker.threadId + '的任务执行时出现错误: ', param.error);
            worker.task.errorCallback(worker.task.runKey, param.error);
            delete worker.task;
            worker.status = 'idle';
            if (worker.once) {
              this.removeWorker(worker.key);
            } else {
              this.pullTask(worker);
            }
            this.init();
            break;
          }
          default:
            console.warn('主线程收到未知的子线程消息[' + param.event + ']');
            break;
        }
      }
    };
  }

  protected pullTask(worker: IWorker) {
    if (this.tasks.length > 0) {
      const task: IVMTask | undefined = this.tasks.pop();
      if (task) {
        this.start(worker, task);
      }
    }
  }

  protected start(worker: IWorker, task: IVMTask) {
    worker.task = task;
    worker.status = 'busy';
    const workerParam = {
      event: 'start',
      param: {
        scriptFile: task.scriptFile,
        script: task.script,
        runKey: task.runKey,
        sandbox: task.sandbox,
        param: task.param,
        interactive: task.interactive
      }
    };
    worker.worker.postMessage(JSON.stringify(workerParam));
    worker.runKey = task.runKey;
    // 线程超时机制防止脚本卡死(默认一分钟执行不完就强制结束)
    console.log('执行时限' + task.timeout + '毫秒');
    if (task.timeout > 0) {
      // @ts-ignore
      worker.timeout = setTimeout(() => {
        if (worker.status === 'busy') {
          if (worker.task) {
            worker.task.errorCallback(worker.task.runKey, new Error('线程运行时间已超过' + task.timeout + '毫秒, 超时退出'));
            delete worker.task;
          }
          this.removeWorker(worker.key);
          this.init();
        }

        if (worker.timeout) {
          clearTimeout(worker.timeout);
          worker.timeout = undefined;
        }
      }, task.timeout);
    }
  }

  static generateTempScriptPath(): string {
    return path.join(os.tmpdir(), uuidV1() + '.js');
  }

  static generateVM2Script(script: string): string {
    const buffer = fs.readFileSync(path.join(__dirname, 'vmscript.js'), {encoding: 'utf8'});
    const code = buffer.toString();
    const keyword = '\'//{script-code}//\';';
    const index = code.indexOf(keyword);
    const codeArray = [];
    if (index >= 0) {
      codeArray.push(code.substr(0, index));
      codeArray.push(script);
      codeArray.push(code.substring(index + keyword.length));
    } else {
      codeArray.push(code);
    }

    const scriptCode = codeArray.join('');
    if (process.env.NODE_ENV !== 'development' && conf.service.showScriptLog) {
      console.log('===========================拼接后脚本===========================');
      console.log(scriptCode);
    }

    const result = babelTransform(scriptCode, {
      ast: false,
      presets: ['stage-0'],
      comments: false
    }).code;

    if (process.env.NODE_ENV !== 'development' && conf.service.showScriptLog) {
      console.log('===========================待执行脚本===========================');
      console.log(result);
    }

    return result || '';
  }
}
