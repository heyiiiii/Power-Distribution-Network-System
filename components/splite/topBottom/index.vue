<template>
  <div ref="container" class="x-container">
    <div class="top" ref="top">
      <slot name="top" :height="topHeight"></slot>
    </div>
    <div class="split-horizontal non-select" :style="{height: splitHeight + 'px'}" ref="split" @mousedown.stop="onSplitMouseDown" @mouseup="onSplitMouseUp">
      <div class="divider" :style="{height: splitHeight + 'px', lineHeight: splitHeight + 'px'}" />
    </div>
    <div class="bottom" ref="bottom">
      <slot name="bottom" :height="bottomHeight"></slot>
    </div>
  </div>
</template>

<script>
import store from 'store';

export default {
  name: 'split-top-bottom',
  props: {
    sid: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      required: true
    },
    splitHeight: {
      type: Number,
      default: 6
    },
    delay: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      handlerDown: false,
      topHeight: this.height / 2,
      bottomHeight: this.height / 2
    };
  },
  computed: {
    container() {
      return $(this.$refs.container);
    },
    top() {
      return $(this.$refs.top);
    },
    bottom() {
      return $(this.$refs.bottom);
    },
    split() {
      return $(this.$refs.split);
    }
  },
  watch: {
    height(newHeight) {
      if (this.top.height() + 20 >= newHeight) {
        this.setupNorthHeight(newHeight - 20);
      } else {
        this.container.height(newHeight);
      }

      if (this.delay) {
        this.$nextTick(() => {
          this.topHeight = this.top.height();
          this.bottomHeight = this.bottom.height();
        });
      } else {
        this.topHeight = this.top.height();
        this.bottomHeight = this.bottom.height();
      }
    }
  },
  mounted() {
    if (this.sid) {
      const height = store.get(this.sid);
      if (height) {
        this.topHeight = height;
      }
    }

    $(window).on('mousemove', this.onSplitMouseMove);
    $(window).on('mouseup', this.onSplitMouseUp);
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
    $(window).off('mouseup', this.onSplitMouseUp);
  },
  methods: {
    redrawLayout() {
      this.container.height(this.height);
      this.setupNorthHeight(this.topHeight);
      this.$nextTick(() => {
        this.$emit('onLayoutChanged', this.top.height(), this.bottom.height());
      });
    },
    setupNorthHeight(height) {
      if (typeof height === 'string') {
        this.top.height(height);
        this.bottom.css({top: this.top.height() + 2});
      } else if (height > 5) {
        this.top.height(height - 2);
        this.bottom.css({top: this.top.height() + 6});
      }

      this.topHeight = this.top.height();
      this.bottomHeight = this.bottom.height();
    },
    onSplitMouseMove(event) {
      if (this.handlerDown) {
        if (event.pageY > this.container.offset().top + 10 && event.pageY + 40 < this.container.offset().top + this.container.height()) {
          const offset = this.top.offset().top;
          this.setupNorthHeight(event.pageY - offset);
        } else {
          this.handlerDown = false;
        }
      }
    },
    onSplitMouseDown(event) {
      if (event.pageY < this.container.offset().top + 10) {
        this.setupNorthHeight(16);
      } else if (event.pageY + 40 > this.container.offset().top + this.container.height()) {
        this.setupNorthHeight(this.container.height() - 50);
      } else {
        this.handlerDown = true;
      }
    },
    onSplitMouseUp(event) {
      if (this.handlerDown) {
        this.handlerDown = false;
        this.topHeight = this.top.height();
        if (this.sid) {
          store.set(this.sid, this.topHeight);
        }
        this.$emit('onLayoutChanged', this.top.height(), this.bottom.height());
      }
    }
  }
};
</script>

<style type="text/css" scoped>
.x-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.split-horizontal {
  position: relative;
  width: 100%;
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
  cursor: ns-resize;
}

.top {
  width: 100%;
  overflow: auto;
}

.bottom {
  width: 100%;
  position: absolute;
  bottom: 0;
  overflow: auto;
}

.divider {
  margin: 0;
  position: absolute;
  display: inline-block;
  left: 50%;
  top: 0;
  font-size: 14px;
  font-weight: bolder;
  -webkit-transform: translateX(-50%);
  -moz-transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  transform: translateX(-50%);
}
</style>
