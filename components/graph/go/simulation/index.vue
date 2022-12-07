<template>
  <div class="graph-body">
    <div :id="uri" class="graph" :style="{height: getPanelHeight}" />
    <ul ref="contextMenu" id="contextMenu" class="ctxmenu">
      <li :class="['menu-item']" v-for="(item,index) in menus" @click="item.action" :key="index">
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import Globals from '../../../../assets/js/globals';
require('../../../../static/vendor/gojs/Figures');

export default {
  name: 'go-graph',
  props: {
    panelHeight: {
      type: [Number, String],
      default: 800
    },
    uri: {
      type: String,
      default: '',
      required: true
    },
    data: {
      type: Object,
      default: () => {}
    },
    structure: {
      type: Object,
      default: {}
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
      }
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
  methods: {
    reset() {
      const diagram = this.getCurrentDiagram();

      // 关闭动画
      this.stopAnimation(true);

      // 重置线路
      diagram.links.each((link) => {
        const fault = link.findObject('fault');
        fault && (fault.opacity = 0);

        const pipe = link.findObject('pipe');
        pipe && (pipe.opacity = 0);

        link.data.locked = false;
      });

      // 重置设备
      diagram.nodes.each((node) => {
        const shape = node.findObject('nodeShape');
        shape && (shape.fill = this.breakerFill.open);
        const timeText = node.findObject('timeText');
        timeText && (timeText.opacity = 0);

        node.data.locked = false;
      });
    },
    stopAnimation(val) {
      const diagram = this.getCurrentDiagram();
      diagram.animationManager.stopAnimation(val);
    },
    start() {
      const timeOutList = [];
      const diagram = this.getCurrentDiagram();

      // 启动动画
      diagram.animationManager.isEnabled = true;
      // 检查是否已存在动画
      if (diagram.animationManager.activeAnimations.count > 0) {
        this.$message.info('请等待当前仿真结束');
        return;
      }

      const { open, close } = this.breakerFill;
      const firstNode = diagram.nodes.first();
      let all = 1;

      const animateLinks = (parent, current) => {
        // 停止标志
        let isStop = false;
        // 定义动画对象
        const linkAnimation = new go.Animation();

        // 下一级连线
        parent.findTreeChildrenLinks().each((link) => {
          // 检查重合闸闭锁
          if (link.data.locked) {
            return;
          }

          // 检查故障点
          const fault = link.findObject('fault');
          if (fault && fault.opacity === 1) {
            // 停止标志
            isStop = true;
            // 上级设备(仅限开关) 失压分闸并闭锁合闸
            if (parent.category === 'breaker') {
              parent.data.locked = true;
            }
            // 线路闭锁
            link.data.locked = true;
            // 下级设备 短时来电闭锁合闸
            const toNode = diagram.findNodeForKey(link.data.to);
            toNode && (toNode.data.locked = true);
            return;
          }

          // 线路动画
          const pipe = link.findObject('pipe');
          (current === all) && linkAnimation.add(pipe, 'opacity', 0, 1);
        });

        if (isStop) {
          // 更改总计次数
          all++;
          // 关闭动画
          this.stopAnimation(true);
          // 清除所有定时动画
          for (const timeOut of timeOutList) {
            clearTimeout(timeOut);
          }
          // 重置线路
          diagram.links.each((link) => {
            const pipe = link.findObject('pipe');
            pipe && (pipe.opacity = 0);
          });
          // 重置设备
          diagram.nodes.each((node) => {
            const timeText = node.findObject('timeText');
            timeText && (timeText.opacity = 0);
          });
          diagram.startTransaction('animateLinks_1');
          animateClose();
          animateLinks(firstNode, 2);
          diagram.commitTransaction('animateLinks_1');
          return;
        }

        linkAnimation.runCount = 1;
        (current === all) && linkAnimation.start();
        linkAnimation.finished = function () {
          animateBreakers(parent, current);
        };
      };

      const animateBreakers = (parent, current) => {
        parent.findTreeChildrenNodes().each((n) => {
          // 检查重合闸闭锁
          if (n.data.locked) {
            return;
          }
          // 负荷开关重合闸退出
          if (n.data.params.tag === 'cim:LoadBreakSwitch') {
            return;
          }
          if (n.category !== 'breaker') {
            animateLinks(n, current);
            return;
          }

          // 动画时间
          diagram.startTransaction('time');
          const time = current === 1 ? n.data.params.restartTime : 7;
          n.data.params.time = time;
          diagram.model.set(n.data, 'params', Object.assign(n.data.params, { time }));
          diagram.commitTransaction('time');

          // 显示合闸时间，存在问题但是忘了是什么了。。。
          const timeText = n.findObject('timeText');
          if (timeText) {
            const textAnimation = new go.Animation();
            textAnimation.add(timeText, 'opacity', timeText.opacity, 1);
            textAnimation.runCount = 1;
            textAnimation.start();
          }

          // 合闸动画
          const breakerAnimation = new go.Animation();
          timeOutList.push(setTimeout(() => {
            const nodeShape = n.findObject('nodeShape');
            breakerAnimation.add(nodeShape, 'fill', nodeShape.fill, open);
            breakerAnimation.runCount = 1;
            if (current !== all) {
              const pipe = parent.findObject('pipe');
              pipe && (pipe.opacity = 0);
              return;
            }
            breakerAnimation.start();
            breakerAnimation.finished = function () {
              animateLinks(n, current);
            };
          }, 1000 * time / 10));
        });
      };

      const animateClose = () => {
        const closeAnimation = new go.Animation();
        diagram.nodes.each((node) => {
          // 非开关退出
          if (node.category !== 'breaker') {
            return;
          }
          // 负荷开关退出
          if (node.data.params.tag === 'cim:LoadBreakSwitch') {
            return;
          }
          const nodeShape = node.findObject('nodeShape');
          closeAnimation.add(nodeShape, 'fill', nodeShape.fill, close);
        });
        closeAnimation.runCount = 1;
        closeAnimation.start();
      };

      diagram.startTransaction('animateLinks');
      animateClose();
      animateLinks(firstNode, 1);
      diagram.commitTransaction('animateLinks');
    },
    getCurrentDiagram() {
      return Globals.getDiagram(this.uri);
    },
    // 加载
    load() {
      // 初始化
      this.initGraph();

      const diagram = this.getCurrentDiagram();
      // 加载数据
      diagram.model = new go.GraphLinksModel(Object.assign({
        linkFromPortIdProperty: 'fromPort',
        linkToPortIdProperty: 'toPort'
      }, this.data));

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
      const { breaker, bus, tower, load, tpoint, transformer, groundDisconnector, acLineSegment, disconnector } = Globals.device;
      // 母线
      diagram.nodeTemplateMap.add(bus.label, this.busTemplate());
      // 分支
      diagram.nodeTemplateMap.add('branch', this.branchTemplate());
      // 开关
      diagram.nodeTemplateMap.add(breaker.label, this.nodeTemplate(2));
      // 刀闸
      diagram.nodeTemplateMap.add(disconnector.label, this.nodeTemplate(2));
      // 接地刀闸
      diagram.nodeTemplateMap.add(groundDisconnector.label, this.nodeTemplate(1));
      // 短引线
      diagram.nodeTemplateMap.add(acLineSegment.label, this.nodeTemplate(2));
      // 负荷
      diagram.nodeTemplateMap.add(load.label, this.nodeTemplate(1));
      // 杆塔
      diagram.nodeTemplateMap.add(tower.label, this.pointTemplate());
      // 连接点
      diagram.nodeTemplateMap.add(tpoint.label, this.pointTemplate());
      // 变压器
      diagram.nodeTemplateMap.add(transformer.label, this.transTemplate());
      // 连线
      diagram.linkTemplate = this.linkTemplate();

      diagram.addDiagramListener('ChangedSelection', this.changedSelection);
      diagram.addDiagramListener('ObjectSingleClicked', this.singleClicked);
      diagram.addDiagramListener('InitialLayoutCompleted', this.moveTpoint);

      diagram.contextMenu = this.myContextMenu(this.$refs.contextMenu);

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
    // 右键菜单
    myContextMenu(cxElement) {
      const _this = this;
      const myContextMenu = new go.HTMLInfo();
      myContextMenu.show = showContextMenu;
      myContextMenu.hide = hideContextMenu;
      // 阻止浏览器默认事件
      cxElement.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
      }, false);

      //  显示右键菜单
      function showContextMenu(obj, diagram) {
        // 选中多个节点时，不显示菜单，防止意外错误发生
        if (diagram.selection.count >= 2) {
          return;
        }
        if (!(obj instanceof go.Link)) {
          return;
        }
        _this.menus = [];

        _this.menus.push({
          text: '设置故障点',
          action: () => _this.setLineFaultPoint(obj, diagram, true)
        });

        const fault = obj.findObject('fault');
        if (fault && fault.opacity === 1) {
          _this.menus.push({
            text: '删除故障点',
            action: () => _this.setLineFaultPoint(obj, diagram, false)
          });
        }

        addClickEventListener(diagram);
      }

      function addClickEventListener(diagram) {
        if (_this.menus.length === 0) {
          diagram.currentTool.stopTool();
          return;
        }
        cxElement.classList.add('show-menu');
        const mousePt = diagram.lastInput.viewPoint;
        cxElement.style.left = mousePt.x + 5 + 'px';
        cxElement.style.top = mousePt.y + 20 + 'px';
        window.addEventListener('click', hideCX, true);
      }

      // 隐藏右键菜单
      function hideContextMenu() {
        cxElement.classList.remove('show-menu');
        window.removeEventListener('click', hideCX, true);
      }

      function hideCX(diagram) {
        if (diagram.currentTool instanceof go.ContextMenuTool) {
          diagram.currentTool.doCancel();
        }
      }

      return myContextMenu;
    },
    // 设置故障点
    setLineFaultPoint(obj, diagram, display) {
      diagram.currentTool.stopTool();
      diagram.animationManager.isEnabled = true;
      diagram.clearSelection();

      diagram.startTransaction('setLineFaultPoint');
      const animation = new go.Animation();
      animation.add(obj.findObject('fault'), 'opacity', display ? 0 : 1, display ? 1 : 0);
      animation.runCount = 1;
      animation.duration = 300;
      animation.start();
      diagram.commitTransaction('setLineFaultPoint');
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
        font: '14px helvetica, arial, sans-serif',
        margin: 0,
        width: 100,
        alignment: new go.Spot(0, 1.2),
        alignmentFocus: go.Spot.BottomCenter
      }).bind('text');
      const panel = new go.Panel('Spot')
        .add(shape)
        .add(textBlock);

      return new go.Node({
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'busShape',
        selectionObjectName: 'busShape',
        selectionAdornmentTemplate: this.selectionAdornmentTemplate(),
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
          return params.isBranch ? new go.Spot(2, 0.5) : new go.Spot(0.5, 1.5);
        })
        .bind('alignmentFocus', 'params', (params) => {
          return params.isBranch ? go.Spot.LeftCenter : go.Spot.TopCenter;
        });
      const timeText = new go.TextBlock({
        name: 'timeText',
        width: 100,
        opacity: 0,
        font: '14px helvetica, arial, sans-serif',
        textAlign: 'center',
        alignment: new go.Spot(0.5, -1),
        alignmentFocus: go.Spot.BottomCenter
      }).bind('text', 'params', (params) => {
        return params.restartTime ? `t = ${params.restartTime}s` : '';
      });
      const panel = new go.Panel('Spot')
        .add(shape)
        .add(textBlock)
        .add(timeText);

      return new go.Node('Horizontal', {
        cursor: 'pointer',
        locationSpot: go.Spot.Center,
        locationObjectName: 'nodeShape',
        selectionObjectName: 'nodeShape',
        selectionAdornmentTemplate: this.selectionAdornmentTemplate(),
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
        selectionAdornmentTemplate: this.selectionAdornmentTemplate(),
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
        selectionAdornmentTemplate: this.selectionAdornmentTemplate(),
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
        cursor: 'pointer',
        contextMenu: this.myContextMenu(this.$refs.contextMenu)
      }).add(shape)
        .add(pipe)
        .add(fault);
    },
    // 选中样式
    selectionAdornmentTemplate() {
      return new go.Adornment('Vertical')
        .add(new go.Panel('Auto')
          .add(new go.Shape({ fill: null, stroke: 'dodgerblue', strokeWidth: 1.5, strokeDashArray: [4, 2] }))
          .add(new go.Placeholder())
        );
    },
    // 选择改变时
    changedSelection() {
      const diagram = this.getCurrentDiagram();
      const first = diagram.selection.first();
      this.$emit('on-select-link', (first && first instanceof go.Link) ? first.data : {});
    },
    // 单击
    singleClicked() {
      const diagram = this.getCurrentDiagram();
      const f = diagram.selection.first();
      console.log('选中的数据', f ? f.data : null);
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
