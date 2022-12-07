import fs from 'fs';
import stream, { Readable } from 'stream';
import path from 'path';
import { exec } from 'child_process';
import Router from 'koa-router';
import { VMScript } from 'vm2';
import koaBody from 'koa-body';
import moment from 'moment';
import FormData from 'form-data';
import JSZip from 'jszip';
import { GridFSBucket, ObjectId } from 'mongodb';
import urlencode from 'urlencode';
import xml2js from 'xml2js';
import LZString from 'lz-string';
import conf from '../../configs';
import {
  getJSScriptBucket,
  getJSTemplateBucket,
  getJSTemporaryBucket,
  getProtectModelGridFS,
  JSFile,
  JSTemplate,
  JSTemporary,
  ProtectCalculation,
  ProtectCompute,
  ProtectModel,
  toObjectId,
  User,
  Variable
} from '../mongo-schema';
import axios, { axiosBasic } from '../controller/basic-axios';
import VM2Pool from '../controller/threadpool/vm2pool';

const { v1: uuidV1 } = require('uuid');
const koaSSE = require('koa-sse-stream');

const vm2Pool = new VM2Pool();
const routerManage = new Router({ prefix: '/manage' });
const scriptContextMap = new Map();

function getFriendlyLength(size: string | number) {
  size = Number(size);
  if (size <= 0) {
    return '0';
  } else if (size < 1024) {
    return size + 'B';
  } else if (size < 1048576) {
    return Number((size / 1024).toFixed(1)) + 'K';
  } else if (size < 1073741824) {
    return Number((size / 1048576).toFixed(1)) + 'M';
  } else if (size < 1099511627776) {
    return Number((size / 1073741824).toFixed(1)) + 'G';
  } else if (size < 1125899906842624) {
    return Number((size / 1099511627776).toFixed(1)) + 'T';
  } else {
    return Number((size / 1125899906842624).toFixed(1)) + 'P';
  }
}

