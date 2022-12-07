export class Base {
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
