'use strict';
const fs = require('fs');
const {parentPort, workerData, threadId} = require('worker_threads');
const EventEmitter = require('events').EventEmitter;
const {NodeVM} = require('vm2');
const {v1: uuidV1} = require('uuid');

const waitingHandle = new EventEmitter();
const events = [];
let interactive = false;

console.log('VM2线程[' + threadId + '][' + workerData.key + ']开始运行');

/*
向主线程parentPort.postMessage时消息体应符合如下格式
{
  eventKey: string;
  event: '$log' | '$input' | '$notice' | 'finish' | 'error' 等;
  data: any;
  result: any;
  error: any;
  timeout?: number;
  defaultValue?: any;
}
主线程发来消息应符合如下格式
{
  eventKey: string;
  event: '$input' | 'start' | 'exit' 等;
  param: any;
}
event为start时表示启动线程, param为启动参数
此时param应具备如下字段
scriptFile|script:待执行的脚本文件路径或脚本字符串
runKey
sandbox:沙箱全局变量(脚本内使用无需加sandbox引用其内容,属于全局global作用域)
param:主函数参数(脚本内可直接使用param.)

event为exit时表示即将强制结束线程, 此时应进行自身的清理工作
event为$开头的事件时表示前端发来的回执消息, 为waitFor所用
*/


parentPort.on('message', value => {
  try {
    const data = JSON.parse(value);
    const {param} = data;
    console.log('收到主线程[' + data.event + ']消息');
    switch (data.event) {
      case 'start': {
        interactive = param.interactive;
        if (interactive) {
          console.warn('执行脚本---交互模式');
        } else {
          console.warn('执行脚本---非交互模式');
        }
        run(param).then(result => {
          parentPort.postMessage(JSON.stringify({
            event: 'finish',
            result
          }, null, 0));
        }).catch(error => {
          parentPort.postMessage(JSON.stringify({
            event: 'error',
            error
          }, null, 0));
        });
        break;
      }
      // 清理资源
      case 'exit': {
        dispose();
        break;
      }
      // 处理$开头的消息回执
      default: {
        if (data.stop) {
          console.log('前端终止执行');
          dispose();
          break;
        }
        // 消息回执(从主线程发来)
        waitingHandle.emit('receipt', data.event, data.eventKey, data.data, data.err, data.status);
        break;
      }
    }
  } catch (err) {
    console.log('子线程中处理消息出现异常: ' + err.message);
    console.error(err);
    parentPort.postMessage(JSON.stringify({
      event: 'error',
      error: err
    }, null, 0));
    dispose();
    process.exit();
  }
});

function dispose() {
  parentPort.removeAllListeners();
  waitingHandle.removeAllListeners();
  for (const event of events) {
    event.emitter.removeAllListeners();
  }

  process.exit();
}

// 消息回执超时(从本线程发来)
waitingHandle.on('timeout', (event, eventKey) => {
  const index = events.findIndex(x => x.eventKey === eventKey);
  if (index >= 0) {
    const found = events[index];
    if (found.timeout) {
      clearTimeout(found.timeout);
    }
    found.emitter.emit('timeout:' + eventKey, event);
    events.splice(index, 1);
  }
});

// 消息回执(通知waitFor)
waitingHandle.on('receipt', (event, eventKey, data, err, status) => {
  const index = events.findIndex(x => x.eventKey === eventKey);
  if (index >= 0) {
    const found = events[index];
    if (found.timeout) {
      clearTimeout(found.timeout);
    }
    found.emitter.emit(eventKey, event, data, err, status);
    events.splice(index, 1);
  }
});

async function run({scriptFile, runKey, sandbox, param}) {
  const moment = require('moment');
  const start = new Date().getTime();
  console.log(moment(start).format('YYYY-MM-DD HH:mm:ss.SSS') + ' -- VM2线程[' + threadId + '][' + workerData.key + ']准备执行脚本[' + runKey + ']');
  try {
    const vm = new NodeVM({
      console: 'inherit',
      sandbox,
      require: {
        external: true,
        builtin: ['*'],
        root: './'
      }
    });

    const buffer = fs.readFileSync(scriptFile, {encoding: 'utf8'});
    console.log('脚本文件[' + scriptFile + '], 大小[' + buffer.length + '字节]');
    fs.unlinkSync(scriptFile);
    const runner = vm.run(buffer.toString(), __filename);
    if (param && !param.env) {
      try {
        param.env = process.env;
      } catch (err) {}
    }
    const result = await runner(param, callback);
    return result;
  } catch (err) {
    console.error(err);
  } finally {
    const now = new Date().getTime();
    console.log(moment(now).format('YYYY-MM-DD HH:mm:ss.SSS') + ' -- 脚本线程运行耗时' + (now - start) + '毫秒');
  }
}

function callback(param) {
  if (!param.event || !param.event.startsWith('$')) {
    return {
      succ: false,
      message: '参数应该具备event字段, 内容为以$开头的字符串'
    };
  }
  const eventKey = uuidV1();
  param.eventKey = eventKey;
  parentPort.postMessage(JSON.stringify(param, null, 0));
  if (param.needWait && interactive) {
    const event = {
      eventKey,
      emitter: new EventEmitter()
    };
    if (param.timeout) {
      event.timeout = setTimeout(() => {
        waitingHandle.emit('timeout', event.eventKey);
      }, param.timeout);
    }
    events.push(event);
    return waitFor(event);
  }
}

function waitFor(event) {
  return new Promise(resolve => {
    event.emitter.once(event.eventKey, ($event, data, err, status) => {
      event.emitter.removeAllListeners();
      console.log('消息[' + $event + ']返回: ', data);
      resolve({
        succ: !err,
        data,
        err,
        status
      });
    });
    event.emitter.once('timeout:' + event.eventKey, ($event) => {
      event.emitter.removeAllListeners();
      console.log('消息[' + $event + ']超时');
      resolve({
        succ: false,
        message: '超时'
      });
    });
  });
}