routerManage.post('/initialize-script-context', async (ctx) => {
  try {
    const body = ctx.request.body;
    const runKey = uuidV1();
    const scriptFile = VM2Pool.generateTempScriptPath();
    let script = '';
    if (body.scriptId) {
      const s = getJSScriptBucket().openDownloadStream(toObjectId(body.scriptId));
      const buffer = await readFile(s);
      script = buffer.toString();
    } else {
      script = body.scriptContent;
    }
    const code = new VMScript(VM2Pool.generateVM2Script(script)).code;
    fs.writeFileSync(scriptFile, code, { encoding: 'utf8' });

    scriptContextMap.set(runKey, {
      scriptFile,
      param: body.param,
      timeoutMS: body.timeoutMS,
      sandbox: {
        runKey,
        configs: conf,
        session: {
          userId: body.userId,
          dataSourceId: body.dataSourceId,
          appDataSourceId: body.appDataSourceId,
          areaCode: body.areaCode,
          // @ts-ignore
          authorization: ctx.session.key,
          cookie: ctx.get('cookie')
        }
      },
      timeout: setTimeout(() => {
        scriptContextMap.delete(runKey);
        fs.unlinkSync(scriptFile);
      }, 60000)
    });

    ctx.body = {
      succ: true,
      runKey
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

function executeScript (SSE: any, runKey: string, context: any) {
  return new Promise((resolve, reject) => {
    vm2Pool.pushTask({
      scriptFile: context.scriptFile,
      runKey,
      sandbox: context.sandbox,
      param: context.param,
      interactive: true,
      timeout: Number(context.timeoutMS),
      runningCallback: async (runKey, eventKey, event, param) => {
        if (event === '$call') {
          const scriptFile = VM2Pool.generateTempScriptPath();
          if (param.script) {
            fs.writeFileSync(scriptFile, param.script, { encoding: 'utf-8' });
          } else if (param.scriptIdentifier) {
            try {
              const found = await JSFile.findOne({ 'metadata.identifier': param.scriptIdentifier }).lean();
              if (found) {
                const scriptStream = getJSScriptBucket().openDownloadStream(found._id);
                const buffer = await readFile(scriptStream);
                const script = VM2Pool.generateVM2Script(buffer.toString());
                fs.writeFileSync(scriptFile, script, { encoding: 'utf-8' });
              } else {
                const err = new Error('未找到标识' + param.scriptIdentifier + '对应的脚本');
                onError(SSE, runKey, err);
                reject(err);
              }
            } catch (err: any) {
              onError(SSE, runKey, err);
              reject(err);
            }
          } else {
            const err = new Error('无法执行$call,参数对象中必须存在script或scriptIdentifier');
            onError(SSE, runKey, err);
            reject(err);
          }
          const newRunKey = uuidV1();
          const newContext = {
            scriptFile,
            runKey: newRunKey,
            sandbox: context.sandbox,
            param: param.param,
            interactive: true,
            timeoutMS: Number(context.timeoutMS)
          };
          // @ts-ignore
          executeScript(SSE, newRunKey, newContext).then(({ result }) => {
            vm2Pool.onReceipt({
              runKey,
              eventKey,
              event,
              data: result,
              status: 'ok'
            });
          }).catch(err => {
            onError(SSE, runKey, err);
            reject(err);
          });
        } else {
          delete param.eventKey;
          const message = {
            runKey,
            status: 'RUNNING',
            event: param.event,
            eventKey,
            param
          };
          const messageData = JSON.stringify(message, null, 0);
          SSE.send(Buffer.from(messageData).toString('base64'));
        }
      },
      finishCallback: (callbackRunKey, result) => {
        resolve({
          runKey: callbackRunKey,
          result
        });
      },
      errorCallback: (runKey, error) => {
        onError(SSE, runKey, error);
        reject(error);
      }
    });
  });

  function onError (SSE: any, runKey: string, error: any) {
    const message = {
      event: '$error',
      runKey,
      status: 'ERROR',
      result: error,
      message: error.message
    };
    SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
    console.error(runKey + ' -- reject', error);
    vm2Pool.kill(runKey);
  }
}

routerManage.get('/sse-run-script/:runKey', koaSSE({
  maxClients: 100,
  pingInterval: 30000
}), ctx => {
  // @ts-ignore
  const SSE = ctx.sse;
  const runKey = ctx.params.runKey;
  try {
    const context = scriptContextMap.get(runKey);
    if (!context) {
      const message = {
        runKey,
        status: 'ERROR',
        message: '指定的runKey: ' + runKey + '不存在'
      };

      SSE.send(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
      return;
    }

    clearTimeout(context.timeout);
    scriptContextMap.delete(runKey);

    console.log('已找到' + runKey + '对应的执行环境对象');
    console.log('-------------------sandbox-------------------');
    console.log(context.sandbox);
    console.log('-------------------param-------------------');
    console.log(context.param);

    // @ts-ignore
    executeScript(SSE, runKey, context).then(({
      runKey,
      result
    }) => {
      const message = {
        event: '$finish',
        runKey,
        status: 'FINISH',
        result
      };
      SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
      console.log('executeScript返回: ', result);
    });
  } catch (err: any) {
    console.warn('脚本执行错误');
    console.error(err);
    const message = {
      runKey,
      status: 'ERROR',
      message: err.message
    };

    // 出现异常时强制结束线程
    vm2Pool.kill(runKey);
    SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
  }
});

routerManage.get('/full-js-script/:id', async ctx => {
  const s = getJSScriptBucket().openDownloadStream(toObjectId(ctx.params.id));
  const buffer = await readFile(s);
  const code = new VMScript(VM2Pool.generateVM2Script(buffer.toString())).code;
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(code));
  const filename = urlencode('xscript.js');
  const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', contentDisposition);
  ctx.body = bufferStream;
});

routerManage.get('/kill-run/:runKey', ctx => {
  vm2Pool.kill(ctx.params.runKey);
  ctx.body = {
    succ: true
  };
});

routerManage.post('/response-event', ctx => {
  const body = ctx.request.body;
  ctx.body = vm2Pool.onReceipt({
    runKey: body.runKey,
    eventKey: body.eventKey,
    event: body.event,
    data: body.data,
    err: body.err,
    status: body.status,
    stop: body.stop
  });
});

routerManage.post('/test-js-template-identifier', async ctx => {
  const body = ctx.request.body;
  if (body.id) {
    const exists = await JSTemplate.exists({
      _id: {
        $ne: toObjectId(body.id)
      },
      'metadata.identifier': ctx.request.body.identifier
    });

    ctx.body = {
      exists
    };
  } else {
    const exists = await JSTemplate.exists({
      'metadata.identifier': ctx.request.body.identifier
    });

    ctx.body = {
      exists
    };
  }
});

routerManage.post('/test-js-file-identifier', async ctx => {
  const body = ctx.request.body;
  if (body.id) {
    const exists = await JSFile.exists({
      _id: {
        $ne: toObjectId(body.id)
      },
      'metadata.identifier': ctx.request.body.identifier
    });

    ctx.body = {
      exists
    };
  } else {
    const exists = await JSFile.exists({
      'metadata.identifier': ctx.request.body.identifier
    });

    ctx.body = {
      exists
    };
  }
});

routerManage.get('/js-templates', async ctx => {
  const array = await JSTemplate.find({}).lean();
  ctx.body = array.map((x: any) => {
    x.length = getFriendlyLength(x.length);
    return x;
  });
});

routerManage.get('/generate-js-template-key/:id', async ctx => {
  const key = String(new Date().getTime());
  await JSTemplate.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    $set: {
      'metadata.editorKey': key
    }
  });
  ctx.body = key;
});

routerManage.post('/on-js-template-save', async ctx => {
  const body = ctx.request.body;
  const template = await JSTemplate.findOne({ 'metadata.editorKey': body.key }).lean();
  try {
    // 0 - no document with the key identifier could be found,
    // 1 - document is being edited,
    // 2 - document is ready for saving,
    // 3 - document saving error has occurred,
    // 4 - document is closed with no changes,
    // 6 - document is being edited, but the current document state is saved,
    // 7 - error has occurred while force saving the document.
    switch (body.status) {
      case 2: {
        const { data: responseStream } = await axiosBasic({
          method: 'get',
          url: body.url,
          responseType: 'stream'
        });
        if (responseStream && template) {
          await getJSTemplateBucket().delete(template._id);
          const writeStream = getJSTemplateBucket().openUploadStreamWithId(template._id, template.filename, { metadata: template.metadata });
          responseStream.pipe(writeStream);
          await waitForWriteStream(writeStream);
        }
        break;
      }
      case 3:
      case 4:
      case 6:
      case 7: {
        break;
      }
    }

    ctx.body = {
      error: 0
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      error: 3
    };
  }
});

routerManage.get('/js-template/:id', async ctx => {
  const file = await JSTemplate.findById(toObjectId(ctx.params.id));
  if (file) {
    const stream = getJSTemplateBucket().openDownloadStream(toObjectId(ctx.params.id));
    const filename = urlencode(file.filename);
    const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', contentDisposition);
    ctx.set('Content-Length', String(file.length));
    ctx.body = stream;
  }
});

routerManage.post('/js-template-url', async ctx => {
  const body = ctx.request.body;
  const found = await JSTemplate.findOne({
    'metadata.identifier': body.identifier
  });
  if (found) {
    ctx.body = {
      succ: true,
      url: `${conf.service.prefix}${conf.service.host}:${conf.service.port}/manage/js-template/${found._id.toHexString()}`,
      _id: found._id
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到标识[' + body.identifier + ']对应的模板'
    };
  }
});

routerManage.post('/protect-template-url', async ctx => {
  const body = ctx.request.body;
  const found: any = await ProtectModel.findOne({ _id: toObjectId(body._id) });
  if (found) {
    ctx.body = {
      succ: true,
      url: `${conf.service.prefix}${conf.service.host}:${conf.service.port}/manage/downloadProtectTemplate/${found._id.toHexString()}`,
      _id: body._id
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到标识[' + body._id + ']对应的脚本'
    };
  }
});

routerManage.post('/js-file-url', async ctx => {
  const body = ctx.request.body;
  const found = await JSFile.findOne({
    'metadata.identifier': body.identifier
  });
  if (found) {
    ctx.body = {
      succ: true,
      url: `${conf.service.prefix}${conf.service.host}:${conf.service.port}/manage/js-file/${found._id.toHexString()}`,
      id: found._id
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到标识[' + body.identifier + ']对应的脚本'
    };
  }
});

routerManage.delete('/js-template/:id', async ctx => {
  const deleteResult = await dropFile(getJSTemplateBucket(), toObjectId(ctx.params.id));
  ctx.body = {
    succ: true,
    deleteResult
  };
});

routerManage.put('/js-template/:id', async ctx => {
  const body = ctx.request.body;
  ctx.body = await JSTemplate.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    $set: {
      'metadata.identifier': body.identifier,
      'metadata.areaCode': body.areaCode
    }
  });
});

routerManage.post('/upload-temporary-file', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  const file = ctx.request.files ? ctx.request.files.file : null;
  console.log(file);
  if (file) {
    // @ts-ignore
    const w = getJSTemporaryBucket().openUploadStream(file.name);
    // @ts-ignore
    const r = fs.createReadStream(file.path);
    r.pipe(w);
    await waitForWriteStream(w);
    ctx.body = w.id;
  }
});

