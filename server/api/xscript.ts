import fs from 'fs';
import Router from 'koa-router';
import { VMScript } from 'vm2';
import { v1 as uuidV1 } from 'uuid';
import urlencode from 'urlencode';
import koaBody from 'koa-body';
import JSZip from 'jszip';
import moment from 'moment';
import { getConfigValueByKey, getScriptGridFSBucket, IScript, Script, toObjectId } from '../mongo-schema';
import conf from '../../configs';
import { ISessInfo } from '../session-store';
import utils from '../utils';
import VM2ThreadPool, { IExecuteMessage, ISandbox, IScriptContext } from '../controller/threadpool/vm2pool';
import { Auth } from '../controller/middleware';
import { Context } from 'koa'

const Master = Auth.Master;
const sse = require('koa-sse-stream');
const router = new Router({ prefix: '/xscript' });
const vm2ThreadPool = new VM2ThreadPool();
const md5 = require('md5');

router.get('/reset-pool', Master, ctx => {
  ctx.body = vm2ThreadPool.reset();
});

router.get('/all', async ctx => {
  const scripts: IScript[] = await Script.find({}).lean();
  for (const script of scripts) {
    script.timeoutMS = script.metadata.timeoutMS;
  }
  ctx.body = scripts;
});

router.get('/list-names', async ctx => {
  ctx.body = await Script.find({}, { filename: 1 }).sort({ filename: 1 }).lean();
});

router.post('/create-new', async ctx => {
  if (await Script.exists({
    filename: ctx.request.body.filename
  })) {
    ctx.body = {
      succ: false,
      message: '已存在同名的脚本'
    };
    return;
  }
  const gridFS = getScriptGridFSBucket();
  const stream = gridFS.openUploadStream(ctx.request.body.filename, {
    metadata: {
      _contentType: 'text/javascript',
      timeoutMS: 5000
    }
  });
  const rawScript = `// 接口: $$timeout,$$timeoutOk,$axios,initMongodb(),$log,$input,$checks,$radio,$select,$selects,$confirm,$notice,$message
// 参数: param,body,configs,roles,userId,flowProperty
`;
  stream.end(Buffer.from(rawScript));
  ctx.body = {
    succ: true,
    scriptId: stream.id
  };
});

router.delete('/delete-script/:id', async ctx => {
  const gridFS = getScriptGridFSBucket();
  await utils.deleteGridFile(gridFS, toObjectId(ctx.params.id));
  ctx.body = {
    succ: true
  };
});

router.get('/get-script/:id', async ctx => {
  const script = await Script.findById(toObjectId(ctx.params.id));
  if (script) {
    const filename = script.filename;
    const gridFS = getScriptGridFSBucket();
    ctx.set('Content-Type', 'text/javascript;charset=UTF-8');
    ctx.set('Content-Disposition', 'inline; filename=' + urlencode(filename) + '; filename*=utf-8\'\'' + urlencode(filename));
    ctx.set('Content-Length', String(script.length));
    ctx.body = gridFS.openDownloadStream(script._id);
  } else {
    ctx.body = {
      succ: false,
      message: '脚本不存在'
    };
  }
});

router.get('/export', async ctx => {
  const scripts = await Script.find({}).lean();
  const gridFS = getScriptGridFSBucket();
  const zip = new JSZip();
  for (const s of scripts) {
    const meta = JSON.stringify(s);
    zip.file(s._id.toHexString() + '.meta', meta, {
      comment: 'metadata'
    });
    zip.file(s._id.toHexString() + '.script', gridFS.openDownloadStream(s._id), {
      comment: 'text/javascript'
    });
  }
  const filename = '定值单系统脚本(' + moment().format('YYYYMMDDHHmmss') + ').zip';
  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-Disposition', 'attach; filename=' + urlencode(filename) + '; filename*=utf-8\'\'' + urlencode(filename));
  ctx.body = zip.generateNodeStream();
});

