import fs from 'fs';
import os from 'os';
import stream from 'stream';
import path from 'path';
import {exec} from 'child_process';
import crypto from 'crypto';
import rimraf, {sync as rimrafSync} from 'rimraf';
import {scheduleJob} from 'node-schedule';
import koaBody from 'koa-body';
import moment from 'moment';
import {decode, encode} from 'urlencode';
import Router from 'koa-router';
import iconv from 'iconv-lite';
import JSZip from 'jszip';
import {path7za} from '7zip-bin';
import {add as sevenZipAdd, extractFull as sevenZipExtract} from 'node-7z';
import {v1 as uuidV1} from 'uuid';
import { Context, DefaultState } from 'koa';
import conf from '../../configs';
import utils from '../utils';
import {
  Config,
  DzdFile,
  FileShare,
  FileShareSchema,
  getDzdGridFSBucket,
  getFileShareGridFSBucket,
  GridFSBucket,
  IDepartment,
  IFileShare,
  mongoose,
  prepareSystemData,
  Task,
  toObjectId,
  User,
  UserSession,
  waitForConnectionOpen,
  waitForWriteStream
} from '../mongo-schema';

const router = new Router<DefaultState, Context>({prefix: '/database'});

if (process.env.NODE_ENV === 'production' && conf.mongodb.autoBackupTime && conf.mongodb.backupDir) {
  scheduleJob(conf.mongodb.autoBackupTime, async fireDate => {
    const backupDir = path.join(conf.mongodb.backupDir, 'mongodb-backup-' + moment().format('YYYYMMDDHHmmss'));
    fs.mkdirSync(backupDir);
    const backupCmd = generateDumpCommand(backupDir);
    await executeCommand(backupCmd);
    if (conf.mongodb.reserveDate) {
      const reserveDate = Math.abs(Number(conf.mongodb.reserveDate));
      if (reserveDate > 0) {
        const date = moment().subtract(reserveDate, 'days').toDate();
        fs.readdir(conf.mongodb.backupDir, (err, files) => {
          if (err) {
            console.log('枚举备份目录[' + conf.mongodb.backupDir + ']失败: ' + err.message);
            console.error(err);
          } else {
            for (const dir of files) {
              const backupDir = path.join(conf.mongodb.backupDir, dir);
              fs.stat(backupDir, (err2, stats) => {
                if (err2) {
                  console.log('获取备份文件夹[' + backupDir + ']状态失败: ' + err2.message);
                  console.error(err2);
                } else {
                  if (stats.ctime.getTime() < date.getTime()) {
                    rimraf(backupDir, err3 => {
                      if (err3) {
                        console.log('删除备份目录[' + backupDir + ']失败: ' + err3.message);
                        console.error(err3);
                      }
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  });
}

router.get('/list-collections', async ctx => {
  const array: {name: string, count: number, loading: boolean}[] = [];
  const collections = mongoose.connection.collections;
  for (const collectionsKey in collections) {
    const count = await collections[collectionsKey].countDocuments();
    array.push({
      name: collectionsKey,
      loading: false,
      count
    });
  }
  ctx.body = array;
});

function executeCommand(cmd: string) {
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

router.post('/import-fh-package', koaBody({
  multipart: true,
  formidable: {maxFileSize: 800 * 1024 * 1024}
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const fileData = fs.readFileSync(file.filepath);
    const zip = await JSZip.loadAsync(fileData);
    const files: {fileId: string, metadataFile: string}[] = [];
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.name.endsWith('.metadata')) {
        const fileId = zipEntry.name.split('.')[0];
        files.push({
          fileId,
          metadataFile: relativePath
        });
      }
    });

    const users = await User.find({}).populate('departments').lean();
    let fileCount = 0;
    const gridFS = getFileShareGridFSBucket();
    for (const f of files) {
      const obj = zip.file(f.metadataFile);
      if (obj) {
        const metadataString = await obj.async('string');
        const metadata = JSON.parse(metadataString);
        const ext = path.extname(metadata.filename);
        const rawFile = zip.file(f.fileId + ext);
        if (rawFile) {
          const fileBuffer = await rawFile.async('nodebuffer');
          if (await FileShare.exists({
            _id: toObjectId(f.fileId)
          })) {
            await utils.deleteGridFile(gridFS, toObjectId(f.fileId));
          }

          const fileInfo = await utils.detectFileInfo(fileBuffer, metadata.filename, false);
          const found = users.find(x => x.name === metadata.metadata.uploadUserName);
          if (found) {
            metadata.metadata.uploadUserId = found._id;
            const deps = found.departments as unknown as IDepartment[];
            if (deps && deps.length) {
              metadata.metadata.department = deps[0]._id;
            }
          } else {
            metadata.metadata.uploadUserId = null;
            continue;
          }

          const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
          metadata.metadata._contentType = fileInfo.mediaType;
          metadata.metadata.shareName = `${metadata.metadata.voltageLevel}_${metadata.metadata.protectType}_${metadata.metadata.factory}_(${metadata.metadata.modelNumber})_[${metadata.metadata.version}]_[${metadata.metadata.serialNumber || ' '}]${ext}`;
          metadata.metadata.fileType = ext;
          metadata.metadata.releaseTime = metadata.metadata.releaseTime ? moment(metadata.metadata.releaseTime).toDate() : moment(metadata.uploadDate).toDate();
          metadata.metadata.uploadTime = moment(metadata.uploadDate).toDate();
          metadata.metadata.rawFilename = metadata.filename;
          const stream = gridFS.openUploadStreamWithId(toObjectId(f.fileId), uuidV1() + ext, {
            metadata: metadata.metadata,
            contentType: fileInfo.mediaType
          });
          stream.end(fileBuffer);
          await utils.waitForWriteStream(stream);
          await FileShare.updateOne({_id: stream.id}, {md5});
          fileCount++;
        }
      }
    }

    ctx.body = {
      succ: true,
      fileCount
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

router.post('/export-fh-collection', async ctx => {
  try {
    const body = ctx.request.body;
    const connection = await mongoose.createConnection(`mongodb://${body.mongodb.host}:${body.mongodb.port}/${body.mongodb.db}?retryWrites=true`, {
      user: body.mongodb.uid ? body.mongodb.uid : undefined,
      pass: body.mongodb.pwd ? body.mongodb.pwd : undefined,
      autoIndex: false,
      keepAlive: true,
      socketTimeoutMS: 4500,
      connectTimeoutMS: 4000
    });

    const db = await waitForConnectionOpen(connection);
    const zip = new JSZip();
    const fhModel = connection.model('FileShare', FileShareSchema, 'FileShare.files');
    const fhGridFS = new GridFSBucket(db, {bucketName: 'FileShare'});
    const files: IFileShare[] = await fhModel.find({}).lean();
    for (const f of files) {
      const s = fhGridFS.openDownloadStream(f._id);
      const fileData = await utils.readFile(s);
      const ext = path.extname(f.filename);
      const metadata = JSON.stringify(f);
      zip.file(f._id.toHexString() + '.metadata', metadata, {
        comment: 'json'
      });
      zip.file(f._id.toHexString() + ext, fileData);
    }
    const filename = '定值单模板共享库(' + moment().format('YYYYMMDDHHmmss') + ').zip';
    ctx.set('Access-Control-Expose-Headers', 'filename');
    ctx.set('filename', encode(filename));
    ctx.set('Content-Type', 'application/zip');
    ctx.set('Content-Disposition', 'attach; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.body = zip.generateNodeStream();
  } catch (err: any) {
    console.error(err);
    ctx.throw(err.message, 500);
  }
});

router.post('/import-configs', async ctx => {
  const body: any = ctx.request.body;
  const updatedRows: any[] = [];
  for (const config of body.systemConfigs) {
    const row = await Config.findOneAndUpdate({
      serviceId: config.serviceId,
      key: config.key
    }, {
      name: config.name,
      value: config.value,
      description: config.description,
      backendOnly: config.backendOnly
    }, {
      upsert: true,
      new: true
    }).lean();

    updatedRows.push(row);
  }

  ctx.body = updatedRows;
});

router.get('/export-configs', async ctx => {
  const systemConfigs = await Config.find({}).lean();
  const json = JSON.stringify({
    serviceConfigs: conf,
    systemConfigs,
    env: process.env
  });
  const buffer = Buffer.from(json);
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);
  const filename = '系统配置(' + moment().format('YYYYMMDDHHmmss') + ').json';
  ctx.set('Content-Type', 'application/json;charset=UTF-8');
  ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.set('Content-Length', String(buffer.length));
  ctx.body = bufferStream;
});

router.post('/sys-config', async ctx => {
  const body = ctx.request.body;
  ctx.body = await Config.create({
    serviceId: String(body.serviceId),
    key: String(body.key),
    name: String(body.name),
    value: String(body.value),
    description: String(body.description),
    backendOnly: body.backendOnly
  });
});

router.post('/replace-dzd-file/:fileId', koaBody({
  multipart: true,
  formidable: {maxFileSize: 8000 * 1024 * 1024}
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

    // const filename = fileInfo.filename;
    if (fileInfo.needUpgrade) {
      const newFileData = await utils.upgradeOfficeFile(fileData, file.name);
      if (newFileData.length <= 0) {
        ctx.body = {
          succ: false,
          message: '升级文档格式失败'
        };
        return;
      }

      fs.writeFileSync(file.filepath, newFileData);
    }

    const found = await DzdFile.findById(toObjectId(ctx.params.fileId)).lean();
    if (found) {
      const matches = await utils.matchFilename(file.name);
      if (matches.success) {
        const gridFS = getDzdGridFSBucket();
        await utils.deleteGridFile(gridFS, found._id);
        found.contentType = fileInfo.mediaType;
        found.metadata._contentType = fileInfo.mediaType;
        found.metadata.fileType = fileInfo.fileType;
        const writeStream = gridFS.openUploadStreamWithId(found._id, file.name, {
          metadata: found.metadata
        });
        const readStream = fs.createReadStream(file.filepath);
        // @ts-ignore
        readStream.pipe(writeStream);
        await waitForWriteStream(writeStream);
        ctx.body = {
          succ: true
        };
      } else {
        ctx.body = {
          succ: false,
          message: '文件名[' + file.name + ']不合法'
        };
      }
    } else {
      ctx.body = {
        succ: false,
        message: '数据库内不存在文件:' + ctx.params.fileId
      };
    }
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

router.get('/export-files/:ext', async ctx => {
  const cursor = await DzdFile.find({
    filename: {
      $regex: new RegExp('\\.' + ctx.params.ext + '$', 'ig')
    }
  }).cursor();
  const gridFS = getDzdGridFSBucket();
  const zip = new JSZip();
  for (let file = await cursor.next(); file != null; file = await cursor.next()) {
    const stream = gridFS.openDownloadStream(file._id);
    zip.file(file._id.toHexString() + '-' + file.filename, stream, {binary: true});
  }
  await cursor.close();
  const filename = ctx.params.ext + '.zip';
  ctx.set('Access-Control-Expose-Headers', 'filename');
  ctx.set('filename', encode(filename));
  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.body = zip.generateNodeStream();
});

router.put('/sys-config/:id', async ctx => {
  const body = ctx.request.body;
  ctx.body = await Config.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    serviceId: String(body.serviceId),
    key: String(body.key),
    name: String(body.name),
    value: String(body.value),
    description: String(body.description),
    backendOnly: body.backendOnly
  });
});

router.delete('/sys-config/:id', async ctx => {
  ctx.body = await Config.deleteOne({
    _id: toObjectId(ctx.params.id)
  });
});

router.get('/sys-configs', async ctx => {
  ctx.body = await Config.find({}).sort({
    name: 1
  }).lean();
});

router.get('/enum-files/:path/:encoding', ctx => {
  try {
    // @ts-ignore
    const files: string[] = fs.readdirSync(decode(ctx.params.path), {encoding: ctx.params.encoding || 'utf8'});
    const statsArray = [];
    for (const file of files) {
      const fpath = path.join(ctx.params.path, file);
      const stats = fs.statSync(fpath);
      statsArray.push({
        path: fpath,
        filename: file,
        isDir: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
        size: stats.size,
        ctime: stats.ctime,
        ctimeMs: stats.ctimeMs,
        atime: stats.atime,
        atimeMs: stats.atimeMs,
        mtime: stats.mtime,
        mtimeMs: stats.mtimeMs
      });
    }
    ctx.body = {
      succ: true,
      stats: statsArray
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/download-file/:path', ctx => {
  const filepath = decode(ctx.params.path);
  const stream = fs.createReadStream(filepath);
  const stat = fs.statSync(filepath);
  const filename = path.parse(filepath).name;
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.set('Content-Length', String(stat.size));
  ctx.body = stream;
});

router.post('/import-mongodb', koaBody({
  multipart: true,
  formidable: { maxFileSize: 8000 * 1024 * 1024 }
}), async ctx => {
  function waitZipStream(stream: any) {
    return new Promise((resolve, reject) => {
      stream.on('progress', (progress: any) => {
        console.log('正在解压: ' + progress.percent + '%');
      });
      stream.on('error', (err: any) => {
        console.error('解压失败: ' + err.message);
        console.error(err);
        reject(err);
      });
      stream.on('end', () => {
        console.log('解压完成');
        resolve(true);
      });
    });
  }

  const file = (ctx.request as any).files.file;

  try {
    if (process.env.NODE_ENV === 'production' && conf.mongodb.backupDir) {
      const backupDir = path.join(conf.mongodb.backupDir, moment().format('YYYYMMDDHHmmss'));
      fs.mkdirSync(backupDir);
      const backupCmd = generateDumpCommand(backupDir);
      await executeCommand(backupCmd);
    }

    const restoreDir = path.join(os.tmpdir(), 'dzd-restore-' + uuidV1());
    fs.mkdirSync(restoreDir);
    const zipStream = sevenZipExtract(file.path, restoreDir, {
      $progress: true,
      $bin: process.env.NODE_ENV === 'development' ? path7za : '7za',
      charset: 'UTF-8'
    });

    await waitZipStream(zipStream);
    const dirs = fs.readdirSync(restoreDir);
    if (!dirs || !dirs.length) {
      rimrafSync(restoreDir);
      ctx.body = {
        succ: false,
        message: '数据包内容不合法'
      };
      return;
    }
    if (dirs[0] !== conf.mongodb.db) {
      fs.renameSync(path.join(restoreDir, dirs[0]), path.join(restoreDir, conf.mongodb.db));
    }
    const cmd = generateRestoreCommand(restoreDir);
    const result = await executeCommand(cmd);
    rimrafSync(restoreDir);
    await UserSession.deleteMany({});
    const sv = await prepareSystemData();
    ctx.body = {
      succ: true,
      result,
      sv
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/download-dump-package/:guid', ctx => {
  try {
    const zipPackage = path.join(os.tmpdir(), 'zd-dump-' + ctx.params.guid, 'dump.7z');
    if (!fs.existsSync(zipPackage)) {
      ctx.body = {
        succ: false,
        message: '未找到' + ctx.params.guid + '对应的数据包'
      };
      return;
    }
    const datetime = utils.formatDateTime(new Date(), 'yyyyMMddhhmmss');
    const filename = '配电网整定计算系统数据库备份(' + datetime + ').7z';
    const stream = fs.createReadStream(zipPackage);
    const stat = fs.statSync(zipPackage);
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
    ctx.set('Content-Length', String(stat.size));
    ctx.body = stream;
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: '/tmp/zd-dump.7z不存在，无法下载'
    };
  }
});

function generateRestoreCommand(dir: string): string {
  const cmdArray = [`mongorestore -h ${conf.mongodb.host}:${conf.mongodb.port} `];
  if (conf.mongodb.uid && conf.mongodb.pwd) {
    cmdArray.push(` --authenticationDatabase=${conf.mongodb.db} --username=${conf.mongodb.uid} --password=${conf.mongodb.pwd} `);
  }
  cmdArray.push(` --drop ${dir}`);
  return cmdArray.join('');
}

function generateDumpCommand(dir: string): string {
  const cmdArray = [`mongodump -h ${conf.mongodb.host}:${conf.mongodb.port} `];
  if (conf.mongodb.uid && conf.mongodb.pwd) {
    cmdArray.push(` --authenticationDatabase=${conf.mongodb.db} --username=${conf.mongodb.uid} --password=${conf.mongodb.pwd} `);
  }
  cmdArray.push(` --db=${conf.mongodb.db} -o ${dir} `);
  return cmdArray.join('');
}

router.get('/generate-mongo-cmd', ctx => {
  ctx.body = {
    dump: generateDumpCommand('/home/mongodump'),
    restore: generateRestoreCommand('/home/mongodump')
  };
});

router.get('/export-mongodb', async ctx => {
  function waitZipStream(stream: any) {
    return new Promise((resolve, reject) => {
      stream.on('progress', (progress: any) => {
        console.log('正在压缩: ' + progress.percent + '%');
      });
      stream.on('error', (err: any) => {
        console.error('压缩失败: ' + err.message);
        console.error(err);
        reject(err);
      });
      stream.on('end', () => {
        console.log('压缩完成');
        resolve(true);
      });
    });
  }

  try {
    const guid = uuidV1();
    const dir = path.join(os.tmpdir(), 'zd-dump-' + guid);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const zipFile = path.join(dir, 'dump.7z');
    const dumpDir = path.join(dir, conf.mongodb.db);
    if (fs.existsSync(zipFile)) {
      fs.unlinkSync(zipFile);
    }
    if (fs.existsSync(dumpDir)) {
      rimrafSync(dumpDir);
    }
    const cmd = generateDumpCommand(dir);
    const result = await executeCommand(cmd);
    if (!fs.existsSync(dumpDir)) {
      ctx.body = {
        succ: false,
        message: '导出数据库失败',
        result
      };
    } else {
      const zipStream = sevenZipAdd(zipFile, dumpDir, {
        $bin: process.env.NODE_ENV === 'development' ? path7za : '7za',
        $progress: true,
        workingDir: dir,
        charset: 'UTF-8'
      });
      await waitZipStream(zipStream);
      rimrafSync(dumpDir);
      ctx.body = {
        succ: true,
        result,
        guid
      };
    }
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/export-collection', async ctx => {
  const body = ctx.request.body;
  const collectionName = body.collectionName;
  const tick = new Date().getTime();
  const exportPath = `/tmp/dump${tick}`;
  const cmd = `mongodump -h ${conf.mongodb.host}:${conf.mongodb.port} --authenticationDatabase=${conf.mongodb.db} --username=${conf.mongodb.uid} --password=${conf.mongodb.pwd} --db=${conf.mongodb.db} --collection=${collectionName} -o ${exportPath}`;
  await executeCommand(cmd);
  const zip = new JSZip();
  const folder = zip.folder(conf.mongodb.db);
  const collectionPath = path.join(exportPath, conf.mongodb.db);
  const dir = fs.readdirSync(collectionPath);
  if (folder && dir) {
    dir.forEach((filename, index) => {
      const stream = fs.createReadStream(path.join(collectionPath, filename));
      folder.file(filename, stream);
    });
  }

  const filename = conf.mongodb.db + '.zip';
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.body = zip.generateNodeStream();
});

router.post('/clear-collection', async ctx => {
  const collection = mongoose.connection.collections[ctx.request.body.collectionName];
  if (collection) {
    ctx.body = await collection.deleteMany({});
  }
});

router.post('/import-collection', koaBody({
  multipart: true,
  formidable: {maxFileSize: 8000 * 1024 * 1024}
}), async ctx => {
  const file = (ctx.request as any).files.file;
  try {
    const stream = fs.createReadStream(file.filepath);
    const zip = await JSZip.loadAsync(await utils.readFile(stream));
    const tick = new Date().getTime();
    const dbPath = `/tmp/import${tick}/${conf.mongodb.db}`;
    fs.mkdirSync(`/tmp/import${tick}`);
    fs.mkdirSync(dbPath);
    const folder = zip.folder(conf.mongodb.db);
    if (folder) {
      folder.forEach((relativePath, file) => {
        if (!file.dir) {
          const fileStream = fs.createWriteStream(path.join(dbPath, relativePath));
          file.nodeStream().pipe(fileStream);
        }
      });
    }
    const cmd = `mongorestore -h ${conf.mongodb.host}:${conf.mongodb.port} --authenticationDatabase=${conf.mongodb.db} --username=${conf.mongodb.uid} --password=${conf.mongodb.pwd} --drop /tmp/import${tick}`;
    ctx.body = await executeCommand(cmd);
  } catch (err: any) {
    console.error(err);
  } finally {
    if (file) {
      fs.unlinkSync(file.filepath);
    }
  }
});

router.get('/export-dzd-data', async ctx => {
  const zip = new JSZip();
  const tasks = await Task.find({}).lean();
  zip.file('tasks.json', JSON.stringify(tasks));
  const folder = zip.folder('files');
  const dzdFileGridFS = getDzdGridFSBucket();
  const iterator = dzdFileGridFS.find({});

  let count = 0;
  if (folder && iterator) {
    for (let dzdFile = await iterator.next(); dzdFile != null; dzdFile = await iterator.next()) {
      try {
        // @ts-ignore
        const subFolder = folder.folder(dzdFile._id.toHexString());
        if (subFolder) {
          // @ts-ignore
          const stream = dzdFileGridFS.openDownloadStream(dzdFile._id);
          // @ts-ignore
          if (dzdFile.metadata.fileType.includes('htm')) {
            // @ts-ignore
            subFolder.file(dzdFile.filename + dzdFile.metadata.fileType, stream);
          } else {
            subFolder.file(dzdFile.filename, stream);
          }
          subFolder.file('metadata.json', JSON.stringify(dzdFile));
          count++;
        }
      } catch (err: any) {
        console.error('文件' + dzdFile._id + '导出错误：' + err.message);
        console.error(err);
      }
    }
  }

  const now = new Date();
  const comment = 'time: ' + utils.formatDateTime(now) + ', count: ' + count;
  const filename = '定值单备份' + utils.formatDateTime(now, 'yyyyMMddhhmmss') + '.zip';
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', 'attachment; filename=' + encode(filename) + '; filename*=utf-8\'\'' + encode(filename));
  ctx.body = zip.generateNodeStream({
    type: 'nodebuffer',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 4
    },
    encodeFileName(filename: string): string {
      return iconv.encode(filename, 'gbk').toString();
    },
    comment: iconv.encode(comment, 'gbk').toString()
  });
});

export default router;
