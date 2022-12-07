<template>
  <div class="graph-body">
    <div v-show="svg" :id="svgId" v-html="svg"></div>
    <ul ref="contextMenu" :id="svgId" class="ctxmenu" style="display: none">
      <li :class="['menu-item']" v-for="(item,index) in menus" @click="onClickMenu(item.action)" :key="index">
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
const d3 = process.client ? require('d3') : {};

export default {
  name: 'svg-graph',
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
    svg: {
      type: String,
      default: ''
    },
    lineSvg: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      menus: [],
      currentDiv: ''
    };
  },
  computed: {
    getPanelHeight() {
      if (typeof this.panelHeight === 'string') {
        return this.panelHeight;
      } else {
        return this.panelHeight - 95 + 'px';
      }
    },
    svgId() {
      return `svg-${this.uri}`;
    },
    curreentMenu() {
      return `ul#${this.svgId}`;
    }
  },
  watch: {
    getPanelHeight(old, newVal) {
      if (this.svg) {
        this.currentDiv.select('svg').attr('height', newVal);
      }
    }
  },
  methods: {
    initSvg() {
      if (!this.svg) {
        return;
      }
      this.currentDiv = d3.select(`div[id=${this.svgId}]`);
      const svg = this.currentDiv.select('svg').attr('height', this.getPanelHeight);
      // 缩放和平移
      const zoom = d3.zoom().on('zoom', () => {
        svg.selectAll('g').attr('transform', d3.zoomTransform(svg.node()));
      });
      svg.call(zoom).call(zoom.transform, d3.zoomIdentity).on('dblclick.zoom', null);
      svg.selectAll('g')
        .on('click', (event) => {
          const node = d3.select(event.currentTarget).node();
          if (node.id.split('_')[0] !== 'PD') {
            return;
          }
          const parentId = node.parentNode.id;
          const layers = {
            Breaker_Layer: 'breaker',
            LoadBreakSwitch_Layer: 'breaker',
            GroundDisconnector_Layer: 'breaker',
            Disconnector_Layer: 'breaker',
            Fuse_Layer: 'breaker',
            BusbarSection_Layer: 'bus',
            PowerTransformer_Layer: 'transformer',
            ACLineSegment_Layer: 'segment'
          };
          if (!layers[parentId]) {
            return;
          }
          this.$emit('on-select-svg', { id: node.id, type: layers[parentId], lineId: this.uri });
        })
        // 右键菜单
        .on('contextmenu', (event) => {
          // 阻止默认右键
          window.oncontextmenu = (e) => {
            e.preventDefault();
          };
          const node = d3.select(event.currentTarget).node();
          if (node.id.split('_')[0] !== 'PD') {
            return;
          }
          const parentId = node.parentNode.id;
          const layers = {
            Breaker_Layer: 'breaker',
            LoadBreakSwitch_Layer: 'breaker',
            GroundDisconnector_Layer: 'breaker',
            Disconnector_Layer: 'breaker',
            Fuse_Layer: 'breaker',
            BusbarSection_Layer: 'bus',
            PowerTransformer_Layer: 'transformer',
            ACLineSegment_Layer: 'segment'
          };
          if (!layers[parentId]) {
            return;
          }
          this.menus = [];
          if (layers[parentId] === 'breaker') {
            const params = {
              lineId: this.uri,
              id: node.id,
              lineSvg: this.lineSvg
            };
            this.menus.push({
              text: '定值计算',
              action: () => this.settingCalculate(params)
            }, {
              text: '生成定值单',
              action: () => this.generalDzWord(params)
            }, {
              text: '生成计算书',
              action: () => this.generalCalculationWord(params)
            });
          }
          d3.select(this.curreentMenu)
            .style('left', event.offsetX + 'px')
            .style('top', event.offsetY + 'px')
            .style('display', 'block');
        });
      svg.on('click', () => {
        d3.select(this.curreentMenu).style('display', 'none');
      });
    },
    onClickMenu(action) {
      d3.select(this.curreentMenu).style('display', 'none');
      action();
    },
    // 定值计算
    settingCalculate({ lineId, id, lineSvg }) {
      this.$emit('on-calculate', lineId, id, lineSvg);
    },
    // 生成定值单
    generalDzWord({ lineId, id, lineSvg }) {
      this.$emit('on-general-dz', lineId, id, lineSvg);
    },
    // 生成计算书
    generalCalculationWord({ lineId, id, lineSvg }) {
      this.$emit('on-general-calculate', lineId, id, lineSvg);
    },
    // 更新标注
    updateMark(id) {
      // d3.select('svg').select('g')
    },
    // 摧毁元素
    removeSvg() {
      this.currentDiv.select('svg').remove();
    }
  }
};
</script>

<style scoped>
.graph-body {
  background: black;
  overflow-x: hidden;
  overflow-y: hidden;
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