routerManage.get('/download-temporary-file/:id', async ctx => {
  const file = await JSTemporary.findById(toObjectId(ctx.params.id)).lean();
  if (file) {
    const r = getJSTemporaryBucket().openDownloadStream(toObjectId(ctx.params.id));
    const filename = urlencode(file.filename);
    const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', contentDisposition);
    ctx.set('Content-Length', String(file.length));
    ctx.body = r;
  }
});

routerManage.delete('/drop-temporary-file/:id', async ctx => {
  await getJSTemporaryBucket().delete(toObjectId(ctx.params.id));
  ctx.body = {
    succ: true
  };
});

routerManage.post('/upload-js-template', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  const file = ctx.request.files ? ctx.request.files.file : null;
  const body = ctx.request.body;
  const metadata = {
    identifier: body.identifier,
    areaCode: Number(body.areaCode)
  };

  let writeStream;
  if (body.id) {
    const id = toObjectId(body.id);
    await getJSTemplateBucket().delete(id);
    // @ts-ignore
    writeStream = getJSTemplateBucket().openUploadStreamWithId(id, file.name, {
      metadata
    });
  } else {
    // @ts-ignore
    writeStream = getJSTemplateBucket().openUploadStream(file.name, { metadata });
  }
  // @ts-ignore
  const readStream = fs.createReadStream(file.path);
  readStream.pipe(writeStream);
  await waitForWriteStream(writeStream);

  ctx.body = writeStream.id;
});

routerManage.get('/export-js-templates', async ctx => {
  const zip = new JSZip();
  const templates = await JSTemplate.find({}).lean();
  for (const file of templates) {
    const stream = getJSTemplateBucket().openDownloadStream(file._id);
    const buffer = await readFile(stream);
    zip.file(file._id + '.file', buffer, {
      binary: true
    });
    zip.file(file._id.toHexString() + '.json', JSON.stringify(file), { binary: false });
  }

  const filename = urlencode('计算模板(' + moment().format('YYYYMMDDHHmmss') + ').zip');
  const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-disposition', contentDisposition);
  ctx.body = await zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
});

routerManage.post('/import-js-templates', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  try {
    // @ts-ignore
    const file = ctx.request.files.file;
    // @ts-ignore
    if (!file.name.match(/^计算模板.*?\.zip/)) {
      ctx.body = {
        succ: false,
        message: '文件名不合法'
      };
      return;
    }
    // @ts-ignore
    const fileData = await readFile(fs.createReadStream(file.path));
    const zip = await JSZip.loadAsync(fileData);
    const files: any[] = [];
    const fileMap: any = {};
    zip.forEach((path, f) => {
      fileMap[path] = f;
    });

    for (const path in fileMap) {
      if (path.endsWith('.json')) {
        const id = path.split('.')[0];
        // @ts-ignore
        const stream = zip.file(id + '.file').nodeStream();
        // @ts-ignore
        const fileObject = JSON.parse(await fileMap[path].async('string'));
        files.push({
          id,
          stream,
          fileObject
        });
      }
    }

    for (const f of files) {
      const id = toObjectId(f.id);
      try {
        await dropFile(getJSTemplateBucket(), id);
      } catch (err: any) {
        console.error(err);
      }
      const stream = getJSTemplateBucket().openUploadStreamWithId(id, f.fileObject.filename, { metadata: f.fileObject.metadata });
      f.stream.pipe(stream);
      await waitForWriteStream(stream);
    }

    ctx.body = {
      succ: true,
      count: files.length
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

function dropFile (bucket: GridFSBucket, id: ObjectId) {
  return new Promise((resolve, reject) => {
    bucket.delete(id, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

routerManage.get('/js-files', async ctx => {
  const array = await JSFile.find({}).sort({
    filename: 1
  }).lean();
  ctx.body = array.map((x: any) => {
    x.length = getFriendlyLength(x.length);
    return x;
  });
});

routerManage.get('/js-file/:id', async ctx => {
  const file = await JSFile.findById(toObjectId(ctx.params.id));
  if (file) {
    const stream = getJSScriptBucket().openDownloadStream(toObjectId(ctx.params.id));
    const filename = urlencode(file.filename);
    const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', contentDisposition);
    ctx.set('Content-Length', String(file.length));
    ctx.body = stream;
  }
});

routerManage.delete('/js-file/:id', async ctx => {
  const deleteResult = await dropFile(getJSScriptBucket(), toObjectId(ctx.params.id));
  ctx.body = {
    succ: true,
    result: deleteResult
  };
});

routerManage.put('/js-file/:id', async ctx => {
  const body = ctx.request.body;
  ctx.body = await JSFile.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    $set: {
      filename: body.identifier + '.js',
      'metadata.identifier': body.identifier,
      'metadata.areaCode': body.areaCode
    }
  });
});

routerManage.post('/js-file/:id', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  // @ts-ignore
  const file = ctx.request.files.file;
  const id = toObjectId(ctx.params.id);
  const fileData = await JSFile.findById(id).lean();
  if (fileData) {
    await dropFile(getJSScriptBucket(), id);
    const writeStream = getJSScriptBucket().openUploadStreamWithId(id, fileData.filename, {
      metadata: fileData.metadata
    });
    // @ts-ignore
    fs.createReadStream(file.path).pipe(writeStream);
    await waitForWriteStream(writeStream);
    ctx.body = {
      succ: true
    };
  }
});

routerManage.post('/create-js-file', async ctx => {
  const body = ctx.request.body;
  const metadata = {
    identifier: body.identifier,
    areaCode: body.areaCode
  };

  let writeStream;
  if (body._id) {
    const id = toObjectId(body._id);
    await dropFile(getJSScriptBucket(), id);
    writeStream = getJSScriptBucket().openUploadStreamWithId(id, body.identifier + '.js', {
      metadata
    });
  } else {
    writeStream = getJSScriptBucket().openUploadStream(body.identifier + '.js', { metadata });
  }

  writeStream.end(Buffer.from(body.script));
  ctx.body = writeStream.id;
});

routerManage.get('/export-js-files', async ctx => {
  const zip = new JSZip();
  const templates = await JSFile.find({}).lean();
  for (const file of templates) {
    const stream = getJSScriptBucket().openDownloadStream(file._id);
    const buffer = await readFile(stream);
    zip.file(file._id + '.file', buffer, {
      binary: true
    });
    zip.file(file._id.toHexString() + '.json', JSON.stringify(file), { binary: false });
  }

  const filename = urlencode('计算脚本(' + moment().format('YYYYMMDDHHmmss') + ').zip');
  const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-disposition', contentDisposition);
  ctx.body = await zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
});

routerManage.post('/import-js-files', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  try {
    // @ts-ignore
    const file = ctx.request.files.file;
    // @ts-ignore
    if (!file.name.match(/^计算脚本.*?\.zip/)) {
      ctx.body = {
        succ: false,
        message: '文件名不合法'
      };
      return;
    }
    // @ts-ignore
    const fileData = await readFile(fs.createReadStream(file.path));
    const zip = await JSZip.loadAsync(fileData);
    const files: any[] = [];
    const fileMap: any = {};
    zip.forEach((path, f) => {
      fileMap[path] = f;
    });

    for (const path in fileMap) {
      if (path.endsWith('.json')) {
        const id = path.split('.')[0];
        // @ts-ignore
        const stream = zip.file(id + '.file').nodeStream();
        const fileObject = JSON.parse(await fileMap[path].async('string'));
        files.push({
          id,
          stream,
          fileObject
        });
      }
    }

    for (const f of files) {
      const id = toObjectId(f.id);
      try {
        await dropFile(getJSScriptBucket(), id);
      } catch (err: any) {
        console.error(err);
      }
      const stream = getJSScriptBucket().openUploadStreamWithId(id, f.fileObject.filename, { metadata: f.fileObject.metadata });
      f.stream.pipe(stream);
      await waitForWriteStream(stream);
    }

    ctx.body = {
      succ: true,
      count: files.length
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

function waitForWriteStream (stream: stream.Writable) {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve(true);
    });
    stream.on('error', err => {
      reject(err);
    });
  });
}

function readFile (readerStream: stream.Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: any[] = [];
    readerStream.on('data', function (chunk) {
      data.push(chunk);
    });

    readerStream.on('error', function (err) {
      reject(err);
    });

    readerStream.on('end', function () {
      resolve(Buffer.concat(data));
    });
  });
}

function executeCommand (cmd: string) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve({
          stdout,
          stderr
        });
      }
    });
  });
}


