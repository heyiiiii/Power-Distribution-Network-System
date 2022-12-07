import {stringify} from 'qs';
import {authExcludes} from './excludes';

async function matchExcludes(path) {
  for (const exclude of authExcludes) {
    if (typeof exclude === 'string') {
      if (path === exclude) {
        return true;
      }

      continue;
    }

    if (typeof exclude === 'function') {
      if (await exclude(path)) {
        return true;
      }

      continue;
    }

    if (exclude instanceof RegExp) {
      if (exclude.test(path)) {
        return true;
      }
    }
  }

  return false;
}

export default async function({$axios, route, redirect, store, error}) {
  try {
    if (await matchExcludes(route.path)) {
      return true;
    }

    if (!store.getters.isAuthenticated) {
      if (route.path !== '/') {
        redirect('/login?' + stringify({
          redirect: route.path
        }, {
          skipNulls: true
        }));
      } else {
        redirect('/login');
      }
      return false;
    } else {
      if (route.path === '/') {
        return true;
      }
    }

    const {data} = await $axios.get('/auth/user-status/' + store.getters.getUserId);
    if (!data.succ) {
      error({
        statusCode: 403,
        message: '权限校验失败：未找到用户"' + store.getters.getUserId + '"'
      });
      return false;
    } else {
      if (store.getters.getUserAccount !== data.account) {
        store.commit('setUserAccount', data.account);
      }
      if (data.account !== 'root' && data.status !== 'enabled') {
        error({
          statusCode: 403,
          message: '权限校验失败：用户被禁止登录'
        });
        return false;
      }
    }

    const found = store.getters.getRoutes.find(x => x.path === route.path);
    if (!found) {
      error({
        statusCode: 404,
        message: '请检查浏览器地址栏是否正确'
      });
      return false;
    }

    if (route.path !== '/') {
      const auths = [];
      if (Array.isArray(found.auths)) {
        auths.push(...found.auths);
      } else if (typeof found.auths === 'string' && (found.auths !== 'any' || found.auths === 'all')) {
        auths.push(...store.getters.getAuths);
      }

      if (auths.length > 0 && !auths.some(x => store.getters.getAuths.includes(x))) {
        error({
          statusCode: 403,
          message: '权限错误：当前用户无权限访问"' + found.label + '"'
        });
        return false;
      }

      if (!store.getters.hasAdminAuth) {
        if (store.getters.getUserAccount !== 'root' && !store.getters.getUserRoutes.some(x => route.path === x.path)) {
          error({
            statusCode: 403,
            message: '权限错误：当前用户未配置页面"' + found.label + '"'
          });
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('nuxt中间件auth.js出现异常');
    console.error(err);
    error({
      statusCode: 500,
      message: '权限检查中间件异常: ' + err.message
    });
    return false;
  }
}
