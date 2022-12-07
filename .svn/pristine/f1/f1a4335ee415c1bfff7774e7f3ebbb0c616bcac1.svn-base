<template>
  <div class="full-width" style="background: #eee">
    <el-row>
      <el-col :span="6" :offset="4">
        <div class="exception-image"></div>
      </el-col>
      <el-col :span="8" :offset="2">
        <div>
          <h1 class="code">404</h1>
          <div class="exception-message">
            抱歉，您访问的页面不存在
          </div>
          <div class="exception-message" v-html="message">
          </div>
          <div>
            <el-button type="primary" @click="directTo('/')">返回首页</el-button>
            <el-button type="success" @click="directTo('/login')">切换用户</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  export default {
    name: 'C-404',
    props: {
      message: {
        type: String,
        default: ''
      }
    },
    methods: {
      directTo(path) {
        this.$router.push(path);
      }
    }
  };
</script>

<style scoped>
  .code {
    margin-top: 24px;
    margin-bottom: 24px;
    color: #515a6e;
    font-weight: 600;
    font-size: 72px;
    line-height: 72px;
  }
  .exception-image {
    float: right;
    width: 100%;
    max-width: 430px;
    height: 360px;
    background-image: url("~/static/img/404.svg");
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: contain;
  }
  .exception-message {
    margin-bottom: 16px;
    color: #808695;
    font-size: 20px;
    line-height: 28px;
  }
</style>
