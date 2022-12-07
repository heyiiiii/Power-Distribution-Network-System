<!--meta:{"index":18,"label":"故障模拟","auths":"any","roles":"any"}-->
<template>
  <container>
    <el-card class="box-card">
      <el-row>
        <el-col :span="2">
          <el-button type="success" icon="el-icon-folder-opened" @click="selectorVisible = true">打开图形</el-button>
        </el-col>
        <template v-if="editableTabs.length > 0">
          <el-col :span="20">
            <el-button-group>
              <el-button type="primary" icon="el-icon-caret-right" @click="onStart">开始</el-button>
              <el-button type="primary" icon="el-icon-video-pause" @click="onEnd">结束</el-button>
              <el-button type="primary" icon="el-icon-refresh-left" @click="onReset">重置</el-button>
            </el-button-group>
          </el-col>
        </template>
      </el-row>
    </el-card>
    <el-tabs v-loading="loading" class="m-t-5" v-model="editableTabsValue" type="border-card" closable @tab-remove="removeTab">
      <el-tab-pane :key="item.name" v-for="(item) in editableTabs" :label="item.name" :name="item.uri">
        <graph
          ref="graph"
          :panelHeight="contentHeight - 208"
          :uri="item.uri"
          :data="item.data"
          :structure="item.structure"
        />
      </el-tab-pane>
      <el-empty v-show="editableTabs.length === 0" description="暂无数据" :style="{height: contentHeight - 190 + 'px'}" />
    </el-tabs>
    <sub-selector title="打开图形" :visible.sync="selectorVisible" @on-open-graph="onOpenGraph" />
  </container>
</template>

<script>
import { mapGetters } from 'vuex';
import Globals from '../../assets/js/globals';
import svgToPath from '../../static/vendor/gojs/svgToPath';
import Container from '~/components/container';
import Graph from '~/components/graph/go/simulation';
import SubSelector from '~/components/selector/substation';

