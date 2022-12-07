<!--meta:{"index":100,"label":"消息提示","auths":["admin","master","user","readonly"],"roles":["audit", "launch", "repeal", "browse"],"hide":true}-->
<template>
  <div class="container">
    <Card class="shadow-black">
      <div slot="title">
        定值单管理系统
      </div>
      <h3>{{ message }}</h3>
      <br />
      <Button type="primary" size="large" to="/">返回首页</Button>
      <Button type="success" size="large" class="m-l-20" to="/login">切换用户</Button>
    </Card>
  </div>
</template>

<script>
  import {decode} from 'urlencode';

  export default {
    name: 'topic-message',
    head() {
      return {
        title: '消息'
      };
    },
    layout: 'empty',
    data() {
      return {};
    },
    asyncData({query}) {
      return {
        message: decode(query.message)
      };
    }
  };
</script>

<style scoped>
  .container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: antiquewhite;
  }

  .shadow-black {
    box-shadow: 5px 5px 40px grey;
  }
</style>
