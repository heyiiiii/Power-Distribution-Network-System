<template>
  <div class="graph-body">
    <div :id="uri" class="graph" :style="{height: getPanelHeight}" />
  </div>
</template>

<script>
import Globals from '../../../../assets/js/globals';
require('../../../../static/vendor/gojs/Figures');

export default {
  name: 'go-graph-plus',
  props: {
    panelHeight: {
      type: [Number, String],
      default: 800
    },
    title: {
      type: String,
      default: ''
    },
    uri: {
      type: String,
      default: '',
      required: true
    },
    svg: {
      type: String,
      default: '',
      required: true
    }
  },
  data() {
    return {
      graph: {
        id: 'graph-id'
      },
      diagram: '',
      menus: [],
      breakerFill: {
        open: 'black',
        close: 'white'
      },
      protectList: []
    };
  },
  computed: {
    getPanelHeight() {
      if (typeof this.panelHeight === 'string') {
        return this.panelHeight;
      } else {
        return this.panelHeight - 8 + 'px';
      }
    }
  },
  beforeDestroy() {
    const diagram = Globals.getDiagram(this.uri);
    if (diagram) {
      Globals.destroyDiagram(this.uri);
    }
  },
  mounted() {
    this.getProtectList();
  },
  methods: {
    async getProtectList() {
      const { data: listRes } = await this.$axios.get('/manage/protectModels/list');
      this.protectList = listRes;
    },
    getCurrentDiagram() {
      return Globals.getDiagram(this.uri);
    },
    // 加载
    load({ graphData, allDzResult, allBreaker, structure, svgData }) {
      // 初始化
      this.initGraph();
      const diagram = this.getCurrentDiagram();
      // 加载数据
      diagram.model = new go.GraphLinksModel(Object.assign({
        linkFromPortIdProperty: 'fromPort',
        linkToPortIdProperty: 'toPort'
      }, graphData));

      // 标题
      const { width } = JSON.parse(JSON.stringify(diagram.viewportBounds));
      diagram.add(new go.Part({ location: new go.Point(width / 2, -100) })
        .add(new go.TextBlock(this.title, { font: '24pt sans-serif' }))
      );
      // 方案表格
      const itemArray = [{
        line: '所属线路',
        parentName: '定值所属设备名称',
        name: '定值所属间隔名称',
        modelNumber: '装置型号',
        ratio: '变比',
        value: '定值'
      }];
      const { nodeDataArray } = graphData;
      // 获取保护名称
      const getProtectName = (calculateType, protect) => {
        if (!protect) {
          return '';
        }
        const found = this.protectList.find(x => x._id === protect);
        if (!found) {
          return '';
        }
        return found.metadata.modelNumber;
      };
      // 定值表格
      for (const key in allDzResult) {
        if (!nodeDataArray.some(x => x.key === key)) {
          continue;
        }
        const found = allBreaker.find(x => x.svg === key);
        if (!found) {
          continue;
        }
        const { name, ct01 = '', ct02 = '', calculateType, protect } = found;
        const { valueI = '', timeI = '', valueII = '', timeII = '' } = allDzResult[key];

        itemArray.push({
          line: this.title,
          parentName: this.getParentName(key, structure, svgData),
          name,
          modelNumber: getProtectName(calculateType, protect),
          ratio: (ct01 && ct02) ? `${ct01}/${ct02}` : '',
          value: `I段：${valueI}A,${timeI}S\nII段：${valueII}A,${timeII}S`
        });
      }
      diagram.model.addNodeData({ key: 'plan', category: 'plan', params: {}, itemArray });

      // 分支出线
      const branchArray = diagram.findNodesByExample({ params: (p) => { return p.isBranch; } });
      branchArray.each((node) => {
        const childrenNodes = node.findTreeChildrenNodes();
        if (childrenNodes.count === 0) {
          const { x, y } = node.data.loc;
          const branchKey = `branch_${node.data.key}`;
          diagram.model.addNodeData({
            key: branchKey,
            category: 'branch',
            params: {
              isBranch: true
            },
            loc: new go.Point(x, y + 50)
          });
          diagram.model.addLinkData({
            key: `${node.data.key}_${branchKey}`,
            from: node.data.key,
            to: branchKey
          });
        }
      });
    },
    getParentName(id, structure, svgData) {
      const strFound = structure.find(x =>
        Globals.formatXmlNode(x.to).id === id ||
        Globals.formatXmlNode(x.from).id === id
      );
      if (!strFound) {
        return '';
      }
      const subFound = svgData.layers.find(x =>
        `#${x.id}` === Globals.formatXmlNode(strFound.to).container ||
        `#${x.id}` === Globals.formatXmlNode(strFound.from).container
      );
      if (!subFound) {
        return '';
      }
      const { name } = subFound;
      return name;
    },
    generateGraphData({ structure, allBreaker, allDzResult, svgData }) {
      const graphData = {
        nodeDataArray: [],
        linkDataArray: []
      };

      if (!structure) {
        return graphData;
      }

      const tagToType = {
        'cim:Breaker': 'breaker',
        'cim:LoadBreakSwitch': 'breaker',
        'cim:Disconnector': 'breaker',
        'cim:GroundDisconnector': 'groundDisconnector',
        'cim:Fuse': 'breaker',
        'cim:BusbarSection': 'bus',
        'cim:PowerTransformer': 'transformer',
        'cim:ACLineSegment': 'acLineSegment',
        'cim:PoleCode': 'tpoint',
        'sgcim:PoleCode': 'tpoint'
      };
      const loopBreaker = allBreaker.find(x => x.funcType === 'loop');
      if (!loopBreaker) {
        this.$message.warning('缺失联络开关');
        return graphData;
      }
      const parentPaths = Globals.getParentPaths({ id: loopBreaker.svg, structure })[0];
      const { to: loopBreakerNode } = structure.find(x => Globals.formatXmlNode(x.to).id === loopBreaker.svg);
      // 全部主线开关
      const allMainBreaker = parentPaths.filter(x => tagToType[Globals.formatXmlNode(x).tag] === 'breaker');
      allMainBreaker.reverse();
      allMainBreaker.push(loopBreakerNode);
      // 全部分支开关的根设备
      let allBranchParent = parentPaths.filter(x => ['bus', 'tpoint'].includes(tagToType[Globals.formatXmlNode(x).tag]));
      allBranchParent = allBranchParent.slice(0, allBranchParent.length - 1);

      const addNode = ({ id, name, tag }) => {
        if (graphData.nodeDataArray.some(x => x.key === id)) {
          return;
        }
        const type = tagToType[tag];
        const getText = () => {
          switch (type) {
            case 'acLineSegment': {
              return '';
            }
            case 'bus': {
              return this.getParentName(id, structure, svgData);
            }
            default: {
              return name;
            }
          }
        };
        const nodeData = {
          key: id,
          category: type || 'error',
          geometryString: this.getDeviceModel(type).svg,
          text: getText(),
          loc: '',
          params: {
            tag,
            isBranch: allMainBreaker.findIndex(x => Globals.formatXmlNode(x).id === id) === -1
          }
        };

        const found = allBreaker.find(x => x.svg === id);
        if (found) {
          nodeData.params.calculateType = found.calculateType;
          Object.assign(nodeData.params, allDzResult ? allDzResult[id] : {});
        }

        graphData.nodeDataArray.push(nodeData);
      };

      const addLink = (from, to) => {
        const fromMode = Globals.formatXmlNode(from);
        addNode(fromMode);
        // 添加to
        const toMode = Globals.formatXmlNode(to);
        addNode(toMode);
        // 添加连线
        const { id: fromKey } = fromMode;
        const { id: toKey } = toMode;
        const lineKey = `${fromKey}_${toKey}`;

        if (graphData.linkDataArray.some(x => x.key === lineKey)) {
          return;
        }
        graphData.linkDataArray.push({
          key: lineKey,
          from: fromKey,
          to: toKey,
          strokeDashArray: fromMode.tag === 'cim:BusbarSection' ? [10, 5] : null
        });
      };

      const handleLink = (svg) => {
        const paths = Globals.getParentPaths({ id: svg, structure })[0];
        const parentUnits = paths.filter(x => {
          const { id } = Globals.formatXmlNode(x);
          return id === bus.id || allBreaker.some(b => b.svg === id) || branchUnits.some(u => Globals.formatXmlNode(u).id === id);
        });
        // 连线
        parentUnits.forEach((parent, index) => {
          // 出线开关
          if (index === 0) {
            const { to: firstNode } = structure.find(x => Globals.formatXmlNode(x.to).id === svg);
            addLink(parent, firstNode);
            return;
          }
          // 普通开关
          addLink(parent, parentUnits[index - 1]);
        });
      };

      // 母线
      const bus = Globals.formatXmlNode(structure[0].from);
      addNode(bus);
      // 主线分支设备
      const allMainKey = allMainBreaker.map(x => Globals.formatXmlNode(x).id);
      const allBranch = allBreaker.filter(x => x.protect && !allMainKey.includes(x.svg));
      const branchUnits = [];
      for (const branch of allBranch) {
        const paths = Globals.getParentPaths({ id: branch.svg, structure })[0];
        // 分支上级所有连接点、母线
        const units = paths.filter(x => ['bus', 'tpoint'].includes(tagToType[Globals.formatXmlNode(x).tag]));
        const difference = units.filter(x => allBranchParent.some(s => Globals.formatXmlNode(s).id === Globals.formatXmlNode(x).id));
        if (difference.length > 0) {
          branchUnits.push(difference[0]);
        }
      }
      // 主线开关
      if (loopBreaker) {
        handleLink(loopBreaker.svg);
      }
      // 分支开关
      for (const branch of allBranch) {
        handleLink(branch.svg);
      }

      return graphData;
    },
    getDeviceModel(type) {
      return Globals.device[type] || {};
    },
    // 初始画布
    initGraph() {
      // 画布
      const diagram = new go.Diagram(this.uri, {
        padding: 20,
        // isReadOnly: true,
        initialAutoScale: go.Diagram.UniformToFill,
        layout: new go.TreeLayout({
          direction: 0,
          treeStyle: go.TreeLayout.StyleRootOnly,
          setsPortSpot: false,
          setsChildPortSpot: false,
          alignment: go.TreeLayout.AlignmentCenterChildren,
          alternateSetsPortSpot: false,
          alternateSetsChildPortSpot: false,
          alternateAlignment: go.TreeLayout.AlignmentStart
        }),
        'animationManager.isInitial': false,
        'dragSelectingTool.isEnabled': false,
        'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom
      });
      // 消除黑色边框
      const canvasCollection = document.getElementsByTagName('canvas');
      for (const canvas of canvasCollection) {
        canvas.style.outline = 'none';
      }

      const { breaker, bus, tpoint, transformer } = Globals.device;
      // 方案表格
      diagram.nodeTemplateMap.add('plan', this.tableTemplate());
      // 母线
      diagram.nodeTemplateMap.add(bus.label, this.busTemplate());
      // 分支
      diagram.nodeTemplateMap.add('branch', this.branchTemplate());
      // 开关
      diagram.nodeTemplateMap.add(breaker.label, this.nodeTemplate(2));
      // 连接点
      diagram.nodeTemplateMap.add(tpoint.label, this.pointTemplate());
      // 变压器
      diagram.nodeTemplateMap.add(transformer.label, this.transTemplate());
      // 连线
      diagram.linkTemplate = this.linkTemplate();

      diagram.addDiagramListener('InitialLayoutCompleted', this.moveTpoint);
      Globals.appendDiagram(this.uri, diagram);
    },
    moveTpoint() {
      const diagram = this.getCurrentDiagram();
      const tpoints = diagram.findNodesByExample({ category: 'tpoint' }).iterator;
      while (tpoints.next()) {
        const t = tpoints.value;
        const tLoc = t.data.loc;

        const parentNode = t.findTreeParentNode();
        diagram.model.set(t.data, 'loc', new go.Point(tLoc.x, parentNode.data.loc.y));

        const moveChildren = (parent) => {
          const childrenNodes = parent.findTreeChildrenNodes();
          const loc = parent.data.loc;
          childrenNodes.each(n => {
            if (n.data.params && n.data.params.isBranch) {
              diagram.model.set(n.data, 'loc', new go.Point(loc.x, loc.y + 80));
              moveChildren(n);
            }
          });
        };

        moveChildren(t);
      }
    },
    // 表格
    tableTemplate() {
      const column0 = new go.TextBlock({ column: 0, margin: 5, textAlign: 'center' }).bind('text', 'line');
      const column1 = new go.TextBlock({ column: 1, margin: 5, textAlign: 'center' }).bind('text', 'parentName');
      const column2 = new go.TextBlock({ column: 2, margin: 5, textAlign: 'center' }).bind('text', 'name');
      const column3 = new go.TextBlock({ column: 3, margin: 5, textAlign: 'center' }).bind('text', 'modelNumber');
      const column4 = new go.TextBlock({ column: 4, margin: 5, textAlign: 'center' }).bind('text', 'ratio');
      const column5 = new go.TextBlock({ column: 5, margin: 5, textAlign: 'left' }).bind('text', 'value');
      const rowTemplate = new go.Panel('TableRow', {
        defaultColumnSeparatorStroke: 'black'
      }).add(column0).add(column1).add(column2).add(column3).add(column4).add(column5);
      const panel = new go.Panel('Table', {
        defaultColumnSeparatorStroke: 'black',
        defaultRowSeparatorStroke: 'black',
        itemTemplate: rowTemplate
      }).bind('itemArray');
      const shape = new go.Shape('Rectangle', {
        fill: 'white',
        strokeWidth: 2
      });
      return new go.Node('Auto')
        .bind('location', 'loc', null, null)
        .add(shape)
        .add(panel);
    },
    // 母线
    busTemplate() {
      const shape = new go.Shape('Rectangle', {
        name: 'busShape',
        strokeWidth: 4.5,
        stroke: 'red',
        stretch: go.GraphObject.Fill,
        portId: '',
        fromSpot: go.Spot.RightSide,
        toSpot: go.Spot.LeftSide,
        strokeJoin: 'round',
        strokeCap: 'butt',
        desiredSize: new go.Size(1, 180)
      });
      const textBlock = new go.TextBlock({
        font: '20px helvetica, arial, sans-serif',
        margin: 0,
        width: 25,
        alignment: new go.Spot(-3, 0.5),
        alignmentFocus: go.Spot.RightCenter
      }).bind('text');
      const panel = new go.Panel('Spot')
        .add(shape)
        .add(textBlock);

      return new go.Node({
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'busShape',
        selectionObjectName: 'busShape',
        zOrder: 999
      }).bind('location', 'loc', null, null)
        .add(panel);
    },
    // 分支
    branchTemplate() {
      const shape = new go.Shape('Rectangle', {
        name: 'branchShape',
        strokeWidth: 1,
        stroke: 'black',
        stretch: go.GraphObject.Fill,
        portId: '',
        fromSpot: go.Spot.BottomCenter,
        toSpot: go.Spot.TopCenter,
        desiredSize: new go.Size(1, 10)
      });
      const panel = new go.Panel('Spot')
        .add(shape);

      return new go.Node({
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'branchShape',
        zOrder: 999
      }).bind('location', 'loc', null, null)
        .add(panel);
    },
    // 开关
    nodeTemplate() {
      const shape = new go.Shape({
        name: 'nodeShape',
        fill: this.breakerFill.open,
        strokeWidth: 2,
        stretch: go.GraphObject.Fill,
        portId: '',
        fromSpot: go.Spot.BottomCenter,
        toSpot: go.Spot.TopCenter,
        strokeJoin: 'round',
        strokeCap: 'butt',
        angle: 270
      }).bind('geometryString')
        .bind('angle', 'params', (params) => {
          return params.isBranch ? 0 : 270;
        });
      const textBlock = new go.TextBlock({
        width: 100,
        font: '14px helvetica, arial, sans-serif',
        alignment: new go.Spot(0.5, 1.5),
        alignmentFocus: go.Spot.TopCenter
      }).bind('text')
        .bind('alignment', 'params', (params) => {
          return params.isBranch ? new go.Spot(-1.5, 0.5) : new go.Spot(0.5, 1.5);
        })
        .bind('alignmentFocus', 'params', (params) => {
          return params.isBranch ? go.Spot.RightCenter : go.Spot.TopCenter;
        });
      const textRemark1 = new go.TextBlock({
        row: 0,
        column: 0,
        alignment: go.Spot.Center
      }).bind('text', 'params', (params) => {
        return params.calculateType === 'selfHealing' ? '自愈开关' : '非自愈开关';
      });
      const textRemark2 = new go.TextBlock({
        row: 1,
        column: 0,
        alignment: go.Spot.Left
      }).bind('text', 'params', (params) => {
        return params.calculateType ? '自动化终端已覆盖' : '无自动化终端覆盖\n不具备保护及FA功能';
      });
      const textI = new go.TextBlock({
        row: 2,
        column: 0,
        alignment: go.Spot.Left
      }).bind('text', 'params', (params) => {
        const { valueI = '', timeI = '' } = params;
        return `定值I：${valueI}A，${timeI}S`;
      }).bind('visible', 'params', (params) => {
        return !!params.calculateType;
      });
      const textII = new go.TextBlock({
        row: 3,
        column: 0,
        alignment: go.Spot.Left
      }).bind('text', 'params', (params) => {
        const { valueII = '', timeII = '' } = params;
        return `II：${valueII}A，${timeII}S`;
      }).bind('visible', 'params', (params) => {
        return !!params.calculateType;
      });
      const textPart = new go.Panel('Table')
        .bind('alignment', 'params', (params) => {
          return params.isBranch ? new go.Spot(1.5, 0.5) : new go.Spot(0.5, -1.5);
        })
        .bind('alignmentFocus', 'params', (params) => {
          return params.isBranch ? go.Spot.LeftCenter : go.Spot.BottomCenter;
        })
        .add(textRemark1)
        .add(textRemark2)
        .add(textI)
        .add(textII);
      const panel = new go.Panel('Spot')
        .add(shape)
        .add(textBlock)
        .add(textPart);

      return new go.Node('Horizontal', {
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'nodeShape',
        selectionObjectName: 'nodeShape',
        zOrder: 999
      }).bind('location', 'loc', null, null)
        .add(panel);
    },
    // 杆塔、连接点
    pointTemplate() {
      const shape = new go.Shape({
        name: 'pointShape',
        fill: 'black',
        strokeWidth: 1,
        stretch: go.GraphObject.Fill,
        portId: '',
        strokeJoin: 'round',
        strokeCap: 'butt'
      }).bind('geometryString');
      const textBlock = new go.TextBlock({
        width: 100,
        font: '14px helvetica, arial, sans-serif',
        margin: 4,
        alignment: new go.Spot(0.5, 1.5),
        alignmentFocus: go.Spot.TopCenter
      }).bind('text');
      const center = new go.Shape({
        portId: 'center',
        width: 1,
        height: 1,
        fill: 'transparent',
        stroke: null,
        alignment: go.Spot.Center
      });
      const panel = new go.Panel('Spot')
        .add(shape)
        .add(textBlock)
        .add(center);

      return new go.Node('Horizontal', {
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'pointShape',
        selectionObjectName: 'pointShape',
        zOrder: 999
      }).bind('location', 'loc', null, null)
        .add(panel);
    },
    // 变压器
    transTemplate() {
      const shape1 = new go.Shape('CircleLine', {
        name: 'transShape1',
        fill: 'transparent',
        fromSpot: go.Spot.MiddleLeft,
        toSpot: go.Spot.MiddleLeft,
        desiredSize: new go.Size(16, 16),
        strokeWidth: 2
      });
      const shape2 = new go.Shape('CircleLine', {
        name: 'transShape2',
        fill: 'transparent',
        desiredSize: new go.Size(16, 16),
        strokeWidth: 2,
        alignment: go.Spot.MiddleRight
      });
      const textBlock = new go.TextBlock({
        font: '14px helvetica, arial, sans-serif',
        margin: 0,
        alignment: new go.Spot(0.5, 1.5),
        alignmentFocus: go.Spot.MiddleBottom,
        width: 100
      }).bind('text');
      const panel = new go.Panel('Spot')
        .add(shape1)
        .add(shape2);

      return new go.Node('Horizontal', {
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'transShape1',
        zOrder: 999
      }).bind('location', 'loc', null, null)
        .add(panel)
        .add(textBlock);
    },
    // 连线
    linkTemplate() {
      // 线
      const shape = new go.Shape({
        name: 'line',
        isPanelMain: true,
        strokeWidth: 2,
        stroke: 'black'
      }).bind('strokeDashArray');
      const pipe = new go.Shape({
        name: 'pipe',
        isPanelMain: true,
        stroke: 'blue',
        strokeWidth: 3,
        opacity: 0
      });
      const fault = new go.Shape({
        name: 'fault',
        stroke: null,
        desiredSize: new go.Size(15, 30),
        fill: '#FF0000',
        figure: 'ElectricalHazard',
        opacity: 0
      });

      return new go.Link({
        selectable: true,
        adjusting: go.Link.None,
        routing: go.Link.Orthogonal,
        fromShortLength: -2,
        toShortLength: -2,
        zOrder: 1,
        cursor: 'pointer'
      }).add(shape)
        .add(pipe)
        .add(fault);
    },
    // 单击
    singleClicked() {
      const diagram = this.getCurrentDiagram();
      const f = diagram.selection.first();
      console.log('选中的数据', f ? f.data : null);
    },
    generateJpg() {
      const myCallback = (blob) => {
        const url = window.URL.createObjectURL(blob);
        const filename = `${this.title}.jpg`;

        const a = document.createElement('a');
        a.style = 'display: none';
        a.href = url;
        a.download = filename;

        // IE 11
        if (window.navigator.msSaveBlob !== undefined) {
          window.navigator.msSaveBlob(blob, filename);
          return;
        }

        document.body.appendChild(a);
        requestAnimationFrame(function() {
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
      };
      const diagram = this.getCurrentDiagram();
      diagram.makeImageData({
        background: 'white',
        returnType: 'blob',
        callback: myCallback
      });
    }
  }
};
</script>

<style scoped>
.grid {
  margin: 0 15px;
}

.graph {
  border-radius: 5px;
  border: 1px solid rgba(239, 239, 239, 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.graph-body {
}

.graph ::-webkit-scrollbar {
  width: 7px;
  height: 7px;
  background-color: white;
}

.graph ::-webkit-scrollbar-thumb {
  border-radius: 20px;
  background-color: rgba(144,147,153, .3);
  -webkit-transition: .3s background-color;
  transition: .3s background-color
}

.graph ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144,147,153, .5)
}

.ctxmenu {
  display: none;
  position: absolute;
  margin: 0;
  padding: 8px 0;
  z-index: 9;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, .2), 0 8px 10px 1px rgba(0, 0, 0, .14), 0 3px 14px 2px rgba(0, 0, 0, .12);
  list-style: none;
  background-color: #ffffff;
  white-space: nowrap;
}

.menu-item {
  display: block;
  position: relative;
  min-width: 150px;
  margin: 0;
  padding: 4px 10px;
  font: 13px sans-serif;
  color: #000000;
  cursor: pointer;
}

.menu-item-icon {
  padding: 4px 6px;
}

.menu-item::before {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  content: "";
  width: 100%;
  height: 100%;
  background-color: #000000;
}

.menu-item:hover::before {
  opacity: .04;
}

.menu .menu {
  top: -8px;
  left: 100%;
}

.show-menu, .menu-item:hover .ctxmenu {
  display: block;
  opacity: 1;
}
</style>
