<!--meta:{"index":100,"label":"消息提示","auths":["admin","master","user","readonly"],"roles":["audit", "launch", "repeal", "browse"],"hide":true}-->
<template>
  <div>
  </div>
</template>

<script>
  import {decode} from 'urlencode';

  export default {
    name: 'topic-throw',
    head() {
      return {
        title: '错误跳转'
      };
    },
    layout: 'empty',
    data() {
      return {};
    },
    asyncData({req, error}) {
      try {
        function getCookie(name, strCookie) {
          const arrCookie = strCookie.split(';');
          for (let i = 0; i < arrCookie.length; i++) {
            const arr = arrCookie[i].split('=');
            if (arr[0].trim() === name) {
              return arr[1];
            }
          }
          return {};
        }

        const cookie = req.headers.cookie;
        const message = getCookie('message', cookie);
        const statusCode = getCookie('statusCode', cookie);
        error({
          statusCode: Number(statusCode || 500),
          message: decode(message)
        });
      } catch (err) {
        error({
          statusCode: 404,
          message: '不允许主动访问throw页面'
        });
      }
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
