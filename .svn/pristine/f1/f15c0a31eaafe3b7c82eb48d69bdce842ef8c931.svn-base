import consola from 'consola';
import {Context, Middleware, Next} from 'koa';
import {ISessInfo} from '../../session-store';

function role(roles: string[]): Middleware<Context, Next> {
  return function (ctx: Context, next) {
    try {
      const sess = ctx.session as unknown as ISessInfo;
      if (sess) {
        if (roles.some((x: any) => sess.roles.includes(x))) {
          return next();
        } else {
          ctx.throw(401, 'role中间件验证用户角色失败: 接口' + ctx.path + '只能被[' + roles.join(',') + ']角色的用户调用, 当前用户[' + sess.user.name + ']角色为[' + sess.roles.join(',') + ']');
        }
      } else {
        ctx.throw(401, 'authorize中间件验证权限失败: 接口' + ctx.path + '访问时不存在session');
      }
    } catch (err: any) {
      consola.error(err);
      // @ts-ignore
      ctx.throw(401, 'role中间件验证用户角色失败: ' + err.message);
    }
  };
}

export const Audit = role(['audit']);
export const Launch = role(['launch']);
export const Repeal = role(['repeal']);
export const Browse = role(['browse']);
export const AllRole = role(['audit', 'launch', 'repeal', 'browse']);
