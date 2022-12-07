import path from 'path';
import fs from 'fs';
import { Readable, Writable } from 'stream';
import crypto from 'crypto';
import { GridFSBucket, GridFSBucketReadStream, GridFSBucketWriteStream, ObjectId } from 'mongodb';
import FormData from 'form-data';
import Koa from 'koa';
import moment from 'moment';
import Axios, { AxiosInstance } from 'axios';
import { v1 as uuidV1 } from 'uuid';
import { VMScript } from 'vm2';
import sharp from 'sharp';
import conf from '../../configs';
import {
  DzdFile,
  DzdValue,
  getConfigNumberValue,
  getConfigValueByKey,
  getDzdGridFSBucket,
  getHtmlCacheGridFSBucket,
  getPdfCacheGridFSBucket,
  getScriptGridFSBucket,
  getStampGridFSBucket,
  HtmlCache,
  IDzdValue,
  IUserRole,
  PdfCache,
  Stamp,
  toObjectId,
  User,
  UserAuth,
  UserRole
} from '../mongo-schema';
import { scriptExecute } from '../api/xscript';
import VM2ThreadPool from '../controller/threadpool/vm2pool';
import AreaCodeArray, { IArea } from './area';

const bytes = require('bytes');
const pinyin = require('pinyin');
const routes: any[] = [];

export interface KVPair {
  key: string;
  value: string;
  type?: string;
  width?: number;
  height?: number;
}

export interface IFilenameMatch {
  success: boolean;
  message: string;
  normalizedFilename: string;
  dzPrefix: string;
  dzYear: number;
  dzCode: string | number;
  dzCodeN: number;
  prefixSort: string;
  protectType: string;
  substationName: string;
  deviceName: string;
  deviceNameQuery: string;
  voltageLevel: string;
  protectModelNumber: string;
  departmentName?: string;
}

export interface IFileInfo {
  succ: boolean;
  message?: string;
  filename: string;
  rawFilename: string;
  needUpgrade: boolean;
  mediaType: string;
  fileType: string;
  excelVersion?: string;
  fileFormat?: string;
  metadata: any;
}

export interface ISessionRole {
  roles: IUserRole[];
  viewSelfDepartment: boolean;
}

