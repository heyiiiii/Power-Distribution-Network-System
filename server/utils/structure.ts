import consola from 'consola';

let xml: any = {};
let svg: any = {};
let relations: any = [];
let busPorts: any = [];

class Base {
  // id 例如 PD_30000000_60894
  id = '';
  // 查找关联时使用的id, 例如 #PD_30000000_60894
  sId = '';
  // 名称
  name = '';

  constructor(data: any) {
    this.id = data.$['rdf:ID'];
    this.sId = `#${data.$['rdf:ID']}`;
    this.name = data?.['cim:IdentifiedObject.name']?.[0] || '';
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
 * 关联
 */
class Terminal extends Base {
  connectivityNode = '';
  conductingEquipment = '';

  constructor(data: any) {
    super(data);
    this.connectivityNode = data['cim:Terminal.ConnectivityNode'][0].$['rdf:resource'];
    this.conductingEquipment = data['cim:Terminal.ConductingEquipment'][0].$['rdf:resource'];
  }
}

/**
 * 厂站
 */

class Substation extends Base {
  type = '';

  constructor(data: any) {
    super(data);
    this.type = data['cim:PowerSystemResource.PSRType'][0].$['rdf:resource'];
  }
}

/**
 * 母线
 */
class Bus extends Base {
  type = '';
  container = '';

  constructor(data: any) {
    super(data);
    this.type = data['cim:PowerSystemResource.PSRType'][0].$['rdf:resource'];
    this.container = data['cim:Equipment.EquipmentContainer'][0].$['rdf:resource'];
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

class PowerTransformerEnd extends Base {
  powerTransformer = '';
  terminal = '';
  ratedS = '';
  endNumber = '';

  constructor(data: any) {
    super(data);
    this.powerTransformer = data['cim:PowerTransformerEnd.PowerTransformer'][0].$['rdf:resource'];
    this.terminal = data['cim:TransformerEnd.Terminal'][0].$['rdf:resource'];
    this.ratedS = data['cim:TransformerEnd.ratedS'] ? data['cim:TransformerEnd.ratedS'][0] : 0;
    this.endNumber = data['cim:TransformerEnd.endNumber'][0];
  }
}

/**
 * PT
 */
class PotentialTransformer extends Base {
  terminals = [];

  constructor(data: any) {
    super(data);
    this.terminals = data['cim:AuxiliaryEquipment.Terminal']
      ? data['cim:AuxiliaryEquipment.Terminal'].map((x: any) => x.$['rdf:resource']) : [];
  }
}

/**
 * 连接点
 */
class PoleCode extends Base {
  terminals = [];

  constructor(data: any) {
    super(data);
    if (data['cim:PoleCode.Terminal']) {
      this.terminals = data['cim:PoleCode.Terminal'].map((x: any) => x && x.$['rdf:resource']);
    }
    if (data['sgcim:PoleCode.Terminal']) {
      this.terminals = data['sgcim:PoleCode.Terminal'].map((x: any) => x && x.$['rdf:resource']);
    }
  }
}

const getStructure = () => {
  if (!xml) {
    return [];
  }
  const relations = [];
  // 一般设备
  for (const t of xml['cim:Terminal']) {
    const terminal = new Terminal(t);
    if (!terminal.connectivityNode || terminal.connectivityNode === '#') {
      continue;
    }
    relations.push({
      port: terminal.connectivityNode,
      device: terminal.conductingEquipment
    });
  }
  // PT
  if (xml['cim:PotentialTransformer']) {
    for (const pt of xml['cim:PotentialTransformer']) {
      const potentialTransformer = new PotentialTransformer(pt);
      for (const sId of potentialTransformer.terminals) {
        const found = xml['cim:Terminal'].find((x: any) => new Base(x).sId === sId);
        if (!found) {
          continue;
        }
        relations.push({
          port: new Terminal(found).connectivityNode,
          device: potentialTransformer.sId
        });
      }
    }
  }
  // 连接点
  if (xml['sgcim:PoleCode']) {
    for (const code of xml['sgcim:PoleCode']) {
      const poleCode = new PoleCode(code);
      for (const sId of poleCode.terminals) {
        const found = xml['cim:Terminal'].find((x: any) => new Base(x).sId === sId);
        if (!found) {
          continue;
        }
        const terminal = new Terminal(found);
        if (relations.some((x: any) => x.port === terminal.connectivityNode && x.device === poleCode.sId)) {
          continue;
        }
        relations.push({
          port: terminal.connectivityNode,
          device: poleCode.sId
        });
      }
    }
  }
  return relations;
};

const getPorts = () => {
  if (!relations) {
    return [];
  }
  const busPorts = [];
  for (const bus of xml['cim:BusbarSection']) {
    const found = relations.find((x: any) => x.device === new Bus(bus).sId);
    found && busPorts.push(found);
  }
  return busPorts;
};

const getSvgData = () => {
  if (!svg || !svg.g) {
    return {};
  }
  const layers: any = [];
  for (const layer of svg.g) {
    if (!layer.g) {
      continue;
    }
    for (const unit of layer.g) {
      const svg: any = {
        id: unit.$.id
      };
      if (unit.metadata) {
        const metadata: any = unit.metadata[0];
        svg.name = metadata['cge:PSR_Ref'][0].$.ObjectName;
        svg.layer = metadata['cge:Layer_Ref'][0].$.ObjectName;
        if (metadata['cge:GLink_Ref']) {
          svg.link = metadata['cge:GLink_Ref'].map((x: any) => x.$.ObjectID);
        }
      }
      const getType = (type: any) => {
        if (!unit[type]) {
          return;
        }
        const res: any = [];
        for (const item of unit[type]) {
          let str = `<${type}`;
          for (const key in item.$) {
            str += ` ${key}="${item.$[key]}"`;
          }
          str += ' />';
          item.$.str = str;
          res.push(item.$);
        }
        return res;
      };

      for (const type of ['use', 'polyline', 'polygon']) {
        svg[type] = getType(type);
      }

      layers.push(svg);
    }
  }

  const symbols: any = [];
  for (const symbol of svg.defs[0].symbol) {
    const model = {
      id: symbol.$.id,
      path: []
    };
    const getAnyPath = (type: any) => {
      const res: any[] = [];
      if (!symbol[type]) {
        return res;
      }
      for (const item of symbol[type]) {
        let str = `<${type}`;
        for (const key in item.$) {
          str += ` ${key}="${item.$[key]}"`;
        }
        str += ' />';
        res.push(str);
      }
      return res;
    };

    for (const type of ['rect', 'line', 'ellipse', 'polygon', 'polyline', 'circle']) {
      // @ts-ignore
      model.path.push(...getAnyPath(type));
    }
    symbols.push(model);
  }

  return { layers, symbols };
};

/**
 * id 图形的id 例如：#PD_30500000_63770
 */
const getData = (id: any) => {
  if (!xml) {
    return;
  }
  const unit = {};
  for (const tag in xml) {
    if (tag === '$') {
      continue;
    }
    const found = xml[tag].find((x: any) => new Base(x).sId === id);
    if (!found) {
      continue;
    }
    Object.assign(unit, found, { tag });
    break;
  }
  return unit;
};

const getAllPoleCodeId = () => {
  if (!xml) {
    return [];
  }
  const allPoleCodeId = [];
  if (xml['cim:PoleCode']) {
    allPoleCodeId.push(...xml['cim:PoleCode'].map((x: any) => new Base(x).sId));
  }
  if (xml['sgcim:PoleCode']) {
    allPoleCodeId.push(...xml['sgcim:PoleCode'].map((x: any) => new Base(x).sId));
  }
  return allPoleCodeId;
};

/**
 * fromId 例如 #PD_30600001_1501692738, 即 # + xml的设备id
 * path 路径 遍历的深度
 */
const getLinkUnit = (fromId: any) => {
  if (!relations) {
    return;
  }
  if (!fromId) {
    return;
  }
  const toDevices: any[] = [];
  const relationsCopy = JSON.parse(JSON.stringify(relations));
  const allPoleCodeId = getAllPoleCodeId();

  const traverse = (id: any) => {
    const fromRelations = relationsCopy.filter((x: any) => x.device === id);
    for (const fromRelation of fromRelations) {
      // 删除关联，防止重复搜索
      relationsCopy.splice(relationsCopy.indexOf(fromRelation), 1);
      // 特殊处理母线的关系
      // @ts-ignore
      const foundPort = busPorts.find((x: any) => x.port === fromRelation.port && x.device !== fromRelation.device);
      if (foundPort) {
        const data = getData(foundPort.device);
        data && toDevices.push({ from: getData(id), to: data });
        traverse(new Base(data).sId);
        continue;
      }

      const toRelations = relationsCopy.filter((x: any) => x.port === fromRelation.port);
      // 处理连接点
      if (toRelations.length > 1) {
        const found = toRelations.find((x: any) => allPoleCodeId.includes(x.device));
        if (found) {
          const data = getData(found.device);
          data && toDevices.push({ from: getData(id), to: data });
          traverse(new Base(data).sId);
          continue;
        }
      }

      const temp = [];
      // 处理普通设备关系
      for (const toRelation of toRelations) {
        // 删除关联，防止重复搜索
        relationsCopy.splice(relationsCopy.indexOf(toRelation), 1);
        // 排除掉Junction标签
        if (xml['cim:Junction'].some((x: any) => new Base(x).sId === toRelation.device)) {
          continue;
        }
        const data = getData(toRelation.device);
        if (!data) {
          continue;
        }
        temp.push({ from: getData(id), to: data });
      }
      toDevices.push(...temp);

      for (const t of temp) {
        traverse(new Base(t.to).sId);
      }
    }
  };
  // 执行遍历
  traverse(fromId);
  return toDevices;
};

export function saveStructure(data: any, svgData: any) {
  xml = data['rdf:RDF'];
  svg = svgData.svg;
  relations = getStructure();
  busPorts = getPorts();

  const subType = xml['cim:PSRType'].find((x: any) => new PSRType(x).name.includes('变电站'));
  if (!subType) {
    consola.error('导入异常：未查询到变电站');
    return { xml: {}, svg: {} };
  }
  const sub = xml['cim:Substation'].find((x: any) => new Substation(x).type === new PSRType(subType).sId);
  const bus = xml['cim:BusbarSection'].find((x: any) => new Bus(x).container === new Substation(sub).sId);

  return { xml: getLinkUnit(new Bus(bus).sId), svg: getSvgData() };
}


