import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import moment from 'moment';
import {Aggregate} from 'mongoose';
import iconv from 'iconv-lite';
import {cancelJob, Job, rescheduleJob, scheduleJob} from 'node-schedule';
import Router from 'koa-router';
import {v1 as uuidV1} from 'uuid';
import koaBody from 'koa-body';
import sharp from 'sharp';
import JSZip from 'jszip';
import Axios from 'axios';
import ObjectID from 'bson-objectid';
import {decode, encode} from 'urlencode';
import qs from 'qs';
import FormData from 'form-data';
import {VMScript} from 'vm2';
import {Context, DefaultState} from 'koa';
import conf from '../../configs';
import {
  Config,
  Department,
  DzdFile,
  DzdTask,
  DzdValue,
  FileShare,
  FlowStateSetting,
  getConfigValueByKey,
  getDzdGridFSBucket,
  getFileShareGridFSBucket,
  getHtmlCacheGridFSBucket,
  getImageGridFSBucket,
  getPdfCacheGridFSBucket,
  getScriptGridFSBucket,
  getStampGridFSBucket,
  HtmlCache,
  IDzdFile,
  IDzdTask,
  Image,
  ISubstation,
  IUser,
  Log,
  OldDzdTask,
  PdfCache,
  ProtectType,
  ProtectTypeComponent,
  Stamp,
  Substation,
  toObjectId,
  User,
  Voltage,
  waitForWriteStream
} from '../mongo-schema';
import Globals from '../globals';
import compareAndMarge from '../utils/compareAndMarge';
import utils, {KVPair} from '../utils';
import {ISessInfo} from '../session-store';
import VM2ThreadPool from '../controller/threadpool/vm2pool';
import {scriptExecute} from './xscript';

interface IDepartment {
  index: number;
  title: string;
  code: string;
  name: string;
  aliasName?: string;
  parentCode: string;
  expand?: boolean;
  label?: string;
  children?: IDepartment[];
}

interface IFileIdInfo {
  fileId: string;
  key: string;
  kvMap: KVPair[];
  userId: string;
}

const fileIdKeyList: IFileIdInfo[] = [];
let autoScriptJob: Job | null = null;
let autoScriptSchedule: string = '';

setInterval(() => {
  Config.find({
    key: {
      $in: ['auto-execute-script-name', 'auto-execute-script-schedule']
    }
  }).exec((err, array) => {
    if (err) {
      console.error(err);
    } else {
      const scriptNameConfig = array.find(x => x.key === 'auto-execute-script-name');
      const scriptScheduleConfig = array.find(x => x.key === 'auto-execute-script-schedule');
      if (scriptNameConfig && scriptScheduleConfig && scriptNameConfig.value && scriptScheduleConfig.value) {
        if (autoScriptJob) {
          if (autoScriptSchedule !== scriptScheduleConfig.value) {
            autoScriptSchedule = scriptScheduleConfig.value;
            rescheduleJob(autoScriptJob, scriptScheduleConfig.value);
          }
        } else {
          autoScriptSchedule = scriptScheduleConfig.value;
          autoScriptJob = scheduleJob(scriptScheduleConfig.value, autoScriptJobFunction);
        }
      } else {
        if (autoScriptJob) {
          cancelJob(autoScriptJob);
          autoScriptJob = null;
        }
      }
    }
  });
}, 5000);

async function autoScriptJobFunction(fireDate: Date) {
  try {
    console.log('自动脚本执行器开始执行，时间：' + moment(fireDate).format('YYYY-MM-DD hh:mm:ss'));
    const scriptName = await getConfigValueByKey('auto-execute-script-name', '');
    if (!scriptName) {
      console.error('未配置自动执行脚本的名称，无法继续执行');
      return;
    }
    const gridFS = getScriptGridFSBucket();
    const stream = gridFS.openDownloadStreamByName(scriptName);
    if (!stream) {
      console.error('脚本[' + scriptName + ']未找到，无法继续执行');
      return;
    }
    console.log('调用脚本[' + scriptName + ']自动执行');
    const jsPath = VM2ThreadPool.generateTempScriptPath();
    const buffer = await utils.readFile(stream);
    const code = new VMScript(VM2ThreadPool.generateVM2Script(buffer.toString())).code;
    fs.writeFileSync(jsPath, code, {encoding: 'utf8'});
    const scriptFile = jsPath;
    const executeResult = await scriptExecute(uuidV1(), {}, {
      scriptFile,
      param: {
        conf,
        fireDate,
        backendBaseURL: `${conf.backend.prefix}${conf.backend.host}:${conf.backend.port}${conf.backend.path}`
      }
    });
    console.log('脚本执行完成，结果：');
    console.log(executeResult);
  } catch (err: any) {
    console.log('脚本执行失败');
    console.error(err);
  }
}

scheduleJob('0 30 03 1/1 * ?', async fireDate => {
  const monthAgo = moment().subtract(2, 'months').toDate();
  const moveTasks: IDzdTask[] = await DzdTask.find({
    finishTime: {
      $exists: true,
      $lt: monthAgo
    }
  }).lean();
  if (moveTasks.length > 0) {
    await OldDzdTask.insertMany(moveTasks);
    await DzdTask.deleteMany({
      _id: {
        $in: moveTasks.map(x => x._id)
      }
    });
  }
  fileIdKeyList.splice(0, fileIdKeyList.length);

  const cursor = HtmlCache.find({}).cursor();
  const girdFS = getHtmlCacheGridFSBucket();
  const now = moment();
  for (let file = await cursor.next(); file != null; file = await cursor.next()) {
    if (file.metadata.temporary) {
      girdFS.delete(file._id);
    } else {
      const days = moment(file.uploadDate).diff(now, 'days');
      if (days > 14) {
        girdFS.delete(file._id);
      } else {
        const exists = await DzdFile.exists({
          _id: file.metadata.originalFileId
        });
        if (!exists) {
          girdFS.delete(file._id);
        }
      }
    }
  }

  const cursor2 = PdfCache.find({}).cursor();
  const girdFS2 = getPdfCacheGridFSBucket();
  for (let file = await cursor2.next(); file != null; file = await cursor2.next()) {
    if (file.metadata.temporary) {
      girdFS2.delete(file._id);
    } else {
      const days = moment(file.uploadDate).diff(now, 'days');
      if (days > 14) {
        girdFS2.delete(file._id);
      } else {
        const exists = await DzdFile.exists({
          _id: file.metadata.originalFileId
        });
        if (!exists) {
          girdFS2.delete(file._id);
        }
      }
    }
  }

  const dropIds = [];
  const cursor3 = DzdValue.find({}).cursor();
  for (let dzdValue = await cursor3.next(); dzdValue != null; dzdValue = await cursor3.next()) {
    if (!await DzdFile.exists({
      _id: dzdValue.file
    })) {
      dropIds.push(dzdValue._id);
    }
  }
  await DzdValue.deleteMany({
    _id: {
      $in: dropIds
    }
  });
});

const router = new Router<DefaultState, Context>({prefix: '/sys'});