export default {
  calcIZValueBase(basepower: number, voltage: number, digits = 6) {
    return {
      ibase: Number((basepower / 1.732050807568877 / voltage).toFixed(digits)),
      zbase: Number((voltage * voltage / basepower).toFixed(digits))
    };
  },
  getAreaCodes(): IArea[] {
    return AreaCodeArray;
  },
  async getSessionRoles(ctx: Koa.Context): Promise<ISessionRole> {
    const sess = ctx.session;
    if (sess) {
      const roles: IUserRole[] = await UserRole.find({
        role: {
          $in: sess.roles
        }
      }).populate('stateConfigs.state').sort({ index: 1 }).lean();
      let viewSelfDepartment = false;
      const user = await User.findById(toObjectId(sess.user._id)).lean();
      if (user) {
        switch (user.viewSelfDepartment) {
          case 'inherit': {
            viewSelfDepartment = roles.map(x => x.viewSelfDepartmentOnly).every(x => x);
            break;
          }
          case 'yes': {
            viewSelfDepartment = true;
            break;
          }
          default: {
            viewSelfDepartment = false;
            break;
          }
        }
      }
      return {
        roles,
        viewSelfDepartment
      };
    } else {
      return {
        roles: [],
        viewSelfDepartment: false
      };
    }
  },
  generateFrontendUrl(ctx: Koa.Context, url: string): string {
    const app = ctx.cookies.get('app');
    const loc = ctx.cookies.get('loc');
    if (app && loc) {
      return loc + '/api-' + app + url;
    } else {
      return url;
    }
  },
  generateFrontendResourceUrl(ctx: Koa.Context, url: string): string {
    const loc = ctx.cookies.get('loc');
    if (loc) {
      return loc + conf.service.routerBase + url;
    } else {
      const prefix = (ctx.request.origin || (conf.service.prefix + conf.service.host + ':' + conf.service.port)) + conf.service.routerBase;
      return prefix + url;
    }
  },
  async getAllowFileExtRegex(): Promise<RegExp> {
    const regex = await getConfigValueByKey('allow-upload-filename-regex', '\\.(docx|doc|xls|xlsx|pdf|html?|jpe?g|png|gif)$');
    return new RegExp(regex, 'i');
  },
  async getAllowFileExtMessage(): Promise<string> {
    return await getConfigValueByKey('allow-upload-filename-regex', '只允许上传doc, docx, xls, xlsx, pdf, html, jpeg, png, gif类型的文件');
  },
  async getAdminUserCount() {
    const auths: any[] = await UserAuth.find({
      auth: {
        $in: ['admin', 'master']
      }
    })
      .populate({
        path: 'groups',
        populate: {
          path: 'users',
          select: 'status'
        }
      })
      .lean();
    let count = 0;
    for (const auth of auths) {
      count += auth.groups
        .map((x: any) => x.users.filter((y: any) => y.status === 'enabled').length)
        .reduce((total: number, num: number) => total + num, 0);
    }
    return count;
  },
  async processKVPair(kvArray: KVPair[], userId?: string): Promise<KVPair[]> {
    const stamps = [];
    if (userId) {
      stamps.push(...await Stamp.find({
        'metadata.keyword': {
          $in: kvArray.map((x: any) => x.key)
        },
        'metadata.user': toObjectId(userId)
      }).sort({ uploadDate: -1 }).lean());
    } else {
      stamps.push(...await Stamp.find({
        'metadata.keyword': {
          $in: kvArray.map((x: any) => x.key)
        }
      }).sort({ uploadDate: -1 }).lean());
    }
    if (stamps.length > 0) {
      for (const s of stamps) {
        const found = kvArray.find((x: any) => x.key === s.metadata.keyword);
        if (found && found.type !== 'image') {
          const stampGridFS = getStampGridFSBucket();
          const stream = stampGridFS.openDownloadStream(s._id);
          const stampData = await this.readFile(stream);
          const resultBuffer = await sharp(stampData).resize(s.metadata.targetWidth, s.metadata.targetHeight, {
            fit: 'fill'
          }).toBuffer();
          const b64 = resultBuffer.toString('base64');
          const result = `data:${s.metadata._contentType};base64,${b64}`;
          found.type = 'image';
          found.value = result;
          found.width = s.metadata.targetWidth;
          found.height = s.metadata.targetHeight;
        }
      }
    }
    return kvArray;
  },
  async detectFileInfo(fileData: Buffer, filename: string, requireMetadata = true): Promise<IFileInfo> {
    const $axios = this.getBackendAxios();
    const formData = new FormData();
    formData.append('file', fileData, filename);
    formData.append('requireMetadata', requireMetadata ? 'true' : 'false');
    const { data } = await $axios.post('/detect-file-info', formData, {
      headers: {
        'Content-Length': String(formData.getLengthSync()),
        ...formData.getHeaders()
      }
    });
    return data;
  },
  async containsImage(fileData: Buffer, filename: string): Promise<boolean> {
    const $axios = this.getBackendAxios();
    const formData = new FormData();
    formData.append('file', fileData, filename);
    const { data } = await $axios.post('/detect-file-images', formData, {
      headers: {
        'Content-Length': String(formData.getLengthSync()),
        ...formData.getHeaders()
      }
    });
    return (data.succ && data.imageCount > 0);
  },
  async getSheets(dzdFileId: string) {
    const $axios = this.getBackendAxios();
    const dzdFile = await DzdFile.findById(toObjectId(dzdFileId)).lean();
    if (dzdFile) {
      if (/\.xlsx?$/.test(dzdFile.metadata.fileType || '')) {
        const gridFS = getDzdGridFSBucket();
        const stream = gridFS.openDownloadStream(dzdFile._id);
        const buffer = await this.readFile(stream);
        const formData = new FormData();
        formData.append('documentVersion', dzdFile.metadata.documentVersion || '');
        formData.append('file', buffer, dzdFile.filename);
        const { data } = await $axios.post('/excel/sheets', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          }
        });
        if (data.succ) {
          if (data.sheets.length > 0) {
            let autoDropSheetCount = await getConfigNumberValue({
              key: 'auto-drop-sheet-count',
              min: 0,
              max: 1000,
              defaultValue: 0
            });
            while (data.sheets.length > 1 && autoDropSheetCount-- > 0) {
              data.sheets.pop();
            }
            const autoDropSheetRegex = await getConfigValueByKey('auto-drop-sheet-regex', '');
            if (autoDropSheetRegex) {
              const regex = new RegExp(autoDropSheetRegex, 'i');
              data.sheets = data.sheets.filter((x: any) => !regex.test(x.name));
            }
          }
          return {
            succ: true,
            filename: dzdFile.filename,
            dzPrefix: dzdFile.metadata.dzPrefix,
            sheets: data.sheets
          };
        } else {
          return {
            succ: false,
            message: data.message
          };
        }
      } else {
        if (!/\.(docx?|pdf|html?)$/.test(dzdFile.metadata.fileType || '')) {
          return {
            succ: false,
            message: '文件' + dzdFile.filename + '无法被转换为html进行比对'
          };
        } else {
          return {
            succ: true,
            filename: dzdFile.filename,
            dzPrefix: dzdFile.metadata.dzPrefix,
            sheets: []
          };
        }
      }
    } else {
      return {
        succ: false,
        message: '文件不存在'
      };
    }
  },
  async getFileMd5(fileId: ObjectId) {
    const fileStream = getDzdGridFSBucket().openDownloadStream(fileId);
    const fileData = await this.readFile(fileStream);
    return crypto.createHash('md5').update(fileData).digest('hex');
  },
  async getSheetHtml(dzdFileId: string, sheetIndex: string | number) {
    try {
      const fileId = toObjectId(dzdFileId);
      const sindex = Number(sheetIndex);
      const file = await DzdFile.findById(fileId).lean();
      if (!file) {
        return {
          succ: false,
          code: 400,
          message: '文件id[' + dzdFileId + ']不存在'
        };
      }

      const fileStream = getDzdGridFSBucket().openDownloadStream(fileId);
      const fileData = await this.readFile(fileStream);
      const fileMd5 = crypto.createHash('md5').update(fileData).digest('hex');

      if (!/(\.xlsx?|\.docx?|\.pdf|\.html?)$/ig.test(file.metadata.fileType || file.filename)) {
        return {
          succ: false,
          code: 400,
          message: '文件[' + file.filename + ']无法转换html'
        };
      }

      const htmlGridFS = getHtmlCacheGridFSBucket();
      let html = '';
      const htmlFile = await HtmlCache.findOne({
        'metadata.originalFileId': file._id,
        'metadata.sheetIndex': sindex
      }).lean();
      if (htmlFile) {
        if (htmlFile.metadata.originalFileMd5 === fileMd5) {
          const buffer = await this.readFile(htmlGridFS.openDownloadStream(htmlFile._id));
          html = buffer.toString();
          console.log('html缓存命中, 大小: ' + this.getFriendlyLength(htmlFile.length));
        } else {
          await this.deleteGridFile(htmlGridFS, htmlFile._id);
        }
      }

      if (!html) {
        html = await this.convertDzdFileToHtml(dzdFileId, sindex);
        if (html) {
          const s = htmlGridFS.openUploadStream(uuidV1() + '.html', {
            contentType: 'text/html',
            metadata: {
              _contentType: 'text/html',
              temporary: false,
              sheetIndex: sindex,
              rawFilename: file.filename,
              originalFileId: file._id,
              originalFileMd5: fileMd5
            }
          });
          s.end(Buffer.from(String(html)));
          await this.waitForWriteStream(s);
        }
      }

      if (html) {
        return {
          succ: true,
          html
        };
      } else {
        return {
          succ: false,
          code: 400,
          message: '文件[' + file.filename + ']转换失败'
        };
      }
    } catch (err: any) {
      return {
        succ: false,
        code: 500,
        // @ts-ignore
        message: err.message
      };
    }
  },
  async convertTempFileToHtml(fileData: Buffer, filename: string, documentVersion: string): Promise<string> {
    const $axios = this.getBackendAxios();
    const clearKeywordRegex = await getConfigValueByKey('keyword-match-regex', '');
    const showHiddenRows = await getConfigValueByKey('show-hidden-rows', 'true');
    const showHiddenCols = await getConfigValueByKey('show-hidden-cols', 'true');
    const extMatch = filename.match(/(\.\w+)$/i);
    if (!extMatch || extMatch.length < 2) {
      return '文件扩展名不合法';
    }
    try {
      if (/\.xlsx?$/i.test(filename)) {
        const formData = new FormData();
        formData.append('resultType', 'html');
        formData.append('documentVersion', documentVersion);
        formData.append('fileType', extMatch[1].toLowerCase());
        formData.append('file', fileData, filename);
        formData.append('sheetIndex', 0);
        formData.append('pageSetupArray', '[]');
        formData.append('showHiddenRows', showHiddenRows);
        formData.append('showHiddenCols', showHiddenCols);
        formData.append('autoDropSheetCount', 0);
        formData.append('autoDropSheetRegex', '');
        formData.append('ignoreHidden', 'false');
        formData.append('clearKeywordRegex', clearKeywordRegex);
        formData.append('creator', '');
        formData.append('createTime', 0);
        formData.append('title', '继保定值单');
        formData.append('subject', '');
        const { data } = await $axios.post('/convert/excel', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          },
          responseType: 'text'
        });
        return data;
      } else if (/\.docx?$/i.test(filename)) {
        const formData = new FormData();
        formData.append('resultType', 'html');
        formData.append('fileType', extMatch[1].toLowerCase());
        formData.append('file', fileData, filename);
        formData.append('documentVersion', documentVersion);
        formData.append('creator', '');
        formData.append('createTime', 0);
        formData.append('title', '');
        formData.append('subject', '');
        const { data } = await $axios.post('/convert/word', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          },
          responseType: 'text'
        });
        return data;
      } else {
        return '不支持的文件类型: ' + extMatch[1];
      }
    } catch (err: any) {
      console.error(err);
      // @ts-ignore
      return '转换文档时出现错误: ' + e.message;
    }
  },
  async convertDzdFileToHtml(fileId: string, sheetIndex = 0): Promise<string> {
    const file = await DzdFile.findById(toObjectId(fileId)).lean();
    if (!file) {
      return '';
    }

    const showHiddenRows = await getConfigValueByKey('show-hidden-rows', 'true');
    const showHiddenCols = await getConfigValueByKey('show-hidden-cols', 'true');
    const gridFS = getDzdGridFSBucket();
    const fileData = await this.readFile(gridFS.openDownloadStream(file._id));
    if (/(\.x?html?$)/ig.test(file.metadata.fileType || file.filename)) {
      return fileData.toString();
    }

    if (/(\.xlsx?|\.docx?)$/ig.test(file.metadata.fileType || file.filename)) {
      try {
        const $axios = this.getBackendAxios();
        const clearKeywordRegex = await getConfigValueByKey('keyword-match-regex', '');
        const formData = new FormData();
        formData.append('resultType', 'html');
        formData.append('fileType', file.metadata.fileType);
        formData.append('file', fileData, file.filename);
        formData.append('sheetIndex', sheetIndex);
        formData.append('pageSetupArray', '[]');
        formData.append('showHiddenRows', showHiddenRows);
        formData.append('showHiddenCols', showHiddenCols);
        formData.append('autoDropSheetCount', 0);
        formData.append('autoDropSheetRegex', '');
        formData.append('ignoreHidden', 'false');
        formData.append('clearKeywordRegex', clearKeywordRegex);
        formData.append('documentVersion', file.metadata.documentVersion || '');
        if (file.metadata.creator) {
          const user = await User.findById(file.metadata.creator).lean();
          formData.append('creator', user ? user.name : '');
        } else {
          formData.append('creator', '');
        }
        if (file.metadata.startTime) {
          formData.append('createTime', moment(file.metadata.startTime).toDate().getTime());
        } else {
          formData.append('createTime', 0);
        }
        formData.append('title', '继保定值单');
        formData.append('subject', file.metadata.dzPrefix);
        // @ts-ignore
        const url = file.metadata.fileType.includes('.xls') ? '/convert/excel' : '/convert/word';
        const { data } = await $axios.post(url, formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          },
          responseType: 'text'
        });

        return data;
      } catch (err: any) {
        return await this.convertToHtmlUsePdfService(fileId);
      }
    } else if (/\.pdf$/ig.test(file.metadata.fileType || file.filename)) {
      const $axios = this.getBackendAxios();
      const formData = new FormData();
      formData.append('file', fileData, file.filename);
      const { data } = await $axios.post('/convert/pdf-to-html', formData, {
        headers: {
          'Content-Length': String(formData.getLengthSync()),
          ...formData.getHeaders()
        },
        responseType: 'text'
      });
      return data;
    }

    return '';
  },
  async convertToHtmlUsePdfService(fileId: string): Promise<string> {
    const file = await DzdFile.findById(toObjectId(fileId));
    const gridFS = getDzdGridFSBucket();
    const fileData = await this.readFile(gridFS.openDownloadStream(toObjectId(fileId)));
    const $axios = this.getPDFServiceAxios();
    const formData = new FormData();
    formData.append('force', 'true');
    formData.append('resultType', 'html');
    formData.append('final', 'true');
    // @ts-ignore
    formData.append('documentVersion', file.metadata.documentVersion || '');
    // @ts-ignore
    formData.append('file', fileData, file.filename);
    const { data } = await $axios.post('/convert', formData, {
      headers: {
        'Content-Length': String(formData.getLengthSync()),
        ...formData.getHeaders()
      }
    });
    return data.html;
  },
  async convertToPdfUsePdfService(fileId: string): Promise<Buffer> {
    const $axios = this.getPDFServiceAxios();
    const file = await DzdFile.findById(toObjectId(fileId));
    const fileStream = getDzdGridFSBucket().openDownloadStream(toObjectId(fileId));
    const fileData = await this.readFile(fileStream);
    const fileMd5 = crypto.createHash('md5').update(fileData).digest('hex');
    const { data } = await $axios.post('/pdf', {
      id: fileId,
      url: `${conf.service.prefix}${conf.service.host}:${conf.service.port}/sys/get-dzd-file/${fileId}`,
      // @ts-ignore
      name: file.filename.trim(),
      // @ts-ignore
      md5: fileMd5,
      // @ts-ignore
      size: file.length,
      force: conf.pdfc.force,
      final: true,
      // @ts-ignore
      fvmap: await this.generateFormulaMap(fileId, file.filename)
    }, {
      responseType: 'arraybuffer'
    });

    return Buffer.from(data);
  },
  async getFilePdf(fileId: string): Promise<Buffer | any> {
    try {
      const file = await DzdFile.findById(toObjectId(fileId)).lean();
      if (!file) {
        return {
          succ: false,
          message: '文件[' + fileId + ']不存在',
          code: 400
        };
      }
      const fileStream = getDzdGridFSBucket().openDownloadStream(toObjectId(fileId));
      const fileData = await this.readFile(fileStream);
      const fileMd5 = crypto.createHash('md5').update(fileData).digest('hex');
      const pdfGridFS = getPdfCacheGridFSBucket();
      let pdfBuffer = null;
      const usePdfCache = await getConfigValueByKey('use-pdf-cache', 'false');
      if (usePdfCache === 'true') {
        const pdfFile = await PdfCache.findOne({
          'metadata.originalFileId': file._id
        }).lean();
        if (pdfFile) {
          if (pdfFile.metadata.originalFileMd5 === fileMd5) {
            pdfBuffer = await this.readFile(pdfGridFS.openDownloadStream(pdfFile._id));
            console.log('pdf缓存命中, 大小: ' + this.getFriendlyLength(pdfBuffer.length));
          } else {
            await this.deleteGridFile(pdfGridFS, pdfFile._id);
          }
        }

        if (!pdfBuffer) {
          pdfBuffer = await this.convertDzdFileToPdf(fileId);
          if (pdfBuffer.length > 0) {
            const s = pdfGridFS.openUploadStream(uuidV1() + '.pdf', {
              contentType: 'application/pdf',
              metadata: {
                _contentType: 'application/pdf',
                temporary: false,
                rawFilename: file.filename,
                originalFileId: file._id,
                originalFileMd5: fileMd5,
                specified: false
              }
            });
            s.end(pdfBuffer);
            await this.waitForWriteStream(s);
          }
        }
      } else {
        const pdfFile = await PdfCache.findOne({
          'metadata.originalFileId': file._id,
          'metadata.originalFileMd5': fileMd5,
          'metadata.specified': true
        }).lean();
        if (pdfFile) {
          pdfBuffer = await this.readFile(pdfGridFS.openDownloadStream(pdfFile._id));
          console.log('pdf缓存命中, 大小: ' + this.getFriendlyLength(pdfBuffer.length));
        } else {
          pdfBuffer = await this.convertDzdFileToPdf(fileId);
        }
      }

      if (pdfBuffer) {
        return {
          succ: true,
          buffer: pdfBuffer
        };
      } else {
        return {
          succ: false,
          code: 400,
          message: '文件[' + file.filename + ']转换失败'
        };
      }
    } catch (err: any) {
      return {
        succ: false,
        code: 500,
        // @ts-ignore
        message: e.message
      };
    }
  },
  async dropExcelFormula(fileData: Buffer, filename: string): Promise<Buffer> {
      const $pdfAxios = this.getPDFServiceAxios();
      const formData = new FormData();
      formData.append('file', fileData, filename);
      const { data } = await $pdfAxios.post('/drop-formula', formData, {
        headers: {
          'Content-Length': String(formData.getLengthSync()),
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      });
      return data;
  },
  async upgradeOfficeFile(fileData: Buffer, filename: string): Promise<Buffer> {
    const $axios = this.getBackendAxios();
    const formData = new FormData();
    formData.append('file', fileData, filename);
    const { data } = await $axios.post('/upgrade-file', formData, {
      headers: {
        'Content-Length': String(formData.getLengthSync()),
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer'
    });
    return Buffer.from(data);
  },
  async extractMetadata(fileId: string): Promise<IDzdValue | null> {
    const gridFS = getDzdGridFSBucket();
    const file = await DzdFile.findById(toObjectId(fileId)).lean();
    if (!file) {
      return null;
    }
    try {
      const fileData = await this.readFile(gridFS.openDownloadStream(file._id));
      const $axios = this.getBackendAxios();
      const formData = new FormData();
      formData.append('file', fileData, file.filename);
      const { data } = await $axios.post('/extract-metadata', formData, {
        headers: {
          'Content-Length': String(formData.getLengthSync()),
          ...formData.getHeaders()
        }
      });

      if (data.succ) {
        await DzdValue.deleteMany({
          file: file._id
        });
        return await DzdValue.create({
          metadata: data.metadata || {},
          values: data.values || [],
          remarks: data.remarks || [],
          deprecateNumber: data.deprecateNumber,
          generateTime: data.generateTime ? new Date(Number(data.generateTime)) : new Date(),
          templateInfoUrl: data.templateInfoUrl,
          file: file._id,
          modifyList: []
        });
      } else {
        console.warn('获取文件元数据失败: ' + data.message);
        return null;
      }
    } catch (err: any) {
      console.error(err);
      return null;
    }
  },
  async convertDzdFileToPdf(fileId: string): Promise<Buffer> {
    const convertUseVM = await getConfigValueByKey('convert-pdf-use-vm', 'false');
    if (convertUseVM === 'true') {
      return await this.convertToPdfUsePdfService(fileId);
    }
    const file = await DzdFile.findById(toObjectId(fileId)).lean();
    if (!file) {
      return Buffer.from('');
    }

    const gridFS = getDzdGridFSBucket();
    const fileData = await this.readFile(gridFS.openDownloadStream(file._id));
    const $axios = this.getBackendAxios();
    if (/(\.xlsx?)$/ig.test(file.metadata.fileType || file.filename)) {
      const autoDropSheetCount = await getConfigNumberValue({
        key: 'auto-drop-sheet-count',
        min: 0,
        max: 1000,
        defaultValue: 0
      });

      const autoDropSheetRegex = await getConfigValueByKey('auto-drop-sheet-regex', '');
      const clearKeywordRegex = await getConfigValueByKey('keyword-match-regex', '');
      const showHiddenRows = await getConfigValueByKey('show-hidden-rows', 'true');
      const showHiddenCols = await getConfigValueByKey('show-hidden-cols', 'true');

      const formData = new FormData();
      formData.append('sheetIndex', 0);
      formData.append('pageSetupArray', '[]');
      formData.append('autoDropSheetCount', autoDropSheetCount);
      formData.append('autoDropSheetRegex', autoDropSheetRegex);
      formData.append('showHiddenRows', showHiddenRows);
      formData.append('showHiddenCols', showHiddenCols);
      formData.append('ignoreHidden', 'false');
      formData.append('clearKeywordRegex', clearKeywordRegex);
      formData.append('resultType', 'pdf');
      formData.append('documentVersion', file.metadata.documentVersion || '');
      if (file.metadata.creator) {
        const user = await User.findById(file.metadata.creator).lean();
        formData.append('creator', user ? user.name : '');
      } else {
        formData.append('creator', '');
      }
      if (file.metadata.startTime) {
        formData.append('createTime', moment(file.metadata.startTime).toDate().getTime());
      } else {
        formData.append('createTime', 0);
      }
      formData.append('title', '继保定值单');
      formData.append('subject', file.metadata.dzPrefix);
      formData.append('fileType', file.metadata.fileType);
      formData.append('file', fileData, file.filename);
      try {
        const { data } = await $axios.post('/convert/excel', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          },
          responseType: 'arraybuffer'
        });

        return Buffer.from(data);
      } catch (err: any) {
        return await this.convertToPdfUsePdfService(fileId);
      }
    } else if (/(\.docx?)$/ig.test(file.metadata.fileType || file.filename)) {
      // let sourceData = fileData;
      // if (file.metadata.fileType === '.doc') {
      //   const $pdfAxios = this.getPDFServiceAxios();
      //   const formData = new FormData();
      //   formData.append('inputType', 'word');
      //   formData.append('compatibilityMode', 'wdCurrent');
      //   formData.append('file', fileData, file.filename);
      //   const {data} = await $pdfAxios.post('/upgrade', formData, {
      //     headers: {
      //       'Content-Length': formData.getLengthSync(),
      //       ...formData.getHeaders()
      //     },
      //     responseType: 'arraybuffer'
      //   });
      //   sourceData = Buffer.from(data);
      // }
      const formData = new FormData();
      formData.append('resultType', 'pdf');
      formData.append('fileType', file.metadata.fileType);
      formData.append('file', fileData, file.filename);
      formData.append('documentVersion', file.metadata.documentVersion || '');
      if (file.metadata.creator) {
        const user = await User.findById(file.metadata.creator).lean();
        formData.append('creator', user ? user.name : '');
      } else {
        formData.append('creator', '');
      }
      if (file.metadata.startTime) {
        formData.append('createTime', moment(file.metadata.startTime).toDate().getTime());
      } else {
        formData.append('createTime', 0);
      }
      formData.append('title', '继保定值单');
      formData.append('subject', file.metadata.dzPrefix);
      try {
        const { data } = await $axios.post('/convert/word', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          },
          responseType: 'arraybuffer'
        });

        return Buffer.from(data);
      } catch (err: any) {
        return await this.convertToPdfUsePdfService(fileId);
      }
    } else {
      return Buffer.from('');
    }
  },
  getPDFServiceAxios(): AxiosInstance {
    const baseURL = `${conf.pdfc.prefix}${conf.pdfc.host}:${conf.pdfc.port}`;
    const axios = Axios.create({
      baseURL,
      withCredentials: true,
      maxBodyLength: bytes.parse('256MB'),
      maxContentLength: bytes.parse('512MB')
    });
    axios.interceptors.request.use(function(config) {
      if (config.headers) {
        config.headers.Pragma = 'no-cache';
        config.headers.Expires = '0';
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      }
      if (!config.url?.endsWith('ping')) {
        console.log('请求调用pdf服务axios.' + config.method + '(' + config.url + ')');
      }
      return config;
    }, function(error) {
      return Promise.reject(error);
    });
    axios.interceptors.response.use(function(response) {
      if (!response.config.url?.endsWith('ping')) {
        console.log('pdf服务axios.' + response.config.method + '(' + response.config.url + ')返回码: ' + response.status);
      }
      return response;
    }, function(error) {
      console.error(error);
      console.warn('虚拟机pdf后端axios调用错误, 错误代码: ' + error.message);
      console.error('请查看虚拟机DzdConv运行日志');
      return Promise.reject(error);
    });
    return axios;
  },
  getBackendAxios(): AxiosInstance {
    const baseURL = `${conf.backend.prefix}${conf.backend.host}:${conf.backend.port}${conf.backend.path}`;
    const axios = Axios.create({
      baseURL,
      withCredentials: true,
      maxBodyLength: bytes.parse('256MB'),
      maxContentLength: bytes.parse('512MB')
    });
    axios.interceptors.request.use(function(config) {
      if (config.headers) {
        config.headers.Pragma = 'no-cache';
        config.headers.Expires = '0';
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      }
      console.log('请求调用xbac后端axios.' + config.method + '(' + config.url + ')');
      return config;
    }, function(error) {
      return Promise.reject(error);
    });
    axios.interceptors.response.use(function(response) {
      console.log('xbac后端axios.' + response.config.method + '(' + response.config.url + ')返回码: ' + response.status);
      return response;
    }, function(error) {
      console.error(error);
      console.warn('xbac后端axios调用错误, 错误信息: ' + error.message);
      console.error('请查看服务器xbac运行日志');
      return Promise.reject(error);
    });
    return axios;
  },
  async generateFormulaMap(fileId: string, filename: string) {
    const fvmap = [];
    try {
      if (filename.match(/.xlsx$/ig)) {
        const gridfs = getDzdGridFSBucket();
        const fileData = await this.readFile(gridfs.openDownloadStream(toObjectId(fileId)));
        const formData = new FormData();
        formData.append('file', fileData, filename);
        const $axios = this.getBackendAxios();
        const { data } = await $axios.post('/detect-and-calc-formula', formData, {
          headers: {
            'Content-Length': String(formData.getLengthSync()),
            ...formData.getHeaders()
          }
        });
        if (data.succ) {
          fvmap.push(...data.formulas);
        }
      }
    } catch (err: any) {
      console.error(err);
    }

    return fvmap;
  },
  deleteGridFile(bucket: GridFSBucket, fileId: ObjectId) {
    return new Promise(resolve => {
      bucket.delete(fileId, err => {
        if (err) {
          resolve({
            succ: false,
            message: err.message
          });
        } else {
          resolve({
            succ: true
          });
        }
      });
    });
  },
  readStream(stream: Readable): Promise<Buffer> {
    return new Promise(resolve => {
      const dataArray: any[] = [];
      stream.on('data', (data) => {
        dataArray.push(data);
      });
      stream.on('end', () => {
        resolve(Buffer.concat(dataArray));
      });
    });
  },
  waitForWriteStream(stream: GridFSBucketWriteStream | Writable) {
    return new Promise((resolve, reject) => {
      stream.once('finish', () => {
        resolve(stream);
      });
      stream.on('error', err => {
        reject(err);
      });
    });
  },
  getBTime(start: number) {
    const between = new Date().getTime() - start;
    const days = Math.floor(between / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(between / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(between / (1000 * 60));
        if (minutes === 0) {
          return '现在';
        } else {
          return minutes + '分钟前';
        }
      } else {
        return hours + '小时前';
      }
    } else {
      return days + '天前';
    }
  },
  getClientIP(request: Koa.Request): string {
    const ip = request.ip.match(/\d+.\d+.\d+.\d+/);
    if (ip) {
      return ip.join('.');
    } else {
      return request.ip;
    }
  },
  getMetaRoutes() {
    try {
      if (routes.length === 0) {
        const file = path.join(__dirname, 'routes.json');
        if (fs.existsSync(file) && fs.statSync(file).size > 32) {
          const array: any[] = require('./routes.json');
          routes.push(...array.filter((x: any) => !x.hide));
        } else {
          console.warn('routes.json不存在或大小不正常,已返回默认路由表');
          routes.push(...defaultRoutes.filter((x: any) => !x.hide));
        }
      }
    } catch (err: any) {
      console.error('获取routes.json失败', err);
      routes.push(...defaultRoutes.filter((x: any) => !x.hide));
    }

    return routes;
  },
  numberCompare(x: string | number | null | undefined, y: string | number | null | undefined) {
    if (!x) {
      x = '0';
    }
    if (!y) {
      y = '0';
    }
    return Number(String(x).replace(/[^0-9.]/ig, '')) - Number(String(y).replace(/[^0-9.]/ig, ''));
  },
  pinyinCompare(x: string | null | undefined, y: string | null | undefined) {
    if (!x) {
      x = '';
    }
    if (!y) {
      y = '';
    }
    return pinyin(x, { style: pinyin.STYLE_NORMAL }).join('').localeCompare(pinyin(y, { style: pinyin.STYLE_NORMAL }).join(''));
  },
  getPinyin(s: string, join = '') {
    const result: string[] = [];
    const array: string[][] = pinyin(s, { style: pinyin.STYLE_NORMAL });
    for (const subArray of array) {
      if (subArray.length) {
        const tmp = subArray[0];
        if (tmp && tmp.length > 0) {
          result.push(tmp);
        }
      }
    }

    return result.join(join);
  },
  getFirstLetters(s: string, join = ''): string {
    const result: string[] = [];
    const array: string[][] = pinyin(s, { style: pinyin.STYLE_FIRST_LETTER });
    for (const subArray of array) {
      if (subArray.length) {
        const tmp = subArray[0];
        if (tmp && tmp.length > 0) {
          result.push(tmp.substr(0, 1));
        }
      }
    }

    return String(result.join(join));
  },
  getFirstLettersWithHeter(s: string): string[] {
    const array: string[][] = pinyin(s, { style: pinyin.STYLE_FIRST_LETTER, heteronym: true });

    function enumHeter(prefix: string, remainArrays: string[][]): string[] {
      const result: string[] = [];
      for (let i = 0; i < remainArrays.length; ++i) {
        const firstLetterArray: string[] = remainArrays[i];
        if (firstLetterArray.length > 1) {
          for (const firstLetter of firstLetterArray) {
            const subs = enumHeter(prefix + firstLetter, remainArrays.slice(i + 1));
            result.push(...subs);
          }
          break;
        } else {
          prefix += firstLetterArray[0];
        }
      }
      if (result.length === 0) {
        result.push(prefix);
      }
      return result;
    }

    return enumHeter('', array);
  },
  normalizeFilename(filename: string | undefined | null): string {
    if (!filename) {
      return '';
    }

    const raw = path.basename(filename).trim();
    const index = raw.indexOf('_');
    if (index > 0) {
      // 替换特殊字符【〖〔﹝（《 和 】〗〕﹞）》为(和)
      const prefix = raw.substring(0, index)
        .replace('—', '-')
        .replace(/[\s\t]+/g, '')
        .replace(/[\u3010\u3016\u3014\uFE5D\uFF08\u300A]/g, '(')
        .replace(/[\u3011\u3017\u3015\uFE5E\uFF09\u300B]/g, ')');
      const content = raw.substr(index);
      const matches = prefix.match(/^(.*?)\((.+)\)(.*)$/);
      if (matches && matches.length === 4) {
        return `${matches[1].replace(/\s*/g, '')}(${matches[2].replace(/\s*/g, '')})${matches[3].replace(/\s*/g, '')}${content}`;
      } else {
        return prefix + content;
      }
    } else {
      return '';
    }
  },
  padding(num: string, length: number) {
    for (let len = num.length; len < length; len = num.length) {
      num = '0' + num;
    }
    return num;
  },
  async matchFilename(filename: string): Promise<IFilenameMatch> {
    const result: IFilenameMatch = {
      success: false,
      message: '',
      normalizedFilename: '',
      dzPrefix: '',
      dzYear: 0,
      dzCode: 0,
      dzCodeN: 0,
      prefixSort: '',
      protectType: '',
      substationName: '',
      deviceName: '',
      deviceNameQuery: '',
      voltageLevel: '',
      protectModelNumber: ''
    };
    try {
      const scriptName = await getConfigValueByKey('upload-filename-script-name', '');
      if (scriptName) {
        console.log('调用脚本[' + scriptName + ']解析文件名');
        const gridFS = getScriptGridFSBucket();
        const stream = gridFS.openDownloadStreamByName(scriptName);
        const jsPath = VM2ThreadPool.generateTempScriptPath();
        const buffer = await this.readFile(stream);
        const code = new VMScript(VM2ThreadPool.generateVM2Script(buffer.toString())).code;
        fs.writeFileSync(jsPath, code, { encoding: 'utf8' });
        const scriptFile = jsPath;
        const executeResult = await scriptExecute(uuidV1(), {}, { scriptFile, param: { filename } });
        console.log('解析文件名完成，结果：');
        console.log(executeResult);
        // @ts-ignore
        if (executeResult.succ) {
          for (const key in result) {
            // @ts-ignore
            result[key] = executeResult.result[key];
          }
          return result;
        } else {
          result.success = false;
          // @ts-ignore
          result.message = executeResult.message;
          return result;
        }
      }
      const normalizedFilename = this.normalizeFilename(filename);
      if (!normalizedFilename) {
        result.success = false;
        result.message = '文件名应该以"X调继(xxxx-xxxx)号_保护类型_厂站名称_设备名称_电压等级_保护型号.xxxx"为模板';
        return result;
      } else {
        result.normalizedFilename = normalizedFilename;
      }

      let matches;
      const m = normalizedFilename.match(/\((.+)\)/);
      if (m && m.length === 2 && m[1].includes('-')) {
        matches = normalizedFilename.match(/^.*\((\d*)-?(.+)\).*_(.*?)_(.*?)_(.*?)_(.*?)_(.*?)(\.[^.]+$)/i);
      } else {
        matches = normalizedFilename.match(/^.*\((\d*)(.*)\).*_(.*?)_(.*?)_(.*?)_(.*?)_(.*?)(\.[^.]+$)/i);
      }

      if (matches && matches.length === 9) {
        const dzCodeN = Number(matches[2].replace(/[^0-9]/ig, ''));
        result.success = true;
        result.dzPrefix = normalizedFilename.split('_')[0];
        result.dzYear = Number(matches[1]);
        result.dzCode = matches[2].trim();
        // eslint-disable-next-line use-isnan
        result.dzCodeN = dzCodeN === Number.NaN || dzCodeN > 9999 ? 9999 : dzCodeN;
        result.prefixSort = `${result.dzYear}-${this.padding(String(result.dzCodeN), 4)}`;
        result.protectType = matches[3].trim();
        result.substationName = matches[4].trim();
        result.deviceName = matches[5].trim();
        result.deviceNameQuery = result.protectType.includes('线路') ? this.normalizeDeviceName(result.deviceName) : result.deviceName;
        result.voltageLevel = matches[6].trim();
        result.protectModelNumber = matches[7].trim();
      } else {
        result.success = false;
        result.message = '文件名应该以"X调继(xxxx-xxxx)号_保护类型_厂站名称_设备名称_电压等级_保护型号.xxxx"为模板';
      }

      return result;
    } catch (err: any) {
      result.success = false;
      // @ts-ignore
      result.message = err.message;
      return result;
    }
  },
  writeTo(outputStream: fs.WriteStream | GridFSBucketWriteStream, data: any) {
    return new Promise((resolve, reject) => {
      outputStream.write(data);
      outputStream.end();
      outputStream.on('finish', () => {
        resolve('');
      });

      outputStream.on('error', (err) => {
        console.error(err);
        reject(err);
      });
    });
  },
  shuffle(arr: any[]) {
    const len = arr.length;
    for (let i = 0; i < len - 1; i++) {
      const index = parseInt(String(Math.random() * (len - i)));
      const temp = arr[index];
      arr[index] = arr[len - i - 1];
      arr[len - i - 1] = temp;
    }
    return arr;
  },
  // eslint-disable-next-line no-undef
  readFile(readerStream: Readable | fs.ReadStream | GridFSBucketReadStream | NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const data: any[] = [];
      readerStream.on('data', function(chunk: any) {
        data.push(chunk);
      });

      readerStream.on('error', function(err: any) {
        reject(err);
      });

      readerStream.on('end', function() {
        resolve(Buffer.concat(data));
      });
    });
  },
  normalizeDeviceName(rawName: string): string {
    return rawName.replace('一号线', '一线')
      .replace('二号线', '二线')
      .replace('三号线', '三线')
      .replace('四号线', '四线')
      .replace('五号线', '五线')
      .replace('六号线', '六线')
      .replace('七号线', '七线')
      .replace('八号线', '八线')
      .replace('九号线', '九线')
      .replace('十号线', '十线')
      .replace('1号线', '一线')
      .replace('2号线', '二线')
      .replace('3号线', '三线')
      .replace('4号线', '四线')
      .replace('5号线', '五线')
      .replace('6号线', '六线')
      .replace('7号线', '七线')
      .replace('8号线', '八线')
      .replace('9号线', '九线')
      .replace('10号线', '十线')
      .replace('1线', '一线')
      .replace('2线', '二线')
      .replace('3线', '三线')
      .replace('4线', '四线')
      .replace('5线', '五线')
      .replace('6线', '六线')
      .replace('7线', '七线')
      .replace('8线', '八线')
      .replace('9线', '九线')
      .replace('10线', '十线');
  },
  getFriendlyLength(size: number | string): string {
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
  },
  parseDateTime1(str: string | undefined): Date | undefined {
    if (!str) {
      return undefined;
    }
    const matches = str.match(/Date\((\d+)\+.+\)/);
    if (matches && matches.length === 2) {
      const tick = Number(matches[1]);
      return tick === 946656000000 ? undefined : new Date(tick);
    }
  },
  formatDateTime(date = new Date(), fmt = 'yyyy-MM-dd hh:mm:ss') {
    const o: any = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    };

    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        const v = o[k];
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (v) : (('00' + v).substr(('' + v).length)));
      }
    }

    return fmt;
  }
};