// 变量删改查接口
routerManage.post('/delete-var', async (ctx) => {
  const areaCode = Number(ctx.headers['area-code']);
  const body = ctx.request.body;
  const condition: any = {
    areaCode
  };
  if (body.name) {
    condition.name = body.name;
  }
  if (body.key) {
    condition.key = body.key;
  }
  const deleted: any = await Variable.deleteOne(condition);
  ctx.body = {
    succ: deleted.ok > 0,
    count: deleted.n,
    deleteCount: deleted.deleteCount
  };
});

routerManage.post('/update-var', async (ctx, next) => {
  const areaCode = Number(ctx.headers['area-code']);
  const body = ctx.request.body;
  const v = await Variable.findOne({
    key: body.key,
    areaCode
  });
  if (!v) {
    const newVar = new Variable({
      name: body.name,
      key: body.key,
      value: body.value,
      oldValue: '',
      updateTime: new Date(),
      description: body.description,
      model: body.model,
      areaCode
    });
    await newVar.save();
    ctx.body = {
      succ: true,
      new: true
    };
  } else {
    if (JSON.stringify(v.value) !== JSON.stringify(body.value)) {
      v.name = body.name;
      v.oldValue = v.value;
      v.value = body.value;
      v.updateTime = new Date();
      v.description = body.description;
      v.model = body.model;
      await v.save();
      ctx.body = {
        succ: true,
        new: false,
        updated: true,
        oldValue: v.oldValue
      };
    } else {
      ctx.body = {
        succ: true,
        new: false,
        updated: false,
        oldValue: v.oldValue
      };
    }
  }
});

routerManage.post('/get-var', async (ctx, next) => {
  const body = ctx.request.body;
  const areaCode = Number(ctx.headers['area-code']);
  const condition: any = {
    areaCode
  };
  if (body.name) {
    condition.name = body.name;
  }
  if (body.key) {
    condition.key = body.key;
  }

  const record = await Variable.findOne(condition);
  if (!record) {
    const newVar = new Variable({
      name: body.name,
      key: body.key,
      value: body.value,
      oldValue: '',
      updateTime: new Date(),
      description: body.description,
      model: body.model,
      areaCode
    });
    await newVar.save();
    ctx.body = body.value;
  } else {
    ctx.body = record.value;
  }
});

routerManage.get('/list-vars', async ctx => {
  const areaCode = Number(ctx.headers['area-code']);
  ctx.body = await Variable.find({
    areaCode
  }).lean();
});

// 保护计算书关联脚本配置
routerManage.post('/protectCompute/delete', async (ctx) => {
  const body = ctx.request.body;
  const areaCode = Number(ctx.headers['area-code']);
  const condition = {
    areaCode,
    _id: body._id
  };
  const record = await ProtectCompute.findOneAndDelete(condition);
  ctx.body = {
    succ: !!record
  };
});

routerManage.post('/protectCompute/update', async (ctx, next) => {
  const body = ctx.request.body;
  const areaCode = Number(ctx.headers['area-code']);
  if (!body._id) {
    const newObject = new ProtectCompute({
      protectType: body.protectType,
      scriptName: body.scriptName,
      scriptFileId: body.scriptFileId,
      computeType: body.computeType,
      areaCode,
      updateTime: new Date()
    });
    ctx.body = await newObject.save();
  } else {
    await protectComputeUpdate(body, areaCode);
    ctx.body = {
      succ: true,
      updated: true
    };
  }
});

routerManage.post('/protectCompute/updateList', async (ctx, next) => {
  const body = ctx.request.body;
  const areaCode = Number(ctx.headers['area-code']);
  for (const obj of body) {
    await protectComputeUpdate(obj, areaCode);
  }
  ctx.body = {
    succ: true,
    updated: true
  };
});

routerManage.get('/protectCompute/list', async ctx => {
  const areaCode = Number(ctx.headers['area-code']);
  ctx.body = await ProtectCompute.find({
    areaCode
  }).lean();
});

async function protectComputeUpdate (obj: any, areaCode: number) {
  await ProtectCompute.updateOne({
    _id: toObjectId(obj._id)
  }, {
    $set: {
      protectType: obj.protectType,
      scriptName: obj.scriptName,
      scriptFileId: obj.scriptFileId,
      computeType: obj.computeType,
      areaCode,
      updateTime: new Date()
    }
  });
}

