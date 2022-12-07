import fs from 'fs';
import path from 'path';
import nodeStream from 'stream';
import moment from 'moment';
import * as IPOption from 'ip';
import Router from 'koa-router';
import sharp from 'sharp';
import urlencode from 'urlencode';
import consola from 'consola';
import {v1 as uuidV1} from 'uuid';
import Axios from 'axios';
import xlsx from 'xlsx';
import _ from 'lodash';
import FormData from 'form-data';
import koaBody from 'koa-body';
import {
  Config,
  DzdFile,
  FormPrintTemplate,
  getConfigValueByKey,
  getFormPrintTemplateGridFSBucket,
  getImageGridFSBucket,
  getPdfCacheGridFSBucket,
  getStampGridFSBucket,
  IFormPrintTemplate,
  Image,
  PdfCache,
  Stamp,
  toObjectId,
  User
} from '../mongo-schema';
import utils, {KVPair} from '../utils';
import conf from '../../configs';
import sessionStore from '../session-store';

const router = new Router({prefix: '/resource'});

interface IImageBuffer {
  buffer: Buffer;
  id: string;
  width: string;
  filename: string;
  contentLength: string;
  timeout: any;
  tick: number;
}

const imageBuffers: IImageBuffer[] = [];

async function getImage(id: string, width: string): Promise<IImageBuffer | null> {
  const found = imageBuffers.find((x: any) => x.id === id && x.width === width);
  if (found) {
    clearTimeout(found.timeout);
    found.tick = new Date().getTime();
    found.timeout = setTimeout(() => {
      const index = imageBuffers.findIndex((x: any) => x.id === id && x.width === width);
      if (index >= 0) {
        imageBuffers.splice(index, 1);
      }
    }, 30000);
    return found;
  }
  const img = await Image.findById(toObjectId(id)).lean();
  if (img) {
    const quality = Number(await getConfigValueByKey('login-bg-quality', '60'));
    const bucket = getImageGridFSBucket();
    const stream = bucket.openDownloadStream(toObjectId(id));
    const rawData = await utils.readFile(stream);
    const buffer = await sharp(rawData).resize(Number(width)).jpeg({quality: quality > 100 || quality < 5 ? 60 : quality}).toBuffer();
    const imageBuffer = {
      buffer,
      id,
      width,
      filename: img.filename,
      contentLength: String(buffer.length),
      timeout: setTimeout(() => {
        const index = imageBuffers.findIndex((x: any) => x.id === id && x.width === width);
        if (index >= 0) {
          imageBuffers.splice(index, 1);
        }
      }, 30000),
      tick: new Date().getTime()
    };
    if (imageBuffers.push(imageBuffer) > 30) {
      imageBuffers.sort((a, b) => a.tick - b.tick);
      const ibuf = imageBuffers.shift();
      if (ibuf) {
        clearTimeout(ibuf.timeout);
      }
    }
    return imageBuffer;
  }

  return null;
}

router.get('/get-stamp-data', async ctx => {
  try {
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
      const b64 = resultBuffer.toString('base64');
      const result = `data:${stamp.metadata._contentType};base64,${b64}`;
      ctx.body = {
        succ: true,
        stamp: result,
        info: {
          width: stamp.metadata.targetWidth,
          height: stamp.metadata.targetHeight
        }
      };
    } else {
      ctx.body = {
        succ: true,
        stamp: 'data:image/png;base64,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',
        info: {
          width: 430,
          height: 430
        }
      };
    }
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/get-sign-data/:userId', async ctx => {
  const user = await User.findById(toObjectId(ctx.params.userId));
  if (user) {
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
      const b64 = resultBuffer.toString('base64');
      const result = `data:${stamp.metadata._contentType};base64,${b64}`;
      ctx.body = {
        succ: true,
        type: 'image',
        sign: result,
        info: {
          width: stamp.metadata.targetWidth,
          height: stamp.metadata.targetHeight
        }
      };
    } else {
      ctx.body = {
        succ: true,
        type: 'text',
        sign: user.name
      };
    }
  } else {
    ctx.body = {
      succ: false,
      message: ''
    };
  }
});

