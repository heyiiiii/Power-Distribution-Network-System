class Base {
    // id 例如 PD_30000000_60894
    id = '';
    // 查找关联时使用的id, 例如 #PD_30000000_60894
    sId = '';
    // 不含PD前缀的id,例如 30000000_60894
    mRID = '';
    // 名称 
    name = '';

    constructor(data) {
        this.id = data.$['rdf:ID'];
        this.sId = `#${data.$['rdf:ID']}`;
        this.mRID = data['cim:IdentifiedObject.mRID'][0];
        this.name = data['cim:IdentifiedObject.name'][0];
    }
}

class 路径类 {
    structure = [];

    constructor(structure) {
        this.structure = structure;
    }

    static async 获取路径(svg) {
        const { data: structureData } = await $axios.get('/models/xml-structure/' + svg);
        return new 路径类(structureData.result ? structureData.result.structure : []);
    }

    获取上级路径(id, path = [[]]) {
        const paths = new Map();
        const allPath = [];
        const filter = this.structure.filter(x => new Base(x.to).id === id);
        for (const item of filter) {
            const from = new Base(item.from);
            const pathCopy = JSON.parse(JSON.stringify(path));
            for (const p of pathCopy) {
                p.push(item.from);
            }
            paths.set(from.id, pathCopy);
        }
        if (paths.size === 0) {
            return path;
        }
        for (const key of paths.keys()) {
            allPath.push(...this.获取上级路径(key, paths.get(key)));
        }
        return allPath;
    }

    获取下级设备({ id, array = [], deep = 1 }) {
        if (deep <= 0) {
            return array;
        }
        const links = this.structure.filter(x => new Base(x.from).id === id);
        for (const link of links) {
            const { id: toId } = new Base(link.to);
            array.push(toId);
            this.获取下级设备(toId, array, deep - 1);
        }
        return array;
    }

    通过ID获取设备(id) {
        const found = this.structure.find(x => new Base(x.to).id === id);
        return found ? found.to : null;
    }
}