// 更新计算书生成记录
routerManage.post('/protectCalculation/update', async (ctx) => {
  const body = ctx.request.body;
  // 查询已有记录并更新
  const find = await ProtectCalculation.findOne({ protectId: body.protectId });
  if (find) {
    let history: any[] = [];
    switch (body.type) {
      case 'protect': {
        history = find.protectHistory;
        break;
      }
      case 'validate': {
        history = find.validateHistory;
        break;
      }
      default:
        break;
    }
    // 添加新的计算书记录
    history.push(body.history);
    // 删除掉多余的旧记录，只保留最新的前两个
    history.splice(0, history.length - 2);
    // 根据类型保存历史记录
    const saveDoc = await find.save();
    ctx.body = {
      status: 'update',
      success: saveDoc !== find
    };
  } else {
    // 创建新的记录
    const calculation = new ProtectCalculation({
      protectId: body.protectId,
      protectName: body.protectName,
      protectType: body.protectType,
      unitId: body.unitId,
      unitName: body.unitName,
      substationId: body.substationId,
      substationName: body.substationName,
      areaCode: Number(ctx.headers['area-code']),
      modifierId: Number(ctx.headers['user-id']),
      modifierName: body.modifierName
    });
    // 根据类型保存历史记录
    switch (body.type) {
      case 'protect': {
        calculation.protectHistory = [body.history];
        break;
      }
      case 'validate': {
        calculation.validateHistory = [body.history];
        break;
      }
      default:
        break;
    }
    const newCalculation = await calculation.save();
    ctx.body = {
      status: 'save',
      success: newCalculation === calculation
    };
  }
});

// 删除计算书生成记录
routerManage.post('/protectCalculation/delete', async (ctx) => {
  ctx.body = await ProtectCalculation.deleteMany({
    protectId: {
      $in: ctx.request.body.deleteList
    }
  });
});

// 查询所有的计算书生成记录
routerManage.get('/protectCalculation/list', async (ctx) => {
  ctx.body = await ProtectCalculation.where('areaCode', Number(ctx.headers['area-code'])).lean();
});

function generateOfficeFileStreamWithMetadata (readerStream: Readable, metadata: any) {
  return new Promise((resolve, reject) => {
    const data: any[] = [];
    readerStream.on('data', function (chunk: any) {
      data.push(chunk);
    });

    readerStream.on('error', function (err: any) {
      reject(err);
    });

    readerStream.on('end', function () {
      // @ts-ignore
      const buf = Buffer.concat(data);
      JSZip.loadAsync(buf).then((zip) => {
        // @ts-ignore
        zip.file('docProps/core.xml').async('string').then((text) => {
          xml2js.parseString(text, {
            explicitArray: false,
            emptyTag: ' ',
            includeWhiteChars: true
            // @ts-ignore
          }, (err, json) => {
            if (err) {
              reject(err);
            } else {
              metadata.metadata.script = metadata.metadata.script.toString();
              json['cp:coreProperties']['dc:description'] = LZString.compressToBase64(JSON.stringify(metadata));
              const builder = new xml2js.Builder({
                xmldec: {
                  version: '1.0',
                  encoding: 'UTF-8',
                  standalone: true
                },
                // @ts-ignore
                emptyTag: ' '
              });
              const xml = builder.buildObject(json);
              zip.file('docProps/core.xml', xml, { binary: false });
              // @ts-ignore
              zip.file('[Content_Types].xml').async('string').then(contentTypeXml => {
                xml2js.parseString(contentTypeXml, {
                  explicitArray: false
                }, (err3, contextType) => {
                  if (err3) {
                    resolve(err3);
                  } else {
                    let mimeType = '';
                    let extName = '';
                    if (contextType.Types && Array.isArray(contextType.Types.Override)) {
                      for (const type of contextType.Types.Override) {
                        if (type.$.ContentType.indexOf('spreadsheetml.sheet') > 0) {
                          extName = '.xlsx';
                          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                          break;
                        }

                        if (type.$.ContentType.indexOf('wordprocessingml.document') > 0) {
                          extName = '.docx';
                          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                          break;
                        }
                      }

                      if (extName) {
                        zip.generateAsync({
                          type: 'arraybuffer',
                          mimeType
                        }).then((buffer) => {
                          const bufferStream = new stream.PassThrough();
                          bufferStream.end(Buffer.from(buffer));
                          resolve({
                            stream: bufferStream,
                            mimeType,
                            extName
                          });
                        });
                      } else {
                        reject(new Error('不支持的office模板文件类型'));
                      }
                    } else {
                      reject(new Error('未知的模板文件类型'));
                    }
                  }
                });
              }).catch(reject);
            }
          });
        });
      }).catch(reject);
    });
  });
}


routerManage.get('/generateEditorKey/:id/:areaCode', async (ctx) => {
  const key = ctx.params.areaCode + Date.now();
  // @ts-ignore
  if (ctx.session) {
    // @ts-ignore
    const user = await User.findById(ctx.session.user._id);
    const username = user ? user.name : '';
    await ProtectModel.updateOne({
      _id: toObjectId(ctx.params.id)
    }, {
      $set: {
        'metadata.officeKey': key,
        'metadata.modifier': username
      }
    });
    ctx.body = {
      succ: true,
      key
    };
  } else {
    ctx.body = {
      succ: true,
      key: String(new Date().getTime())
    };
  }
});

routerManage.post('/batchProtectModelScripts', async (ctx, next) => {
  const body = ctx.request.body;
  const script = Buffer.from(body.script);
  const ret = [];
  for (const id of body.protectModelIds) {
    const protectModel = await ProtectModel.findOne({ _id: toObjectId(id) });
    if (protectModel) {
      protectModel.metadata.script = script;
      ret.push(protectModel._id);
      await protectModel.save();
    }
  }

  ctx.body = {
    succ: true,
    ids: ret
  };
});

async function getWorkbookData(fileData: Buffer, filename: string) {
  try {
    const formData = new FormData();
    formData.append('file', fileData, filename);
    const headers = formData.getHeaders();
    headers['Content-Length'] = formData.getLengthSync();
    const { data } = await axios.post('/api/dz/get-all-cell-values', formData, {
      headers
    });
    if (data.succ) {
      return data.cellValues || [];
    } else {
      console.error(data.message);
      return [];
    }
  } catch (e: any) {
    console.error(e);
    return [];
  }
}

routerManage.get('/dzd-template-add-count/:id', async ctx => {
  try {
    const template = await ProtectModel.findById(toObjectId(ctx.params.id));
    if (template) {
      template.metadata.dzdCount = Number(template.metadata.dzdCount || 0) + 1;
      if (Array.isArray(template.metadata.modifyLogs) && template.metadata.modifyLogs.length > 0) {
        template.metadata.modifyLogs[template.metadata.modifyLogs.length - 1].dzdCount = template.metadata.dzdCount;
      }
      const result = await template.save();
      ctx.body = {
        succ: true,
        result
      };
    } else {
      ctx.body = {
        succ: false,
        message: '未找到定值单模板'
      };
    }
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: e.message
    };
  }
});