router.get('/version', ctx => {
  try {
    const json = fs.readFileSync(path.resolve(__dirname, '../../static/release.json'), {encoding: 'utf8'});
    const releaseNotes = fs.readFileSync(path.resolve(__dirname, '../../static/release-notes.md'), {encoding: 'utf8'});
    const str = json.toString();
    ctx.body = {
      succ: true,
      info: JSON.parse(str),
      releaseNotes
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/dzd-info/:fileId', async ctx => {
  try {
    function getType(filename: string) {
      if (/\.docx?$/i.test(filename)) {
        return 'word';
      }

      if (/\.xlsx?$/i.test(filename)) {
        return 'excel';
      }

      if (/\.pdf$/i.test(filename)) {
        return 'pdf';
      }

      if (/\.html?$/i.test(filename)) {
        return 'html';
      }

      if (/\.jpe?g$/i.test(filename)) {
        return 'jpeg';
      }

      if (/\.png$/i.test(filename)) {
        return 'png';
      }

      if (/\.gif$/i.test(filename)) {
        return 'gif';
      }

      if (/\.svg/i.test(filename)) {
        return 'svg';
      }

      if (/\.txt/i.test(filename)) {
        return 'txt';
      }

      return 'unknown';
    }

    const fileId = ctx.params.fileId;
    const dzdFile = await DzdFile.findById(toObjectId(fileId)).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到id[' + fileId + ']对应的文件'
      };
      return;
    }

    if (ctx.query && ctx.query.sk) {
      // @ts-ignore
      const sess = sessionStore.getSessionByKey(ctx.query.sk);
      if (sess) {
        consola.info({
          message: '用户[' + sess.user.name + '], 角色[' + sess.roles.join(',') + ']请求查看定值单[' + dzdFile.filename + ']',
          badge: true
        });
      }
    }

    // @ts-ignore
    if (dzdFile.metadata.fileType.includes('htm')) {
      ctx.body = {
        succ: true,
        url: utils.generateFrontendUrl(ctx, `/sys/dzd-html/${fileId}`),
        type: 'html',
        title: dzdFile.filename,
        filename: dzdFile.filename
      };
    } else {
      // @ts-ignore
      if (dzdFile.metadata.fileType.includes('pdf') || dzdFile.metadata.fileType.includes('xls') || dzdFile.metadata.fileType.includes('doc')) {
        const fileUrl = utils.generateFrontendUrl(ctx, '/sys/preview-dzd/' + fileId);
        const viewerUrl = utils.generateFrontendResourceUrl(ctx, `pdf/web/viewer.html?file=${urlencode(fileUrl)}`);
        ctx.body = {
          succ: true,
          url: viewerUrl,
          type: getType(dzdFile.filename),
          title: dzdFile.filename,
          filename: dzdFile.filename
        };
      } else {
        ctx.body = {
          succ: true,
          url: utils.generateFrontendUrl(ctx, `/sys/get-dzd-file/${fileId}`),
          type: getType(dzdFile.filename),
          title: dzdFile.filename,
          filename: dzdFile.filename
        };
      }
    }
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/configs/:type', async ctx => {
  const result: any = {};
  switch (ctx.params.type) {
    case 'configs': {
      const configs: any = {};
      for (const key in conf) {
        // @ts-ignore
        if (!conf[key].backendOnly) {
          // @ts-ignore
          configs[key] = conf[key];
        }
      }
      result.configs = configs;
      break;
    }
    case 'system-configs': {
      result.systemConfigs = await Config.find({
        $or: [
          {
            backendOnly: {
              $exists: false
            }
          },
          {
            backendOnly: {
              $eq: false
            }
          }
        ]
      }).lean();
      break;
    }
    case 'all': {
      result.systemConfigs = await Config.find({
        $or: [
          {
            backendOnly: {
              $exists: false
            }
          },
          {
            backendOnly: {
              $eq: false
            }
          }
        ]
      }).lean();
      const configs: any = {};
      for (const key in conf) {
        // @ts-ignore
        if (!conf[key].backendOnly) {
          // @ts-ignore
          configs[key] = conf[key];
        }
      }
      result.configs = configs;
      break;
    }
  }
  ctx.body = result;
});

router.get('/login-type', async ctx => {
  try {
    const preferCommonLogin = await getConfigValueByKey('prefer-common-login', 'false');
    if (preferCommonLogin === 'true') {
      ctx.body = 'common';
      return;
    }
    const clientIP = utils.getClientIP(ctx.request);
    const clientIPs = await getConfigValueByKey('common-login-clients', '');
    console.log('客户端[' + clientIP + ']准备登录系统');
    const ips = clientIPs.split(/[\n\s,，]/).filter((x: string) => !!x).map((x: string) => x.trim());
    let includes = false;
    console.log('可信任客户端表：');
    for (const ip of ips) {
      console.log(ip);
      if (ip.includes('/')) {
        if (IPOption.cidrSubnet(ip).contains(clientIP)) {
          includes = true;
          break;
        }
      } else {
        if (IPOption.isEqual(ip, clientIP)) {
          includes = true;
          break;
        }
      }
    }
    if (includes) {
      console.log('客户端[' + clientIP + ']存在于常规登录IP表内');
      ctx.body = 'common';
    } else {
      console.log('客户端[' + clientIP + ']不在常规登录IP表内，将使用安全登录模式');
      ctx.body = 'security';
    }
  } catch (err: any) {
    console.log('IP表配置异常，将使用安全登录模式');
    console.error(err);
    ctx.body = 'security';
  }
});

router.get('/login-configs', async ctx => {
  let bgInterval = 8000;
  let bgRandom = false;
  let title1 = {
    text: '辽宁电力调度控制中心',
    fontSize: '22px',
    letterSpacing: '3px',
    color: '#006569'
  };
  let title2 = {
    text: '继电保护定值单网络管理系统',
    fontSize: '15px',
    letterSpacing: '2px',
    color: '#006569'
  };
  const bgImageIds = [];

  try {
    const preferCommonLogin = await getConfigValueByKey('prefer-common-login', 'false');
    const clientIP = utils.getClientIP(ctx.request);
    const clientIPs = await getConfigValueByKey('common-login-clients', '');
    console.log('客户端[' + clientIP + ']准备登录系统');
    const ips = clientIPs.split(/[\n\s,，]/).filter((x: string) => !!x).map((x: string) => x.trim());
    let loginType = 'security';
    console.log('可信任客户端表：');
    for (const ip of ips) {
      console.log(ip);
      if (ip.includes('/')) {
        if (IPOption.cidrSubnet(ip).contains(clientIP)) {
          loginType = 'common';
          break;
        }
      } else {
        if (IPOption.isEqual(ip, clientIP)) {
          loginType = 'common';
          break;
        }
      }
    }

    if (loginType === 'common') {
      console.log('客户端[' + clientIP + ']存在于常规登录IP表内');
    } else {
      console.log('客户端[' + clientIP + ']不在常规登录IP表内，将使用安全登录模式');
    }

    const list = await Image.find({
      'metadata.imageType': '/login'
    }).sort({filename: 1}).lean();
    bgImageIds.push(...list.map((x: any) => x._id));

    const configs = await Config.find({
      key: {
        $in: [
          'login-bg-interval',
          'login-bg-random',
          'internet-disallow',
          'captcha-security-login',
          'captcha-common-login',
          'enable-register',
          'login-title1',
          'login-title2',
          'pwd-check-regex',
          'pwd-check-message'
        ]
      }
    }, {
      key: 1,
      value: 1
    }).lean();

    const loginBgInterval = configs.find((x: any) => x.key === 'login-bg-interval');
    if (loginBgInterval) {
      const value = Number(loginBgInterval.value);
      if (value > 0 && value < 999) {
        bgInterval = value * 1000;
      }
    }

    const loginBgRandom = configs.find((x: any) => x.key === 'login-bg-random');
    if (loginBgRandom) {
      bgRandom = loginBgRandom.value.trim() === 'true';
    }

    const title1Config = configs.find((x: any) => x.key === 'login-title1');
    if (title1Config) {
      title1 = JSON.parse(title1Config.value);
    }

    const title2Config = configs.find((x: any) => x.key === 'login-title2');
    if (title2Config) {
      title2 = JSON.parse(title2Config.value);
    }

    const pwdCheckRegex = configs.find((x: any) => x.key === 'pwd-check-regex');
    const pwdCheckMessage = configs.find((x: any) => x.key === 'pwd-check-message');
    const internetDisallow = configs.find((x: any) => x.key === 'internet-disallow');
    const enableRegister = configs.find((x: any) => x.key === 'enable-register');
    const securityCaptchaRequired = configs.find((x: any) => x.key === 'captcha-security-login');
    const commonCaptchaRequired = configs.find((x: any) => x.key === 'captcha-common-login');
    const adminUserCount = await utils.getAdminUserCount();

    ctx.body = {
      succ: true,
      bgImageIds: bgRandom ? utils.shuffle(bgImageIds) : bgImageIds,
      bgInterval,
      bgRandom,
      title1,
      title2,
      loginType: preferCommonLogin === 'true' ? 'common' : loginType,
      adminUserCount,
      pwdCheckRegex: pwdCheckRegex ? pwdCheckRegex.value : '',
      pwdCheckMessage: pwdCheckMessage ? pwdCheckMessage.value : '',
      internetDisallow: internetDisallow ? internetDisallow.value === 'true' : false,
      enableRegister: enableRegister ? enableRegister.value === 'true' : false,
      securityCaptchaRequired: securityCaptchaRequired ? securityCaptchaRequired.value === 'true' : false,
      commonCaptchaRequired: commonCaptchaRequired ? commonCaptchaRequired.value === 'true' : false,
      routePaths: utils.getMetaRoutes().map(x => x.path)
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      bgImageIds: bgRandom ? utils.shuffle(bgImageIds) : bgImageIds,
      bgInterval,
      bgRandom,
      title1,
      title2,
      loginType: 'security',
      adminUserCount: 1,
      pwdCheckRegex: '',
      pwdCheckMessage: '',
      internetDisallow: false,
      enableRegister: false,
      securityCaptchaRequired: false,
      commonCaptchaRequired: false,
      routePaths: utils.getMetaRoutes().map(x => x.path),
      message: err.message
    };
  }
});

router.get('/image/:id/:width', async ctx => {
  try {
    if (ctx.headers.referer && (ctx.headers.referer.includes(conf.service.routerBase) || ctx.headers.referer.includes('/login'))) {
      const imageBuffer = await getImage(ctx.params.id, ctx.params.width);
      if (imageBuffer) {
        ctx.set('Content-Type', 'image/jpeg');
        ctx.set('Content-Disposition', 'attachment; filename=' + urlencode(imageBuffer.filename) + '; filename*=utf-8\'\'' + urlencode(imageBuffer.filename));
        ctx.set('Content-Length', imageBuffer.contentLength);
        const bufferStream = new nodeStream.PassThrough();
        bufferStream.end(imageBuffer.buffer);
        ctx.body = bufferStream;
      } else {
        ctx.body = {
          succ: false,
          message: '未找到图像ID'
        };
      }
    } else {
      ctx.body = {
        succ: false,
        message: '未授权的下载'
      };
    }
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

interface IFileIdData {
  fileId: string;
  identifier: string;
}

const fileIdKeyList: IFileIdData[] = [];

async function getTemplateFile(): Promise<IFormPrintTemplate> {
  const templates = await FormPrintTemplate.find({}).lean();
  // @ts-ignore
  return templates[0];
}

function waitForTemplateFileSave(fileId: string) {
  return new Promise((resolve) => {
    if (!fileIdKeyList.some(x => x.fileId === fileId)) {
      resolve(true);
    } else {
      console.log('文档正在被编辑');
      for (const i of fileIdKeyList) {
        console.log(i.identifier + ' ---- ' + i.fileId);
      }
      // eslint-disable-next-line prefer-const
      let timeout: any;
      const interval = setInterval(() => {
        if (!fileIdKeyList.some(x => x.fileId === fileId)) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        }
      }, 1000);
      timeout = setTimeout(() => {
        clearInterval(interval);
        if (fileIdKeyList.some(x => x.fileId === fileId)) {
          resolve(false);
        } else {
          resolve(true);
        }
      }, 10000);
    }
  });
}

router.get('/generate-print-template-identifier', async ctx => {
  const identifier = String(new Date().getTime());
  const file = await getTemplateFile();
  if (!await waitForTemplateFileSave(file._id.toHexString())) {
    console.error('generate-dzd-file-key时发现文档正在被编辑');
  }
  await FormPrintTemplate.updateOne({
    _id: file._id
  }, {
    $set: {
      'metadata.identifier': identifier
    }
  });
  const found = fileIdKeyList.find(x => x.fileId === file._id.toHexString());
  if (found) {
    found.identifier = identifier;
  } else {
    fileIdKeyList.push({
      fileId: file._id.toHexString(),
      identifier
    });
  }
  ctx.body = identifier;
});

router.post('/replace-print-template', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 50 * 1024 * 1024
  }
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    let s;
    const templateFile = await getTemplateFile();
    const gridFS = getFormPrintTemplateGridFSBucket();
    if (templateFile) {
      await gridFS.delete(templateFile._id);
      templateFile.metadata.identifier = '';
      s = gridFS.openUploadStreamWithId(templateFile._id, templateFile.filename, {
        metadata: templateFile.metadata
      });
    } else {
      s = gridFS.openUploadStream('流程表单打印模板.xlsx', {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        metadata: {
          templateType: 'all',
          identifier: '',
          _contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
    }
    const input = fs.createReadStream(file.filepath);
    // @ts-ignore
    input.pipe(s);
    await utils.waitForWriteStream(s);
    ctx.body = {
      succ: true,
      fileId: s.id
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

router.get('/download-print-template', async ctx => {
  const file = await getTemplateFile();
  const gridFS = getFormPrintTemplateGridFSBucket();
  const stream = gridFS.openDownloadStream(file._id);
  const filename = file.filename;
  ctx.set('Content-Type', file.metadata._contentType);
  ctx.set('Content-Disposition', 'inline; filename=' + urlencode(filename) + '; filename*=utf-8\'\'' + urlencode(filename));
  ctx.set('Content-Length', String(file.length));
  ctx.body = stream;
});

router.post('/save-print-template/:identifier', async ctx => {
  const identifier = ctx.params.identifier;
  const body = ctx.request.body;
  console.log(body);
  if (body.history && body.history.changes) {
    console.log(body.history.changes);
  }

  if (body.status === 1) {
    console.log('表单打印模板编辑器回调：文件' + identifier + '被修改');
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
        const saveSucc = await saveOnlyofficeFile(identifier, body);
        if (saveSucc) {
          console.log('定值单文件已保存');
          const index = fileIdKeyList.findIndex(x => x.identifier === identifier);
          if (index >= 0) {
            fileIdKeyList.splice(index, 1);
          }
          await FormPrintTemplate.updateOne({'metadata.identifier': identifier}, {
            $set: {
              'metadata.identifier': ''
            }
          });
        }
        break;
      }
      // 文档已关闭，但无需保存
      case 4: {
        const index = fileIdKeyList.findIndex(x => x.identifier === identifier);
        if (index >= 0) {
          fileIdKeyList.splice(index, 1);
        }
        console.log('定值单文件已关闭, 无需保存');
        break;
      }
      // 保存文档，但文档未关闭，不删除key
      case 6: {
        console.log('定值单文件请求保存, 但还未关闭');
        await saveOnlyofficeFile(identifier, body);
        break;
      }
      case 3:
      case 7: {
        // 保存出错，并且文档已关闭，只删除key，不保存
        const index = fileIdKeyList.findIndex(x => x.identifier === identifier);
        if (index >= 0) {
          fileIdKeyList.splice(index, 1);
        }
        await FormPrintTemplate.updateOne({'metadata.identifier': identifier}, {
          $set: {
            'metadata.identifier': ''
          }
        });
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

async function saveOnlyofficeFile(identifier: string, body: any) {
  const file = await FormPrintTemplate.findOne({'metadata.identifier': identifier}).lean();
  if (!file) {
    console.error('onlyoffice保存打印模板失败，无法根据identifier[' + identifier + ']找到文件');
    return false;
  }
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

    console.log('打印模板[' + file.filename + ']被修改, 文件id[' + identifier + ']');

    const gridFS = getFormPrintTemplateGridFSBucket();
    await utils.deleteGridFile(gridFS, file._id);
    const writeStream = gridFS.openUploadStreamWithId(file._id, file.filename, {
      metadata: file.metadata
    });
    await utils.writeTo(writeStream, newFileData);
    return true;
  } catch (err: any) {
    console.error('保存文件错误');
    console.error(err);
    return false;
  }
}

router.get('/download-cached-pdf/:cacheId', async ctx => {
  const cacheFile = await PdfCache.findById(toObjectId(ctx.params.cacheId));
  if (!cacheFile) {
    ctx.throw(404, '文件不存在');
    return;
  }
  const pdfGridFS = getPdfCacheGridFSBucket();
  const stream = pdfGridFS.openDownloadStream(cacheFile._id);
  const filename = cacheFile.metadata.rawFilename;
  ctx.set('Content-Type', 'application/pdf');
  ctx.set('Content-Disposition', 'attachment; filename=' + urlencode(filename) + '; filename*=utf-8\'\'' + urlencode(filename));
  ctx.set('Content-Length', String(cacheFile.length));
  ctx.body = stream;
});

router.get('/generate-form-print/:fileId', async ctx => {
  try {
    const users = await User.find({}, {name: 1});
    const dzdFile = await DzdFile.findById(toObjectId(ctx.params.fileId)).lean();
    if (!dzdFile) {
      ctx.body = {
        succ: false,
        message: '未找到定值单文件'
      };
      return;
    }
    const kvMap: KVPair[] = [];
    const keywords = await readPrintTemplateKeywords();
    for (const keyword of keywords) {
      switch (keyword.type) {
        case 'f': {
          // @ts-ignore
          const found = dzdFile.metadata.formData.find(x => x.key === keyword.key);
          if (found) {
            keyword.value = String(found.value);
          }
          break;
        }
        case 'u': {
          const value = _.get(dzdFile, keyword.key, '');
          const found = users.find(x => x._id === value);
          if (found) {
            keyword.value = found.name;
          }
          break;
        }
        case 'd': {
          const value = _.get(dzdFile, keyword.key, '');
          if (value) {
            keyword.value = moment(value).format('YYYY年MM月DD日');
          }
          break;
        }
        default: {
          keyword.value = _.get(dzdFile, keyword.key, '');
          break;
        }
      }
      kvMap.push({
        key: keyword.keyword,
        value: keyword.value || ''
      });
    }

    const templateFile = await getTemplateFile();
    const gridFS = getFormPrintTemplateGridFSBucket();
    const buffer = await utils.readFile(gridFS.openDownloadStream(templateFile._id));
    const $axios = utils.getBackendAxios();
    const formData = new FormData();
    formData.append('file', buffer, 'form.xlsx');
    formData.append('fileType', '.xlsx');
    formData.append('documentVersion', '');
    await utils.processKVPair(kvMap);
    formData.append('kvArray', JSON.stringify(kvMap));
    const {data: responseExcelBuffer} = await $axios.post('/dzd/kv-replace', formData, {
      headers: {
        'Content-Length': String(formData.getLengthSync()),
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer'
    });

    const clearKeywordRegex = await getConfigValueByKey('keyword-match-regex', '');
    const formData2 = new FormData();
    formData2.append('sheetIndex', 0);
    formData2.append('pageSetupArray', '[]');
    formData2.append('autoDropSheetCount', '0');
    formData2.append('autoDropSheetRegex', '');
    formData2.append('showHiddenRows', 'false');
    formData2.append('showHiddenCols', 'false');
    formData2.append('clearKeywordRegex', clearKeywordRegex);
    formData2.append('resultType', 'pdf');
    formData2.append('documentVersion', '');
    formData2.append('creator', '');
    formData2.append('createTime', 0);
    formData2.append('title', '定值单执行表单');
    formData2.append('subject', dzdFile.metadata.dzPrefix);
    formData2.append('fileType', '.xlsx');
    formData2.append('file', Buffer.from(responseExcelBuffer), '定值单执行情况.xlsx');

    const {data: pdfStream} = await $axios.post('/convert/excel', formData2, {
      headers: {
        'Content-Length': String(formData2.getLengthSync()),
        ...formData2.getHeaders()
      },
      responseType: 'stream'
    });

    const pdfGridFS = getPdfCacheGridFSBucket();
    const cacheStream = pdfGridFS.openUploadStream(uuidV1() + '.pdf', {
      metadata: {
        temporary: true,
        rawFilename: dzdFile.filename,
        specified: false
      }
    });
    pdfStream.pipe(cacheStream);
    await utils.waitForWriteStream(cacheStream);

    const fileUrl = utils.generateFrontendUrl(ctx, '/resource/download-cached-pdf/' + cacheStream.id);
    const viewerUrl = utils.generateFrontendResourceUrl(ctx, `pdf/web/viewer.html?file=${urlencode(fileUrl)}`);
    ctx.body = {
      succ: true,
      url: viewerUrl,
      type: 'excel',
      title: dzdFile.filename,
      filename: dzdFile.filename
    };
  } catch (e: any) {
    ctx.body = {
      succ: false,
      message: e.message
    };
  }
});

interface IKeyword {
  keyword: string;
  key: string;
  type: string;
  value?: string;
}

async function readPrintTemplateKeywords(): Promise<IKeyword[]> {
  const file = await getTemplateFile();
  const gridFS = getFormPrintTemplateGridFSBucket();
  const stream = gridFS.openDownloadStream(file._id);
  const buffer = await utils.readFile(stream);
  const workbook = xlsx.read(buffer);
  const keywords: string[] = [];
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  for (const cell in worksheet) {
    if (!cell.startsWith('!')) {
      const str = worksheet[cell].w;
      if (/{.+}/ig.test(str)) {
        keywords.push(str);
      }
    }
  }

  const ret: IKeyword[] = [];
  for (const keyword of keywords) {
    const m = /{(.+)}/ig.exec(keyword);
    if (m && m.length > 1) {
      const keywordArray = m[1].split(',');
      if (keywordArray.length === 2) {
        ret.push({
          keyword,
          key: keywordArray[0],
          type: keywordArray[1]
        });
      } else {
        ret.push({
          keyword,
          key: keywordArray[0],
          type: ''
        });
      }
    }
  }
  return ret;
}

export default router;
