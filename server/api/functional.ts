import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {v1 as uuidV1} from 'uuid';
import Axios from 'axios';
import Router from 'koa-router';
import sharp from 'sharp';
import {encode} from 'urlencode';
import koaBody from 'koa-body';
import {DefaultState, Context} from 'koa';
import moment from 'moment';
import {writeSnapshot} from 'heapdump';
import JSZip from 'jszip';
import iconv from 'iconv-lite';
import {
  Department,
  FileShare,
  generateObjectId,
  getDepartmentSubstationVoltages,
  getFileShareGridFSBucket,
  getStampGridFSBucket,
  IDepartment,
  ISessInfo,
  ProtectType,
  Stamp,
  Substation,
  toObjectId,
  User,
  Voltage,
  waitForWriteStream
} from '../mongo-schema';
import utils from '../utils';
import Globals from '../globals';
import conf from '../../configs';

const router = new Router<DefaultState, Context>({prefix: '/functional'});

router.get('/fetch-current-user-info', async ctx => {
  try {
    const sess = ctx.session as unknown as ISessInfo;
    const user = await User.findById(toObjectId(sess.user._id))
      .populate('flows')
      .populate('departments')
      .populate({
        path: 'groups',
        select: 'name',
        populate: [
          {
            path: 'auths',
            options: {
              sort: {
                index: 1
              }
            }
          },
          {
            path: 'roles',
            options: {
              sort: {
                index: 1
              }
            }
          }
        ]
      }).lean();
    if (!user) {
      ctx.body = {
        succ: false,
        message: '未找到当前用户'
      };
      return;
    }

    const flows: string[] = [];
    const departments = [];
    for (const d of user.departments) {
      const department = d as unknown as IDepartment;
      departments.push(department.aliasName || department.name);
    }
    if (user.flows) {
      for (const f of user.flows) {
        // @ts-ignore
        flows.push(f.metadata.name);
      }
    }

    let viewSelfDepartment = false;
    const groups: string[] = [];
    const roles: string[] = [];
    const auths: string[] = [];
    for (const g of user.groups) {
      groups.push(g.name);
      for (const r of g.roles) {
        // @ts-ignore
        if (!roles.includes(r.name)) {
          // @ts-ignore
          roles.push(r.name);
          // @ts-ignore
          if (!viewSelfDepartment && r.viewSelfDepartmentOnly) {
            viewSelfDepartment = true;
          }
        }
      }

      for (const a of g.auths) {
        // @ts-ignore
        if (!auths.includes(a.name)) {
          // @ts-ignore
          auths.push(a.name);
        }
      }
    }

    switch (user.viewSelfDepartment) {
      case 'yes': {
        viewSelfDepartment = true;
        break;
      }
      case 'no': {
        viewSelfDepartment = false;
        break;
      }
    }

    const substationNames = [];
    if (viewSelfDepartment) {
      if (conf.service.isProvince) {
        const substations = await Substation.find({
          // @ts-ignore
          departmentId: user.departments.map(x => x._id)
        }).lean();
        substationNames.push(...substations.map(x => x.name));
      } else {
        // @ts-ignore
        const substationVoltageConditions = await getDepartmentSubstationVoltages(user.departments.map(x => x._id.toHexString()));
        substationNames.push(...substationVoltageConditions);
      }
    } else {
      substationNames.push('全部厂站与电压等级');
    }
    ctx.body = {
      succ: true,
      userId: user._id,
      name: user.name,
      account: user.account,
      status: user.status,
      flows,
      groups,
      departments,
      roles,
      auths,
      viewSelfDepartment,
      viewRange: user.viewRange,
      voltageLevels: user.voltageLevels,
      loginLogs: user.loginLogs.slice(-10),
      clientIP: utils.getClientIP(ctx.request),
      substationNames: substationNames.sort((a, b) => a.localeCompare(b, 'zh-CN'))
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.delete('/delete-share-file/:id', async ctx => {
  const file = await FileShare.findById(toObjectId(ctx.params.id)).lean();
  if (!file) {
    ctx.body = {
      succ: false,
      message: '未找到id[' + ctx.params.id + ']对应的共享模板文件'
    };
    return;
  }

  const gridFS = getFileShareGridFSBucket();
  await utils.deleteGridFile(gridFS, file._id);
  ctx.body = {
    succ: true,
    fileId: ctx.params.id
  };
});

router.post('/upload-share-file', koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 50 * 1024 * 1024
  }
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const body = ctx.request.body;
    const sess = ctx.session as unknown as ISessInfo;
    const fileData = fs.readFileSync(file.filepath);
    const fileInfo = await utils.detectFileInfo(fileData, file.name);
    if (!fileInfo.succ) {
      ctx.body = {
        succ: false,
        message: '检测文件信息失败: ' + fileInfo.message
      };
      return;
    }

    const gridFS = getFileShareGridFSBucket();
    const now = new Date();
    const s = gridFS.openUploadStream(uuidV1() + fileInfo.fileType, {
      contentType: fileInfo.mediaType,
      metadata: {
        _contentType: fileInfo.mediaType,
        rawFilename: file.name,
        fileType: fileInfo.fileType,
        department: toObjectId(sess.departments[0]),
        shareName: `${body.voltageLevel}_${body.protectType}_${body.factory}_(${body.modelNumber})_[${body.version}]_[${body.serialNumber || ' '}]${fileInfo.fileType}`,
        uploadUserId: toObjectId(sess.user._id),
        uploadUserName: sess.user.name,
        uploadTime: now,
        status: 'pending',
        factory: body.factory,
        modelNumber: body.modelNumber,
        version: body.version,
        serialNumber: body.serialNumber || '',
        protectType: body.protectType,
        voltageLevel: body.voltageLevel,
        platform: body.platform,
        releaseTime: now,
        downloadCount: 0,
        description: body.description || ''
      }
    });
    s.end(fileData);
    await utils.waitForWriteStream(s);
    const md5 = crypto.createHash('md5').update(fileData).digest('hex');
    const f = await FileShare.findOneAndUpdate({
      _id: s.id
    }, {
      $set: {
        md5
      }
    }, {
      new: true,
      upsert: true
    });
    ctx.body = {
      succ: true,
      fileInfo,
      file: f
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

router.post('/check-share-file-duplicate', async ctx => {
  try {
    const body = ctx.request.body;
    const exists = await FileShare.exists({
      'metadata.modelNumber': {
        $regex: new RegExp('^' + body.modelNumber + '$', 'i')
      },
      'metadata.version': {
        $regex: new RegExp('^' + body.version + '$', 'i')
      },
      'metadata.serialNumber': {
        $regex: new RegExp('^' + body.serialNumber + '$', 'i')
      }
    });
    ctx.body = {
      succ: true,
      exists
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/share-file-zip-content/:id', async ctx => {
  try {
    const file = await FileShare.findById(toObjectId(ctx.params.id)).lean();
    if (!file) {
      ctx.body = {
        succ: false,
        message: '未找到id[' + ctx.params.id + ']对应的共享模板文件'
      };
      return;
    }

    const gridFS = getFileShareGridFSBucket();
    const s = gridFS.openDownloadStream(toObjectId(ctx.params.id));
    if (!s) {
      ctx.body = {
        succ: false,
        message: '未找到[' + ctx.params.id + ']对应的文件'
      };
      return;
    }

    const fileData = await utils.readStream(s);
    const zip = await JSZip.loadAsync(fileData, {
      // @ts-ignore
      decodeFileName(bytes) {
        // @ts-ignore
        return iconv.decode(bytes, 'gbk');
      }
    });
    const files: any[] = [];
    zip.forEach((relativePath, file) => {
      files.push({
        relativePath,
        dir: file.dir,
        name: path.basename(relativePath)
      });
    });
    ctx.body = {
      succ: true,
      files,
      filename: file.metadata.shareName
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/share-file-aggregate', async ctx => {
  const result = await FileShare.aggregate([
    {
      $match: {}
    },
    {
      $group: {
        _id: {
          // @ts-ignore
          department: '$metadata.department',
          protectType: '$metadata.protectType',
          factory: '$metadata.factory',
          modelNumber: '$metadata.modelNumber',
          version: '$metadata.version',
          serialNumber: '$metadata.serialNumber',
          voltageLevel: '$metadata.voltageLevel',
          platform: '$metadata.platform'
        }
      }
    }
  ]).allowDiskUse(true);

  const departments = await Department.find({}).lean();
  const areaNameSet = new Set<string>();
  const protectTypeSet = new Set<string>();
  const factorySet = new Set<string>();
  const modelNumberSet = new Set<string>();
  const versionSet = new Set<string>();
  const serialNumberSet = new Set<string>();
  const voltageLevelSet = new Set<string>();
  const platformSet = new Set<string>();
  for (const r of result) {
    const department = departments.find(x => x._id.equals(r._id.department));
    if (department) {
      areaNameSet.add(department.aliasName || department.name);
    }
    protectTypeSet.add(r._id.protectType);
    factorySet.add(r._id.factory);
    modelNumberSet.add(r._id.modelNumber);
    versionSet.add(r._id.version);
    serialNumberSet.add(r._id.serialNumber);
    voltageLevelSet.add(String(r._id.voltageLevel));
    platformSet.add(r._id.platform);
  }
  if (voltageLevelSet.size === 0) {
    const voltages = await Voltage.find({}).lean();
    for (const v of voltages) {
      voltageLevelSet.add(v.name);
    }
  }
  if (protectTypeSet.size === 0) {
    const protectTypes = await ProtectType.find({}).lean();
    for (const p of protectTypes) {
      protectTypeSet.add(p.name);
    }
  }
  ctx.body = {
    succ: true,
    areaNames: Array.from(areaNameSet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    protectTypes: Array.from(protectTypeSet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    factories: Array.from(factorySet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    modelNumbers: Array.from(modelNumberSet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    versions: Array.from(versionSet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    serialNumbers: Array.from(serialNumberSet).sort((a, b) => a.localeCompare(b, 'zh-CN')),
    voltageLevels: Array.from(voltageLevelSet).sort((a, b) => {
      const voltageA = /(\d+)/.exec(a);
      const voltageB = /(\d+)/.exec(b);
      if (voltageA && voltageB) {
        return Number(voltageA[1]) - Number(voltageB[1]);
      }
      return 0;
    }),
    platforms: Array.from(platformSet).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  };
});

router.post('/fetch-share-files', async ctx => {
  try {
    const body = ctx.request.body;
    const $sort: any = {};
    if (body.sortColumn) {
      $sort['metadata.' + body.sortColumn] = body.asc ? 1 : -1;
    } else {
      $sort['metadata.releaseTime'] = body.asc ? 1 : -1;
    }
    const $match: any = {};
    if (body.factory) {
      $match['metadata.factory'] = body.factory;
    }
    if (body.areaName) {
      const department = await Department.findOne({
        $or: [
          {
            aliasName: body.areaName
          },
          {
            name: body.areaName
          }
        ]
      }).lean();

      if (department) {
        $match['metadata.department'] = department._id;
      }
    }
    if (body.protectType) {
      $match['metadata.protectType'] = body.protectType;
    }
    if (body.voltageLevel) {
      $match['metadata.voltageLevel'] = body.voltageLevel;
    }
    if (body.version) {
      $match['metadata.version'] = body.version;
    }
    if (body.serialNumber) {
      $match['metadata.serialNumber'] = body.serialNumber;
    }
    if (body.platform) {
      $match['metadata.platform'] = body.platform;
    }
    if (body.uploadUserId) {
      $match['metadata.uploadUserId'] = toObjectId(body.uploadUserId);
    }
    if (body.modelNumber) {
      $match['metadata.modelNumber'] = {
        $regex: new RegExp(body.modelNumber, 'i')
      };
    }
    if (body.releaseTime1 && body.releaseTime2) {
      const begin = Math.min(body.releaseTime1, body.releaseTime2);
      const end = Math.max(body.releaseTime1, body.releaseTime2);
      $match['metadata.releaseTime'] = {
        $gt: new Date(begin),
        $lt: new Date(end)
      };
    } else if (body.releaseTime1) {
      $match['metadata.releaseTime'] = {
        $gt: new Date(body.releaseTime1)
      };
    } else if (body.releaseTime2) {
      $match['metadata.releaseTime'] = {
        $lt: new Date(body.releaseTime2)
      };
    }

    const $project = {
      uploadDate: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$uploadDate',
          timezone: 'Asia/Shanghai'
        }
      },
      filename: 1,
      length: 1,
      uploadUser: 1,
      status: '$metadata.status',
      contentType: '$metadata._contentType',
      shareName: '$metadata.shareName',
      department: '$metadata.department',
      uploadUserName: '$metadata.uploadUserName',
      factory: '$metadata.factory',
      modelNumber: '$metadata.modelNumber',
      version: '$metadata.version',
      serialNumber: '$metadata.serialNumber',
      protectType: '$metadata.protectType',
      voltageLevel: '$metadata.voltageLevel',
      platform: '$metadata.platform',
      downloadCount: '$metadata.downloadCount',
      fileType: '$metadata.fileType',
      uploadTime: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$metadata.uploadTime',
          timezone: 'Asia/Shanghai'
        }
      },
      releaseTime: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$metadata.releaseTime',
          timezone: 'Asia/Shanghai'
        }
      }
    };

    const queryResult: any[] = await FileShare.aggregate([
      {
        $facet: {
          rows: [
            {
              $match
            },
            {
              $sort
            },
            {
              $skip: body.skip
            },
            {
              $limit: body.limit
            },
            {
              $lookup: {
                from: 'user',
                localField: 'metadata.uploadUserId',
                foreignField: '_id',
                as: 'uploadUser'
              }
            },
            {
              $unwind: {
                path: '$uploadUser',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project
            }
          ],
          count: [
            {
              $match
            },
            {
              $count: 'count'
            }
          ]
        }
      }
    ]).allowDiskUse(true);

    const departments = await Department.find({}).lean();
    const rows = queryResult[0].rows;
    let index = body.skip;
    for (const row of rows) {
      if (row.uploadUser) {
        row.uploadUserName = row.uploadUser.name;
      }
      row.index = ++index;
      row.department = departments.find(x => x._id.equals(row.department));
      delete row.uploadUser;
    }
    const total = queryResult[0].count && queryResult[0].count.length > 0 ? queryResult[0].count[0].count : 0;
    ctx.body = {
      succ: true,
      rows,
      total
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/fetch-self-share-files', async ctx => {
  try {
    const sess = ctx.session as unknown as ISessInfo;
    const body = ctx.request.body;
    const $sort: any = {};
    if (body.sortColumn) {
      $sort['metadata.' + body.sortColumn] = body.asc ? 1 : -1;
    } else {
      $sort['metadata.releaseTime'] = body.asc ? 1 : -1;
    }
    const $match: any = {
      'metadata.uploadUserId': toObjectId(sess.user._id)
    };
    if (body.factory) {
      $match['metadata.factory'] = body.factory;
    }
    if (body.areaName) {
      const department = await Department.findOne({
        $or: [
          {
            aliasName: body.areaName
          },
          {
            name: body.areaName
          }
        ]
      }).lean();

      if (department) {
        $match['metadata.department'] = department._id;
      }
    }
    if (body.protectType) {
      $match['metadata.protectType'] = body.protectType;
    }
    if (body.voltageLevel) {
      $match['metadata.voltageLevel'] = body.voltageLevel;
    }
    if (body.version) {
      $match['metadata.version'] = body.version;
    }
    if (body.serialNumber) {
      $match['metadata.serialNumber'] = body.serialNumber;
    }
    if (body.platform) {
      $match['metadata.platform'] = body.platform;
    }
    if (body.modelNumber) {
      $match['metadata.modelNumber'] = {
        $regex: new RegExp(body.modelNumber, 'i')
      };
    }
    if (body.releaseTime1 && body.releaseTime2) {
      const begin = Math.min(body.releaseTime1, body.releaseTime2);
      const end = Math.max(body.releaseTime1, body.releaseTime2);
      $match['metadata.releaseTime'] = {
        $gt: new Date(begin),
        $lt: new Date(end)
      };
    } else if (body.releaseTime1) {
      $match['metadata.releaseTime'] = {
        $gt: new Date(body.releaseTime1)
      };
    } else if (body.releaseTime2) {
      $match['metadata.releaseTime'] = {
        $lt: new Date(body.releaseTime2)
      };
    }

    const $project = {
      uploadDate: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$uploadDate',
          timezone: 'Asia/Shanghai'
        }
      },
      filename: 1,
      length: 1,
      uploadUser: 1,
      status: '$metadata.status',
      contentType: '$metadata._contentType',
      shareName: '$metadata.shareName',
      department: '$metadata.department',
      uploadUserName: '$metadata.uploadUserName',
      factory: '$metadata.factory',
      modelNumber: '$metadata.modelNumber',
      version: '$metadata.version',
      serialNumber: '$metadata.serialNumber',
      protectType: '$metadata.protectType',
      voltageLevel: '$metadata.voltageLevel',
      platform: '$metadata.platform',
      downloadCount: '$metadata.downloadCount',
      fileType: '$metadata.fileType',
      uploadTime: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$metadata.uploadTime',
          timezone: 'Asia/Shanghai'
        }
      },
      releaseTime: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M:%S',
          date: '$metadata.releaseTime',
          timezone: 'Asia/Shanghai'
        }
      }
    };

    const queryResult: any[] = await FileShare.aggregate([
      {
        $facet: {
          rows: [
            {
              $match
            },
            {
              $sort
            },
            {
              $skip: body.skip
            },
            {
              $limit: body.limit
            },
            {
              $lookup: {
                from: 'user',
                localField: 'metadata.uploadUserId',
                foreignField: '_id',
                as: 'uploadUser'
              }
            },
            {
              $unwind: {
                path: '$uploadUser',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project
            }
          ],
          count: [
            {
              $match
            },
            {
              $count: 'count'
            }
          ]
        }
      }
    ]).allowDiskUse(true);

    const departments = await Department.find({}).lean();
    const rows = queryResult[0].rows;
    let index = body.skip;
    for (const row of rows) {
      if (row.uploadUser) {
        row.uploadUserName = row.uploadUser.name;
      }
      row.index = ++index;
      row.department = departments.find(x => x._id.equals(row.department));
      delete row.uploadUser;
    }
    const total = queryResult[0].count && queryResult[0].count.length > 0 ? queryResult[0].count[0].count : 0;
    ctx.body = {
      succ: true,
      rows,
      total
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/require-heapdump', async ctx => {
  function dumpHeap(dumpFilename: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      writeSnapshot(dumpFilename, (err: any, filename: any) => {
        if (err) {
          console.error('输出内存倾印文件失败', err);
          reject(err);
        } else {
          if (filename) {
            console.log('已输出内存倾印文件[' + filename + ']');
            const fileBuffer = fs.readFileSync(filename);
            fs.unlinkSync(filename);
            resolve(fileBuffer);
          } else {
            reject(new Error('未成功输出dump文件'));
          }
        }
      });
    });
  }

  try {
    const filename = path.join(os.tmpdir(), 'DMS-HEAP-DUMP-' + moment().format('YYYYMMDDHHmmss') + '.heapsnapshot');
    console.log('准备打印内存至: ' + filename);
    const buffer = await dumpHeap(filename);
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', 'attach; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.set('Content-Length', String(buffer.length));
    ctx.body = buffer;
  } catch (err: any) {
    console.error(err);
    ctx.throw(500, err.message);
  }
});

router.get('/sys-stat', async ctx => {
  try {
    const {data} = await Axios.get(`${conf.monitor.prefix}${conf.monitor.host}:${conf.monitor.port}/docker/api/getSystemStat`, {timeout: 1000});
    ctx.body = {
      succ: true,
      stat: data
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/route-metas', (ctx) => {
  ctx.body = utils.getMetaRoutes();
});

router.get('/mongo-id/:count', (ctx) => {
  const count = Number(ctx.params.count);
  if (count <= 1) {
    ctx.body = [generateObjectId()];
  } else {
    const ids = [];
    for (let i = 0; i < count; ++i) {
      ids.push(generateObjectId());
    }
    ctx.body = ids;
  }
});

router.get('/online-users', async ctx => {
  try {
    const pageCount = Globals.socket.clients.size;
    if (pageCount > 0) {
      const userIds = new Set();
      for (const client of Globals.socket.clients.values()) {
        if (client.user.id) {
          userIds.add(client.user.id);
        }
      }

      const users = await User.find({
        _id: {
          // @ts-ignore
          $in: Array.from(userIds).map((x: string) => toObjectId(x))
        }
      }, {name: 1}).lean();

      ctx.body = {
        succ: true,
        users,
        pageCount
      };
    } else {
      ctx.body = {
        succ: true,
        users: [],
        pageCount
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

router.get('/preview-stamp/:id', async ctx => {
  const stamp = await Stamp.findById(toObjectId(ctx.params.id)).lean();
  if (stamp) {
    const bucket = getStampGridFSBucket();
    const stream = bucket.openDownloadStream(toObjectId(ctx.params.id));
    const buffer = await utils.readFile(stream);
    const resultBuffer = await sharp(buffer).resize(stamp.metadata.targetWidth, stamp.metadata.targetHeight, {
      fit: 'fill'
    }).toBuffer();
    const filename = stamp.filename;
    ctx.set('Content-Type', stamp.metadata._contentType);
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

router.delete('/delete-stamp/:id', ctx => {
  try {
    const bucket = getStampGridFSBucket();
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

router.post('/update-stamp-info/:id', async ctx => {
  const body = ctx.request.body;
  ctx.body = await Stamp.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    $set: {
      'metadata.stampType': body.stampType,
      'metadata.targetWidth': Number(body.targetWidth),
      'metadata.targetHeight': Number(body.targetHeight),
      'metadata.user': body.userId ? toObjectId(body.userId) : undefined,
      'metadata.keyword': body.keyword
    }
  }, {
    upsert: true
  });
});

router.get('/list-stamps', async ctx => {
  ctx.body = await Stamp.find({}).sort({filename: 1}).populate({
    path: 'metadata.user',
    select: 'name'
  }).lean();
});

router.post('/upload-stamp', koaBody({multipart: true, formidable: {maxFileSize: 50 * 1024 * 1024}}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const bucket = getStampGridFSBucket();
    const body = ctx.request.body;
    const imageInfo = require('imageinfo');
    const imageData = fs.readFileSync(file.filepath);
    const info = imageInfo(imageData);

    const stream = bucket.openUploadStream(file.name, {
      contentType: info.mimeType,
      metadata: {
        _contentType: info.mimeType,
        user: body.userId ? toObjectId(body.userId) : undefined,
        rawWidth: Number(info.width),
        rawHeight: Number(info.height),
        targetWidth: Number(body.targetWidth),
        targetHeight: Number(body.targetHeight),
        stampType: body.stampType,
        keyword: body.keyword
      }
    });
    const readStream = fs.createReadStream(file.filepath);
    // @ts-ignore
    readStream.pipe(stream);
    await utils.waitForWriteStream(stream);
    const stamp = await Stamp.findById(stream.id).populate({
      path: 'metadata.user',
      select: 'name'
    }).lean();
    ctx.body = {
      succ: true,
      stamp
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

export default router;