routerManage.get('/dzd-template-info/:id', async ctx => {
  try {
    const result = await ProtectModel.findById(toObjectId(ctx.params.id)).lean();
    if (result) {
      result.metadata.modifyLogs.sort((a, b) => b.modifyTime - a.modifyTime);
      for (const l of result.metadata.modifyLogs) {
        l.modifyTime = moment(l.modifyTime).format('YYYY-MM-DD HH:mm:ss');
      }
      ctx.body = {
        succ: true,
        result
      };
    } else {
      ctx.body = {
        succ: false,
        message: '未找到定值单模板'
      };
    }
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: e.message
    };
  }
});

routerManage.post('/on-doc-save', async (ctx, next) => {
  const body = ctx.request.body;
  const protectModel = await ProtectModel.findOne({ 'metadata.officeKey': body.key }).lean();
  try {
    // 0 - no document with the key identifier could be found,
    // 1 - document is being edited,
    // 2 - document is ready for saving,
    // 3 - document saving error has occurred,
    // 4 - document is closed with no changes,
    // 6 - document is being edited, but the current document state is saved,
    // 7 - error has occurred while force saving the document.
    switch (body.status) {
      case 2: {
        const { data: responseStream } = await axiosBasic({
          method: 'get',
          url: body.url,
          responseType: 'stream'
        });
        let fileStream = responseStream;
        if (responseStream && protectModel) {
          const content = [];
          if (protectModel.filename.endsWith('.xlsx')) {
            const addCells = [];
            const modifyCells = [];
            const dropCells = [];
            const rawFileStream = getProtectModelGridFS().openDownloadStream(protectModel._id);
            const rawFileData = await readFile(rawFileStream);
            const originalCells = await getWorkbookData(rawFileData, protectModel.filename);
            const currentFileData = await readFile(responseStream);
            const currentCells = await getWorkbookData(currentFileData, protectModel.filename);
            for (const cell of currentCells) {
              const originCell = originalCells.find((x: any) => x.address === cell.address);
              if (!originCell) {
                if (cell.value) {
                  addCells.push(cell);
                }
              } else {
                if (cell.value !== originCell.value) {
                  if (cell.value) {
                    modifyCells.push({
                      oldValue: originCell.value,
                      address: cell.address,
                      sheetName: cell.sheetName,
                      value: cell.value
                    });
                  } else {
                    dropCells.push(cell);
                  }
                }
              }
            }
            for (const cell of originalCells) {
              const currentCell = currentCells.find((x: any) => x.address === cell.address);
              if (!currentCell) {
                dropCells.push(cell);
              }
            }
            for (const c of addCells) {
              content.push({
                sheetName: c.sheetName,
                cellAddress: c.address,
                modifyType: 'add',
                oldValue: '',
                newValue: c.value
              });
            }
            for (const c of modifyCells) {
              content.push({
                sheetName: c.sheetName,
                cellAddress: c.address,
                modifyType: 'modify',
                oldValue: c.oldValue,
                newValue: c.value
              });
            }
            for (const c of dropCells) {
              content.push({
                sheetName: c.sheetName,
                cellAddress: c.address,
                modifyType: 'remove',
                oldValue: c.value,
                newValue: ''
              });
            }

            fileStream = new stream.PassThrough();
            fileStream.end(currentFileData);
          }

          await getProtectModelGridFS().delete(protectModel._id);
          protectModel.metadata.officeKey = '';
          if (!protectModel.metadata.modifyLogs) {
            protectModel.metadata.modifyLogs = [];
          }
          protectModel.metadata.modifyLogs.push({
            modifyTime: new Date(),
            modifier: protectModel.metadata.modifier,
            dzdCount: protectModel.metadata.dzdCount || 0,
            content
          });
          if (protectModel.metadata.modifyLogs.length > 5) {
            protectModel.metadata.modifyLogs.splice(0, 1);
          }
          protectModel.metadata.dzdCount = 0;
          const writeStream = getProtectModelGridFS().openUploadStreamWithId(
            protectModel._id, protectModel.filename, { metadata: protectModel.metadata });
          fileStream.pipe(writeStream);
          await waitForWriteStream(writeStream);
        }
        break;
      }
      case 3:
      case 4:
      case 6:
      case 7: {
        break;
      }
    }

    ctx.body = {
      error: 0
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      error: 3
    };
  }
});

const keyMap: any = {};

routerManage.get('/generateTemporaryEditorKey/:id/:areaCode', (ctx) => {
  const key = ctx.params.areaCode + new Date().getTime().toString();
  keyMap[key] = ctx.params.id;
  ctx.body = {
    succ: true,
    key
  };
});

routerManage.post('/setDzTemplateProtectType/:areaCode', async (ctx) => {
  const body = ctx.request.body;
  const protectModels = await ProtectModel.find({
    'metadata.areaCode': Number(ctx.params.areaCode),
    'metadata.protectType': body.oldProtectType
  });
  let ret = 0;
  for (const protectModel of protectModels) {
    protectModel.metadata.protectType = body.newProtectType;
    await protectModel.save();
    ret++;
  }

  ctx.body = {
    succ: true,
    updateCount: ret
  };
});

routerManage.post('/importProtectModels/:areaCode', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 2000 * 1024 * 1024
  }
}), async (ctx, next) => {
  const file = ctx.request.files ? ctx.request.files.file : null;
  // @ts-ignore
  const readStream = fs.createReadStream(file.path);
  const zip = await JSZip.loadAsync(await readFile(readStream));
  // @ts-ignore
  const json = await zip.file('meta').async('string');
  const fileMetadata = JSON.parse(json);
  let importCount = 0;
  if (Array.isArray(fileMetadata.protectModels)) {
    const protectModels = await ProtectModel.find({ 'metadata.areaCode': Number(ctx.params.areaCode) }).lean();
    for (const protectModel of protectModels) {
      getProtectModelGridFS().delete(protectModel._id);
    }

    const found = await fileMetadata.protectModels.find((x: any) => x.areaCode === Number(ctx.params.areaCode));
    if (found) {
      for (const id of found.ids) {
        try {
          const folder = zip.folder(id);
          // @ts-ignore
          const metaString = await folder.file('metadata.json').async('string');
          const metadata = JSON.parse(metaString);
          metadata.metadata.script = Buffer.from(String(metadata.metadata.script), 'base64');
          const writeStream = getProtectModelGridFS().openUploadStreamWithId(toObjectId(id), metadata.filename, { metadata: metadata.metadata });
          // @ts-ignore
          folder.file(metadata.filename).nodeStream().pipe(writeStream);
          await waitForWriteStream(writeStream);
          importCount++;
        } catch (err: any) {
          console.error(err);
        }
      }
    }
  }
  ctx.body = {
    succ: true,
    importCount
  };
});

