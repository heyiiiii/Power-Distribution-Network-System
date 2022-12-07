import {roleExcludes} from './excludes';

async function matchExcludes(path) {
  for (const exclude of roleExcludes) {
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

export default async function({route, store, error}) {
  try {
    if (await matchExcludes(route.path)) {
      return true;
    }

    if (route.path === '/') {
      return true;
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
      const roles = [];
      if (Array.isArray(found.roles)) {
        roles.push(...found.roles);
      } else if (typeof found.roles === 'string' && (found.roles !== 'any' || found.roles === 'all')) {
        roles.push(...store.getters.getRoles);
      }

      if (roles.length > 0 && !roles.some(x => store.getters.getRoles.includes(x))) {
        error({
          statusCode: 403,
          message: '角色错误：当前用户角色不允许访问"' + found.label + '"'
        });
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('nuxt中间件role.js出现异常');
    console.error(err);
    error({
      statusCode: 500,
      message: '角色检查中间件异常: ' + err.message
    });
    return false;
  }
}
