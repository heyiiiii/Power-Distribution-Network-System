<template>
  <el-container style="padding: 0">
    <el-header class="header" :style="{height: headerHeight + 'px'}">
      <div class="flex-row text-white full-width" style="justify-content: space-between">
        <div>
          <div class="tree-container" @click="isCollapse = !isCollapse">
            <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
          </div>
          <span class="header-title">{{ getHeaderTitle }}&nbsp;&nbsp;</span>
        </div>
        <div>
          <el-dropdown size="medium" @command="onHeaderMenuClick">
            <span class="el-dropdown-link text-white hover-cursor">
              <i class="el-icon-user"></i>&nbsp;&nbsp;{{ getUserName }}
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="exit">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-container>
      <transition name="el-zoom-in-center">
        <el-aside
          class="aside"
          width="auto"
          :style="{height: getClientHeight + 'px'}"
        >
          <el-menu
            class="el-menu-vertical-demo"
            :collapse="isCollapse"
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ffd04b"
            @select="onRouteChange"
          >
            <tree-menu v-for="item of routeTree" :item="item" :key="item._id"></tree-menu>
          </el-menu>
        </el-aside>
      </transition>
      <el-main :style="{height: getClientHeight + 'px'}"
               style="overflow: auto; margin: 0; padding: 0">
        <Nuxt/>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import TreeMenu from '@/components/treeMenu';

export default {
  name: 'layout-default',
  head() {
    return {
      script: [
        { src: this.getOnlyofficeApiUrl }
      ]
    };
  },
  components: {
    TreeMenu
  },
  data() {
    return {
      isCollapse: false,
      headerHeight: 42,
      asideWidth: 200,
      showDepartments: false,
      headerBackground: '#00787c',
      asideBackground: '#f2f4f5',
      asideCollapsed: true,
      asideAutoCollapse: false,
      time: '',
      timeUpdated: true,
      timeout: null,
      lastTimeClickTick: 0,
      timeClickCount: 0,
      timeClickTickResetTimer: null,
      asideShow: false
    };
  },
  computed: {
    ...mapGetters([
      'messageKey',
      'getUser',
      'getClientHeight',
      'getUserName',
      'getUserId',
      'getParams',
      'hasAdminAuth',
      'getOnlyofficeApiUrl',
      'getUserRoutes',
      'getSettingConfig'
    ]),
    getHeaderTitle() {
      const headerTitle = this.getSettingConfig.find(x => x.name === 'headerTitle');
      return headerTitle ? headerTitle.value : '配电网整定计算系统';
    },
    getCurrentRouteName() {
      const userRoute = this.getUserRoutes.find(x => x.path === this.$route.path);
      if (userRoute) {
        return userRoute.label;
      }
      return '';
    },
    currentRouteName() {
      return this.$route.name;
    },
    routeTree() {
      const generateTree = (routes, parentId) => {
        const items = routes.filter(x => x.parentId === parentId);
        items.forEach((item, index) => {
          item.children = generateTree(routes, item._id);
        });
        return items;
      };
      const routes = this.getUserRoutes.map(x => Object.assign({}, x));
      return generateTree(routes, '');
    }
  },
  mounted() {
    this.setUserAgent(navigator.userAgent);
    this.$on('onResize', this.onResize);
    let timeout = null;
    $(window).resize(e => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      timeout = setTimeout(() => {
        this.$emit('onResize');
        timeout = null;
      }, 200);
    });

    this.$emit('onResize');
  },
  methods: {
    ...mapMutations([
      'setWindowHeight',
      'setClientHeight',
      'setClientWidth',
      'setUserAgent',
      'appendTempAdminAuth'
    ]),
    onAsideCollapsed(asideCollapsed) {
      this.asideCollapsed = asideCollapsed;
    },
    onResize() {
      const windowHeight = $(window).height();
      this.setWindowHeight(windowHeight);
      this.setClientHeight(windowHeight - this.headerHeight);
      this.setClientWidth($(window).width());
    },
    onRouteChange(index) {
      if (index) {
        const route = this.getUserRoutes.find(x => x._id === index);
        if (route.path) {
          this.$router.push(route.path);
        }
      }
    },
    onHeaderMenuClick(cmd) {
      console.log(cmd);
      switch (cmd) {
        case 'exit': {
          this.$confirm('是否退出用户' + this.getUserName + '？', '请确认', {
            confirmButtonText: '退出',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.$axios.get('/auth/logout').catch(err => console.error(err));
            this.$router.push({ name: 'login' });
          });
          break;
        }
      }
    }
  }
};
</script>

<style scoped>
.trans90 {
  transform: rotate(-90deg);
}

.menu-btn {
  font-size: 23px;
  color: white;
  cursor: pointer;
  transition: transform 250ms;
}

.header {
  z-index: 2;
  display: flex;
  align-items: center;
  flex-direction: row;
  text-align: right;
  font-size: 12px;
  background-size: 100% 100%;
  background: linear-gradient(313deg, #006c8c, #20867f, #20a082, #07a781);
  box-shadow: 0 2px 6px rgb(5 28 51 / 40%);
}

.aside {
  z-index: 1;
  box-sizing: border-box;
  box-shadow: 2px 0 6px rgb(5 28 51 / 40%);
  background: linear-gradient(313deg, #006c8c, #20867f, #20a082, #07a781);
}

:deep(.el-menu) {
  border: none;
}

.hover-cursor {
  cursor: pointer;
}

:deep(.el-dropdown-menu--mini) {
  padding: 10px 0;
}

.page-component__scroll {
  height: 100%;
}

.page-component__scroll :deep(.el-scrollbar__wrap) {
  overflow-x: auto;
}

:deep(.el-menu-item i) {
  color: #fff;
}

.tree-container {
  font-size: 30px;
  padding: 4px 10px 7px;
  line-height: 30px;
  height: 100%;
  float: left;
  cursor: pointer;
  -webkit-transition: background .3s;
  transition: background .3s;
  -webkit-tap-highlight-color: transparent;
}

.tree-container:hover {
  background: rgba(0,0,0,.075);
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.header-title {
  font-size: x-large;
  font-weight: bold;
  padding-left: 10px;
}
</style>
