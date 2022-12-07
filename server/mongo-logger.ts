import stream from 'stream';
import sizeof from 'object-sizeof';
import Koa from 'koa';
import conf from '../configs';
import {ISessInfo} from './session-store';
import utils from './utils';
import {getConfigValueByKey, ILogData, Log} from './mongo-schema';

export default class MongoLogger {
  private ignoreResultUrls: string[] = [];
  private calcResultSizeUrls: string[] = [];

  constructor() {
    this.reloadSystemConfig();
    setInterval(this.reloadSystemConfig.bind(this), 20000);
  }

  protected reloadSystemConfig() {
    getConfigValueByKey('LogLimitIgnoreResultUrls', '').then(value => {
      this.ignoreResultUrls = value.replace(/[\r\n]/g, '').split(';').map((x:string) => x.trim()).filter((x: string) => x);
    }).catch((err) => {
      console.error(err);
      this.ignoreResultUrls = [];
    });
    getConfigValueByKey('LogLimitCalcResultSizeUrls', '').then(value => {
      this.calcResultSizeUrls = value.replace(/[\r\n]/g, '').split(';').map((x:string) => x.trim()).filter((x: string) => x);
    }).catch((err) => {
      console.error(err);
      this.calcResultSizeUrls = [];
    });
  }

  protected getLimitType(url: string): 'ignore' | 'calc' | '' {
    if (this.ignoreResultUrls.some((x: string) => {
      return !!url.match(new RegExp(x, 'ig'));
    })) {
      return 'ignore';
    }

    if (this.calcResultSizeUrls.some((x: string) => {
      return !!url.match(new RegExp(x, 'ig'));
    })) {
      return 'calc';
    }

    return '';
  }

  protected getObjectType(x: any) {
    try {
      if (x !== undefined && x !== null) {
        return Object.prototype.toString.call(x);
      } else {
        return typeof x;
      }
    } catch (err: any) {
      console.error(err);
      return '';
    }
  }

  processRequestLog(ctx: Koa.Context, beginTime: number, err?: Error) : Promise<ILogData> {
    return new Promise((resolve, reject) => {
      try {
        const session = ctx.session as unknown as ISessInfo;
        const matches = ctx.path.match(/(\/[^/]*)\/?/);
        const logData: ILogData = new Log({
          time: beginTime,
          serverId: conf.service.id,
          version: 1,
          address: utils.getClientIP(ctx.request),
          url: ctx.path,
          method: ctx.method,
          headers: ctx.headers,
          query: ctx.querystring,
          level: err ? 'error' : 'info',
          category: 'axios',
          module: matches ? matches[1] : 'unknown',
          userId: session && session.user ? session.user._id : undefined,
          error: err
        });

        logData.level = 'info';
        if (!ctx.path.startsWith(conf.service.routerBase)) {
          if (ctx.body instanceof stream.Stream || ctx.body instanceof Buffer) {
            logData.result = 'stream';
          } else {
            switch (this.getLimitType(ctx.path)) {
              case 'ignore': {
                logData.result = '不记录该接口的返回值';
                break;
              }
              case 'calc': {
                logData.result = '返回字节数: ' + sizeof(ctx.body);
                if (Array.isArray(ctx.body)) {
                  logData.result += ', 记录数: ' + ctx.body.length;
                }
                break;
              }
              default: {
                try {
                  logData.result = JSON.stringify(ctx.body);
                } catch (e) {
                  logData.result = ctx.body;
                }
                break;
              }
            }

            if (ctx.body && typeof ctx.body === 'object') {
              if ('succ' in ctx.body) {
                // @ts-ignore
                logData.succ = String(ctx.body.succ);
                // @ts-ignore
                logData.level = ctx.body.succ ? 'info' : 'error';
              }
              if ('message' in ctx.body) {
                // @ts-ignore
                logData.message = String(ctx.body.message);
              }
            }
          }
        }

        // @ts-ignore
        if (ctx.request.rawBody) {
          // @ts-ignore
          logData.param = ctx.request.rawBody;
        }
        logData.duration = new Date().getTime() - beginTime;
        logData.resultType = this.getObjectType(ctx.body);
        logData.contentType = ctx.get('Content-Type');
        logData.contentLength = ctx.get('Content-Length');
        logData.save((err, record) => {
          if (err) {
            console.error('存储mongodb日志出现异常: ', err);
            reject(err);
          } else {
            resolve(record);
          }
        });
      } catch (err: any) {
        console.error(err);
        reject(err);
      }
    });
  }
}
