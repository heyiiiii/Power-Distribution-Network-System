<template>
  <el-submenu v-if="item.children && item.children.length > 0" :index="item._id" :key="item._id">
    <template slot="title">
      <i v-if="item.icon" :class="item.icon"></i>
      <span v-html="item.label"></span>
      <p v-if="item.description">
        <small class="text-grey" v-html="item.description"></small>
      </p>
    </template>
    <tree-menu v-for="sub of item.children" :item="sub" :key="sub._id" @route-change="onRouteChange"></tree-menu>
  </el-submenu>
  <el-menu-item v-else :index="item._id" :to="item.path" :key="item._id" @click.native="onSwitchRoute">
    <i v-if="item.icon" :class="item.icon"></i>
    <span slot="title" v-html="item.label"></span>
    <p v-if="item.description">
      <small class="text-grey" v-html="item.description"></small>
    </p>
  </el-menu-item>
</template>

<script>
  export default {
    name: 'TreeMenu',
    props: {
      item: {
        type: Object,
        required: true
      }
    },
    methods: {
      onSwitchRoute() {
        this.$emit('route-change', this.item._id);
      },
      onRouteChange(routeId) {
        this.$emit('route-change', routeId);
      }
    }
  };
</script>
