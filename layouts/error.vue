<template>
  <div class="container">
    <C403 v-if="error.statusCode === 403" :message="error.message"></C403>
    <C404 v-else-if="error.statusCode === 404" :message="error.message"></C404>
    <C500 v-else :code="error.statusCode" :message="error.message"></C500>
  </div>
</template>

<script>
  import C403 from '@/components/exception/C403';
  import C404 from '@/components/exception/C404';
  import C500 from '@/components/exception/C500';

  export default {
    name: 'error-page',
    props: ['error'],
    layout: 'empty',
    components: {
      C403,
      C404,
      C500
    },
    head() {
      return {
        title: '访问错误'
      };
    }
  };
</script>
<style scoped>
  .container {
    height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
</style>
