<!--meta:{"index":1,"label":"首页","auths":"any","roles":"any"}-->
<template>
  <el-container class="container">
    <el-header style="padding: 8px 0 0 15px" height="80px" />
    <el-main class="main-css">
      <span class="title-css">{{ getHeaderTitle }}</span>
      <el-card class="box-card card-css" v-for="item in routerPaths" :key="item.id">
        <el-row :gutter="30" slot-scope="{ height }">
          <el-col :span="4" class="menu-item-title">
            {{ item.label }}
          </el-col>
          <el-col :span="20">
            <el-row :gutter="20">
              <el-col :span="4" v-for="childrenItem in item.children" :key="childrenItem.id">
                <div class="menu-item" @click="routeTo(childrenItem.path)">
                  <span class="menu-item-text">{{ childrenItem.label }}</span>
                </div>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </el-card>
      <el-card class="box-card card-css" v-if="routerSinglePaths.length > 0">
        <el-row>
          <el-col :span="4" class="menu-item-title">
            <span>功能</span>
          </el-col>
          <el-col :span="20">
            <el-row :gutter="20">
              <el-col :span="4" v-for="item in routerSinglePaths" :key="item.id">
                <div class="menu-item" @click="routeTo(item.path)">
                  <span class="menu-item-text">{{ item.label }}</span>
                </div>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </el-card>
    </el-main>
  </el-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'DMS-Index',
  layout: 'default',
  data() {
    return {
    };
  },
  head() {
    return {
      title: this.currentRouteText
    };
  },
  computed: {
    ...mapGetters([
      'getUserRoutes',
      'getSettingConfig'
    ]),
    getHeaderTitle() {
      const headerTitle = this.getSettingConfig.find(x => x.name === 'headerTitle');
      return headerTitle ? headerTitle.value : '配电网整定计算系统';
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
      return route ? route.label : '首页';
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
    },
    routerPaths() {
      return this.routeTree.filter(x => x.path !== this.$route.path && x.children && x.children.length > 0);
    },
    routerSinglePaths() {
      return this.routeTree.filter(x => x.path !== this.$route.path && (!x.children || x.children.length === 0));
    }
  },
  methods: {
    routeTo(path) {
      this.$router.push({ path, query: {} });
    }
  }
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background: linear-gradient(313deg, #006c8c, #20867f, #20a082, #07a781);
}

.card-css {
  background: linear-gradient(313deg, #006c8c, #20867f, #20a082, #07a781);
  width: 80%;
  display: inline-block;
  margin: 50px auto 0 auto;
  border-color: #007D9D;
}

.main-css {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 0;
  min-width: 100px;
  overflow: auto;
}

.title-css {
  font-size: 35px;
  color: white;
}

.menu-item {
  background-color: #006569;
  border: 1px #007D9D solid;
  border-radius: 5px;
  height: 50px;
  margin: 5px;
  text-align: center;
  width: 100%;
  display: flex;
  display: -webkit-flex;
  align-items: center;
  justify-content: center;
  text-overflow: ellipsis;
}


.menu-item:hover {
  cursor: pointer;
  background-color: #00595C;
  border: 1px silver solid;
}


.menu-item-title {
  border-right: 1px silver dashed;
  color: white;
  font-size: 20px;
  margin-top: 13px;
  font-weight: bold
}

.menu-item-text {
  background-color: white;
  -webkit-background-clip: text;
  color: transparent;
  font-size: 16px;
  font-weight: bold
}

.menu-item-text:hover {
  background-color: white;
  -webkit-background-clip: text;
  color: transparent;
  font-size: 16px;
  font-weight: bold
}
</style>