const defaultRoutes = [{
  name: 'index',
  path: '/',
  index: 1,
  label: '首页',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: ['audit', 'launch', 'repeal', 'browse']
}, {
  name: 'index2',
  path: '/index2',
  index: 2,
  label: '首页2',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'index3',
  path: '/index3',
  index: 3,
  label: '首页3',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'task-file',
  path: '/task/file',
  index: 5,
  label: '上传文件',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'task',
  path: '/task',
  index: 6,
  label: '待办工作台',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'task-own',
  path: '/task/own',
  index: 7,
  label: '个人任务',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'task-examine',
  path: '/task/examine',
  index: 8,
  label: '定值审核',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'task-approve',
  path: '/task/approve',
  index: 9,
  label: '定值批准',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'flow',
  path: '/flow',
  index: 11,
  label: '流程设计',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'querys-archived',
  path: '/querys/archived',
  index: 12,
  label: '已归档定值单查询',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'manage-user',
  path: '/manage/user',
  index: 13,
  label: '用户管理',
  auths: ['admin', 'master'],
  roles: 'any'
}, {
  name: 'manage-mongodb',
  path: '/manage/mongodb',
  index: 14,
  label: '数据库管理',
  auths: ['admin', 'master'],
  roles: 'any'
}, {
  name: 'manage-logs',
  path: '/manage/logs',
  index: 15,
  label: '日志查看',
  auths: ['admin', 'master', 'user'],
  roles: 'any'
}, {
  name: 'manage-import',
  path: '/manage/import',
  index: 16,
  label: '旧数据导入',
  auths: ['admin', 'master'],
  roles: 'any'
}, {
  name: 'frames-script',
  path: '/frames/script',
  index: 17,
  label: '脚本设计',
  auths: ['admin', 'master'],
  roles: 'any'
}, {
  name: 'frames-form',
  path: '/frames/form',
  index: 18,
  label: '表单设计',
  auths: ['admin', 'master'],
  roles: 'any'
}, {
  name: 'html',
  path: '/html',
  index: 20,
  label: 'Html比对',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any'
}, {
  name: 'message',
  path: '/message',
  index: 100,
  label: '消息提示',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: ['audit', 'launch', 'repeal', 'browse'],
  hide: true
}, {
  name: 'throw',
  path: '/throw',
  index: 100,
  label: '错误跳转',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: ['audit', 'launch', 'repeal', 'browse'],
  hide: true
}, {
  name: 'compare',
  path: '/compare',
  index: 100,
  label: '文件比对结果',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: ['audit', 'launch', 'repeal', 'browse'],
  hide: true
}, {
  name: 'oms-content',
  path: '/oms/content',
  label: 'OMS首页',
  auths: 'any',
  roles: 'any',
  hide: true
}, { name: 'oms-login', path: '/oms/login', label: 'OMS登录页', auths: 'any', roles: 'any' }, {
  name: 'setting',
  path: '/setting',
  label: '配置维护',
  auths: ['admin', 'master', 'user', 'readonly'],
  roles: 'any',
  hide: true
}];

export { saveStructure } from './structure';
export { getCapacity } from './capacity';
export { SftpUtil } from './sftp';
