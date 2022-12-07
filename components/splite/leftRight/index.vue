<template>
  <div ref="container" class="x-container" @resize="onResize">
    <div class="left" ref="left">
      <slot name="left" :width="leftWidth" :height="height" />
    </div>
    <div :class="{ 'closed' : !isShow }" @click="onClickSummary">
      <div class="summary">
        <span>{{ leftName }}</span>
      </div>
    </div>
    <div class="split-content" v-show="isShow">
      <div class="split-vertical" :style="{width: splitWidth + 'px'}" ref="split" @mousedown.stop="onSplitMouseDown" @mouseup="onSplitMouseUp">
        <div class="divider" :style="{width: splitWidth + 'px'}" />
      </div>
      <a class="toggle" @click="onClickToggle">
        <span title="收起侧栏" class="icon-content">
          <i class="el-icon-caret-left" />
          <svg height="56" viewBox="0 0 12 56" width="12" xmlns="http://www.w3.org/2000/svg">
            <path
              d="m8.13049517 4.06524758-8.13049517-4.06524758v56l8.13049517-4.0652476c2.37148823-1.1857441 3.86950483-3.6095859 3.86950483-6.2609903v-35.3475242c0-2.65140439-1.4980166-5.07524622-3.86950483-6.26099032z"
              :fill="toggleColor"
              fill-rule="evenodd"
            />
          </svg>
        </span>
      </a>
    </div>
    <div class="right" ref="right">
      <slot name="right" :width="rightWidth" :height="height" />
    </div>
  </div>
</template>

<script>
import store from 'store';

export default {
    name: 'split-left-right',
    props: {
      sid: {
        type: String,
        default: ''
      },
      height: {
        type: Number,
        required: true
      },
      splitWidth: {
        type: Number,
        default: 6
      },
      leftWidthInit: {
        type: Number,
        default: 300
      },
      leftName: {
        type: String,
        default: '展开'
      },
      delay: {
        type: Boolean,
        default: false
      },
      toggleColor: {
        type: String,
        default: '#07a781'
      }
    },
    data() {
      return {
        isShow: true,
        handlerDown: false,
        leftWidth: this.leftWidthInit,
        rightWidth: 100
      };
    },
    computed: {
      container() {
        return $(this.$refs.container);
      },
      left() {
        return $(this.$refs.left);
      },
      right() {
        return $(this.$refs.right);
      }
    },
    watch: {
      height(newHeight) {
        this.container.height(newHeight);
      }
    },
    mounted() {
      if (this.sid) {
        const width = store.get(this.sid);
        if (width) {
          this.leftWidth = width;
        }
      }

      $(window).on('mousemove', this.onSplitMouseMove);
      $(window).on('resize', this.onResize);

      if (this.delay) {
        this.$nextTick(() => {
          this.redrawLayout();
        });
      } else {
        this.redrawLayout();
      }
    },
    beforeDestroy() {
      $(window).off('mousemove', this.onSplitMouseMove);
      $(window).off('resize', this.onResize);
    },
    methods: {
      onClickSummary() {
        this.resetLeftWidth(this.leftWidth);
        this.isShow = true;
      },
      onClickToggle() {
        this.left.width(0);
        this.right.css({ left: this.left.width() + 30 });
        this.isShow = false;
      },
      redrawLayout() {
        this.container.height(this.height);
        this.resetLeftWidth(this.leftWidth);
        this.$nextTick(() => {
          this.$emit('onLayoutChanged', this.left.width(), this.right.width());
        });
      },
      onResize() {
        if (this.left.width() + 20 >= this.container.width()) {
          this.resetLeftWidth(this.container.width() - 20);
        }
      },
      resetLeftWidth(width) {
        if (typeof height === 'string') {
          this.left.width(width);
          this.right.css({ left: this.left.width() + 2 });
        } else if (width > 10) {
          this.left.width(width - 2);
          this.right.css({ left: this.left.width() + 6 });
        }

        this.leftWidth = this.left.width();
        this.rightWidth = this.right.width();
      },
      onSplitMouseDown(event) {
        this.handlerDown = true;
        if (event.pageX <= this.container.offset().left + 10) {
          this.resetLeftWidth(15);
        } else if (event.pageX + 60 > this.container.offset().left + this.container.width()) {
          this.resetLeftWidth(this.container.width() - 80);
        }
      },
      onSplitMouseMove(event) {
        if (this.handlerDown) {
          if (event.pageX > this.container.offset().left + 10 && event.pageX + 60 < this.container.offset().left + this.container.width()) {
            const offset = this.left.offset().left;
            this.resetLeftWidth(event.pageX - offset);
          } else {
            this.handlerDown = false;
          }
        }
      },
      onSplitMouseUp(event) {
        if (this.handlerDown) {
          if (this.sid) {
            store.set(this.sid, this.left.width());
          }
          this.handlerDown = false;
          this.$emit('onLayoutChanged', this.left.width(), this.right.width());
        }
      }
    }
  };
</script>

<style scoped>
.x-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: 0 1px;
}

.left {
  position: relative;
  float: left;
  height: 100%;
  width: 30%;
  overflow: auto;
}

.split-content {
  position: relative;
  float: left;
  height: 100%;
  z-index: 5;
  width: 20px;
}

.split-content:hover .toggle {
  display: flex;
}

.split-vertical {
  position: relative;
  float: left;
  height: 100%;
  background-color: #dbeaf0;
  color: darkgrey;
  overflow: hidden;
  user-select: none;
  z-index: 5;
  box-shadow: 0 1px 3px rgba(34, 25, 25, 0.2);
  -webkit-transition: background-color linear 500ms;
  -moz-transition: background-color linear 500ms;
  -o-transition: background-color linear 500ms;
  transition: background-color linear 500ms;
  cursor: ew-resize;
}

.right {
  position: absolute;
  right: 1px;
  height: 100%;
  overflow-x: hidden;
}

.divider {
  margin: 0;
  position: absolute;
  left: 60%;
  top: 50%;
  font-size: 14px;
  font-weight: bold;
  -webkit-transform: translateX(-50%) translateY(-50%);
  -moz-transform: translateX(-50%) translateY(-50%);
  -ms-transform: translateX(-50%) translateY(-50%);
  transform: translateX(-50%) translateY(-50%);
}

.toggle {
  margin-left: 5px;
  display: none;
  left: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.icon-content {
  display: inline-block;
  height: 56px;
  position: relative;
  width: 12px;
  left: 2px;
}

.icon-content i {
  align-items: center;
  color: #fff;
  display: flex;
  height: 56px;
  justify-content: center;
  margin: 0;
  padding: 0;
  position: absolute;
  transform: scale(.6);
  width: 12px;
  z-index: 8;
  font-size: 1em;
}

.summary {
  display: none;
  letter-spacing: 1px;
  overflow: hidden;
  padding-top: .65em;
  text-overflow: ellipsis;
}

.closed {
  position: relative;
  float: left;
  height: 100%;
  background: #fff;
  width: 29px;
  cursor: pointer;
  border-right: 1px solid #dadee3;
  transition: background-color 0.5s;
}

.closed:hover {
  background-color: #f5f6f8;
}

.closed > .summary {
  position: relative;
  float: left;
  display: block;
  height: 100%;
  right: 0;
  top: 0;
  text-align: center;
}
</style>