router.get('/prepare-local-edit/:id', async ctx => {
  try {
    const ajaxPrefix = ctx.query.ah;
    const userId = toObjectId(String(ctx.query.u));
    const localEditorGuid = uuidV1();
    const dzdFile = await DzdFile.findOneAndUpdate({
      _id: toObjectId(ctx.params.id)
    }, {
      'metadata.localEditorGuid': localEditorGuid
    }, {
      new: true,
      upsert: true
    }).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到文件[' + ctx.params.id + ']'
      };
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      ctx.body = {
        succ: false,
        message: '未找到用户[' + userId + ']'
      };
      return;
    }

    const result: any = {
      succ: true,
      fileId: dzdFile._id,
      sign: false,
      stamp: false,
      localEditorGuid,
      filename: dzdFile.filename,
      downloadFileUrl: (ctx.request.header.origin || ctx.origin) + ajaxPrefix + '/sys/get-dzd-file/' + ctx.params.id,
      saveFileUrl: (ctx.request.header.origin || ctx.origin) + ajaxPrefix + '/sys/replace-dzd-file/' + ctx.params.id,
      signFileNotifyUrl: (ctx.request.header.origin || ctx.origin) + ajaxPrefix + '/sys/set-dzd-file-signed/' + ctx.params.id + '/' + localEditorGuid,
      stampFileNotifyUrl: (ctx.request.header.origin || ctx.origin) + ajaxPrefix + '/sys/set-dzd-file-stamped/' + ctx.params.id + '/' + localEditorGuid
    };

    const task = await DzdTask.findOne({
      file: dzdFile._id
    }).populate('flow').lean();
    if (task) {
      // @ts-ignore
      const currentStep = task.flow.metadata.steps.find(x => x._id.equals(task.step.stepId));
      if (currentStep) {
        result.stepName = currentStep.name;
        result.userName = user.name;
        result.edit = currentStep.edit;
        result.sign = currentStep.sign;
        result.stamp = currentStep.stamp;
      }
    }

    if (result.stamp) {
      const stamps = await Stamp.find({
        'metadata.stampType': 'apply'
      }).sort({uploadDate: -1}).limit(1).lean();
      if (stamps && stamps.length > 0) {
        const stamp = stamps[0];
        const gridFS = getStampGridFSBucket();
        const stream = gridFS.openDownloadStream(stamp._id);
        const stampData = await utils.readFile(stream);
        const resultBuffer = await sharp(stampData).resize(stamp.metadata.targetWidth, stamp.metadata.targetHeight, {
          fit: 'fill'
        }).toBuffer();
        result.stampBase64 = resultBuffer.toString('base64');
        result.stampWidth = stamp.metadata.targetWidth;
        result.stampHeight = stamp.metadata.targetHeight;
      } else {
        result.stampBase64 = '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';
        result.stampWidth = 430;
        result.stampHeight = 430;
      }
    }

    if (result.sign) {
      const stamps = await Stamp.find({
        'metadata.user': toObjectId(user._id)
      }).sort({uploadDate: -1}).limit(1).lean();
      if (stamps && stamps.length > 0) {
        const stamp = stamps[0];
        const gridFS = getStampGridFSBucket();
        const stream = gridFS.openDownloadStream(stamp._id);
        const stampData = await utils.readFile(stream);
        const resultBuffer = await sharp(stampData).resize(stamp.metadata.targetWidth, stamp.metadata.targetHeight, {
          fit: 'fill'
        }).toBuffer();
        result.signBase64 = resultBuffer.toString('base64');
        result.signWidth = stamp.metadata.targetWidth;
        result.signHeight = stamp.metadata.targetHeight;
        result.signText = user.name;
      } else {
        result.signText = user.name;
      }
    }

    ctx.body = result;
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/set-dzd-file-signed/:fileId/:localEditorGuid', async ctx => {
  try {
    const result = await DzdFile.updateOne({
      _id: toObjectId(ctx.params.fileId),
      'metadata.localEditorGuid': ctx.params.localEditorGuid
    }, {
      $set: {
        'metadata.signed': true
      }
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/set-dzd-file-stamped/:fileId/:localEditorGuid', async ctx => {
  try {
    const result = await DzdFile.updateOne({
      _id: toObjectId(ctx.params.fileId),
      'metadata.localEditorGuid': ctx.params.localEditorGuid
    }, {
      $set: {
        'metadata.stamped': true
      }
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/update-pdf-cache/:fileId', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 500 * 1024 * 1024
  }
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const body = ctx.request.body;
    const dzdFile = await DzdFile.findById(toObjectId(ctx.params.fileId)).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到文件[' + ctx.params.fileId + ']'
      };
      return;
    }

    if (typeof body.localEditorGuid === 'string' && body.localEditorGuid !== dzdFile.metadata.localEditorGuid) {
      ctx.body = {
        succ: false,
        message: '编辑器内的文件已过期，请在浏览器内重新打开本地编辑器'
      };
      return;
    }

    const pdfCaches = await PdfCache.find({
      'metadata.originalFileId': dzdFile._id
    }).lean();
    const gridFS = getPdfCacheGridFSBucket();
    for (const c of pdfCaches) {
      await gridFS.delete(c._id);
    }
    const s = gridFS.openUploadStream(uuidV1() + '.pdf', {
      contentType: 'application/pdf',
      metadata: {
        _contentType: 'application/pdf',
        temporary: false,
        rawFilename: dzdFile.filename,
        originalFileId: dzdFile._id,
        originalFileMd5: dzdFile.md5,
        specified: true
      }
    });
    const input = fs.createReadStream(file.filepath);
    // @ts-ignore
    input.pipe(s);
    await utils.waitForWriteStream(s);
    ctx.body = {
      succ: true
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.post('/replace-dzd-file/:id', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 500 * 1024 * 1024
  }
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const body = ctx.request.body;
    const dzdFile = await DzdFile.findById(toObjectId(ctx.params.id)).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到文件[' + ctx.params.id + ']'
      };
      return;
    }

    if (body.localEditorGuid !== dzdFile.metadata.localEditorGuid) {
      ctx.body = {
        succ: false,
        message: '编辑器内的文件已过期，请在浏览器内重新打开本地编辑器'
      };
      return;
    }

    const gridFS = getDzdGridFSBucket();
    await gridFS.delete(dzdFile._id);

    const s = gridFS.openUploadStreamWithId(dzdFile._id, dzdFile.filename, {
      contentType: dzdFile.contentType,
      metadata: dzdFile.metadata
    });

    const hash = crypto.createHash('md5').setEncoding('hex');
    s.on('data', data => hash.update(data));
    const readStream = fs.createReadStream(file.filepath);
    // @ts-ignore
    readStream.pipe(s);
    await waitForWriteStream(s);
    hash.end();
    await DzdFile.updateOne({
      _id: s.id
    }, {
      $set: {
        md5: hash.read()
      }
    });
    const pdfCaches = await PdfCache.find({
      'metadata.originalFileId': s.id
    }).lean();
    const pdfGridFS = getPdfCacheGridFSBucket();
    for (const c of pdfCaches) {
      await pdfGridFS.delete(c._id);
    }
    const htmlCaches = await HtmlCache.find({
      'metadata.originalFileId': s.id
    }).lean();
    const htmlGridFS = getHtmlCacheGridFSBucket();
    for (const c of htmlCaches) {
      await htmlGridFS.delete(c._id);
    }

    Globals.socket.postClientMessage('fileUpdated', {
      fileId: dzdFile._id.toHexString()
    });

    ctx.body = {
      succ: true
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.get('/download-share-file-zip-content/:id/:relativePath', async ctx => {
  const gridFS = getFileShareGridFSBucket();
  const s = gridFS.openDownloadStream(toObjectId(ctx.params.id));
  if (!s) {
    console.error('未找到id[' + ctx.params.id + ']对应的共享模板文件');
    ctx.throw('未找到id[' + ctx.params.id + ']对应的共享模板文件');
    return;
  }

  const relativePath = decode(ctx.params.relativePath);
  const fileData = await utils.readStream(s);
  const zip = await JSZip.loadAsync(fileData, {
    // @ts-ignore
    decodeFileName(bytes) {
      // @ts-ignore
      return iconv.decode(bytes, 'gbk');
    }
  });
  const buffer = await zip.file(relativePath)?.async('uint8array');
  if (buffer) {
    const filename = path.basename(relativePath);
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    // @ts-ignore
    ctx.set('Content-Length', String(buffer.length));
    ctx.set('Access-Control-Expose-Headers', 'filename');
    ctx.set('filename', encode(filename));
    ctx.body = Buffer.from(buffer);
  } else {
    console.error('未找到路径为[' + relativePath + ']的压缩包文件');
    ctx.throw('未找到路径为[' + relativePath + ']的压缩包文件');
  }
});

router.get('/download-share-file/:id', async ctx => {
  try {
    const file = await FileShare.findById(toObjectId(ctx.params.id)).lean();
    if (!file) {
      console.error('未找到id[' + ctx.params.id + ']对应的共享模板文件');
      ctx.throw('未找到id[' + ctx.params.id + ']对应的共享模板文件');
      return;
    }

    let downloadCount = 0;
    if (ctx.session) {
      downloadCount = file.metadata.downloadCount + 1;
      await FileShare.updateOne({
        _id: file._id
      }, {
        $set: {
          'metadata.downloadCount': downloadCount
        }
      });
    }
    const gridFS = getFileShareGridFSBucket();
    const stream = gridFS.openDownloadStream(file._id);
    const filename = file.metadata.shareName;
    ctx.set('Content-Type', file.metadata._contentType);
    ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.set('Content-Length', String(file.length));
    ctx.set('Access-Control-Expose-Headers', 'filename, download-count');
    ctx.set('filename', encode(filename));
    ctx.set('download-count', String(downloadCount));
    ctx.body = stream;
  } catch (err: any) {
    console.error(err);
    ctx.throw('下载id[' + ctx.params.id + ']对应的共享模板文件失败: ' + err.message);
  }
});

router.post('/download-raw-files', async ctx => {
  const zip = new JSZip();
  const body = ctx.request.body;
  const gridFS = getDzdGridFSBucket();
  const fileMetadataArray = [];
  for (const id of body.ids) {
    const fileId = toObjectId(id);
    const dzdFile = await DzdFile.findById(fileId).lean();
    if (dzdFile) {
      const stream = gridFS.openDownloadStream(fileId);
      zip.file(dzdFile.filename, stream, {binary: true});
      fileMetadataArray.push(dzdFile);
    }
  }
  zip.file('filesMetadata.json', JSON.stringify(fileMetadataArray), {
    comment: 'metadata',
    binary: false
  });
  const filename = '定值单打包下载(' + moment().format('YYYYMMDDHHmmss') + ').zip';
  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-Disposition', 'attach; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.body = zip.generateNodeStream();
});

router.get('/list-station-users', async ctx => {
  const cursor = User.find({
    account: {
      $ne: 'root'
    },
    status: {
      $ne: 'disabled'
    }
  }, {
    password: false,
    salt: false,
    loginLogs: false
  }).sort({name: 1}).populate('departments').populate({
    path: 'groups',
    select: 'name',
    populate: [{
      path: 'auths',
      select: {
        index: 1,
        name: 1,
        auth: 1
      },
      options: {
        sort: {
          index: 1
        }
      }
    }, {
      path: 'roles',
      select: {
        index: 1,
        name: 1,
        role: 1
      },
      options: {
        sort: {
          index: 1
        }
      }
    }]
  }).lean().cursor();
  const users = [];
  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    if (user.departments && user.departments.length) {
      const dep = user.departments[0] as unknown as IDepartment;
      if (dep.parentCode === '0000000002') {
        user.auths = [];
        user.roles = [];
        for (const g of user.groups) {
          for (const a of g.auths) {
            if (!user.auths.some((x: any) => x.auth === (a as any).auth)) {
              user.auths.push(a as any);
            }
          }
          for (const r of g.roles) {
            if (!user.roles.some((x: any) => x.role === (r as any).role)) {
              user.roles.push(r as any);
            }
          }
        }
        if (user.roles.some((x: any) => x.role === 'repeal')) {
          // @ts-ignore
          delete user.groups;
          users.push(user);
        }
      }
    }
  }
  await cursor.close();
  ctx.body = {
    succ: true,
    users
  };
});

router.get('/fetch-users', async ctx => {
  try {
    const users = await User.find({
      account: {
        $ne: 'root'
      },
      status: {
        $ne: 'disabled'
      }
    }, {
      password: 0,
      salt: 0,
      loginLogs: 0
    }).populate('departments').populate({
      path: 'groups',
      select: 'name',
      populate: [{
        path: 'auths',
        select: {
          index: 1,
          name: 1,
          auth: 1
        },
        options: {
          sort: {
            index: 1
          }
        }
      }, {
        path: 'roles',
        select: {
          index: 1,
          name: 1,
          role: 1
        },
        options: {
          sort: {
            index: 1
          }
        }
      }]
    }).lean();
    for (const u of users) {
      u.auths = [];
      u.roles = [];
      if (u.groups && Array.isArray(u.groups)) {
        for (const g of u.groups) {
          for (const a of g.auths) {
            if (!u.auths.some((x: any) => x.auth === (a as any).auth)) {
              u.auths.push(a as any);
            }
          }
          for (const r of g.roles) {
            if (!u.roles.some((x: any) => x.role === (r as any).role)) {
              u.roles.push(r as any);
            }
          }
        }
      } else {
        console.warn('用户[' + u.name + ']不属于任何用户组');
      }
      // @ts-ignore
      delete u.groups;
    }
    ctx.body = {
      succ: true,
      users
    };
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: e.message
    };
  }
});

router.get('/clear-all-file-cache', async ctx => {
  let htmlCacheCount = 0;
  let pdfCacheCount = 0;
  const cursor = HtmlCache.find({}).cursor();
  const girdFS = getHtmlCacheGridFSBucket();
  for (let file = await cursor.next(); file != null; file = await cursor.next()) {
    girdFS.delete(file._id);
    htmlCacheCount++;
  }

  const cursor2 = PdfCache.find({}).cursor();
  const girdFS2 = getPdfCacheGridFSBucket();
  for (let file = await cursor2.next(); file != null; file = await cursor2.next()) {
    girdFS2.delete(file._id);
    pdfCacheCount++;
  }

  ctx.body = {
    htmlCacheCount,
    pdfCacheCount
  };
});

router.post('/check-duplicate-prefix', async ctx => {
  const body = ctx.request.body;
  const count = await DzdFile.countDocuments({
    'metadata.dzPrefix': body.dzPrefix
  }).lean();
  ctx.body = count > 0;
});

router.post('/detect-file-info', koaBody({
  multipart: true,
  formidable: {maxFileSize: 500 * 1024 * 1024}
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const fileData = fs.readFileSync(file.filepath);
    const fileInfo = await utils.detectFileInfo(fileData, file.name);
    if (!fileInfo.succ) {
      ctx.body = {
        succ: false,
        message: '检测文件信息失败: ' + fileInfo.message
      };
      return;
    }

    ctx.body = {
      succ: true,
      fileInfo
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.post('/check-file', koaBody({multipart: true, formidable: {maxFileSize: 500 * 1024 * 1024}}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const matches = await utils.matchFilename(file.name);
    const filename = matches.normalizedFilename;
    if (!matches.success) {
      ctx.body = {
        succ: false,
        message: matches.message
      };
      return;
    }

    const rgx = await utils.getAllowFileExtRegex();
    if (!rgx.test(filename)) {
      ctx.body = {
        succ: false,
        message: await utils.getAllowFileExtMessage()
      };
      return;
    }

    const fileData = fs.readFileSync(file.filepath);
    const fileInfo = await utils.detectFileInfo(fileData, file.name);
    if (!fileInfo.succ) {
      ctx.body = {
        succ: false,
        message: '检测文件信息失败: ' + fileInfo.message
      };
      return;
    }

    const protectTypeFound = await ProtectType.findOne({
      name: {
        $regex: new RegExp(matches.protectType, 'i')
      }
    }).lean();
    if (!protectTypeFound) {
      ctx.body = {
        succ: false,
        message: '未配置保护类型：' + matches.protectType
      };
      return;
    }

    const protectTypeComponents = await ProtectTypeComponent.find({
      protectTypeId: protectTypeFound._id.toHexString()
    }).lean();
    if (protectTypeComponents.length > 0) {
      if (!protectTypeComponents.some((x: any) => x.name === matches.deviceName)) {
        ctx.body = {
          succ: false,
          message: '未配置元件名称：' + matches.deviceName
        };
        return;
      }
    }

    const voltageLevelFound = await Voltage.findOne({name: matches.voltageLevel}).lean();
    if (!voltageLevelFound) {
      ctx.body = {
        succ: false,
        message: '未配置电压等级：' + matches.voltageLevel
      };
      return;
    }

    if (conf.service.isProvince) {
      const substationFound: ISubstation = await Substation.findOne({
        name: matches.substationName
      }).lean();
      if (!substationFound) {
        ctx.body = {
          succ: false,
          message: '未配置厂站：' + matches.substationName
        };
        return;
      }
    } else {
      const substationFound: ISubstation = await Substation.findOne({
        name: matches.substationName,
        $or: [
          {
            voltage: {
              $exists: false
            }
          },
          {
            voltage: voltageLevelFound._id
          }
        ]
      }).lean();
      if (!substationFound) {
        ctx.body = {
          succ: false,
          message: '未配置厂站：' + matches.substationName
        };
        return;
      }
    }

    let isDuplicated = true;
    const duplicates: IDzdFile[] = await DzdFile.find({
      'metadata.dzPrefix': matches.dzPrefix
    }).lean();
    if (duplicates.length > 0) {
      const substationNames = Array.from(new Set([...duplicates.map(x => x.metadata.substationName), matches.substationName]));
      const deviceNames = Array.from(new Set([...duplicates.map(x => x.metadata.deviceName), matches.deviceName]));
      const protectTypes = Array.from(new Set([...duplicates.map(x => x.metadata.protectType), matches.protectType]));
      const protectModelNumbers = Array.from(new Set([...duplicates.map(x => x.metadata.protectModelNumber), matches.protectModelNumber]));
      if (substationNames.length === 1 && protectTypes.length === 1 && protectModelNumbers.length === 1 && deviceNames.length === duplicates.length + 1) {
        isDuplicated = false;
      }
    } else {
      isDuplicated = false;
    }
    if (isDuplicated) {
      ctx.body = {
        succ: false,
        message: '定值单号已存在！'
      };
      return;
    }

    ctx.body = {
      succ: true,
      properties: matches,
      fileInfo
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.get('/template-info/:fileId', async ctx => {
  try {
    const dzdValue = await DzdValue.findOne({
      file: toObjectId(ctx.params.fileId)
    }, {
      templateInfoUrl: 1
    }).lean();
    if (dzdValue && dzdValue.templateInfoUrl) {
      const {data} = await Axios.get(dzdValue.templateInfoUrl, {timeout: 3000});
      if (data.succ && data.result && data.result.metadata) {
        let modifyTime = moment(data.result.metadata.modifyTime).fromNow();
        let modifier = data.result.metadata.modifier;
        if (data.result.metadata.modifyLogs && data.result.metadata.modifyLogs.length > 0) {
          modifyTime = moment(data.result.metadata.modifyLogs[0].modifyTime, 'YYYY-MM-DD HH:mm:ss').fromNow();
          modifier = data.result.metadata.modifyLogs[0].modifier;
        }
        ctx.body = {
          succ: true,
          templateInfoUrl: dzdValue.templateInfoUrl,
          modifyLogs: data.result.metadata.modifyLogs,
          dzdCount: data.result.metadata.dzdCount || 0,
          modifyTime,
          modifier
        };
      } else {
        ctx.body = {
          succ: false,
          message: '未找到模板信息'
        };
      }
    } else {
      ctx.body = {
        succ: false,
        message: '未找到模板信息'
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

router.post('/check-dzd-number', async ctx => {
  const body = ctx.request.body;
  const exists = await DzdFile.exists({
    'metadata.dzYear': body.dzYear,
    'metadata.dzCode': body.dzCode
  });
  ctx.body = {
    succ: true,
    exists
  };
});

router.post('/query-max-dzd-number', async ctx => {
  const body = ctx.request.body;
  try {
    let creator = null;
    if (body.userName) {
      const user: IUser = await User.findOne({
        $or: [
          {
            name: body.userName
          },
          {
            account: body.userName
          }
        ]
      }).lean();

      if (user) {
        creator = user._id;
      } else {
        ctx.body = {
          succ: false,
          message: '未找到用户: ' + body.userName
        };
        return;
      }
    } else if (body.userId) {
      creator = toObjectId(body.userId);
    }

    let maxDzdNumber = '';
    if (creator) {
      const found: IDzdFile[] = await DzdFile.find({
        'metadata.creator': creator
      }).sort({
        'metadata.dzYear': -1,
        'metadata.dzCodeN': -1
      }).limit(1).lean();
      if (found && found.length > 0) {
        maxDzdNumber = found[0].metadata.dzYear + '-' + found[0].metadata.dzCode;
      } else {
        const found2: IDzdFile[] = await DzdFile.find({}).sort({
          'metadata.dzYear': -1,
          'metadata.dzCodeN': -1
        }).limit(1).lean();

        if (found2 && found2.length > 0) {
          maxDzdNumber = found2[0].metadata.dzYear + '-' + found2[0].metadata.dzCode;
        }
      }
    } else {
      const found: IDzdFile[] = await DzdFile.find({}).sort({
        'metadata.dzYear': -1,
        'metadata.dzCodeN': -1
      }).limit(1).lean();
      if (found && found.length > 0) {
        maxDzdNumber = found[0].metadata.dzYear + '-' + found[0].metadata.dzCode;
      }
    }

    ctx.body = {
      succ: true,
      maxDzdNumber
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/generate-mongodb-id', ctx => {
  // @ts-ignore
  ctx.body = ObjectID.generate();
});

router.get('/generate-mongodb-id/:count', ctx => {
  const ids = [];
  for (let i = 0; i < Number(ctx.params.count); ++i) {
    // @ts-ignore
    ids.push(ObjectID.generate());
  }
  ctx.body = ids;
});

router.get('/preview-image/:id', async ctx => {
  const img = await Image.findById(toObjectId(ctx.params.id)).lean();
  if (img) {
    const bucket = getImageGridFSBucket();
    const stream = bucket.openDownloadStream(toObjectId(ctx.params.id));
    const buffer = await utils.readFile(stream);
    const resultBuffer = await sharp(buffer).resize(760).toBuffer();
    const filename = img.filename;
    ctx.set('Content-Type', img.metadata._contentType);
    ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.set('Content-Length', String(resultBuffer.length));
    const Duplex = require('stream').Duplex;
    const outputStream = new Duplex();
    outputStream.push(resultBuffer);
    outputStream.push(null);
    ctx.body = outputStream;
  } else {
    ctx.body = {
      succ: false,
      message: '未找到图像'
    };
  }
});

router.delete('/delete-image/:id', ctx => {
  try {
    const bucket = getImageGridFSBucket();
    bucket.delete(toObjectId(ctx.params.id));
    ctx.body = {
      succ: true
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/update-image-info/:id', async ctx => {
  ctx.body = await Image.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    $set: {
      filename: ctx.request.body.filename,
      'metadata.imageType': ctx.request.body.imageType
    }
  }, {
    upsert: true
  });
});

router.post('/list-images-by-type', async ctx => {
  const list = await Image.find({
    'metadata.imageType': ctx.request.body.imageType
  }).sort({filename: 1}).lean();
  ctx.body = {
    ids: list.map((x: any) => x._id)
  };
});

router.get('/list-images', async ctx => {
  ctx.body = await Image.find({}).sort({filename: 1}).lean();
});

router.post('/upload-image', koaBody({multipart: true, formidable: {maxFileSize: 50 * 1024 * 1024}}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const bucket = getImageGridFSBucket();
    const body = ctx.request.body;
    const imageInfo = require('imageinfo');
    const imageData = fs.readFileSync(file.filepath);
    const info = imageInfo(imageData);

    const stream = bucket.openUploadStream(file.name, {
      contentType: info.mimeType,
      metadata: {
        _contentType: info.mimeType,
        imageType: body.imageType,
        width: info.width,
        height: info.height
      }
    });
    const readStream = fs.createReadStream(file.filepath);
    // @ts-ignore
    readStream.pipe(stream);
    await waitForWriteStream(stream);
    const image = await Image.findById(stream.id).lean();
    ctx.body = {
      succ: true,
      image
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.get('/datetime/:interval', ctx => {
  // 获得本季度的开端月份
  function getQuarterStartMonth(month: number) {
    if (month < 3) {
      return 0;
    } else if (month > 2 && month < 6) {
      return 3;
    } else if (month > 5 && month < 9) {
      return 6;
    } else if (month > 8) {
      return 9;
    } else {
      return 0;
    }
  }

  // 获得本周的开端日期
  function getCurrentWeekStartDate() {
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    return new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - ((day - 1) * 24 * 60 * 60 * 1000));
  }

  // 获得本周的停止日期
  function getCurrentWeekEndDate() {
    const currentWeekStartDate = new Date(getCurrentWeekStartDate().getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
    return new Date(currentWeekStartDate.getFullYear(), currentWeekStartDate.getMonth(), currentWeekStartDate.getDate(), 23, 59, 59, 999);
  }

  // 获得上周的开端日期
  function getLastWeekStartDate() {
    const currentWeekStartDate = getCurrentWeekStartDate();
    return new Date(currentWeekStartDate.getTime() - (7 * 24 * 60 * 60 * 1000));
  }

  // 获得上周的停止日期
  function getLastWeekEndDate() {
    const lastWeekStartDate = new Date(getLastWeekStartDate().getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
    return new Date(lastWeekStartDate.getFullYear(), lastWeekStartDate.getMonth(), lastWeekStartDate.getDate(), 23, 59, 59, 999);
  }

  // 获得本月的开端日期
  function getCurrentMonthStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // 获得本月的停止日期
  function getCurrentMonthEndDate() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return new Date(now.getFullYear(), now.getMonth(), end.getDate(), 23, 59, 59, 999);
  }

  // 获得上月开端时候
  function getLastMonthStartDate() {
    const now = new Date();
    const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), 1);
  }

  // 获得上月停止时候
  function getLastMonthEndDate() {
    const now = new Date();
    const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), lastMonthLastDay.getDate(), 23, 59, 59, 999);
  }

  // 获得本季度的开端日期
  function getCurrentQuarterStartDate() {
    const now = new Date();
    const month = getQuarterStartMonth(now.getMonth());
    return new Date(now.getFullYear(), month, 1);
  }

  // 获得本季度的停止日期
  function getCurrentQuarterEndDate() {
    const now = new Date();
    const month = getQuarterStartMonth(now.getMonth());
    const end = new Date(now.getFullYear(), month + 3, 0);
    return new Date(now.getFullYear(), month + 2, end.getDate(), 23, 59, 59, 999);
  }

  // 获得上季度的开端日期
  function getLastQuarterStartDate() {
    const now = new Date();
    let year = now.getFullYear();
    let month = getQuarterStartMonth(now.getMonth());
    if (month === 0) {
      month = 9;
      year -= 1;
    } else {
      month -= 3;
    }

    return new Date(year, month, 1);
  }

  // 获得上季度的停止日期
  function getLastQuarterEndDate() {
    const now = new Date();
    const lastQuarterStartDate = getLastQuarterStartDate();
    const end = new Date(now.getFullYear(), lastQuarterStartDate.getMonth() + 3, 0);
    return new Date(lastQuarterStartDate.getFullYear(), lastQuarterStartDate.getMonth() + 2, end.getDate(), 23, 59, 59, 999);
  }

  // 去年开始日期
  function getLastYearStartDate() {
    const now = new Date();
    return new Date(now.getFullYear() - 1, 0, 1);
  }

  // 去年结束日期
  function getLastYearEndDate() {
    const now = new Date();
    return new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  // 今年开始日期
  function getCurrentYearStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
  }

  // 今年结束日期
  function getCurrentYearEndDate() {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  switch (ctx.params.interval) {
    case 'current-week': {
      ctx.body = {
        succ: true,
        time1: getCurrentWeekStartDate().getTime(),
        time2: getCurrentWeekEndDate().getTime()
      };
      break;
    }
    case 'last-week': {
      ctx.body = {
        succ: true,
        time1: getLastWeekStartDate().getTime(),
        time2: getLastWeekEndDate().getTime()
      };
      break;
    }
    case 'current-month': {
      ctx.body = {
        succ: true,
        time1: getCurrentMonthStartDate().getTime(),
        time2: getCurrentMonthEndDate().getTime()
      };
      break;
    }
    case 'last-month': {
      ctx.body = {
        succ: true,
        time1: getLastMonthStartDate().getTime(),
        time2: getLastMonthEndDate().getTime()
      };
      break;
    }
    case 'current-quarter': {
      ctx.body = {
        succ: true,
        time1: getCurrentQuarterStartDate().getTime(),
        time2: getCurrentQuarterEndDate().getTime()
      };
      break;
    }
    case 'last-quarter': {
      ctx.body = {
        succ: true,
        time1: getLastQuarterStartDate().getTime(),
        time2: getLastQuarterEndDate().getTime()
      };
      break;
    }
    case 'current-year': {
      ctx.body = {
        succ: true,
        time1: getCurrentYearStartDate().getTime(),
        time2: getCurrentYearEndDate().getTime()
      };
      break;
    }
    case 'last-year': {
      ctx.body = {
        succ: true,
        time1: getLastYearStartDate().getTime(),
        time2: getLastYearEndDate().getTime()
      };
      break;
    }
    default: {
      ctx.body = {
        succ: false,
        message: '未知的参数类型: ' + ctx.params.interval
      };
    }
  }
});

router.get('/download-mongodb-dump', ctx => {
  try {
    const datetime = utils.formatDateTime(new Date(), 'yyyyMMddhhmmss');
    const filename = '定值单系统数据库备份(' + datetime + ').7z';
    const stream = fs.createReadStream('/tmp/dzd-dump.7z');
    const stat = fs.statSync('/tmp/dzd-dump.7z');
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.set('Content-Length', String(stat.size));
    ctx.body = stream;
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: '/tmp/dzd-dump.7z不存在，无法下载'
    };
  }
});

router.post('/resolve-dzd-filename', async ctx => {
  ctx.body = await utils.matchFilename(ctx.request.body.filename);
});

router.get('/query-dzd', async ctx => {
  const query: any = ctx.request.query;
  if (!query.arg.trim()) {
    ctx.body = {
      success: false,
      message: 'arg参数不可为空'
    };
    return;
  }

  const condition: any = {};
  condition.skip = query.skip ? Number(query.skip) : 0;
  condition.limit = query.limit ? Number(query.limit) : 20000;
  switch (query.type) {
    case 'station': {
      condition.substationName = query.arg;
      break;
    }
    case 'device': {
      condition.deviceName = query.arg;
      break;
    }
    case 'code': {
      condition.dzNumber = query.arg;
      break;
    }
    case 'jcode': {
      condition.serviceNumber = query.arg;
      break;
    }
    default: {
      ctx.body = {
        success: false,
        message: 'type参数不合法，应该为[station,device,code,jcode]之一'
      };
      return;
    }
  }

  const sort: any = {};
  sort['metadata.prefixSort'] = -1;

  ctx.body = await queryDzdFiles(condition, sort);
});

async function queryDzdFiles(conditionSrc: any, sort: any) {
  const condition: any = {};
  condition['metadata.status'] = {
    $in: ['H', 'Z', 'K']
  };

  if (conditionSrc.protectType) {
    condition['metadata.protectType'] = {
      $regex: new RegExp(conditionSrc.protectType, 'i')
    };
  }
  if (conditionSrc.substationName) {
    condition['metadata.substationName'] = {
      $eq: conditionSrc.substationName
    };
  }
  if (conditionSrc.departmentId) {
    condition['metadata.department'] = {
      $eq: toObjectId(conditionSrc.departmentId)
    };
  }
  if (conditionSrc.dzNumber) {
    condition['metadata.dzNumber'] = {
      $regex: new RegExp(conditionSrc.dzNumber, 'i')
    };
  }
  if (conditionSrc.deviceName) {
    condition.$or = [
      {
        'metadata.deviceName': conditionSrc.deviceName
      },
      {
        'metadata.deviceNameQuery': conditionSrc.deviceName
      }
    ];
  }
  if (conditionSrc.serviceNumber) {
    condition['metadata.serviceNumber'] = {
      $eq: conditionSrc.serviceNumber
    };
  }
  if (conditionSrc.protectModelNumber) {
    condition['metadata.protectModelNumber'] = {
      $regex: new RegExp(conditionSrc.protectModelNumber, 'i')
    };
  }

  console.log('查询条件: ');
  console.log(condition);
  const total: any[] = await DzdFile.aggregate([{
    $match: condition
  }, {
    $count: 'total'
  }]);
  const list: any[] = await DzdFile.aggregate([
    {
      $match: condition
    },
    {
      $sort: sort
    },
    {
      $project: {
        uploadDate: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M:%S',
            date: '$uploadDate',
            timezone: 'Asia/Shanghai'
          }
        },
        filename: 1,
        length: 1,
        status: '$metadata.status',
        rawFileId: '$metadata.rawFileId',
        serviceNumber: '$metadata.serviceNumber',
        createTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M:%S',
            date: '$metadata.createTime',
            timezone: 'Asia/Shanghai'
          }
        },
        protectType: '$metadata.protectType',
        substationName: '$metadata.substationName',
        deviceName: '$metadata.deviceName',
        voltageLevel: '$metadata.voltageLevel',
        protectModelNumber: '$metadata.protectModelNumber',
        dzNumber: '$metadata.dzNumber',
        sendTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$metadata.sendTime',
            timezone: 'Asia/Shanghai'
          }
        },
        applyTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$metadata.applyTime',
            timezone: 'Asia/Shanghai'
          }
        },
        auditTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$metadata.auditTime',
            timezone: 'Asia/Shanghai'
          }
        },
        feedbackTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$metadata.feedbackTime',
            timezone: 'Asia/Shanghai'
          }
        },
        fileType: '$metadata.fileType',
        department: '$metadata.department',
        sender: '$metadata.sender',
        applier: '$metadata.applier',
        auditor: '$metadata.auditor',
        feedback: '$metadata.feedback',
        remark: '$metadata.remark',
        disableRemark: '$metadata.disableRemark',
        replaced: '$metadata.replaced',
        fileSize: '$length'
      }
    },
    {
      $skip: conditionSrc.skip
    },
    {
      $limit: conditionSrc.limit
    }
  ]).allowDiskUse(true);

  const states: any[] = await FlowStateSetting.find({}).lean();

  function getStatusName(status: string) {
    const found = states.find((x: any) => x.mark === status);
    return found ? found.name : '';
  }

  return {
    total: total.length > 0 ? total[0].total : 0,
    list: list.map((x: any) => {
      return {
        size: x.length,
        filename: x.filename,
        station: x.substationName,
        device: x.deviceName,
        model: x.protectModelNumber,
        code: x.dzNumber,
        state: getStatusName(x.status),
        serviceNumber: x.serviceNumber,
        href: x.fileType.includes('htm') ? `${conf.service.prefix}${conf.service.host}:${conf.service.port}/sys/dzd-html/${x._id}` : `${conf.service.prefix}${conf.service.host}:${conf.service.port}/sys/preview-dzd/${x._id}`
      };
    })
  };
}

router.get('/kill-office', async ctx => {
  const $axios = utils.getPDFServiceAxios();
  const {data} = await $axios.get('/clearoffice');
  ctx.body = data;
});

router.get('/compare-html-files/:file1Id/:sheetIndex1/:file2Id/:sheetIndex2', async ctx => {
  const file1Id = toObjectId(ctx.params.file1Id);
  const file2Id = toObjectId(ctx.params.file2Id);
  const file1 = await DzdFile.findById(file1Id).lean();
  const file2 = await DzdFile.findById(file2Id).lean();
  const htmlFile1 = await HtmlCache.findOne({
    'metadata.originalFileId': toObjectId(ctx.params.file1Id),
    'metadata.sheetIndex': Number(ctx.params.sheetIndex1)
  });
  const htmlFile2 = await HtmlCache.findOne({
    'metadata.originalFileId': toObjectId(ctx.params.file2Id),
    'metadata.sheetIndex': Number(ctx.params.sheetIndex2)
  });
  const file1Md5 = await utils.getFileMd5(file1Id);
  const file2Md5 = await utils.getFileMd5(file2Id);
  if (!file1 || !file2 || !htmlFile1 || !htmlFile2 || file1Md5 !== htmlFile1.metadata.originalFileMd5 || file2Md5 !== htmlFile2.metadata.originalFileMd5) {
    ctx.throw(400, '文件缓存已过期，请关闭当前页面重新进行比对操作');
    return;
  }

  const htmlGridFS = getHtmlCacheGridFSBucket();
  const html1Buffer = await utils.readFile(htmlGridFS.openDownloadStream(htmlFile1._id));
  const html2Buffer = await utils.readFile(htmlGridFS.openDownloadStream(htmlFile2._id));
  const resultHtml = compareAndMarge(html1Buffer.toString(), html2Buffer.toString());
  ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  ctx.set('Pragma', 'no-cache');
  ctx.set('Expires', '0');
  ctx.set('Content-Type', 'text/html; charset=UTF-8');
  ctx.set('Content-Length', String(resultHtml.length));
  ctx.body = resultHtml;
});

router.get('/html-cache/:fileId/:sheetIndex', async ctx => {
  const fileId = toObjectId(ctx.params.fileId);
  const file = await DzdFile.findById(fileId).lean();
  const htmlFile = await HtmlCache.findOne({
    'metadata.originalFileId': fileId,
    'metadata.sheetIndex': Number(ctx.params.sheetIndex)
  });

  const fileStream = getDzdGridFSBucket().openDownloadStream(fileId);
  const fileData = await utils.readFile(fileStream);
  const fileMd5 = crypto.createHash('md5').update(fileData).digest('hex');
  if (!file || !htmlFile || fileMd5 !== htmlFile.metadata.originalFileMd5) {
    ctx.throw(400, '文件的html缓存已过期');
    return;
  }
  const htmlGridFS = getHtmlCacheGridFSBucket();
  const html = await utils.readFile(htmlGridFS.openDownloadStream(htmlFile._id));
  ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  ctx.set('Pragma', 'no-cache');
  ctx.set('Expires', '0');
  ctx.set('Content-Type', 'text/html; charset=UTF-8');
  ctx.set('Content-Length', String(html.length));
  ctx.body = html;
});

router.post('/convert-temporary-html', koaBody({
  multipart: true,
  formidable: {maxFileSize: 500 * 1024 * 1024}
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const fileData = fs.readFileSync(file.filepath);
    const filename = file.name;
    const html = await utils.convertTempFileToHtml(fileData, filename, '');
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.set('Content-Type', 'text/html; charset=UTF-8');
    ctx.set('Content-Length', String(html.length));
    ctx.body = html;
  } catch (err: any) {
    console.error(err);
    ctx.throw(500, err.message);
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.post('/compare-temporary-files', koaBody({
  multipart: true,
  formidable: {maxFileSize: 500 * 1024 * 1024}
}), ctx => {
  const files = (ctx.request as any).files.file;
  try {
    if (Array.isArray(files) && files.length === 2) {
      const fileData1 = fs.readFileSync(files[0].path);
      const fileData2 = fs.readFileSync(files[1].path);
      const html = compareAndMarge(fileData1.toString(), fileData2.toString());
      ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      ctx.set('Pragma', 'no-cache');
      ctx.set('Expires', '0');
      ctx.set('Content-Type', 'text/html; charset=UTF-8');
      ctx.set('Content-Length', String(html.length));
      ctx.body = html;
    } else {
      ctx.throw(400, '文件个数不合法');
    }
  } catch (err: any) {
    console.error(err);
    ctx.throw(500, err.message);
  } finally {
    if (files && files.length > 0) {
      for (const f of files) {
        fs.unlinkSync(f.path);
      }
    }
  }
});

router.post('/prepare-preview-url', async ctx => {
  try {
    const body = ctx.request.body;
    const fileId = body.fileId;
    const dzdFile = await DzdFile.findById(toObjectId(fileId)).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到id[' + fileId + ']对应的文件'
      };
      return;
    }

    if (body.countView) {
      const session = ctx.session as unknown as ISessInfo;
      if (session) {
        const roleNames = session.roles;
        let viewCount = dzdFile.metadata.viewCount;
        if (!viewCount) {
          viewCount = 1;
        } else {
          viewCount++;
        }

        const $set: any = {
          'metadata.viewCount': viewCount
        };
        if (roleNames.includes('repeal')) {
          $set['metadata.repealViewed'] = true;
        }

        DzdFile.updateOne({
          _id: dzdFile._id
        }, {$set}).exec();
      }
    }

    const sess = ctx.session as unknown as ISessInfo;
    const url = Buffer.from(utils.generateFrontendUrl(ctx, `/resource/dzd-info/${fileId}?sk=${sess ? sess.key : ''}`)).toString('base64');
    const query = {
      fid: fileId,
      ts: new Date().getTime(),
      sk: sess ? sess.key : '',
      url
    };

    let ieUrl = '';
    // @ts-ignore
    if (dzdFile.metadata.fileType.includes('htm')) {
      ieUrl = utils.generateFrontendUrl(ctx, `/sys/dzd-html/${fileId}`);
    } else {
      // @ts-ignore
      if (dzdFile.metadata.fileType.includes('pdf') || dzdFile.metadata.fileType.includes('xls') || dzdFile.metadata.fileType.includes('doc')) {
        ieUrl = utils.generateFrontendUrl(ctx, `/sys/preview-dzd/${fileId}`);
      } else {
        ieUrl = utils.generateFrontendUrl(ctx, `/sys/get-dzd-file/${fileId}`);
      }
    }

    ctx.body = {
      succ: true,
      ieUrl,
      filename: dzdFile.filename,
      url: `${conf.service.routerBase}preview.html?${qs.stringify(query)}`
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/preview-dzd-html-sheet/:fileId/:sheetIndex', async ctx => {
  const result = await utils.getSheetHtml(ctx.params.fileId, ctx.params.sheetIndex);
  if (result.succ) {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
    ctx.set('Content-Type', 'text/html; charset=UTF-8');
    // @ts-ignore
    ctx.set('Content-Length', String(result.html.length));
    ctx.body = result.html;
  } else {
    // @ts-ignore
    ctx.throw(result.code, result.message);
  }
});

router.get('/preview-dzd/:fileId', async ctx => {
  const file: any = await DzdFile.findById(toObjectId(ctx.params.fileId)).lean();
  if (!file) {
    ctx.body = {
      succ: false,
      message: '转换pdf失败，文件未找到'
    };
    console.log('转换pdf失败，文件未找到');
    return;
  }

  try {
    console.log('预览定值单:' + file.filename);
    if (file.metadata.fileType === '.pdf') {
      const gridFS = getDzdGridFSBucket();
      ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      ctx.set('Pragma', 'no-cache');
      ctx.set('Expires', '0');
      ctx.set('Content-Type', 'application/pdf');
      ctx.set('Content-Disposition', 'filename=' + encode(file.filename) + '; filename*=utf-8\'\'' + encode(file.filename));
      // @ts-ignore
      ctx.set('Content-Length', String(file.length));
      ctx.body = gridFS.openDownloadStream(file._id);
    } else {
      const result = await utils.getFilePdf(ctx.params.fileId);
      if (result.succ) {
        const filename = file.filename.replace(/\.\w+$/, '.pdf');
        ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        ctx.set('Pragma', 'no-cache');
        ctx.set('Expires', '0');
        ctx.set('Content-Type', 'application/pdf');
        ctx.set('Content-Disposition', 'filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
        // @ts-ignore
        ctx.set('Content-Length', String(result.buffer.length));
        ctx.body = result.buffer;
      } else {
        ctx.throw(result.code, result.message);
      }
    }
  } catch (err: any) {
    ctx.throw(500, err.message);
  }
});

router.post('/get-sys-config', async ctx => {
  const body = ctx.request.body;
  ctx.body = await Config.find({
    key: body.key
  }).lean();
});

function waitForDzdFileSave(fileId: string) {
  return new Promise((resolve) => {
    if (!fileIdKeyList.some((x: any) => x.fileId === fileId)) {
      resolve(true);
    } else {
      console.log('文档正在被编辑');
      for (const i of fileIdKeyList) {
        console.log(i.key + ' ---- ' + i.fileId);
      }
      // eslint-disable-next-line prefer-const
      let timeout: any;
      const interval = setInterval(() => {
        if (!fileIdKeyList.some((x: any) => x.fileId === fileId)) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        }
      }, 1000);
      timeout = setTimeout(() => {
        clearInterval(interval);
        if (fileIdKeyList.some((x: any) => x.fileId === fileId)) {
          resolve(false);
        } else {
          resolve(true);
        }
      }, 10000);
    }
  });
}

router.get('/set-file-signed/:key', async ctx => {
  const found = fileIdKeyList.find((x: any) => x.key === ctx.params.key);
  if (found) {
    console.log('文件：' + found.fileId + '被签名');
    const result = await DzdFile.updateOne({
      _id: toObjectId(found.fileId)
    }, {
      $set: {
        'metadata.signed': true
      }
    });
    ctx.body = {
      succ: true,
      result
    };
  } else {
    console.error('文件key：' + ctx.params.key + '不存在');
    ctx.body = {
      succ: false
    };
  }
});

router.get('/set-file-stamped/:key', async ctx => {
  const found = fileIdKeyList.find((x: any) => x.key === ctx.params.key);
  if (found) {
    console.log('文件：' + found.fileId + '被签章');
    const result = await DzdFile.updateOne({
      _id: toObjectId(found.fileId)
    }, {
      $set: {
        'metadata.stamped': true
      }
    });
    ctx.body = {
      succ: true,
      result
    };
  } else {
    console.error('文件key：' + ctx.params.key + '不存在');
    ctx.body = {
      succ: false
    };
  }
});

router.post('/generate-dzd-file-key/:id', async ctx => {
  // const body = ctx.request.body;
  const sess = ctx.session as unknown as ISessInfo;
  if (!await waitForDzdFileSave(ctx.params.id)) {
    console.error('generate-dzd-file-key(' + ctx.params.id + ')时发现文档正在被编辑');
  }
  let key = new Date().getTime();
  while (fileIdKeyList.some((x: any) => x.key === String(key))) {
    key++;
  }
  const strKey = String(key);
  fileIdKeyList.push({
    key: strKey,
    fileId: ctx.params.id,
    kvMap: [],
    userId: sess.user._id
  });
  console.log('生成新文档key: ' + strKey);
  for (const i of fileIdKeyList) {
    console.log(i.key + ' ---- ' + i.fileId);
  }
  console.log('向文件编辑列表增加[' + strKey + ',' + ctx.params.id + ']');
  ctx.body = {
    editorKey: strKey
  };
});

router.post('/kv-replace/:fileId', async ctx => {
  const sess = ctx.session as unknown as ISessInfo;
  const kvMap = ctx.request.body.kvMap;
  const all = ctx.request.body.all;
  const openingFile = fileIdKeyList.find((x: any) => x.fileId === ctx.params.fileId);
  if (openingFile) {
    for (const kv of kvMap) {
      const found = openingFile.kvMap.find((x: any) => x.key === kv.key);
      if (found) {
        found.value = kv.value;
      } else {
        openingFile.kvMap.push(kv);
      }
    }
    ctx.body = {
      succ: true
    };
  } else {
    try {
      const objectFileId = toObjectId(ctx.params.fileId);
      const dzdFile = await DzdFile.findById(objectFileId).lean();
      if (!dzdFile) {
        return {
          succ: false,
          message: '文件id' + ctx.params.fileId + '不存在'
        };
      }
      const gridFS = getDzdGridFSBucket();
      const stream = gridFS.openDownloadStream(objectFileId);
      const buffer = await utils.readFile(stream);
      const $axios = utils.getBackendAxios();
      const formData = new FormData();
      formData.append('file', buffer, dzdFile.filename);
      formData.append('fileType', dzdFile.metadata.fileType);
      formData.append('documentVersion', dzdFile.metadata.documentVersion || '');
      await utils.processKVPair(kvMap, sess.user._id);
      formData.append('replaceAll', all ? 'true' : 'false');
      formData.append('kvArray', JSON.stringify(kvMap));
      const kvResult = await $axios.post('/dzd/kv-replace', formData, {
        headers: {
          'Content-Length': String(formData.getLengthSync()),
          ...formData.getHeaders()
        },
        responseType: 'stream'
      });

      if (kvResult.status === 200) {
        await utils.deleteGridFile(gridFS, objectFileId);
        const outputStream = gridFS.openUploadStreamWithId(objectFileId, dzdFile.filename, {
          metadata: dzdFile.metadata
        });
        const hash = crypto.createHash('md5').setEncoding('hex');
        kvResult.data.on('data', (d: any) => hash.update(d));
        kvResult.data.pipe(outputStream);
        await utils.waitForWriteStream(outputStream);
        hash.end();
        await DzdFile.updateOne({_id: objectFileId}, {md5: hash.read()});
        ctx.body = {
          succ: true
        };
      } else {
        ctx.body = {
          succ: false,
          message: kvResult.statusText
        };
      }
    } catch (err: any) {
      console.error('替换关键词错误，与xbac服务通讯异常');
      console.error(err);
      ctx.body = {
        succ: false,
        message: err.message
      };
    }
  }
});

async function saveOnlyofficeFile(fileId: string, body: any) {
  const dzdFile: any = await DzdFile.findById(toObjectId(fileId)).lean();
  try {
    const axiosBasic = Axios.create();
    if (conf.onlyoffice.onlyofficeBackAddress) {
      body.url = body.url.replace(conf.onlyoffice.host, conf.onlyoffice.onlyofficeBackAddress);
    }
    const {data: newFileData} = await axiosBasic({
      method: 'get',
      url: body.url,
      responseType: 'arraybuffer'
    });
    if (!newFileData) {
      return false;
    }

    console.log('定值单[' + dzdFile.filename + ']被修改, 文件id[' + fileId + ']');
    let modifier = '';
    if (body.users && body.users[0]) {
      const user: any = await User.findById(toObjectId(body.users[0])).lean();
      dzdFile.metadata.lastModifier = user.name;
      modifier = user.name;
    }
    dzdFile.metadata.modifyTime = new Date();
    const dzdFileGridFS = getDzdGridFSBucket();
    const oldFileData = await utils.readFile(dzdFileGridFS.openDownloadStream(dzdFile._id));
    await utils.deleteGridFile(dzdFileGridFS, toObjectId(fileId));
    const writeStream = dzdFileGridFS.openUploadStreamWithId(toObjectId(fileId), dzdFile.filename, {
      metadata: dzdFile.metadata
    });
    await utils.writeTo(writeStream, newFileData);
    const md5 = crypto.createHash('md5').update(newFileData).digest('hex');
    await DzdFile.updateOne({_id: toObjectId(fileId)}, {md5});
    return true;
  } catch (err: any) {
    console.error('保存文件错误');
    console.error(err);
    return false;
  }
}

async function doKeyValueReplace(key: string, fileId: string, userId: string) {
  const kvMap = [];
  const index = fileIdKeyList.findIndex((x: any) => x.key === String(key));
  if (index >= 0) {
    kvMap.push(...fileIdKeyList[index].kvMap);
    fileIdKeyList.splice(index, 1);
  } else {
    console.error('错误：文件key' + key + '不在编辑列表内');
    return {
      succ: false,
      message: '错误：文件key' + key + '不在编辑列表内'
    };
  }

  if (kvMap.length > 0) {
    console.log('开始替换关键词');
    try {
      const objectFileId = toObjectId(fileId);
      const dzdFile = await DzdFile.findById(objectFileId).lean();
      if (!dzdFile) {
        return {
          succ: false,
          message: '文件id' + fileId + '不存在'
        };
      }
      const gridFS = getDzdGridFSBucket();
      const stream = gridFS.openDownloadStream(objectFileId);
      const buffer = await utils.readFile(stream);
      const $axios = utils.getBackendAxios();
      const formData = new FormData();
      formData.append('file', buffer, dzdFile.filename);
      formData.append('fileType', dzdFile.metadata.fileType);
      formData.append('documentVersion', dzdFile.metadata.documentVersion || '');
      await utils.processKVPair(kvMap, userId);
      formData.append('kvArray', JSON.stringify(kvMap));
      const kvResult = await $axios.post('/dzd/kv-replace', formData, {
        headers: {
          'Content-Length': String(formData.getLengthSync()),
          ...formData.getHeaders()
        },
        responseType: 'stream'
      });

      if (kvResult.status === 200) {
        await utils.deleteGridFile(gridFS, objectFileId);
        const outputStream = gridFS.openUploadStreamWithId(objectFileId, dzdFile.filename, {
          metadata: dzdFile.metadata
        });
        const hash = crypto.createHash('md5').setEncoding('hex');
        kvResult.data.on('data', (d: any) => hash.update(d));
        kvResult.data.pipe(outputStream);
        await utils.waitForWriteStream(outputStream);
        await DzdFile.updateOne({_id: objectFileId}, {md5: hash.read()});
        console.log('替换关键词完成');
        return {
          succ: true
        };
      } else {
        return {
          succ: false,
          message: kvResult.statusText
        };
      }
    } catch (err: any) {
      console.error('替换关键词错误，与xbac服务通讯异常');
      console.error(err);
      return {
        succ: false,
        message: err.message
      };
    }
  } else {
    return {
      succ: true
    };
  }
}

router.post('/save-dzd-file/:fileId', async ctx => {
  const fileId = ctx.params.fileId;
  const body = ctx.request.body;
  console.log(body);
  if (body.history && body.history.changes) {
    console.log(body.history.changes);
  }
  const fileFound = fileIdKeyList.find(x => x.key === String(body.key));
  if (!fileFound) {
    ctx.body = {
      error: 1
    };
    console.warn('定值单文件编辑器回调错误，key对应的文件id不存在');
    return;
  }

  if (body.status === 1) {
    console.log('定值单编辑器回调：文件' + fileId + '被修改');
    ctx.body = {
      error: 0
    };
    return;
  }

  try {
    // 0 - no document with the key identifier could be found,
    // 1 - document is being edited,
    // 2 - document is ready for saving,
    // 3 - document saving error has occurred,
    // 4 - document is closed with no changes,
    // 6 - document is being edited, but the current document state is saved,
    // 7 - error has occurred while force saving the document.
    console.log('定值单文件保存回调: ' + body.status);
    switch (body.status) {
      // 保存文档且文档已关闭，删除key
      case 2: {
        await saveOnlyofficeFile(fileId, body);
        console.log('定值单文件已保存');
        Globals.socket.postClientMessage('saveSuccess', {
          fileId,
          status: body.status
        });

        await doKeyValueReplace(body.key, fileId, fileFound.userId);
        break;
      }
      // 文档已关闭，但无需保存
      case 4: {
        console.log('定值单文件已关闭, 无需保存');
        Globals.socket.postClientMessage('saveSuccess', {
          fileId,
          status: body.status
        });

        await doKeyValueReplace(body.key, fileId, fileFound.userId);
        break;
      }
      // 保存文档，但文档未关闭，不删除key
      case 6: {
        console.log('定值单文件请求保存, 但还未关闭');
        await saveOnlyofficeFile(fileId, body);
        Globals.socket.postClientMessage('saveSuccess', {
          fileId,
          status: body.status
        });
        break;
      }
      case 3:
      case 7: { // 保存出错，并且文档已关闭，只删除key，不保存
        const index = fileIdKeyList.findIndex((x: any) => x.key === String(body.key));
        if (index >= 0) {
          fileIdKeyList.splice(index, 1);
        } else {
          console.warn('错误：文件key' + body.key + '不在编辑列表内2');
        }
        Globals.socket.postClientMessage('saveSuccess', {
          fileId,
          status: body.status
        });
        break;
      }
    }

    ctx.body = {
      error: 0
    };
  } catch (err: any) {
    console.error(err);
    const index = fileIdKeyList.findIndex((x: any) => x.key === String(body.key));
    if (index >= 0) {
      fileIdKeyList.splice(index, 1);
    } else {
      console.error('错误：文件key' + body.key + '不在编辑列表内3');
    }
    Globals.socket.postClientMessage('saveFailed', {
      fileId,
      error: err
    });
    ctx.body = {
      error: 3
    };
  }
});

router.get('/get-dzd-file/:id', async ctx => {
  console.log('请求下载定值单文件: ' + ctx.params.id);
  const dzdFile: any = await DzdFile.findById(toObjectId(ctx.params.id), {
    filename: 1,
    contentType: 1,
    length: 1,
    metadata: 1
  }).lean();
  if (dzdFile) {
    const gridFS = getDzdGridFSBucket();
    if (dzdFile.metadata.fileType && dzdFile.metadata.fileType.includes('htm')) {
      dzdFile.filename = dzdFile.filename.replace(/\.\w+$/, '.html');
    }
    const readerStream = gridFS.openDownloadStream(toObjectId(ctx.params.id));
    ctx.set('Content-Type', dzdFile.contentType || dzdFile.metadata._contentType);
    ctx.set('Access-Control-Expose-Headers', 'filename');
    ctx.set('filename', encode(dzdFile.filename));
    ctx.set('Content-Disposition', 'inline; filename=' + encode(dzdFile.filename) + '; filename*=utf-8\'\'' + encode(dzdFile.filename));
    ctx.set('Content-Length', String(dzdFile.length));
    ctx.body = readerStream;
    console.log('文件名: ' + dzdFile.filename + '，大小: ' + (dzdFile.length / 1024) + 'kb');
  } else {
    ctx.throw(404, '文件不存在');
  }
});

router.post('/get-gbk-sha1', ctx => {
  const str = ctx.request.body.str;
  const sha1 = crypto.createHash('sha1');
  sha1.update(iconv.encode(str, 'gbk'));
  ctx.body = sha1.digest('hex');
});

router.post('/get-utf8-sha1', ctx => {
  const str = ctx.request.body.str;
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  ctx.body = sha1.digest('hex');
});

router.get('/dzd-html/:id', ctx => {
  if (ctx.params.id.endsWith('.gif')) {
    const stream = fs.createReadStream(path.resolve(__dirname, '../../static/img/sign.gif'));
    ctx.set('Content-Type', 'image/gif');
    ctx.body = stream;
  } else if (ctx.params.id.endsWith('.png')) {
    const stream = fs.createReadStream(path.resolve(__dirname, '../../static/img/sign.png'));
    ctx.set('Content-Type', 'image/png');
    ctx.body = stream;
  } else {
    const gridFS = getDzdGridFSBucket();
    const readerStream = gridFS.openDownloadStream(toObjectId(ctx.params.id));
    ctx.set('Content-Type', 'text/html');
    ctx.body = readerStream;
  }
});

router.get('/departments', async ctx => {
  ctx.body = await Department.find({
    code: {
      $ne: '0'
    }
  }).sort({index: 1}).lean();
});

export async function queryDepartmentsFromCodes(codes: string[]) {
  const departments = await queryDepartments({
    $match: {
      code: {
        $in: codes
      }
    }
  });

  const ret: any[] = [];
  for (const department of departments) {
    if (department.children && department.children.length > 0) {
      for (const child of department.children) {
        if (!ret.some((x: any) => x.code === child.code)) {
          ret.push(child);
        }
      }
    }

    if (!ret.some((x: any) => x.code === department.code)) {
      delete department.children;
      ret.push(department);
    }
  }

  return ret.filter((x: any) => x.code !== '0').sort((x, y) => x.index - y.index);
}

router.post('/query-departments-from-codes', async ctx => {
  const session = ctx.session as unknown as ISessInfo;
  const codes = ctx.request.body.codes;
  if (session && session.departments && session.auths && session.auths.includes('admin')) {
    const departments: any[] = await Department.find(
      {
        code: {
          $in: codes
        }
      },
      {
        parentCode: 1
      }
    ).lean();
    const parentCodes = departments.map((x: any) => x.parentCode);
    const tmp: any[] = await Department.find(
      {
        parentCode: {
          $in: parentCodes
        }
      },
      {
        code: 1
      }
    ).lean();

    for (const d of tmp) {
      if (!codes.some((x: any) => x.code === d.code)) {
        codes.push(d.code);
      }
    }
  }

  ctx.body = await queryDepartmentsFromCodes(codes);
});

router.post('/query-department-tree-from-codes', async ctx => {
  const session = ctx.session as unknown as ISessInfo;
  const codes = ctx.request.body.codes;
  if (session && session.departments && session.auths && session.auths.includes('admin')) {
    const departments: any[] = await Department.find(
      {
        code: {
          $in: codes
        }
      },
      {
        parentCode: 1
      }
    ).lean();
    const parentCodes = departments.map((x: any) => x.parentCode);
    const tmp: any[] = await Department.find(
      {
        parentCode: {
          $in: parentCodes
        }
      },
      {
        code: 1
      }
    ).lean();

    for (const d of tmp) {
      if (!codes.some((x: any) => x.code === d.code)) {
        codes.push(d.code);
      }
    }
  }

  const departments = await queryDepartments({
    $match: {
      code: {
        $in: codes
      }
    }
  });

  const roots: IDepartment[] = [];
  const children: IDepartment[] = [];
  for (const department of departments) {
    if (department.children && department.children.length > 0) {
      for (const child of department.children) {
        children.push(child);
      }
    }
    delete department.children;
    roots.push(department);
  }

  ctx.body = generateTree(
    roots.sort((x, y) => x.index - y.index),
    children.sort((x, y) => x.index - y.index)
  );
});

router.get('/department-tree', async ctx => {
  const departments = await queryDepartments({
    $match: {
      parentCode: '0'
    }
  });

  const roots: IDepartment[] = [];
  const children: IDepartment[] = [];
  for (const department of departments) {
    if (department.children && department.children.length > 0) {
      for (const child of department.children) {
        children.push(child);
      }
    }
    delete department.children;
    roots.push(department);
  }

  ctx.body = generateTree(
    roots.sort((x, y) => x.index - y.index),
    children.sort((x, y) => x.index - y.index)
  );
});

function queryDepartments(condition: any): Aggregate<any[]> {
  return Department.aggregate([
    condition,
    {
      $graphLookup: {
        from: 'user.department',
        startWith: '$code',
        connectFromField: 'code',
        connectToField: 'parentCode',
        as: 'children'
      }
    },
    {
      $sort: {
        index: 1
      }
    }
  ]);
}

function generateTree(roots: IDepartment[], departments: IDepartment[]) {
  function fetchChildren(node: IDepartment) {
    const children = departments
      .filter((x: any) => x.parentCode === node.code)
      .map((x: any) => {
        return Object.assign(
          {
            expand: false,
            title: x.aliasName || x.name,
            label: x.aliasName || x.name
          },
          x
        );
      });
    for (const child of children) {
      child.children = fetchChildren(child);
    }
    return children;
  }

  for (const node of roots) {
    node.expand = true;
    node.title = node.aliasName || node.name;
    node.label = node.aliasName || node.name;
    node.children = fetchChildren(node);
  }

  if (roots.length === 1 && roots[0].code === '0') {
    return roots[0].children ? roots[0].children : [];
  } else {
    return roots;
  }
}

router.post('/pinyin', ctx => {
  if (!ctx.request.body.chinese) {
    ctx.body = [];
    return;
  }

  ctx.body = utils.getPinyin(ctx.request.body.chinese);
});

router.post('/firstletter', ctx => {
  if (!ctx.request.body.chinese) {
    ctx.body = [];
    return;
  }
  ctx.body = utils.getFirstLetters(ctx.request.body.chinese);
});

interface ILogQueryBody {
  serverId?: string;
  startTime?: number;
  endTime?: number;
  userName?: string;
  clientAddress?: string;
  module?: string;
  method?: string;
  url?: string;
  duration?: number;
  timeAsc: boolean;
  startRow: number;
  endRow: number;
}

router.get('/single-log/:id', async ctx => {
  const result: any = await Log.findById(toObjectId(ctx.params.id)).populate('user', {
    name: 1
  }).lean();
  if (result) {
    result.time = moment(result.time).format('YYYY-MM-DD HH:mm:ss.SSS');
    ctx.body = {
      succ: true,
      result
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到[' + ctx.params.id + ']对应的日志信息'
    };
  }
});

router.post('/query-logs', async ctx => {
  const body: ILogQueryBody = ctx.request.body;
  let userId;
  if (body.userName) {
    const userFound: any = await User.findOne({
      $or: [
        {
          account: body.userName
        },
        {
          name: body.userName
        }
      ]
    }).lean();
    if (userFound) {
      userId = userFound._id;
    }
  }

  const condition: any = {
    module: {
      $ne: '/auth'
    }
  };
  if (userId) {
    condition.userId = userId;
  }

  if (body.serverId) {
    condition.serverId = body.serverId;
  }

  if (body.startTime && body.endTime) {
    condition.time = {
      $and: [
        {
          $gte: new Date(body.startTime)
        },
        {
          $lte: new Date(body.endTime)
        }
      ]
    };
  } else if (body.startTime) {
    condition.time = {
      $gte: new Date(body.startTime)
    };
  } else if (body.endTime) {
    condition.time = {
      $lte: new Date(body.endTime)
    };
  }

  if (body.clientAddress) {
    condition.address = {
      $regex: new RegExp(body.clientAddress, 'i')
    };
  }

  if (body.module) {
    condition.module = {
      $regex: new RegExp(body.module, 'i')
    };
  }

  if (body.method) {
    condition.method = {
      $regex: new RegExp(body.method, 'i')
    };
  }

  if (body.url) {
    condition.url = {
      $regex: new RegExp(body.url, 'i')
    };
  }

  if (body.duration) {
    condition.duration = {
      $gte: body.duration
    };
  }

  const count = await Log.countDocuments(condition);
  const rows = await Log.find(condition, {
    param: 0,
    error: 0,
    result: 0
  }).populate('user', {
    name: 1
  }).sort({time: body.timeAsc ? 1 : -1}).skip(body.startRow).limit(body.endRow - body.startRow).lean();

  let index = body.startRow + 1;
  for (const row of rows) {
    // @ts-ignore
    row.time = moment(row.time).format('YYYY-MM-DD HH:mm:ss');
    // @ts-ignore
    row.index = index++;
  }
  ctx.body = {
    succ: true,
    result: { count, rows }
  };
});

export default router;
