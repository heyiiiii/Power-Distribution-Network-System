// import {URL} from 'url';
import Koa from 'koa';
import compose from 'koa-compose';
import moment from 'moment';
import KoaCors from 'koa2-cors';
import Router from "koa-router";
import conf from '../configs';
import controllers from './api';
import sessionStore from './session-store';
import { ILogData } from './mongo-schema';
import MongoLogger from './mongo-logger';
import KoaBodyParser from 'koa-bodyparser';

const unless = require('koa-unless');
const cors = KoaCors({
  origin(ctx) {
    // if (ctx.request.header.referer) {
    //   const url = new URL(ctx.request.header.referer);
    //   // console.log('url: ' + ctx.path + ', origin: ' + url.origin);
    //   return url.origin;
    // }
    return ctx.request.header.origin || ctx.origin;
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 300,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'Session-Id',
    'Login-Serial',
    'npid',
    'nptoken',
    'User-Id',
    'Accept',
    'app',
    'loc',
    'X-Requested-With',
    'X-Custom-Header'
  ]
});

const proxies = function () {
  const proxy = require('koa-proxies');
  const backend = `http://${conf.backend.host}:${conf.backend.port}${conf.backend.path}`;
  return [
    proxy('/download/**', {
      target: `${conf.downloadProxy.prefix}${conf.downloadProxy.host}:${conf.downloadProxy.port}${conf.downloadProxy.path}`,
      changeOrigin: true,
      rewrite(path: string) {
        return path.replace(/^\/download\//, conf.downloadProxy.path);
      }
    }),
    proxy('/dsrv/**', {
      target: conf.dsrv.prefix + conf.dsrv.host + ':' + conf.dsrv.port,
      changeOrigin: true,
      rewrite(path: string) {
        return path.replace(/^\/dsrv\//, '/');
      }
    }),
    proxy('/dserver/**', {
      target: `${conf.pdfc.prefix}${conf.pdfc.host}:${conf.pdfc.port}`,
      changeOrigin: true,
      rewrite(path: string) {
        return path.replace(/^\/dserver\//, conf.onlyoffice.path);
      }
    }),
    proxy('/back/**', {
      target: backend,
      changeOrigin: true
    }),
    proxy('/editors/**', {
      target: conf.onlyoffice.prefix + conf.onlyoffice.host + ':' + conf.onlyoffice.port,
      changeOrigin: false,
      ws: true,
      rewrite(path: string) {
        return path.replace(/^\/onlyoffice\//, conf.onlyoffice.path);
      }
    }),
    proxy('/onlyoffice/**', {
      target: conf.onlyoffice.prefix + conf.onlyoffice.host + ':' + conf.onlyoffice.port,
      changeOrigin: false,
      ws: true,
      rewrite(path: string) {
        return path.replace(/^\/onlyoffice\//, conf.onlyoffice.path);
      }
    })
  ];
};

const errorHandler = async function (ctx: Koa.Context, next: Koa.Next) {
  try {
    await next();
  } catch (err: any) {
    ctx.body = {
      status: err.statusCode || err.status || 500,
      message: err.message,
      succ: false,
      error: JSON.parse(JSON.stringify(err))
    };
  }
};

function nuxtRender(nuxt: any, nuxtConfig: any) {
  return async function (ctx: Koa.Context, next: Koa.Next) {
    if (ctx.path === '/' || ctx.path === '/dms' || ctx.path.includes('/shield')) {
      ctx.status = 301;
      ctx.redirect(conf.service.routerBase);
      return;
    }

    if (ctx.path.startsWith(conf.service.routerBase)) {
      ctx.status = 200; // koa defaults to 404 when it sees that status is unset
      ctx.respond = false; // Bypass Koa's built-in response handling
      (ctx.req as any).axiosBaseURL = `${conf.service.prefix}${conf.service.host}:${conf.service.port}`;
      if (ctx.path === conf.service.routerBase + 'login') {
        const sessionKey = await sessionStore.dropSession(ctx);
        console.log('已删除session：' + sessionKey);
        (ctx.req as any).session = null;
        ctx.cookies.set(conf.session.cookieKey, '');
        ctx.cookies.set('captchaId', '');
        ctx.cookies.set('statusCode', '');
        ctx.cookies.set('message', '');
        if (ctx.headers['x-nginx-proxy'] !== 'true') {
          ctx.cookies.set('app', '');
          ctx.cookies.set('loc', '');
        }
      } else {
        const sess = await sessionStore.getSession(ctx);
        if (sess) {
          (ctx.req as any).session = sess; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
        }
      }
      nuxt.render(ctx.req, ctx.res);
    } else {
      await next();
    }
  };
}

const logger = function () {
  const logLimit = new MongoLogger();
  const _logger = async function (ctx: Koa.Context, next: Koa.Next) {
    if (process.env.NODE_ENV === 'development') {
      console.log('client access path: ' + ctx.path);
    }
    const beginTime = new Date().getTime();
    try {
      await next();
      logLimit.processRequestLog(ctx, beginTime).then((logData: ILogData) => {
        let result = '';
        if (ctx && ctx.body && typeof ctx.body === 'object' && 'succ' in ctx.body) {
          // @ts-ignore
          if (ctx.body.succ) {
            result = 'succ: true';
          } else {
            // @ts-ignore
            result = 'succ: false, message[' + ctx.body.message + ']';
          }
        } else {
          result = '返回值类型[' + logData.resultType + ']';
        }
        console.log('[' + logData.level + '] ' + moment(logData.time).format('HH:mm:ss.SSS') + ' - 已记录[' + ctx.path + ']日志, 耗时[' + logData.duration + '毫秒], ' + result);
      }).catch((err: Error) => {
        console.error('记录[' + ctx.path + '][error]日志时出现异常: ', err);
      });
    } catch (err: any) {
      // @ts-ignore
      logLimit.processRequestLog(ctx, beginTime, err).then((logData: ILogData) => {
        console.log('[error] ' + moment(logData.time).format('HH:mm:ss.SSS') + ' - 已记录[' + ctx.path + ']日志, 耗时[' + logData.duration + '毫秒], 异常: ', err);
      }).catch((e: Error) => {
        console.error('记录[' + ctx.path + '][error]日志时出现异常: ', e);
      });
      throw new Error(err);
    }
  };

  _logger.unless = unless;
  return _logger;
};

async function pathMonitor(ctx: Koa.Context, next: Koa.Next) {
  console.log('收到http请求[' + ctx.path + ']');
  await next();
}

export default function ({ nuxt, nuxtConfig }: any): Koa {
  const app = new Koa();
  app.proxy = true;
  app.keys = conf.session.appKeys;

  const routerRegex = new RegExp('^' + conf.service.routerBase, 'i');
  const sessionUnlessPaths = [
    /^\/$/,
    routerRegex,
    /^\/(__webpack_hmr|_nuxt|dms|auth|onlyoffice|pdfc|resource|download|dserver|socket|upload|dsrv)\/?/i,
    /\.(js|css|woff2?|eot|ttf|otf|ico|icon|png|jpe?g|gif|svg)$/i
  ];
  app.use(
    compose([
      pathMonitor,
      cors,
      sessionStore.getKoaMiddleware({
        passThroughUrls: [/^\/(sys|auth|resource|pass|setting)\//, /^\/manage\/(js-template|downloadProtectTemplate)\//]
      }).unless({ path: sessionUnlessPaths }),
      errorHandler,
      nuxtRender(nuxt, nuxtConfig),
      logger().unless({ path: [
          /^\/$/,
          routerRegex,
          /(query-logs|single-log|login-logs|compare-ping|socket|user-status|user-check)/i,
          /^\/(__webpack_hmr|_nuxt|cnd|onlyoffice|pdfc|resource|download|upload|dsrv)\//i,
          /\.(js|css|woff2?|eot|ttf|otf|ico|icon|png|jpe?g|gif|svg)$/i
        ] }),
      ...proxies(),
      KoaBodyParser()
    ])
  );

  for (const controller of controllers) {
    app.use(controller.routes()).use(controller.allowedMethods());
    console.log('已挂载axios接口簇[' + (controller as any).opts.prefix + ']');
  }


  return app;
}