function normalizeDocFile(docZip: JSZip) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    docZip.file('docProps/core.xml').async('string').then((text: string) => {
      xml2js.parseString(text, {
        explicitArray: false
      }, (err, json) => {
        if (err) {
          reject(err);
        } else {
          delete json['cp:coreProperties']['dc:description'];
          const builder = new xml2js.Builder({
            xmldec: {
              version: '1.0',
              encoding: 'UTF-8',
              standalone: true
            }
          });
          const xml = builder.buildObject(json);
          docZip.file('docProps/core.xml', xml, { binary: false });
          resolve(true);
        }
      });
    }).catch(reject);
  });
}

routerManage.get('/exportProtectModels/:areaCode', async (ctx, next) => {
  let protectModels;
  const areaCode = Number(ctx.params.areaCode);
  if (areaCode > 0) {
    protectModels = await ProtectModel.find({ 'metadata.areaCode': Number(ctx.params.areaCode) }).lean();
  } else {
    protectModels = await ProtectModel.find().lean();
  }
  console.log('查找到' + protectModels.length + '个要导出的保护装置型号');
  const zip = new JSZip();
  const metaFile = {
    protectModels: []
  };
  for (const protectModel of protectModels) {
    const strId = typeof protectModel._id === 'string' || typeof protectModel._id.toHexString !== 'function' ? protectModel._id : protectModel._id.toHexString();
    const objId = protectModel._id;
    try {
      const readerStream = getProtectModelGridFS().openDownloadStream(objId);
      const folder = zip.folder(strId);
      delete protectModel._id;
      // @ts-ignore
      folder.file('metadata.json', JSON.stringify(protectModel));

      const fileBuffer = await readFile(readerStream);
      const docZip = await JSZip.loadAsync(fileBuffer);
      await normalizeDocFile(docZip);
      const docFile = await docZip.generateNodeStream();
      // @ts-ignore
      folder.file(protectModel.filename, docFile);
      // @ts-ignore
      const found = metaFile.protectModels.find(x => x.areaCode === protectModel.metadata.areaCode);
      if (found) {
        // @ts-ignore
        found.ids.push(strId);
      } else {
        metaFile.protectModels.push({
          // @ts-ignore
          areaCode: protectModel.metadata.areaCode,
          // @ts-ignore
          ids: [strId]
        });
      }
    } catch (err: any) {
      console.log(`导出装置型号(${protectModel.filename}, ${protectModel._id})失败, ${err.message}`);
      console.error(err);
      if (strId) {
        zip.remove(strId);
      }
    }
  }

  zip.file('meta', JSON.stringify(metaFile));

  ctx.body = zip.generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
});

routerManage.get('/downloadProtectTemplateFile/:id', async (ctx, next) => {
  const file = await ProtectModel.findOne({ _id: toObjectId(ctx.params.id) });
  const readerStream = getProtectModelGridFS().openDownloadStream(toObjectId(ctx.params.id));
  // @ts-ignore
  const filename = urlencode(file.filename);
  const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', contentDisposition);
  // @ts-ignore
  ctx.set('Content-Length', String(file.length));
  ctx.body = readerStream;
});

routerManage.get('/downloadProtectTemplate/:id', async (ctx, next) => {
  try {
    const metadata = await ProtectModel.findOne({ _id: toObjectId(ctx.params.id) }).lean();
    if (metadata) {
      try {
        const readerStream = getProtectModelGridFS().openDownloadStream(toObjectId(ctx.params.id));
        const stream = await generateOfficeFileStreamWithMetadata(readerStream, metadata);
        // @ts-ignore
        const filename = urlencode(metadata.filename.toLowerCase().endsWith(stream.extName) ? metadata.filename : metadata.filename + stream.extName);
        const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
        // @ts-ignore
        ctx.set('Content-Type', stream.mimeType);
        ctx.set('Content-disposition', contentDisposition);
        // @ts-ignore
        ctx.body = stream.stream;
      } catch (e: any) {
        console.error(e);
        const readerStream = getProtectModelGridFS().openDownloadStream(toObjectId(ctx.params.id));
        const filename = urlencode(metadata.filename);
        const contentDisposition = 'attachment; filename=' + filename + '; filename*=utf-8\'\'' + filename;
        ctx.set('Content-Type', 'binary/octet-stream');
        ctx.set('Content-Disposition', contentDisposition);
        ctx.body = readerStream;
      }
    } else {
      ctx.body = {
        succ: false,
        message: '文件不存在'
      };
    }
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: e.toString()
    };
  }
});

routerManage.delete('/protectModel/:id', async (ctx, next) => {
  const result = await dropFile(getProtectModelGridFS(), toObjectId(ctx.params.id));
  ctx.body = {
    succ: true,
    result
  };
});

routerManage.post('/protectModel/check/duplicate', async (ctx) => {
  if (ctx.request.body._id) {
    ctx.body = await ProtectModel.countDocuments({
      _id: {
        $ne: ctx.request.body._id
      },
      'metadata.areaCode': Number(ctx.request.body.areaCode),
      'metadata.checkCode': ctx.request.body.checkCode,
      'metadata.version': ctx.request.body.version,
      'metadata.modelNumber': ctx.request.body.modelNumber
    });
  } else {
    ctx.body = await ProtectModel.countDocuments({
      'metadata.areaCode': Number(ctx.request.body.areaCode),
      'metadata.checkCode': ctx.request.body.checkCode,
      'metadata.version': ctx.request.body.version,
      'metadata.modelNumber': ctx.request.body.modelNumber
    });
  }
});

// 更新装置型号
routerManage.post('/protectModel/:id', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024
  }
}), async (ctx, next) => {
  const found = await ProtectModel.findOne({ _id: toObjectId(ctx.params.id) });
  if (!found) {
    ctx.body = {
      succ: false,
      message: '数据库中不存在id为' + ctx.params.id + '的装置定值模板文件'
    };
    return;
  }

  const file = ctx.request.files ? ctx.request.files.file : null;
  const body = ctx.request.body;
  const user = await User.findById(body.userId);
  // @ts-ignore
  const filename = body.filename ? body.filename : (file ? file.name : 'empty.xlsx');
  if (file) {
    await dropFile(getProtectModelGridFS(), toObjectId(ctx.params.id));
    const metadata = {
      // 创建人
      creator: found.metadata.creator,
      // 创建时间
      createTime: found.metadata.createTime,
      // 修改人
      // @ts-ignore
      modifier: user.name,
      // 修改时间
      modifyTime: new Date(),
      // 型号
      modelNumber: body.modelNumber,
      // 校验码
      checkCode: body.checkCode,
      extname: body.extname,
      // 版本
      version: body.version,
      // 是否为六统一
      flag6: body.flag6 ? body.flag6.toLowerCase() === 'true' : false,
      // 厂家
      factory: body.factory,
      // 电压等级
      baseVoltageName: body.baseVoltageName,
      // 保护类型(线路、侧路、切换、变压器、站用变、中性点、断路器、母线、母联、录波器、备自投、电容器、电抗器、短引线、10kV线路、远方跳闸)
      protectType: body.protectType,
      // 地区号
      areaCode: Number(body.areaCode),
      // 接口列表
      interfaces: [],
      // 参数检查表
      argChecks: [],
      modifyLogs: [],
      dzdCount: 0,
      script: body.script && body.script !== '' ? Buffer.from(body.script) : found.metadata.script
    };
    const writeStream = getProtectModelGridFS().openUploadStreamWithId(toObjectId(ctx.params.id), filename, { metadata });
    // @ts-ignore
    const readStream = fs.createReadStream(file.path);
    readStream.pipe(writeStream);
    await waitForWriteStream(writeStream);
    ctx.body = {
      _id: writeStream.id,
      filename,
      metadata
    };
  } else {
    found.filename = body.filename;
    found.metadata.modelNumber = body.modelNumber;
    found.metadata.checkCode = body.checkCode;
    found.metadata.version = body.version;
    found.metadata.flag6 = body.flag6;
    found.metadata.factory = body.factory;
    found.metadata.baseVoltageName = body.baseVoltageName;
    found.metadata.protectType = body.protectType;
    found.metadata.areaCode = body.areaCode;
    await found.save();
    ctx.body = found;
  }
});

