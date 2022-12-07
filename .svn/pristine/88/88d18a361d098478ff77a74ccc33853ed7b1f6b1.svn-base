import consola from 'consola';
import {Context, Middleware, Next} from 'koa';
import {ISessInfo} from '../../session-store';

function authorize(auths: string[]): Middleware<Context, Next> {
  return function (ctx: Context, next) {
    try {
      const sess = ctx.session as unknown as ISessInfo;
      if (sess) {
        if (sess && auths.some((x: any) => sess.auths.includes(x))) {
          return next();
        } else {
          ctx.throw(401, 'authorize中间件验证权限失败: 接口' + ctx.path + '只能被[' + auths.join(',') + ']权限的用户调用, 当前用户[' + sess.user.name + ']权限为[' + sess.auths.join(',') + ']');
        }
      } else {
        ctx.throw(401, 'authorize中间件验证权限失败: 接口' + ctx.path + '访问时不存在session');
      }
    } catch (err: any) {
      consola.error(err);
      // @ts-ignore
      ctx.throw(401, 'authorize中间件验证权限失败: ' + err.message);
    }
  };
}

export const Admin = authorize(['admin']);
export const Master = authorize(['admin', 'master']);
export const User = authorize(['admin', 'master', 'user']);
export const Readonly = authorize(['admin', 'master', 'user', 'readonly']);
export const AllAuth = authorize(['admin', 'master', 'user', 'readonly']);
