'use strict';

let $$timeout = 0;
let $$timeoutOk = true;
let $$callback$$ = function () {
};

const $axios = (function () {
  if (!global.configs || !global.configs.service) {
    return require('axios');
  }
  const Axios = require('axios');
  const axios = Axios.create({
    baseURL: 'http://localhost:' + global.configs.service.port,
    withCredentials: true
  });
  axios.interceptors.request.use((config) => {
    if (global.session) {
      const { userId, authorization, cookie, areaCode } = global.session;
      config.headers.common['User-Id'] = userId;
      config.headers.common['Authorization'] = authorization;
      config.headers.common['Cookie'] = cookie;
      config.headers.common['area-code'] = areaCode;
    }
    return config;
  });
  return axios;
})();

let $mongoose;

async function initMongodb() {
  const mongoose = require('mongoose');
  $mongoose = await mongoose.createConnection(`mongodb://${global.configs.mongodb.host}:${global.configs.mongodb.port}/${global.configs.mongodb.db}?retryWrites=true`, {
    user: global.configs.mongodb.uid ? global.configs.mongodb.uid : undefined,
    pass: global.configs.mongodb.pwd ? global.configs.mongodb.pwd : undefined,
    autoIndex: true,
    replicaSet: global.configs.mongodb.replicaSet,
    keepAlive: true,
    maxPoolSize: 16,
    minPoolSize: 2,
    socketTimeoutMS: 4500,
    connectTimeoutMS: 4000
  });
  return $mongoose;
}

const $log = function (...args) {
  $$callback$$({
    event: '$log',
    status: 'RUNNING',
    args,
    needWait: false
  });
};

const $input = function ({ title, content, defaultValue, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$input',
    status: 'RUNNING',
    needWait: true,
    title,
    content,
    defaultValue,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $inputs = function ({ title, width, content, header, options, defaultValues, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$inputs',
    status: 'RUNNING',
    needWait: true,
    title,
    width,
    content,
    header,
    options,
    defaultValues,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};


const $select = function ({ title, content, options, defaultValue, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$select',
    status: 'RUNNING',
    needWait: true,
    title,
    content,
    options,
    defaultValue,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $selects = function ({ title, content, options, defaultValues, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$selects',
    status: 'RUNNING',
    needWait: true,
    title,
    content,
    options,
    defaultValues,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $planGraph = function ({ title, width, graph, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$planGraph',
    status: 'RUNNING',
    needWait: true,
    title,
    width,
    graph,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $checks = function ({ title, width, options, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$checks',
    status: 'RUNNING',
    needWait: true,
    title,
    width,
    options,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};
const $radio = function ({ title, width, options, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$radio',
    status: 'RUNNING',
    needWait: true,
    title,
    width,
    options,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $confirm = function ({ title, content, type, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$confirm',
    status: 'RUNNING',
    needWait: true,
    title,
    content,
    type,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $message = function ({ content, type, duration, closable }) {
  $$callback$$({
    event: '$message',
    status: 'RUNNING',
    needWait: false,
    content,
    type,
    duration,
    closable
  });
};

const $notice = function ({ title, desc, type, duration }) {
  $$callback$$({
    event: '$notice',
    status: 'RUNNING',
    needWait: false,
    title,
    desc,
    type,
    duration
  });
};

const $inputsGroup = function ({ title, width, member, activeName, timeout, timeoutOk }) {
  return $$callback$$({
    event: '$inputsGroup',
    status: 'RUNNING',
    needWait: true,
    title,
    width,
    member,
    activeName,
    timeout: !isNaN(timeout) ? timeout : $$timeout,
    timeoutOk: timeoutOk !== undefined ? timeoutOk : $$timeoutOk
  });
};

const $call = function ({ param, script, scriptIdentifier }) {
  return $$callback$$({
    event: '$call',
    status: 'RUNNING',
    needWait: true,
    param,
    script,
    scriptIdentifier
  });
};

const $triggerDownload = function ({ url, filename, dropUrl }) {
  return $$callback$$({
    event: '$download',
    status: 'RUNNING',
    needWait: false,
    url,
    filename,
    dropUrl
  });
}

console.log('已进入VM2脚本执行环境...');
module.exports = async function (param, $callback$) {
  try {
    if (!global.body) {
      global.body = param;
    }
  } catch (e) { }
  const __now = new Date().getTime();
  let result = '';
  try {
    $$callback$$ = $callback$;
    '//{script-code}//';
  } catch (err) {
    console.error('执行脚本出现异常: ', err.message);
    $callback$({
      event: '$error',
      status: 'ERROR',
      needWait: false,
      error: err,
      message: err.message
    });
    result = {
      err: true,
      succ: false,
      message: err.message
    };
  } finally {
    try {
      if ($mongoose) {
        $mongoose.close();
      }
    } catch (err) {
      console.error(err);
    }
    console.log('VM2脚本执行完毕, 耗时: ' + (new Date().getTime() - __now) + '毫秒');
  }
  return result;
};