routerManage.get('/protectModel/script/:id', async (ctx, next) => {
  const protectModel = await ProtectModel.findOne({ _id: ctx.params.id }, { 'metadata.script': 1 }).lean();
  if (protectModel) {
    ctx.body = protectModel.metadata.script.toString();
  } else {
    ctx.body = '';
  }
});

routerManage.post('/protectModel/script/:id', async (ctx, next) => {
  const protectModel = await ProtectModel.findOne({ _id: toObjectId(ctx.params.id) });
  // @ts-ignore
  protectModel.metadata.script = Buffer.from(ctx.request.body.script);
  // @ts-ignore
  await protectModel.save();
  ctx.body = {
    succ: true
  };
});

// 新建装置型号
routerManage.post('/protectModel', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024
  }
}), async (ctx, next) => {
  const file = ctx.request.files ? ctx.request.files.file : null;
  const body = ctx.request.body;
  const user = await User.findById(body.userId);
  // @ts-ignore
  const filename = body.filename ? body.filename : (file ? file.name : 'empty.xlsx');
  const metadata = {
    // 创建人
    // @ts-ignore
    creator: user.name,
    // 创建时间
    createTime: new Date(),
    // 修改人
    // @ts-ignore
    modifier: user.name,
    // 修改时间
    modifyTime: new Date(),
    // 型号
    modelNumber: body.modelNumber,
    // 校验码
    checkCode: body.checkCode,
    extname: body.extname,
    // 版本
    version: body.version,
    // 是否为六统一
    flag6: body.flag6 ? body.flag6.toLowerCase() === 'true' : false,
    // 厂家
    factory: body.factory,
    // 电压等级
    baseVoltageName: '',
    // 保护类型(线路、侧路、切换、变压器、站用变、中性点、断路器、母线、母联、录波器、备自投、电容器、电抗器、短引线、10kV线路、远方跳闸)
    protectType: '',
    // 地区号
    areaCode: Number(ctx.headers['area-code']),
    // 接口列表
    interfaces: [],
    // 参数检查表
    argChecks: [],
    modifyLogs: [],
    dzdCount: 0,
    script: Buffer.from(body.script && body.script !== '' ? body.script : '')
  };
  const writeStream = getProtectModelGridFS().openUploadStream(filename, { metadata });
  // @ts-ignore
  const readStream = file ? fs.createReadStream(file.path) : fs.createReadStream(path.resolve(__dirname, '../utils/empty.xlsx'));
  readStream.pipe(writeStream);
  await waitForWriteStream(writeStream);
  ctx.body = {
    _id: writeStream.id,
    filename,
    metadata
  };
});

// routerManage.get('/protectModels/:areaCode', async (ctx, next) => {
//   ctx.body = await ProtectModel.find({ 'metadata.areaCode': Number(ctx.params.areaCode) }, {
//     _id: 1,
//     filename: 1,
//     'metadata.modelNumber': 1,
//     'metadata.checkCode': 1,
//     'metadata.version': 1,
//     'metadata.flag6': 1,
//     'metadata.factory': 1,
//     'metadata.extname': 1,
//     'metadata.baseVoltageName': 1,
//     'metadata.protectType': 1,
//     'metadata.areaCode': 1
//   }).lean();
// });

routerManage.get('/protectModels/list', async (ctx, next) => {
  ctx.body = await ProtectModel.find({ 'metadata.areaCode': Number(ctx.headers['area-code']) }, {
    _id: 1,
    filename: 1,
    'metadata.modelNumber': 1,
    'metadata.checkCode': 1,
    'metadata.version': 1,
    'metadata.flag6': 1,
    'metadata.factory': 1,
    'metadata.extname': 1,
    'metadata.baseVoltageName': 1,
    'metadata.protectType': 1,
    'metadata.areaCode': 1
  }).lean();
});

routerManage.post('/getProtectTypeByIdAndVersion', async (ctx, next) => {
  const body = ctx.request.body;
  const protectType = await ProtectModel.findOne({
    _id: toObjectId(body.protectTypeId),
    'metadata.version': body.version
  }).lean();
  if (protectType) {
    ctx.body = {
      succ: true
    };
  } else {
    ctx.body = {
      succ: false
    };
  }
});

routerManage.get('/getScript2/:protectTypeId', async (ctx, next) => {
  const protectType = await ProtectModel.findOne({ _id: toObjectId(ctx.params.protectTypeId) }).lean();
  // const interfaceNames = protectType.metadata.interfaces;
  // const interfaces = await MongoModels.DZInterface.find({name: {$in: interfaceNames}}, {script: 1}).lean();
  if (protectType) {
    ctx.body = {
      succ: true,
      script: protectType.metadata.script.toString(),
      interfaces: [], // interfaces.map(x => x.script.toString()),
      protectType: {
        id: protectType._id,
        _id: protectType._id,
        creator: protectType.metadata.creator,
        modelNumber: protectType.metadata.modelNumber,
        checkCode: protectType.metadata.checkCode,
        version: protectType.metadata.version,
        protectType: protectType.metadata.protectType,
        factory: protectType.metadata.factory,
        templateFileName: protectType.filename,
        templateID: protectType._id,
        typeName: protectType.metadata.modelNumber,
        typeGroup: protectType.metadata.checkCode,
        basicDeviceType: protectType.metadata.protectType,
        typeVersion: protectType.metadata.version,
        manufacturer: protectType.metadata.factory
      }
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到装置型号模板'
    };
  }
});

export default routerManage;
