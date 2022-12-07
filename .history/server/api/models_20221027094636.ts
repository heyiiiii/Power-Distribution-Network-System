import fs from 'fs';
import stream from 'stream';
import readline from 'readline';
import Router from 'koa-router';
import koaBody from 'koa-body';
import xml2js from 'xml2js';
import JSZip, { JSZipObject } from 'jszip';
import moment from 'moment';
import iconv from 'iconv-lite';
import conf from '../../configs';
import {
  ConductorType,
  toObjectId,
  Substation,
  ISessInfo,
  Voltage,
  IVoltage,
  ISubstation,
  IConductorType,
  Bus,
  IBus,
  Line,
  ILine,
  LineSegment,
  Breaker,
  ILineSegment,
  Transformer,
  Svg,
  getSvgFSBucket,
  IBreaker,
  Xml,
  getXmlFSBucket,
  Type,
  XmlVoltage,
  Current,
  ICurrent,
  Calculate,
  ICalculate,
  ProtectModel,
  getStructureBucket,
  Structure
} from '../mongo-schema';
import Utils, { saveStructure, getCapacity, SftpUtil } from '../utils';

const router = new Router({ prefix: '/models' });

// 厂站
/** @deprecated */
router.post('/substation/create', async (ctx, next) => {
  try {
    const { name, voltage, subType, state, maintainTime, description } = ctx.request.body;
    // @ts-ignore
    const session: ISessInfo = ctx.session;
    if (!session) {
      throw new Error('缺少用户session');
    }
    const substation = new Substation({
      name,
      subType,
      state,
      voltage,
      maintainTime,
      description,
      modifier: toObjectId(session.user._id)
    });
    ctx.body = {
      succ: true,
      result: await substation.save()
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
});

/** @deprecated */
router.post('/substation/update/:id', async (ctx, next) => {
  try {
    const id = ctx.params.id;
    const body: ISubstation = ctx.request.body;
    const substation = await Substation.findById(toObjectId(id));
    if (!substation) {
      throw new Error('更新失败，未查询到结果');
    }
    // @ts-ignore
    const session: ISessInfo = ctx.session;
    if (!session) {
      throw new Error('缺少用户session');
    }
    body.modifier = toObjectId(session.user._id);
    ctx.body = {
      succ: true,
      result: await substation!.updateOne(body)
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
});

router.post('/substation/list', async (ctx, next) => {
  try {
    const { startRow = 0, endRow = 0 } = ctx.request.body;
    const count = await Substation.countDocuments({});
    const rows = await Substation.find({
      areaCode: Number(ctx.headers['area-code'])
    })
      .sort({ name: 1 })
      .skip(startRow)
      .limit(endRow - startRow);
    ctx.body = {
      succ: true,
      result: { count, rows }
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
});

router.delete('/substation/delete/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const areaCode = Number(ctx.headers['area-code']);
  const sub: ISubstation = await Substation.findById(toObjectId(id)).lean();
  const buses = await Bus.find({
    _id: {
      $in: sub.buses.map((x: any) => toObjectId(x))
    },
    areaCode
  });
  for (const bus of buses) {
    // 删除母线下所有线路
    const lines = await Line.find({
      bus: toObjectId(bus._id),
      areaCode
    }).lean();
    // 删除线路下的设备
    for (const line of lines) {
      const { _id: lineId, svg: lineSvg } = line;
      await Breaker.deleteMany({
        line: toObjectId(lineId),
        areaCode
      });
      await Transformer.deleteMany({
        line: toObjectId(lineId),
        areaCode
      });
      await Bus.deleteMany({
        line: toObjectId(lineId),
        areaCode
      });
      await LineSegment.deleteMany({
        line: toObjectId(lineId),
        areaCode
      });
      await Xml.deleteMany({
        'metadata.line': lineSvg,
        'metadata.areaCode': areaCode
      });
      await Svg.deleteMany({
        'metadata.line': lineSvg,
        'metadata.areaCode': areaCode
      });
      await Structure.deleteMany({
        'metadata.svgId': lineSvg,
        'metadata.areaCode': areaCode
      });
    }
    await Line.deleteMany({
      bus: toObjectId(bus._id),
      areaCode
    });
  }
  await Bus.deleteMany({
    _id: {
      $in: sub.buses.map((x: any) => toObjectId(x))
    },
    areaCode
  });

  ctx.body = {
    succ: true,
    result: await Substation.deleteOne({
      _id: toObjectId(id),
      areaCode
    })
  };
});

// 数据导入
router.post('/data/import/sftp', async (ctx) => {
  const filePath = '';
  const sftp = new SftpUtil(conf.dz.local);
  const file: any = await sftp.getFile(filePath);
  if (!file) {
    throw new Error('文件丢失');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  await importData({
    filepath: file.path,
    session,
    areaCode: Number(ctx.headers['area-code'])
  });
  ctx.body = {
    succ: true
  };
});
router.post('/data/import', koaBody({
  multipart: true,
  formidable: { maxFileSize: 5000 * 1024 * 1024 }
}), async (ctx, next) => {
  const file: any = ctx.request.files ? ctx.request.files.file : null;
  if (!file) {
    throw new Error('文件丢失');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  await importData({
    filepath: file.path,
    session,
    areaCode: Number(ctx.headers['area-code'])
  });
  ctx.body = {
    succ: true
  };
});

router.post('/xml-structure/import', koaBody({
  multipart: true,
  formidable: { maxFileSize: 5000 * 1024 * 1024 }
}), async (ctx, next) => {
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const file: any = ctx.request.files ? ctx.request.files.file : null;
  if (!file) {
    throw new Error('文件丢失');
  }
  const { path } = file;
  const fileData = await readFile(fs.createReadStream(path));
  const jsZip: JSZip = await JSZip.loadAsync(fileData, {
    decodeFileName: (bytes: any) => {
      return iconv.decode(bytes, 'gbk');
    }
  });
  const map: any = {};
  jsZip.forEach((path, f) => {
    const p = path.split('/')[0];
    if (!map[p]) {
      map[p] = {};
    }
    if (path.endsWith('.svg')) {
      map[p].svg = f;
      map[p].svgPath = path;
    }
    if (path.endsWith('.xml')) {
      map[p].xml = f;
      map[p].xmlPath = path;
    }
  });
  const structureMap: Map<string, object> = new Map();
  const promises = [];
  const xmlParser = new xml2js.Parser();

  for (const path in map) {
    // eslint-disable-next-line no-async-promise-executor
    promises.push(new Promise(async (resolve) => {
      let s = await map[path].xml.async('string');
      let json = null;
      if (s.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
        s = await map[path].xml.async('binarystring');
        json = await xmlParser.parseStringPromise(iconv.decode(Buffer.from(s, 'binary'), 'GBK').toString());
      } else {
        json = await xmlParser.parseStringPromise(s);
      }
      const { deviceTypes, substations, feeders } = toXml2(json['rdf:RDF']);
      const subType = toObject(deviceTypes.find((x: any) => toObject(x).name === '变电站'));
      const subNode = toObject(substations.find((x: any) => toObject(x).typeId === subType.id));
      const feederNode = toObject(feeders.find((x: any) => toObject(x).substation === subNode.id));

      let svgString = await map[path].svg.async('string');
      let svgContent = null;
      if (svgString.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
        svgString = await map[path].svg.async('binarystring');
        svgContent = await xmlParser.parseStringPromise(iconv.decode(Buffer.from(svgString, 'binary'), 'GBK').toString());
      } else {
        svgContent = await xmlParser.parseStringPromise(svgString);
      }

      const structure: any = saveStructure(json, svgContent);
      structureMap.set(feederNode.svgId, {
        filename: map[path].xmlPath.split('/')[1].split('.')[0] + '.json',
        svgId: feederNode.svgId,
        xml: structure.xml,
        svg: structure.svg,
        modifier: toObjectId(session.user._id)
      });
      resolve('');
    }));
  }
  await Promise.all(promises);

  // xml拓扑
  const structureList = Array.from(structureMap.values());
  const areaCode = Number(ctx.headers['area-code']);
  await Structure.deleteMany({
    'metadata.svgId': { $in: structureList.map((x: any) => x.svgId) },
    'metadata.areaCode': areaCode
  });
  for (const structure of structureList as Array<any>) {
    const { filename, xml, svg, svgId } = structure;
    const s = getStructureBucket().openUploadStream(filename, {
      metadata: {
        svgId,
        areaCode,
        modifier: toObjectId(session.user._id)
      }
    });
    s.end(Buffer.from(JSON.stringify({ svg, xml })));
    await waitForWriteStream(s);
  }

  ctx.body = {
    succ: true
  };
});

router.get('/xml/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const areaCode = Number(ctx.headers['area-code']);
  const found: any = await Xml.findOne({
    'metadata.line': id,
    'metadata.areaCode': areaCode
  }).lean();
  if (found === null) {
    ctx.body = {
      succ: false,
      result: '未找到xml文件'
    };
    return next();
  }
  const xmlFileStream = getXmlFSBucket().openDownloadStream(found._id);
  const xmlFileData = await readFile(xmlFileStream);
  const xmlFileString = xmlFileData.toString();
  const xmlParser = new xml2js.Parser();
  let str = null;
  let result = {};

  if (xmlFileString.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
    str = iconv.decode(xmlFileData, 'gbk').toString();
  } else {
    str = xmlFileString;
  }

  xmlParser.parseString(str, (err: any, json: any) => {
    if (err) {
      return;
    }
    result = json;
  });
  ctx.body = {
    succ: true,
    result
  };
});

// 电压等级
/** @deprecated */
router.post('/voltage/create', async (ctx, next) => {
  const { name, ubase, ubaseMax, ubaseMin, ibase, zbase, color, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const voltage = new Voltage({
    name,
    ubase: Number(ubase),
    ubaseMax: Number(ubaseMax),
    ubaseMin: Number(ubaseMin),
    ibase: Number(ibase),
    zbase: Number(zbase),
    color,
    description,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await voltage.save()
  };
});

/** @deprecated */
router.post('/voltage/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: IVoltage = ctx.request.body;
  const voltage = await Voltage.findById(toObjectId(id));
  if (!voltage) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await voltage!.updateOne(body)
  };
});

/** @deprecated */
router.get('/voltage/list', async (ctx, next) => {
  try {
    ctx.body = {
      succ: true,
      result: await Voltage.find({}).lean()
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
});

/** @deprecated */
router.delete('/voltage/delete/:id', async (ctx, next) => {
  try {
    const id = ctx.params.id;
    ctx.body = {
      succ: true,
      result: await Voltage.deleteOne({ _id: toObjectId(id) })
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
});

/** @deprecated */
router.post('/voltage/calc-izvalue-base', ctx => {
  const { ubase, basepower } = ctx.request.body;
  ctx.body = Utils.calcIZValueBase(basepower, ubase);
});

// 导线型号库
router.get('/conductor-types/list', async ctx => {
  ctx.body = {
    succ: true,
    result: await ConductorType.find({}).lean()
  };
});

router.post('/conductor-types/create', async (ctx, next) => {
  const { name, overhead, gvalMR, rvalPerKM, xvalPerKM, rvalDivR0, xvalDivX0, safeCurrent, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const conductorType = new ConductorType({
    name,
    overhead,
    gvalMR: Number(gvalMR),
    rvalPerKM: Number(rvalPerKM),
    xvalPerKM: Number(xvalPerKM),
    rvalDivR0: Number(rvalDivR0),
    xvalDivX0: Number(xvalDivX0),
    safeCurrent: Number(safeCurrent),
    description,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await conductorType.save()
  };
});

router.post('/conductor-types/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: IConductorType = ctx.request.body;
  const conductorType = await ConductorType.findById(toObjectId(id));
  if (!conductorType) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await conductorType!.updateOne(body)
  };
});

router.delete('/conductor-types/delete/:id', async (ctx, next) => {
  const id = ctx.params.id;
  ctx.body = {
    succ: true,
    result: await ConductorType.deleteOne({ _id: toObjectId(id) })
  };
});

router.post('/conductor-types/import', koaBody({
  multipart: true,
  formidable: { maxFileSize: 5000 * 1024 * 1024 }
}), async (ctx, next) => {
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const file: any = ctx.request.files!.file || null;
  if (!file) {
    throw new Error('文件丢失');
  }
  await fs.readFile(file.path, 'utf-8', async (err, data) => {
    if (err) {
      throw new Error('文件读取出错');
    }
    const arr = [];
    for (const conductor of JSON.parse(data)) {
      const { name, overhead, gvalMR, rvalPerKM, xvalPerKM, rvalDivR0, xvalDivX0, safeCurrent, description } = conductor;
      const obj = {
        name,
        overhead,
        gvalMR: Number(gvalMR),
        rvalPerKM: Number(rvalPerKM),
        xvalPerKM: Number(xvalPerKM),
        rvalDivR0: Number(rvalDivR0),
        xvalDivX0: Number(xvalDivX0),
        safeCurrent: Number(safeCurrent),
        description,
        modifier: toObjectId(session.user._id)
      };
      arr.push(obj);
    }
    await ConductorType.insertMany(arr);
  });
  ctx.body = {
    succ: true
  };
});

// 母线
router.post('/bus/list', async (ctx, next) => {
  const busIdList = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Bus.find({
      _id: {
        $in: busIdList
      },
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

//根据过滤后的breakerId用于对过滤后数据的刷新 --Jyz
router.post('/filterCt/list', async ctx => {
  const filterIdList = ctx.request.body;
  let breakerData = [];
  for (const ids of filterIdList) {
    breakerData.push(await Breaker.findOne().where('_id').in(ids).exec());
  }
  ctx.body = {
    succ: true,
    result: breakerData
  }
});

//  查询满足ct索引的母线(前端需要传入符合的id数组来) --Jyz
router.post('/bus/ctlist', async (ctx, next) => {
  const busIdList = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Bus.find({
      _id: {
        $in: busIdList
      },
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

router.get('/bus/list/:line', async (ctx, next) => {
  const condition = {
    line: toObjectId(ctx.params.line),
    areaCode: Number(ctx.headers['area-code'])
  };
  ctx.body = {
    succ: true,
    result: await Bus.find(condition).sort({ name: 1 })
  };
});

router.get('/bus/:svg', async (ctx, next) => {
  ctx.body = {
    succ: true,
    result: await Bus.findOne({
      svg: ctx.params.svg,
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

router.post('/bus/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: IBus = ctx.request.body;
  const bus = await Bus.findById(toObjectId(id));
  if (!bus) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await bus!.updateOne(body)
  };
});

/** @deprecated */
router.post('/bus/create', async (ctx, next) => {
  const { name, substation, voltage, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const bus = new Bus({
    name,
    description,
    modifier: toObjectId(session.user._id)
  });
  substation && (bus.substation = toObjectId(substation));
  voltage && (bus.voltage = toObjectId(voltage));
  ctx.body = {
    succ: true,
    result: await bus.save()
  };
});

/** @deprecated */
router.delete('/bus/delete/:id', async (ctx, next) => {
  const id = ctx.params.id;
  // 删除母线下所有线路
  const lines = await Line.find({ bus: toObjectId(id) }).lean();
  // 删除线路下的设备
  for (const line of lines) {
    const { _id: lineId, svg: lineSvg } = line;
    await Breaker.deleteMany({ line: toObjectId(lineId) });
    await Transformer.deleteMany({ line: toObjectId(lineId) });
    await Bus.deleteMany({ line: toObjectId(lineId) });
    await LineSegment.deleteMany({ line: toObjectId(lineId) });
    await Xml.deleteMany({ 'metadata.line': lineSvg });
    await Structure.deleteMany({ 'metadata.svgId': lineSvg });
  }
  await Line.deleteMany({ bus: toObjectId(id) });

  ctx.body = {
    succ: true,
    result: await Bus.deleteOne({ _id: toObjectId(id) })
  };
});

// 线路
router.post('/line/list', async (ctx, next) => {
  const lineIdList = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Line.where('_id').in(lineIdList).exec()
  };
});

// 获取所有线路。--Jyz
router.post('/allLine/list', async (ctx, next) => {
  ctx.body = {
    succ: true,
    result: await Line.find({
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

// 根据line获取母线。--Jyz
router.post('/busByLine/list', async (ctx, next) => {
  const { linebusid: lineBusId = [] }: any = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Bus.find({
      _id: {
        $in: lineBusId
      },
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

// 查询所有母线
router.post('/allBuses/list', async (ctx, next) => {

  ctx.body = {
    succ: true,
    result: await Bus.find().exec()
  };
});

// 获取多条线路。--Jyz
router.post('/line/lists', async ctx => {
  const { linesList: lineList = [] }: any = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Line.find({
      _id: {
        $in: lineList
      },
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

// 根据line._id查询breaker --Jyz
router.post('/breaker/lineid/list', async (ctx, next) => {
  const body: Array<any> = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Breaker.where('line').in(body).exec()
  };
});

// 根据拿到的breaker的svg将其funcType设置为outlet --Jyz
router.post('/updateBreaker/svgList', async (ctx, next) => {
  const breakerSvgs = ctx.request.body.filtedBreakerSvg
  ctx.body = {
    succ: true,
    result: await Breaker.updateMany({
      svg: {
        $in: breakerSvgs
      },
      areaCode: Number(ctx.headers['area-code'])
    }, { $set: { funcType: 'outlet' } })
  };
});

router.post('/line/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: ILine = ctx.request.body;
  const line = await Line.findById(toObjectId(id));
  if (!line) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await line!.updateOne(body)
  };
});

/** @deprecated */
router.post('/line/create', async (ctx, next) => {
  const { name, bus, cutA, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const line = new Line({
    name,
    cutA,
    bus: toObjectId(bus),
    description,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await line.save()
  };
});

/** @deprecated */
router.delete('/line/delete/:id/:svgId', async (ctx, next) => {
  const id = ctx.params.id;
  const svgId = ctx.params.svgId;

  // 删除线路下的所有设备
  await Breaker.deleteMany({ line: toObjectId(id) });
  await Transformer.deleteMany({ line: toObjectId(id) });
  await Bus.deleteMany({ line: toObjectId(id) });
  await LineSegment.deleteMany({ line: toObjectId(id) });
  await Xml.deleteMany({ 'metadata.line': svgId });
  await Structure.deleteMany({ 'metadata.svgId': svgId });

  ctx.body = {
    succ: true,
    result: await Line.deleteOne({ _id: toObjectId(id) })
  };
});

// 线路段
router.post('/segment/list', async (ctx, next) => {
  const body: Array<any> = ctx.request.body;
  const data = await LineSegment.find({
    _id: {
      $in: body
    },
    areaCode: Number(ctx.headers['area-code'])
  }).lean();
  const result = [];
  for (const item of body) {
    result.push(data.find((x: any) => x._id.toHexString() === item));
  }
  ctx.body = {
    succ: true,
    result
  };
});

router.get('/segment/list/:line', async (ctx, next) => {
  const condition = {
    line: toObjectId(ctx.params.line),
    areaCode: Number(ctx.headers['area-code'])
  };
  ctx.body = {
    succ: true,
    result: await LineSegment.find(condition).sort({ name: 1 })
  };
});

router.get('/segment/:svg', async (ctx, next) => {
  ctx.body = {
    succ: true,
    result: await LineSegment.findOne({
      svg: ctx.params.svg,
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

router.post('/segment/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: ILineSegment = ctx.request.body;
  const lineSegment = await LineSegment.findById(toObjectId(id));
  if (!lineSegment) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await lineSegment!.updateOne(body)
  };
});

/** @deprecated */
router.post('/segment/create', async (ctx, next) => {
  const { lineType, conductorType, length, index, sectionSurface, ground, circuit, startDeviceId, startDeviceType,
    endDeviceId, endDeviceType, valR1, valX1, valR0, valX0
  } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const lineSegment = new LineSegment({
    lineType,
    conductorType: toObjectId(conductorType),
    length: Number(length),
    index: Number(index),
    sectionSurface: Number(sectionSurface),
    ground,
    circuit,
    startDeviceId: toObjectId(startDeviceId),
    startDeviceType,
    endDeviceId: toObjectId(endDeviceId),
    endDeviceType,
    valR1,
    valX1,
    valR0,
    valX0,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await lineSegment.save()
  };
});

/** @deprecated */
router.delete('/segment/delete/:id', async (ctx, next) => {
  const id = ctx.params.id;
  ctx.body = {
    succ: true,
    result: await LineSegment.deleteOne({ _id: toObjectId(id) })
  };
});

// 开关
router.post('/breaker/list', async (ctx, next) => {
  const body: Array<any> = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Breaker.find({
      _id: {
        $in: body
      },
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

router.get('/breaker/list/:line', async (ctx, next) => {
  const condition = {
    line: toObjectId(ctx.params.line),
    areaCode: Number(ctx.headers['area-code'])
  };
  ctx.body = {
    succ: true,
    result: await Breaker.find(condition).sort({ name: 1 })
  };
});

router.post('/breaker/condition/list', async (ctx, next) => {
  const body: any = ctx.request.body;
  const condition: any = {
    areaCode: Number(ctx.headers['area-code'])
  };
  if (body.line) {
    condition.line = toObjectId(body.line);
  }
  if (body.svgList) {
    condition.svg = {
      $in: body.svgList
    };
  }
  if (body.isHavenProtect) {
    condition.protect = {
      $exists: true
    };
  }
  if (body.funcType) {
    condition.funcType = body.funcType;
  }
  if (body.calculateType) {
    condition.calculateType = {
      $in: body.calculateTypeList
    };
  }
  ctx.body = {
    succ: true,
    result: await Breaker.find(condition)
  };
});

router.get('/breaker/:lineId/:svg', async (ctx, next) => {
  const { svg, lineId } = ctx.params;
  const line: any = await Line.findById(toObjectId(lineId)).lean();
  if (line === null) {
    throw new Error('线路不存在');
  }
  const capacityList = await getCapacity(line.svg, svg, Number(ctx.headers['area-code']));
  const breaker: any = await Breaker.findOne({
    svg: ctx.params.svg,
    areaCode: Number(ctx.headers['area-code'])
  });
  breaker.set(capacityList);
  await breaker.save();

  const result: any = Object.assign({}, breaker.toObject());
  if (result.protect) {
    const protectModel: any = await ProtectModel.findById(toObjectId(result.protect)).lean();
    if (protectModel) {
      result.protectName = protectModel.metadata.modelNumber;
    }
  }
  ctx.body = {
    succ: true,
    result
  };
});

router.post('/breaker/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: IBreaker = ctx.request.body;
  const breaker = await Breaker.findById(toObjectId(id));
  if (!breaker) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await breaker!.updateOne(body)
  };
});

//  批量更新。--Jyz
router.post('/breaker/batchUpdate', async (ctx, next) => {
  const idList = ctx.request.body.idList;
  const body: IBreaker = ctx.request.body.data;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  ctx.body = {
    succ: true,
    result: await Breaker.updateMany({
      _id: {
        $in: idList
      },
      areaCode: Number(ctx.headers['area-code'])
    }, body)
  };
});

// 根据线路的svg过滤母线并分组
router.post('/line/busList', async (ctx, next) => {
  const { lineSvgList } = ctx.request.body.lineSvgList;
  const { lineIdList } = ctx.request.body.lineIdList;
  await Bus.find({
    $match: {
      svg: {
        $in: lineSvgList
      }
    },
    $group: {
      line: {
        $in: lineIdList
      }
    }
  })
})

/** @deprecated */
router.post('/breaker/create', async (ctx, next) => {
  const { name, breakerType } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const breaker = new Breaker({
    name,
    breakerType,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await breaker.save()
  };
});

// 变压器
router.post('/transformer/list', async (ctx, next) => {
  const body: Array<any> = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Transformer.find({
      _id: {
        $in: body
      },
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

router.get('/transformer/list/:line', async (ctx, next) => {
  const condition = {
    line: toObjectId(ctx.params.line),
    areaCode: Number(ctx.headers['area-code'])
  };
  ctx.body = {
    succ: true,
    result: await Transformer.find(condition).sort({ name: 1 })
  };
});

router.post('/transformer/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: IBreaker = ctx.request.body;
  const transformer = await Transformer.findById(toObjectId(id));
  if (!transformer) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await transformer!.updateOne(body)
  };
});

router.get('/transformer/:svg', async (ctx, next) => {
  ctx.body = {
    succ: true,
    result: await Transformer.findOne({
      svg: ctx.params.svg,
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

router.post('/transformer/svg/list', async (ctx, next) => {
  const body: Array<any> = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await Transformer.find({
      svg: {
        $in: body
      },
      areaCode: Number(ctx.headers['area-code'])
    }).exec()
  };
});

/** @deprecated */
router.post('/transformer/create', async (ctx, next) => {
  const { name, uk, capacity } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const transformer = new Transformer({
    name,
    uk: Number(uk),
    capacity: Number(capacity),
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await transformer.save()
  };
});

// svg
router.get('/svg/:line', async (ctx, next) => {
  const line = ctx.params.line;
  const svg = await Svg.findOne({
    'metadata.line': line,
    'metadata.areaCode': Number(ctx.headers['area-code'])
  }).lean();
  if (svg === null) {
    ctx.body = {
      succ: false,
      result: '查询失败'
    };
    return next();
  }
  ctx.set('Content-Type', 'image/svg');
  const svgStream = getSvgFSBucket().openDownloadStream(svg!._id);
  const svgData = await readFile(svgStream);
  const svgString = svgData.toString();

  if (svgString.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
    ctx.body = iconv.decode(svgData, 'gbk').toString();
  } else {
    ctx.body = svgString;
  }
});

// 设备类型
router.post('/type/list', async (ctx) => {
  const body = ctx.request.body;
  const count = await Type.countDocuments({});
  const rows = await Type.find({}).sort({ svg: 1 }).skip(body.startRow).limit(body.endRow - body.startRow);
  ctx.body = {
    succ: true,
    result: { count, rows }
  };
});

// 电压等级
router.get('/xml-voltage/list', async (ctx) => {
  ctx.body = {
    succ: true,
    result: await XmlVoltage.find({
      areaCode: Number(ctx.headers['area-code'])
    }).sort({ svg: 1 })
  };
});

// 电容电流
router.get('/current/list', async (ctx) => {
  ctx.body = {
    succ: true,
    result: await Current.find({})
  };
});

router.post('/current/create', async (ctx, next) => {
  const { voltage, value, area, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const current = new Current({
    voltage,
    area: Number(area),
    value: Number(value),
    description,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await current.save()
  };
});

router.post('/current/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: ICurrent = ctx.request.body;
  const current = await Current.findById(toObjectId(id));
  if (!current) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await current!.updateOne(body)
  };
});

router.delete('/current/delete/:id', async (ctx, next) => {
  const id = ctx.params.id;
  ctx.body = {
    succ: true,
    result: await Current.deleteOne({ _id: toObjectId(id) })
  };
});

router.get('/xml-structure/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const structure = await Structure.findOne({ 'metadata.svgId': id }).lean();
  if (structure === null) {
    ctx.body = { succ: false, result: '查询失败' };
    return next();
  }
  const stream = getStructureBucket().openDownloadStream(structure!._id);
  const data = await readFile(stream);
  const result = JSON.parse(data.toString());
  ctx.body = { succ: true, result };
});

// 定值
router.post('/calculate/create', async (ctx, next) => {
  const { params, breakerSvg } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const svgSplit = breakerSvg.split('_');
  const update = {
    params,
    breakerSvg,
    status: 0,
    areaCode: Number(ctx.headers['area-code']),
    gisId: svgSplit[1] + svgSplit[2],
    modifier: toObjectId(session.user._id)
  };
  const found: any = await Calculate.findOne({ breakerSvg });
  if (found !== null) {
    ctx.body = {
      succ: true,
      result: await found.updateOne(update)
    };
  } else {
    const calculate = new Calculate(update);
    ctx.body = {
      succ: true,
      result: await calculate.save()
    };
  }
});

router.post('/calculate/breaker/list', async (ctx) => {
  const body: any = ctx.request.body;
  const condition: any = {
    areaCode: Number(ctx.headers['area-code'])
  };
  if (body.svgList) {
    condition.breakerSvg = {
      $in: body.svgList
    };
  }
  ctx.body = {
    succ: true,
    result: await getDzBreakerList(condition)
  };
});

router.get('/calculate/:breakerSvg', async (ctx) => {
  ctx.body = {
    succ: true,
    result: await Calculate.findOne({
      breakerSvg: ctx.params.breakerSvg,
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

router.post('/calculate/condition/list', async (ctx) => {
  const body = ctx.request.body;
  const condition: any = {
    areaCode: Number(ctx.headers['area-code'])
  };
  if (body.svgList) {
    condition.breakerSvg = {
      $in: body.svgList
    };
  }
  ctx.body = {
    succ: true,
    result: await Calculate.find(condition)
  };
});

router.post('/calculate/update/:id', async (ctx, next) => {
  const id = ctx.params.id;
  const body: ICalculate = ctx.request.body;
  const calculate = await Calculate.findById(toObjectId(id));
  if (!calculate) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  body.areaCode = Number(ctx.headers['area-code']);
  ctx.body = {
    succ: true,
    result: await calculate!.updateOne(body)
  };
});

router.post('/calculate/delete/:breakerSvg', async (ctx) => {
  const breakerSvg = ctx.params.breakerSvg;
  ctx.body = {
    succ: true,
    result: await Calculate.deleteOne({
      breakerSvg,
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

// 定值召回
router.post('/dz/recall', async (ctx) => {
  const { id, substationName, lineName, gisId } = ctx.request.body;
  const ip = conf.dz.ip;
  const groupNumber = conf.dz.groupNumber;
  const time = moment().format('YYYYMMDDHHmmss');
  const fileContent = `未@定值召回命令@${substationName}@${lineName}@GISID${gisId}@IP${ip}@组号${groupNumber}@时间${time}`;
  const content = '<file>\n' + fileContent + '\n' + '</file>';

  const remoteSftp = new SftpUtil(conf.dz.remote);
  const result = await remoteSftp.uploadFile(Buffer.from(content), `${fileContent}.pwdz`);

  if (result) {
    const localSftp = new SftpUtil(conf.dz.local);
    // 删除之前的回复文件
    await localSftp.deleteFile(`GISID${Number(gisId)}@IP${ip}@组号${groupNumber}@调阅保护定值@回复.pwdz`);
    // 更新状态
    const calculate = await Calculate.findById(toObjectId(id));
    if (calculate) {
      await calculate!.updateOne({ status: 1 });
    }
  }
  ctx.body = {
    succ: true,
    result: { status: 1 }
  };
});

router.post('/dz/recall/result', async (ctx) => {
  const { id, gisId } = ctx.request.body;
  const ip = conf.dz.ip;
  const groupNumber = conf.dz.groupNumber;
  const filePath = `GISID${Number(gisId)}@IP${ip}@组号${groupNumber}@调阅保护定值@回复.pwdz`;

  const sftp = new SftpUtil(conf.dz.local);
  const file = await sftp.getFile(filePath);

  const getResult = new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const bufferStream = new stream.PassThrough({ encoding: 'binary' });
    const streams = bufferStream.end(file);
    const rl = readline.createInterface({
      input: streams,
      output: process.stdout,
      terminal: false
    });
    const info = { result: '', reason: '' };
    const data: any[] = [];
    rl.on('line', (oldLine: string) => {
      const line = iconv.decode(Buffer.from(oldLine, 'binary'), 'GBK');
      if (line === '<file>' || line === '</file>') {
        return;
      }
      const temp = line.split('@');
      if (line.includes('@调阅保护定值')) {
        info.result = temp[4];
        info.reason = temp[5];
        return;
      }
      data.push({
        group: temp[0],
        address: temp[1],
        name: temp[2],
        type: temp[3],
        scope: temp[4],
        stepSize: temp[5],
        value: temp[6],
        sign: temp[7]
      });
    });
    rl.on('close', () => {
      resolve({ info, data });
    });
  });

  const result = await getResult;
  if (result) {
    const calculate = await Calculate.findById(toObjectId(id));
    if (calculate) {
      await calculate!.updateOne({ recallResult: result, status: 2 });
    }
  }
  ctx.body = {
    succ: true,
    result: { recallResult: result, status: 2 }
  };
});

router.post('/dz/modify', async (ctx) => {
  const { id, substationName, lineName, breakerName, gisId, update } = ctx.request.body;
  const getRows = () => {
    let rows = '';
    for (const row of update) {
      const { address, name, value } = row;
      rows = rows + `@${address}@${name}@${value}\n`;
    }
    return rows;
  };
  const ip = conf.dz.ip;
  const groupNumber = conf.dz.groupNumber;
  const time = moment().format('YYYYMMDDHHmmss');
  const number = time + '' + Math.floor(Math.random() * 100);
  const content = '<file>\n' +
    `#${number}@${substationName}@${lineName}@${breakerName}@GISID${gisId}@Ip${ip}@组号${groupNumber}@定值区号\n` +
    getRows() +
    '</file>';

  const sftp = new SftpUtil(conf.dz.remote);
  const result = await sftp.uploadFile(Buffer.from(content), `未@待执行定值@${number}@GISID${gisId}@IP${ip}@组号${groupNumber}@时间${time}.pwdz`);
  if (result) {
    const calculate = await Calculate.findById(toObjectId(id));
    if (calculate) {
      await calculate!.updateOne({ sendTime: time, status: 3, number });
    }
  }
  ctx.body = {
    succ: true,
    result: { sendTime: time, status: 3, number }
  };
});

router.post('/dz/modify/result', async (ctx) => {
  const { id, number, gisId, sendTime } = ctx.request.body;
  const ip = conf.dz.ip;
  const groupNumber = conf.dz.groupNumber;
  const fileName = `@${number}@GISID${gisId}@IP${ip}@组号${groupNumber}@时间${sendTime}.pwdz`;

  const sftp = new SftpUtil(conf.dz.local);

  const failFile = await sftp.getFile('已@执行失败' + fileName);
  const fail = new Promise((resolve) => {
    if (!failFile) {
      resolve(null);
      return;
    }
    const bufferStream = new stream.PassThrough({ encoding: 'binary' });
    const streams = bufferStream.end(failFile);
    const rl = readline.createInterface({
      input: streams,
      output: process.stdout,
      terminal: false
    });
    const info = { result: '', reason: '' };
    const data: any[] = [];
    rl.on('line', (oldLine: string) => {
      const line = iconv.decode(Buffer.from(oldLine, 'binary'), 'GBK');
      if (line === '<file>' || line === '</file>') {
        return;
      }
      const temp = line.split('@');
      if (line.includes('已@执行失败')) {
        info.result = temp[1];
        info.reason = temp[7];
        return;
      }
      data.push({
        status: temp[0],
        address: temp[1],
        name: temp[2]
      });
    });
    rl.on('close', () => {
      resolve({ info, data });
    });
  });

  const revokeFile = await sftp.getFile('已@撤销成功' + fileName);
  const revoke = new Promise((resolve) => {
    if (!revokeFile) {
      resolve(null);
      return;
    }
    const bufferStream = new stream.PassThrough({ encoding: 'binary' });
    const streams = bufferStream.end(revokeFile);
    const rl = readline.createInterface({
      input: streams,
      output: process.stdout,
      terminal: false
    });
    const info = { result: '', reason: '' };
    const data: any[] = [];
    rl.on('line', (oldLine: string) => {
      const line = iconv.decode(Buffer.from(oldLine, 'binary'), 'GBK');
      if (line === '<file>' || line === '</file>') {
        return;
      }
      const temp = line.split('@');
      if (line.includes('已@撤销成功')) {
        info.result = temp[1];
        info.reason = temp[7];
        return;
      }
      data.push({
        address: temp[1],
        name: temp[2],
        value: temp[3]
      });
    });
    rl.on('close', () => {
      resolve({ info, data });
    });
  });

  const successFile = await sftp.getFile('已@执行成功' + fileName);
  const success = new Promise((resolve) => {
    if (!successFile) {
      resolve(null);
      return;
    }
    const bufferStream = new stream.PassThrough({ encoding: 'binary' });
    const streams = bufferStream.end(successFile);
    const rl = readline.createInterface({
      input: streams,
      output: process.stdout,
      terminal: false
    });
    const info = { result: '', reason: '' };
    const data: any[] = [];
    rl.on('line', (oldLine: string) => {
      const line = iconv.decode(Buffer.from(oldLine, 'binary'), 'GBK');
      if (line === '<file>' || line === '</file>') {
        return;
      }
      const temp = line.split('@');
      if (line.includes('已@执行成功')) {
        info.result = temp[1];
        info.reason = temp[7];
        return;
      }
      data.push({
        status: temp[0],
        address: temp[1],
        name: temp[2]
      });
    });
    rl.on('close', () => {
      resolve({ info, data });
    });
  });

  const result = (await success) || (await revoke) || (await fail) || null;
  if (result) {
    const calculate = await Calculate.findById(toObjectId(id));
    if (calculate) {
      await calculate!.updateOne({ modifyResult: result, status: 4 });
    }
  }
  ctx.body = {
    succ: true,
    result: { modifyResult: result, status: 4 }
  };
});

router.post('/ct/list', async ctx => {
  const { calculateTypeList = [] }: any = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await getCtBreakerList({
      calculateType: {
        $in: calculateTypeList
      },
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

router.post('/outgoing-line/list', async ctx => {
  const { outletTypeList = [] }: any = ctx.request.body;
  ctx.body = {
    succ: true,
    result: await getCtBreakerList({
      funcType: {
        $in: outletTypeList
      },
      areaCode: Number(ctx.headers['area-code'])
    })
  };
});

async function getCtBreakerList(condition: any) {
  const breakerList = await Breaker.find(condition)
    .populate('line').lean();
  const busCache: any[] = [];
  const subCache: any[] = [];
  for (const breaker of breakerList) {
    // 查询母线
    let bus: any = {};
    const busFound = busCache.find((x: any) => x.lines.includes(toObjectId(breaker.line)));
    if (busFound) {
      bus = busFound;
    } else {
      bus = await Bus.findOne({ lines: { $elemMatch: { $eq: toObjectId(breaker.line) } } }).lean();
      busCache.push(bus);
    }

    // 查询厂站
    let sub: any = {};
    // @ts-ignore
    const subFound = subCache.find((x: any) => x.buses.includes(toObjectId(bus._id)));
    if (subFound) {
      sub = subFound;
    } else {
      sub = await Substation.findOne({ buses: { $elemMatch: { $eq: toObjectId(bus._id) } } }).lean();
      subCache.push(sub);
    }
    // @ts-ignore
    breaker.substation = sub;
    // @ts-ignore
    breaker.bus = bus;
  }
  return breakerList;
}

function readFile(readerStream: stream.Readable): Promise<Buffer> {
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

function waitForWriteStream(stream: stream.Writable) {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve(true);
    });
    stream.on('error', err => {
      reject(err);
    });
  });
}

async function getDzBreakerList(condition: any) {
  const calculateList = await Calculate.find(condition).lean();
  const breakerList = await Breaker.find({
    areaCode: condition.areaCode,
    svg: {
      $in: calculateList.map((x: any) => x.breakerSvg)
    }
  }).populate('line').lean();

  const busCache: any[] = [];
  const subCache: any[] = [];
  for (const breaker of breakerList) {
    // 查询母线
    let bus: any = {};
    const busFound = busCache.find((x: any) => x.lines.includes(toObjectId(breaker.line)));
    if (busFound) {
      bus = busFound;
    } else {
      bus = await Bus.findOne({
        lines: {
          $elemMatch: {
            $eq: toObjectId(breaker.line)
          }
        }
      }).lean();
      busCache.push(bus);
    }
    // 查询厂站
    let sub: any = {};
    const subFound = subCache.find((x: any) => x.buses.includes(toObjectId(bus._id)));
    if (subFound) {
      sub = subFound;
    } else {
      sub = await Substation.findOne({
        buses: {
          $elemMatch: {
            $eq: toObjectId(bus._id)
          }
        }
      }).lean();
      subCache.push(sub);
    }
    // @ts-ignore
    breaker.substation = sub;
    // @ts-ignore
    breaker.calc = calculateList.find((x: any) => x.breakerSvg === breaker.svg);
  }
  return breakerList;
}

function toXml2(data: any) {
  return {
    geographicalRegion: data['cim:GeographicalRegion'] || [],
    subGeographicalRegion: data['cim:SubGeographicalRegion'] || [],
    voltageLevels: data['cim:VoltageLevel'] || [],
    voltages: data['cim:BaseVoltage'] || [],
    feeders: data['cim:Feeder'] || [],
    deviceTypes: data['cim:PSRType'],
    breakers: data['cim:Breaker'] || [],
    buses: data['cim:BusbarSection'] || [],
    substations: data['cim:Substation'] || [],
    transformers: data['cim:PowerTransformer'] || [],
    transformerEnds: data['cim:PowerTransformerEnd'] || [],
    pts: data['cim:PotentialTransformer'] || [],
    cts: data['cim:CurrentTransformer'] || [],
    segments: data['cim:ACLineSegment'] || [],
    fuses: data['cim:Fuse'] || [],
    loadBreakSwitches: data['cim:LoadBreakSwitch'] || [],
    disconnectors: data['cim:Disconnector'] || [],
    groundDisconnectors: data['cim:GroundDisconnector'] || [],
    surgeArrester: data['cim:SurgeArrester'] || [],
    ground: data['cim:Ground'] || []
  };
}

async function importData({ filepath, session, areaCode }: {
  filepath: string,
  session: any,
  areaCode: number
}) {
  const fileData: Buffer = await readFile(fs.createReadStream(filepath));
  const jsZip: JSZip = await JSZip.loadAsync(fileData, {
    decodeFileName: (bytes: any) => {
      return iconv.decode(bytes, 'gbk');
    }
  });
  const map: any = {};
  jsZip.forEach((path: string, f: JSZipObject) => {
    // 数据参数
    let params: any = {};
    if (path.endsWith('.svg')) {
      params = { svg: f, svgPath: path };
    }
    if (path.endsWith('.xml')) {
      params = { xml: f, xmlPath: path };
    }
    // 对应key
    const prefix: string = path.split('/')[0];
    map[prefix] = map[prefix] || {};
    Object.assign(map[prefix], params);
  });

  const subMap: Map<string, object> = new Map();
  const voltageMap: Map<string, object> = new Map();
  const typeMap: Map<string, object> = new Map();
  const structureMap: Map<string, object> = new Map();
  const breakerMap: Map<string, object> = new Map();
  const segmentMap: Map<string, object> = new Map();
  const busMap: Map<string, object> = new Map();
  const transformerMap: Map<string, object> = new Map();
  const promises = [];
  const xmlParser = new xml2js.Parser();

  for (const path in map) {
    // eslint-disable-next-line no-async-promise-executor
    promises.push(new Promise(async (resolve) => {
      let str = await map[path].xml.async('string');
      let json = null;
      if (str.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
        str = await map[path].xml.async('binarystring');
        json = await xmlParser.parseStringPromise(iconv.decode(Buffer.from(str, 'binary'), 'GBK').toString());
      } else {
        json = await xmlParser.parseStringPromise(str);
      }
      const {
        deviceTypes, substations, buses, feeders, breakers, loadBreakSwitches, disconnectors, groundDisconnectors,
        fuses, segments, transformers, transformerEnds, voltages, voltageLevels, geographicalRegion, subGeographicalRegion
      } = toXml2(json['rdf:RDF']);
      const subType = toObject(deviceTypes.find((x: any) => toObject(x).name === '变电站'));
      const subNode = toObject(substations.find((x: any) => toObject(x).typeId === subType.id));
      const busNode = toObject(buses.find((x: any) => toObject(x).substation === subNode.id));
      const feederNode = toObject(feeders.find((x: any) => toObject(x).substation === subNode.id));
      const getSub = async () => {
        const geoList = [];
        for (const geo of geographicalRegion) {
          const geoObject: any = {};
          const geoNode = toObject(geo);
          geoObject.geographicalRegion = {
            id: geoNode.svgId,
            name: geoNode.name
          };
          const subGeo = subGeographicalRegion.find((x: any) => toObject(x).region === geoNode.id);
          if (subGeo) {
            const subGeoNode = toObject(subGeo);
            geoObject.SubGeographicalRegion = {
              id: subGeoNode.svgId,
              name: subGeoNode.name
            };
          }
          geoList.push(geoObject);
        }
        const subFound: any = await Substation.findOne({ svg: subNode.svgId, areaCode }).lean();
        const voltageLevel = voltageLevels.find((x: any) => toObject(x).voltageLevelSub === subNode.id);
        return {
          name: subNode.name,
          subType: '变电站',
          voltage: voltageLevel ? toObject(voltageLevel).voltageLevelBase.split('#')[1] : '',
          svg: subNode.svgId,
          geographicalRegions: geoList,
          areaCode,
          modifier: toObjectId(session.user._id),
          buses: subFound ? subFound.buses : []
        };
      };
      const getBus = async () => {
        const busFound: any = await Bus.findOne({ svg: busNode.svgId, areaCode }).lean();
        return new Bus({
          name: busNode.name,
          svg: busNode.svgId,
          areaCode,
          lines: busFound ? busFound.lines : [],
          modifier: toObjectId(session.user._id)
        });
      };

      // 创建厂站
      const substation: any = await getSub();
      // 创建母线
      const bus: any = await getBus();
      // 创建厂站和母线的关系
      if (substation.buses instanceof Array) {
        substation.buses.push(bus._id);
      } else {
        substation.buses = [bus._id];
      }
      // 存入厂站集合
      const subFound: any = subMap.get(substation.svg);
      if (subFound) {
        subFound.buses = [...substation.buses];
      } else {
        subMap.set(substation.svg, substation);
      }

      // 创建线路
      const line = new Line({
        name: feederNode.name,
        bus: bus._id,
        svg: feederNode.svgId,
        areaCode,
        belong: deviceTypes.some((x: any) => toObject(x).name.includes('环网柜')) ? 'city' : 'village',
        modifier: toObjectId(session.user._id)
      });
      // 创建母线和线路的关系
      bus.line = line._id;
      if (bus.lines instanceof Array) {
        bus.lines.push(line._id);
      } else {
        bus.lines = [line._id];
      }
      // 创建开关
      const units = [...breakers, ...fuses, ...loadBreakSwitches, ...disconnectors, ...groundDisconnectors];
      for (const unit of units) {
        const unitNode = toObject(unit);
        const foundType = deviceTypes.find((x: any) => toObject(x).id === unitNode.typeId);
        breakerMap.set(unitNode.svgId, {
          name: unitNode.name,
          breakerType: foundType ? toObject(foundType).name : '',
          svg: unitNode.svgId,
          line: line._id,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }

      // 创建线路段
      for (const segment of segments) {
        const segmentNode = toObject(segment);
        segmentMap.set(segmentNode.svgId, {
          name: segmentNode.name,
          svg: segmentNode.svgId,
          line: line._id,
          length: segmentNode.length ? Number(segmentNode.length) : 0,
          sectionSurface: segmentNode.crossSectionArea ? Number(segmentNode.crossSectionArea) : 0,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }
      // 创建变压器
      for (const transformer of transformers) {
        const transformerNode = toObject(transformer);
        const transformerEnd = transformerEnds.find((x: any) => transformerNode.id === toObject(x).transformer && toObject(x).endNumber === '1');
        const foundType = deviceTypes.find((x: any) => toObject(x).id === transformerNode.typeId);
        transformerMap.set(transformerNode.svgId, {
          name: transformerNode.name,
          type: foundType ? toObject(foundType).name : '',
          svg: transformerNode.svgId,
          line: line._id,
          capacity: toObject(transformerEnd).ratedS,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }
      // 创建非变电站母线
      for (const bus of buses.filter((x: any) => toObject(x).substation !== subNode.id)) {
        const busN = toObject(bus);
        busMap.set(busN.svgId, {
          name: busN.name,
          svg: busN.svgId,
          line: line._id,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }
      // 创建导入类型
      for (const type of deviceTypes) {
        const typeNode = toObject(type);
        const found: any = typeMap.get(typeNode.svgId);
        if (found) {
          !found.name.includes(typeNode.name) && found.name.push(typeNode.name);
          continue;
        }
        typeMap.set(typeNode.svgId, {
          name: [typeNode.name],
          svg: typeNode.svgId,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }
      // 创建电压等级
      for (const voltage of voltages) {
        const voltageNode = toObject(voltage);
        if (voltageMap.has(voltageNode.svgId)) {
          continue;
        }
        voltageMap.set(voltageNode.svgId, {
          name: voltageNode.name,
          svg: voltageNode.svgId,
          value: voltageNode.voltageValue ? Number(voltageNode.voltageValue) : -1,
          areaCode,
          modifier: toObjectId(session.user._id)
        });
      }

      await Bus.deleteOne({ svg: busNode.svgId, areaCode });
      await bus.save();

      await Line.deleteOne({ svg: feederNode.svgId, areaCode });
      await line.save();

      await Xml.deleteOne({ 'metadata.line': feederNode.svgId, 'metadata.areaCode': areaCode });
      // @ts-ignore
      const xmlStream = jsZip.file(map[path].xmlPath).nodeStream();
      const xmlWriteStream = getXmlFSBucket().openUploadStream(map[path].xmlPath.split('/')[1], {
        metadata: {
          line: feederNode.svgId,
          areaCode,
          modifier: toObjectId(session.user._id)
        }
      });
      xmlStream.pipe(xmlWriteStream);

      await Svg.deleteOne({ 'metadata.line': feederNode.svgId, 'metadata.areaCode': areaCode });
      // @ts-ignore
      const svgStream = jsZip.file(map[path].svgPath).nodeStream();
      const svgWriteStream = getSvgFSBucket().openUploadStream(map[path].svgPath.split('/')[1], {
        metadata: {
          line: feederNode.svgId,
          areaCode,
          modifier: toObjectId(session.user._id)
        }
      });
      svgStream.pipe(svgWriteStream);

      let svgString = await map[path].svg.async('string');
      let svgContent = null;
      if (svgString.includes('<?xml version="1.0" encoding="GB2312" ?>')) {
        svgString = await map[path].svg.async('binarystring');
        svgContent = await xmlParser.parseStringPromise(iconv.decode(Buffer.from(svgString, 'binary'), 'GBK').toString());
      } else {
        svgContent = await xmlParser.parseStringPromise(svgString);
      }

      const structure: any = saveStructure(json, svgContent);
      structureMap.set(feederNode.svgId, {
        filename: map[path].xmlPath.split('/')[1].split('.')[0] + '.json',
        svgId: feederNode.svgId,
        xml: structure.xml,
        svg: structure.svg,
        modifier: toObjectId(session.user._id)
      });
      resolve('');
    }));
  }

  await Promise.all(promises);

  // xml拓扑
  const structureList = Array.from(structureMap.values());
  await Structure.deleteMany({
    'metadata.svgId': {
      $in: structureList.map((x: any) => x.svgId)
    },
    'metadata.areaCode': areaCode
  });
  for (const structure of structureList as Array<any>) {
    const { filename, xml, svg, svgId } = structure;
    const s = getStructureBucket().openUploadStream(filename, {
      metadata: {
        svgId,
        areaCode,
        modifier: toObjectId(session.user._id)
      }
    });
    s.end(Buffer.from(JSON.stringify({ svg, xml })));
    await waitForWriteStream(s);
  }

  // 创建全局厂站
  const subList = Array.from(subMap.values());
  await Substation.deleteMany({
    svg: {
      $in: subList.map((x: any) => x.svg)
    },
    areaCode
  });
  await Substation.insertMany(subList);

  // 开关
  const breakerList = Array.from(breakerMap.values());
  await Breaker.deleteMany({
    svg: {
      $in: breakerList.map((x: any) => x.svg)
    },
    areaCode
  });
  await Breaker.insertMany(breakerList);

  // 线路段
  const segmentList = Array.from(segmentMap.values());
  await LineSegment.deleteMany({
    svg: {
      $in: segmentList.map((x: any) => x.svg)
    },
    areaCode
  });
  await LineSegment.insertMany(segmentList);

  // 变压器
  const transformerList = Array.from(transformerMap.values());
  await Transformer.deleteMany({
    svg: {
      $in: transformerList.map((x: any) => x.svg)
    },
    areaCode
  });
  await Transformer.insertMany(transformerList);

  // 环网柜母线
  const busList = Array.from(busMap.values());
  await Bus.deleteMany({
    svg: {
      $in: busList.map((x: any) => x.svg)
    },
    areaCode
  });
  await Bus.insertMany(busList);

  // 创建全局的电压等级
  const voltageList = Array.from(voltageMap.values());
  await XmlVoltage.deleteMany({
    svg: {
      $in: voltageList.map((x: any) => x.svg)
    },
    areaCode
  });
  await XmlVoltage.insertMany(voltageList);

  // 创建全局的设备类型
  const typeList = Array.from(typeMap.values());
  await Type.deleteMany({
    svg: {
      $in: typeList.map((x: any) => x.svg)
    },
    areaCode
  });
  await Type.insertMany(typeList);
}

function toObject(data: any) {
  if (!data) {
    return {};
  }
  return {
    id: `#${data.$['rdf:ID']}`,
    svgId: data.$['rdf:ID'],
    name: data?.['cim:IdentifiedObject.name']?.[0] || '',
    mId: data?.['cim:IdentifiedObject.mRID']?.[0] || '',
    type: data.deviceType,
    typeId: data?.['cim:PowerSystemResource.PSRType']?.[0]?.$?.['rdf:resource'] || '',
    subType: data.subType,
    substation: data?.['cim:Equipment.EquipmentContainer']?.[0]?.$?.['rdf:resource'] ||
      data?.['cim:Feeder.NormalEnergizingSubstation']?.[0]?.$?.['rdf:resource'] ||
      '',
    voltage: data?.['cim:ConductingEquipment.BaseVoltage']?.[0]?.$?.['rdf:resource'] || '',
    length: data?.['cim:Conductor.length']?.[0] || '',
    crossSectionArea: data?.['cim:Conductor.crossSectionArea']?.[0] || '',
    transformer: data?.['cim:PowerTransformerEnd.PowerTransformer']?.[0]?.$?.['rdf:resource'] || '',
    endNumber: data?.['cim:TransformerEnd.endNumber']?.[0] || '',
    ratedS: data?.['cim:PowerTransformerEnd.ratedS']?.[0] || '',
    voltageValue: data?.['cim:BaseVoltage.nominalVoltage']?.[0]?.['cim:Voltage']?.[0]?.['cim:Voltage.value']?.[0] || '',
    voltageLevelSub: data?.['cim:VoltageLevel.Substation']?.[0]?.$?.['rdf:resource'] || '',
    voltageLevelBase: data?.['cim:VoltageLevel.BaseVoltage']?.[0]?.$?.['rdf:resource'] || '',
    region: data?.['cim:SubGeographicalRegion.Region']?.[0]?.$?.['rdf:resource'] || ''
  };
}

export default router;