export default {
  name: 'cim-simulation',
  head() {
    return {
      title: this.currentRouteText
    };
  },
  components: {
    Container,
    Graph,
    SubSelector
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getClientHeight'
    ]),
    contentHeight() {
      return this.getClientHeight;
    },
    currentRouteText() {
      function findRoute(routes, name) {
        if (!routes) {
          return null;
        }
        for (const route of routes) {
          if (route.name === name) {
            return route;
          } else if (route.children) {
            const found = findRoute(route.children, name);
            if (found) {
              return found;
            }
          }
        }
      }

      const route = findRoute(this.getUserRoutes, this.$route.name);
      return route ? route.label : '故障模拟';
    },
    currentGraph() {
      if (!this.$refs.graph) {
        return null;
      }
      return this.$refs.graph.find(x => x.uri === this.editableTabsValue);
    }
  },
  data() {
    return {
      loading: false,
      selectorVisible: false,
      editableTabsValue: '',
      editableTabs: []
    };
  },
  methods: {
    // 仿真-开始
    onStart() {
      if (!this.currentGraph) {
        this.$message.error('缺失图形');
        return;
      }
      this.currentGraph.start();
    },
    // 仿真-结束
    onEnd() {
      if (!this.currentGraph) {
        this.$message.error('缺失图形');
        return;
      }
      this.currentGraph.stopAnimation(false);
    },
    // 仿真-重置
    onReset() {
      if (!this.currentGraph) {
        this.$message.error('缺失图形');
        return;
      }
      this.currentGraph.reset();
    },
    // 打开图形
    async onOpenGraph({ _id, svg, name, belong }) {
      if (!belong) {
        this.$message.info('请选择图形属性中的地区');
        return;
      }
      if (belong === 'city') {
        this.$message.info('城网线路不支持仿真');
        return;
      }

      this.selectorVisible = false;
      this.loading = true;

      const { data: structureData } = await this.$axios.get(`/models/xml-structure/${svg}`);
      if (!structureData.succ || !structureData.result) {
        this.$message.error('获取图形拓扑失败');
        this.loading = false;
        return;
      }
      const { data: breakerData } = await this.$axios.post('/models/breaker/condition/list', {
        line: _id
      });
      if (!breakerData.succ || !breakerData.result) {
        this.$message.error('获取开关失败');
        this.loading = false;
        return;
      }

      const { xml: structure } = structureData.result;
      this.editableTabsValue = _id;
      this.editableTabs.push({
        uri: _id,
        name,
        data: this.generateGraphData1({
          allBreaker: breakerData.result,
          structure
        }),
        structure: structureData.result
      });

      this.$nextTick(() => {
        const found = this.$refs.graph.find(x => x.uri === _id);
        found && found.load();
        this.loading = false;
      });
    },
    // 生成图形数据
    generateGraphData(structure, allBreaker) {
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
      const parentPaths = loopBreaker ? Globals.getParentPaths({ id: loopBreaker.svg, structure })[0] : [];
      const allMainBreaker = parentPaths.filter(x => tagToType[Globals.formatXmlNode(x).tag] === 'breaker');
      let allBranchParent = parentPaths.filter(x => ['bus', 'tpoint'].includes(tagToType[Globals.formatXmlNode(x).tag]));
      allBranchParent = allBranchParent.slice(0, allBranchParent.length - 1);

      const addNode = ({ id, name, tag }) => {
        if (graphData.nodeDataArray.some(x => x.key === id)) {
          return;
        }
        // 图形类型
        const type = tagToType[tag];
        // 获取重合闸时间
        const getRestartTime = () => {
          if (type !== 'breaker') {
            return;
          }
          if (tag === 'cim:LoadBreakSwitch') {
            return;
          }
          // 初始为倒序，反转为正序
          allMainBreaker.reverse();

          const index = allMainBreaker.findIndex(x => Globals.formatXmlNode(x).id === id);
          // 出现开关重合闸时间
          const outLineTime = (allMainBreaker[0] && allMainBreaker[0].xTimeLimit) ? allMainBreaker[0].xTimeLimit : 7;
          // 默认重合闸时间
          const defaultTime = 7;

          // 主线开关
          if (index !== -1) {
            // 出线开关重合闸时间
            if (index === 0) {
              return outLineTime;
            }
            // 一级主线开关及后续开关默认7s
            return defaultTime;
          }
          // 一级分支开关
          const isFirst = structure.some(x => {
            return Globals.formatXmlNode(x.to).id === id && allBranchParent.some(b => Globals.formatXmlNode(b).id === Globals.formatXmlNode(x.from).id);
          });
          if (isFirst) {
            return allMainBreaker.length * defaultTime * 2 + defaultTime + outLineTime;
          }
          // 次级分支开关
          return defaultTime;
        };

        graphData.nodeDataArray.push({
          key: id,
          category: type || 'error',
          geometryString: this.getDeviceModel(type).svg,
          text: type === 'acLineSegment' ? '' : name,
          loc: '',
          params: {
            tag,
            restartTime: getRestartTime()
          }
        });
      };

      for (const relation of structure) {
        const { from, to } = relation;
        // 添加from
        const fromMode = Globals.formatXmlNode(from);
        addNode(fromMode);
        // 添加to
        const toMode = Globals.formatXmlNode(to);
        addNode(toMode);

        // 添加连线
        const { id: fromKey } = fromMode;
        const { id: toKey } = toMode;

        graphData.linkDataArray.push({
          key: `${fromKey}_${toKey}`,
          from: fromKey,
          to: toKey,
          strokeDashArray: structure.indexOf(relation) === 0 ? [10, 5] : null
        });
      }
      return graphData;
    },
    generateGraphData1({ structure, allBreaker }) {
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

        // 已有的的重合闸时间
        let reclosingTime = '';
        const currentNode = allBreaker.find(x => x.svg === id);
        if (currentNode) {
          const { reclosingTime: time, calculateType = '' } = currentNode;
          if (calculateType === 'selfHealing') {
            reclosingTime = time;
          }
        }

        // 图形类型
        const type = tagToType[tag];
        // 获取重合闸时间
        const getRestartTime = () => {
          if (type !== 'breaker') {
            return {};
          }
          if (tag === 'cim:LoadBreakSwitch') {
            return {};
          }

          const outLineBreaker = allBreaker.find(x => x.svg === Globals.formatXmlNode(allMainBreaker[0]).id);
          // 出现开关重合闸时间
          const outLineTime = (outLineBreaker && outLineBreaker.reclosingTime) ? outLineBreaker.reclosingTime : 7;
          // 默认重合闸时间
          const defaultTime = 7;

          // 主线开关
          const index = allMainBreaker.findIndex(x => Globals.formatXmlNode(x).id === id);
          if (index !== -1) {
            // 已有指定重合闸时间，则使用此时间
            if (reclosingTime) {
              return { restartTime: reclosingTime, isBranch: false };
            }
            // 出线开关重合闸时间
            if (index === 0) {
              return { restartTime: outLineTime, isBranch: false };
            }
            // 一级主线开关及后续开关默认7s
            return { restartTime: defaultTime, isBranch: false };
          }
          // 一级分支开关
          const branchPaths = Globals.getParentPaths({ id, structure })[0];
          const lastParent = branchPaths.filter(x => tagToType[Globals.formatXmlNode(x).tag] === 'breaker')[0];
          // 已有指定重合闸时间，则使用此时间
          if (reclosingTime) {
            return { restartTime: reclosingTime, isBranch: true };
          }
          // 开关最近的一个根开关是否是主线开关，若是则为一级分支开关
          if (allMainBreaker.some(x => Globals.formatXmlNode(x).id === Globals.formatXmlNode(lastParent).id)) {
            return { restartTime: Math.min(allMainBreaker.length - 1, 4) * defaultTime * 2 + defaultTime + outLineTime, isBranch: true };
          }
          // 次级分支开关
          return { restartTime: defaultTime, isBranch: true };
        };

        const { restartTime = '', isBranch = false } = getRestartTime();
        graphData.nodeDataArray.push({
          key: id,
          category: type || 'error',
          geometryString: this.getDeviceModel(type).svg,
          text: type === 'acLineSegment' ? '' : name,
          loc: '',
          params: {
            tag,
            restartTime,
            isBranch
          }
        });
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
      const allBranch = allBreaker.filter(x => x.calculateType && !allMainKey.includes(x.svg));
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
    generateGraphData2(svgData) {
      const graphData = {
        nodeDataArray: [],
        linkDataArray: []
      };

      if (!svgData) {
        return graphData;
      }

      const { layers, symbols } = svgData;

      for (const unit of layers) {
        const { id, name, layer, use = [], polyline = [] } = unit;
        if (!name) {
          continue;
        }

        // if (layer === 'ConnLine_Layer') {
        //
        // }

        const getLocAndGeo = (use, polyline) => {
          let geo = '';
          let loc = '';

          if (use.length > 0) {
            const { x, y } = use[0];
            loc = new go.Point(Number(x), Number(y));

            for (const item of use) {
              const href = item['xlink:href'];
              const found = symbols.find(x => href === `#${x.id}`);
              if (!found) {
                continue;
              }
              for (const p of found.path) {
                geo += svgToPath(p);
              }
            }
          }

          if (polyline.length > 0 && geo === '') {
            const { points } = polyline[0];
            const split = points.split(' ');
            if (split.length >= 2) {
              const start = split[0].split(',');
              const end = split[1].split(',');
              loc = new go.Point((Number(start[0]) + Number(end[0])) / 2, (Number(start[1]) + Number(end[1])) / 2);
            }

            for (const item of polyline) {
              geo += svgToPath(item.str);
            }
          }

          return { geo, loc };
        };

        const { loc, geo } = getLocAndGeo(use, polyline);
        if (!loc) {
          continue;
        }
        const nodeData = {
          key: id,
          category: 'auto',
          text: name,
          geo,
          loc
        };
        if (use.length > 0) {
          const { width, height, transform } = use[0];
          nodeData.width = Number(width);
          nodeData.height = Number(height);

          const transList = transform.split(') ');
          const prop = {};
          for (const item of transList) {
            const splitItem = item.split('(');
            const splitItem2 = splitItem[1].split(',');
            prop[splitItem[0]] = Number(splitItem2[0]);
          }

          nodeData.scale = prop.scale;
          nodeData.angle = prop.rotate;
        }
        if (polyline.length > 0 && layer === 'BusbarSection_Layer') {
          nodeData.strokeWidth = Number(polyline[0]['stroke-width']);
        }
        graphData.nodeDataArray.push(nodeData);
      }

      return graphData;
    },
    // 获取设备模型
    getDeviceModel(type) {
      return Globals.device[type] || {};
    },
    removeTab(targetName) {
      const tabs = this.editableTabs;
      let activeName = this.editableTabsValue;
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.uri === targetName) {
            const nextTab = tabs[index + 1] || tabs[index - 1];
            if (nextTab) {
              activeName = nextTab.uri;
            }
          }
        });
      }
      this.editableTabs = tabs.filter(tab => tab.uri !== targetName);
      this.editableTabsValue = this.editableTabs.length === 0 ? this.$options.data().editableTabsValue : activeName;
    }
  }
};
</script>

<style scoped>
.box-card {
  margin: 5px 0 15px;
}

:deep(.el-tabs--border-card > .el-tabs__content) {
  padding: 15px 0 0;
}
</style>