router.post('/import', koaBody({ multipart: true, formidable: { maxFileSize: 700 * 1024 * 1024 } }), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const imported = [];
    const gridFS = getScriptGridFSBucket();
    const stream = fs.createReadStream(file.filepath);
    const zip = await JSZip.loadAsync(await utils.readFile(stream));
    const files: any[] = [];
    zip.forEach((path, file) => {
      if (path.endsWith('.meta') && file.comment === 'metadata') {
        const id = path.split('.')[0];
        files.push({
          id,
          metaFile: file,
          scriptFile: zip.file(id + '.script')
        });
      }
    });
    for (const f of files) {
      const json = await f.metaFile.async('string');
      const meta = JSON.parse(json);
      const script = await Script.findOne({
        filename: meta.filename
      }).lean();

      if (script) {
        if (f.scriptFile && f.scriptFile.comment === 'text/javascript') {
          await utils.deleteGridFile(gridFS, script._id);
          const wstream = gridFS.openUploadStreamWithId(script._id, script.filename, {
            metadata: script.metadata
          });
          const fstream = f.scriptFile.nodeStream();
          fstream.pipe(wstream);
          await utils.waitForWriteStream(wstream);
          imported.push(script);
          console.log('已替换脚本: ' + script.filename);
        }
      } else {
        if (f.scriptFile && f.scriptFile.comment === 'text/javascript') {
          const wstream = gridFS.openUploadStream(meta.filename, {
            metadata: meta.metadata
          });
          const fstream = f.scriptFile.nodeStream();
          fstream.pipe(wstream);
          await utils.waitForWriteStream(wstream);
        }
      }
    }
    ctx.body = {
      succ: true,
      imported
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.post('/save-script/:id', koaBody({ multipart: true, formidable: { maxFileSize: 700 * 1024 * 1024 } }), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const scriptId = toObjectId(ctx.params.id);
    const body = ctx.request.body;
    if (await Script.exists({
      _id: {
        $ne: scriptId
      },
      filename: body.filename.trim()
    })) {
      ctx.body = {
        succ: false,
        message: '已存在同名的脚本'
      };
      return;
    }
    const gridFS = getScriptGridFSBucket();
    const script = await Script.findById(scriptId);
    if (script) {
      const buffer = fs.readFileSync(file.filepath);
      if (script.md5 !== md5(buffer)) {
        console.log('脚本md5有变化，需要更新');
        await utils.deleteGridFile(gridFS, script._id);
        const writeStream = gridFS.openUploadStreamWithId(script._id, body.filename.trim(), {
          metadata: {
            _contentType: 'text/javascript',
            timeoutMS: Number(body.timeoutMS)
          }
        });

        writeStream.end(buffer || Buffer.from('// use strict;'));
        await utils.waitForWriteStream(writeStream);
      } else {
        script.filename = body.filename.trim();
        script.metadata.timeoutMS = Number(body.timeoutMS);
        await script.save();
      }
      ctx.body = {
        succ: true
      };
    } else {
      ctx.body = {
        succ: false,
        message: '未找到id[' + ctx.params.id + ']对应的脚本对象'
      };
    }
  } catch (err: any) {
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

const ScriptContextMap = new Map<string, IScriptContext>();

router.post('/set-script-context', async (ctx: Context) => {
  try {
    const session = ctx.session as unknown as ISessInfo;
    const body: IScriptContext = ctx.request.body;
    const sandbox: ISandbox = {
      configs: conf,
      roles: session.roles,
      userId: session.user._id,
      token: session.key,
      flowProperty: body.flowProperty
    };
    if (body.scriptId) {
      const gridFS = getScriptGridFSBucket();
      const stream = gridFS.openDownloadStream(toObjectId(body.scriptId));
      if (!stream) {
        ctx.body = {
          succ: false,
          message: '指定的脚本id: ' + body.scriptId + '不存在'
        };
        return;
      }
      const scriptBuffer = await utils.readFile(stream);
      sandbox.context = {};
      const jsPath = VM2ThreadPool.generateTempScriptPath();
      const code = new VMScript(VM2ThreadPool.generateVM2Script(scriptBuffer.toString())).code;
      fs.writeFileSync(jsPath, code, { encoding: 'utf8' });
      body.scriptFile = jsPath;
    } else if (body.script) {
      const jsPath = VM2ThreadPool.generateTempScriptPath();
      const code = new VMScript(VM2ThreadPool.generateVM2Script(body.script)).code;
      fs.writeFileSync(jsPath, code, { encoding: 'utf8' });
      body.scriptFile = jsPath;
    } else {
      ctx.body = {
        succ: false,
        message: '参数中至少需要指定scriptId或script'
      };
      return;
    }
    const key = uuidV1();
    const timeout = setTimeout(() => {
      if (ScriptContextMap.has(key)) {
        ScriptContextMap.delete(key);
      }
    }, 60000);
    ScriptContextMap.set(key, {
      // @ts-ignore
      timeout,
      // @ts-ignore
      sandbox,
      ...body,
      user: body.user,
      timeoutMS: isNaN(body.timeoutMS) && body.timeoutMS > 0 ? body.timeoutMS : 0
    });
    ctx.body = {
      succ: true,
      key
    };
  } catch (err: any) {
    console.error('set-script-context异常', err);
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  }
});

export function scriptExecute(runKey: string, sandbox: any, context: { scriptFile: string, param?: any }, timeout: number = 3000) {
  return new Promise((resolve, reject) => {
    const messages: any[] = [];
    vm2ThreadPool.pushTask({
      scriptFile: context.scriptFile,
      runKey,
      sandbox,
      timeout,
      interactive: false,
      param: context.param,
      runningCallback: (runKey: string, eventKey: string, event: string, param: any) => {
        messages.push({
          runKey,
          eventKey,
          event,
          param
        });
      },
      finishCallback: (runKey: string, result?: any) => {
        resolve({
          succ: true,
          runKey,
          status: 'FINISH',
          result,
          messages
        });
      },
      errorCallback: (runKey: string, error: any) => {
        reject(error);
      }
    });
  });
}

router.get('/run/:key', async ctx => {
  try {
    const runKey = ctx.params.key;
    const context = ScriptContextMap.get(runKey);
    if (!context) {
      ctx.body = {
        succ: false,
        message: '指定的key: ' + runKey + '不存在'
      };
      return;
    }

    ScriptContextMap.delete(runKey);
    clearTimeout(context.timeout);

    console.log('已找到' + runKey + '对应的执行环境对象');
    const sandbox: any = {
      ...context.sandbox,
      user: context.param.user,
      body: {
        ...context.param,
        formId: context.formId,
        flowProperty: context.flowProperty
      }
    };

    console.log('-------------------sandbox-------------------');
    console.log(context.sandbox);
    console.log('-------------------param-------------------');
    console.log(context.param);
    const timeout = await getConfigValueByKey('vm2timeout', context.timeoutMS || 60000);
    ctx.body = await scriptExecute(runKey, sandbox, context, Number(timeout));
  } catch (err: any) {
    console.warn('脚本执行错误');
    console.error(err);
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  }
});

router.get('/sse-run/:key', sse({
  maxClients: 100,
  pingInterval: 30000
}), async ctx => {
  const SSE = (ctx as any).sse;
  const runKey = ctx.params.key;
  try {
    const context = ScriptContextMap.get(runKey);
    if (!context) {
      const message: IExecuteMessage = {
        runKey,
        status: 'ERROR',
        message: '指定的runKey: ' + runKey + '不存在'
      };

      SSE.send(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
      return;
    }

    ScriptContextMap.delete(runKey);
    clearTimeout(context.timeout);

    console.log('已找到' + runKey + '对应的执行环境对象');
    const sandbox: any = {
      ...context.sandbox,
      user: context.param.user,
      body: {
        ...context.param,
        formId: context.formId,
        flowProperty: context.flowProperty
      }
    };

    console.log('-------------------sandbox-------------------');
    console.log(context.sandbox);
    console.log('-------------------param-------------------');
    console.log(context.param);

    const timeout = await getConfigValueByKey('vm2timeout', context.timeoutMS || 60000);
    vm2ThreadPool.pushTask({
      scriptFile: context.scriptFile,
      runKey,
      sandbox,
      param: context.param,
      interactive: true,
      timeout: Number(timeout),
      runningCallback: (runKey: string, eventKey: string, event: string, param: any) => {
        delete param.eventKey;
        const message: IExecuteMessage = {
          runKey,
          status: 'RUNNING',
          event: param.event,
          eventKey,
          param
        };
        const messageData = JSON.stringify(message, null, 0);
        SSE.send(Buffer.from(messageData).toString('base64'));
      },
      finishCallback: (runKey: string, result?: any) => {
        const message: IExecuteMessage = {
          event: '$finish',
          runKey,
          status: 'FINISH',
          result
        };
        SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
      },
      errorCallback: (runKey: string, error: any) => {
        const message: IExecuteMessage = {
          event: '$error',
          runKey,
          status: 'ERROR',
          result: error,
          message: error.message
        };
        SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
      }
    });
  } catch (err: any) {
    console.warn('脚本执行错误');
    console.error(err);
    const message: IExecuteMessage = {
      runKey,
      status: 'ERROR',
      // @ts-ignore
      message: err.message
    };

    // 出现异常时强制结束线程
    vm2ThreadPool.kill(runKey);
    SSE.sendEnd(Buffer.from(JSON.stringify(message, null, 0)).toString('base64'));
  }
});

router.post('/response-event', ctx => {
  const body = ctx.request.body;
  ctx.body = vm2ThreadPool.onReceipt({
    runKey: body.runKey,
    eventKey: body.eventKey,
    event: body.event,
    data: body.data,
    err: body.err,
    status: body.status,
    stop: !!body.stop
  });
});

export default router;
