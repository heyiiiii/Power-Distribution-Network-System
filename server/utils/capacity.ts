import stream from 'stream';
import xml2js from 'xml2js';
import {getXmlFSBucket, Transformer, Xml, Structure, getStructureBucket} from '../../server/mongo-schema';

class Base {
  // id 例如 PD_30000000_60894
  id = '';
  // 查找关联时使用的id, 例如 #PD_30000000_60894
  sId = '';
  // 不含PD前缀的id,例如 30000000_60894
  mRID = '';
  // 名称
  name = '';

  constructor(data: any) {
    this.id = data.$['rdf:ID'];
    this.sId = `#${data.$['rdf:ID']}`;
    this.mRID = data['cim:IdentifiedObject.mRID'][0];
    this.name = data['cim:IdentifiedObject.name'][0];
  }
}

/**
 * 类型
 */
class PSRType extends Base {
  // eslint-disable-next-line no-useless-constructor
  constructor(data: any) {
    super(data);
  }
}

/**
 * 变压器
 */
class PowerTransformer extends Base {
  type = '';

  constructor(data: any) {
    super(data);
    this.type = data['cim:PowerSystemResource.PSRType'][0].$['rdf:resource'];
  }
}

/**
 * 获取所有下级设备
 */
// @ts-ignore
const getChildrenBySId = (sId, type, tag, array) => {
  const links = structure.filter((x: any) => new Base(x.from).sId === sId);
  for (const link of links) {
    const to = new Base(link.to);
    if (link.to.tag === tag) {
      const transTo = new PowerTransformer(link.to);
      transTo.type === type && array.push(to.id);
    }
    // 存入集合中
    getChildrenBySId(to.sId, type, tag, array);
  }
  return array;
};

let xml: any = {};
let structure: any = [];

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

export async function getCapacity(lineSvg: any, breakerSId: any, areaCode: Number) {
  const found: any = await Xml.findOne({
    'metadata.line': lineSvg,
    'metadata.areaCode': areaCode
  }).lean();
  if (!found) {
    throw new Error('xml查询异常');
  }
  const xmlFileStream = getXmlFSBucket().openDownloadStream(found._id);
  const xmlFileData = await readFile(xmlFileStream);
  const xmlParser = new xml2js.Parser();
  let result: any = {};
  xmlParser.parseString(xmlFileData.toString(), (err: any, json: any) => {
    if (err) {
      return;
    }
    result = json;
  });
  xml = result['rdf:RDF'];

  const xmlStructure: any = await Structure.findOne({
    'metadata.svgId': lineSvg,
    'metadata.areaCode': areaCode
  }).lean();
  if (!xmlStructure) {
    throw new Error('xml查询异常');
  }
  const structureStream = getStructureBucket().openDownloadStream(xmlStructure._id);
  const structureData: any = await readFile(structureStream);
  if (structureData) {
    const structureObj: any = JSON.parse(structureData.toString());
    structure = structureObj.xml;
  }

  const transType = xml['cim:PSRType'].find((x: any) => new PSRType(x).name.includes('配电变压器'));
  const transList = transType ? getChildrenBySId(
    `#${breakerSId}`,
    new PSRType(transType).sId,
    'cim:PowerTransformer',
    []
  ) : [];
  const transData = await Transformer.find({
    svg: {
      $in: transList
    },
    areaCode
  }).lean();
  const capacityList = transData.map((x: any) => x.capacity);
  const totalCapacity = capacityList.length > 0 ? capacityList.reduce((pre: any, current: any) => {
    return pre + current;
  }) : 0;

  return {
    // 最大电动机容量
    maxMotorCapacity: 0,
    // 最大配变容量
    maxCapacity: Math.max(0, ...capacityList),
    // 总配变容量
    totalCapacity
  };
};
