import http from 'http';
import { AddressInfo } from 'net';
import moment from 'moment-timezone';
import consola from 'consola';
import conf from '../configs';
import Globals from './globals';
import { mongoose } from './mongo-schema';
import compose from './compose';

try {
  console.log('server下的index被启动了')


  require('events').EventEmitter.prototype._maxListeners = 70;
  require('events').defaultMaxListeners = 70;
  const interfaces = require('os').networkInterfaces();
  const addresses = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        addresses.push(alias.address);
      }
    }
  }

  moment.tz.setDefault(process.env.TZ);
  moment.locale('zh-cn');
  console.log('环境变量', process.env);
  consola.log('本机ip: ', addresses);
  consola.log('当前时区: ' + moment.tz.guess());
  consola.log('当前系统时间: ' + moment(new Date()).format());
} catch (err: any) {
  consola.error('服务初始化时出现异常: ', err);
}

(function ({ Nuxt, Builder }) {
  return new Promise((resolve, reject) => {
    try {
      const nuxtConfig = require('../nuxt.config.js');
      const nuxt = new Nuxt(nuxtConfig);
      // Build in development
      if (process.env.NODE_ENV !== 'production' && conf.service.rebuild) {
        const builder = new Builder(nuxt);
        builder.build().then(() => {
          resolve({ nuxt, nuxtConfig });
        });
      } else {
        nuxt.ready().then(() => {
          resolve({ nuxt, nuxtConfig });
        });
      }
    } catch (err: any) {
      reject(err);
    }
  });
})(require('nuxt')).then((nuxt) => {
  consola.info('服务开始启动，配置信息：', conf);
  const app = compose(nuxt);
  app.on('error', (err: any, ctx: any) => {
    consola.error({
      message: `捕获到koa服务端异常, path: ${ctx.request.path}, status: ${err.status}, error: ${err.message}`,
      badge: true
    });
    consola.error(err);
  });

  const server = http.createServer(app.callback());
  Globals.initialize(server);
  return server.listen(conf.service.port);
}).then((server: http.Server) => {
  if (!server.listening) {
    consola.error({ message: 'HTTP端口' + conf.service.port + '监听失败, 服务终止启动', badge: true });
    server.close();
    server.unref();
    process.exit(100);
  }

  server.on('error', (err) => {
    consola.error({ message: 'HTTP服务出现异常: ' + err.message, badge: true });
    consola.error(err);
  });

  let address = '';
  if (typeof server.address() === 'string') {
    address = server.address() as string;
  } else if (typeof server.address() === 'object') {
    address = (server.address() as AddressInfo).address;
  }
  consola.success({ message: `服务端以[${process.env.NODE_ENV}]模式启动成功: 监听地址[${address}], 端口[${conf.service.port}]`, badge: true });
  process.on('SIGINT', () => {
    consola.warn({ message: '检测到进程终止信号', badge: true });
    Promise.all([
      new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            consola.error(err);
          } else {
            consola.success({ message: '已关闭http服务', badge: true });
          }
          server.unref();
          resolve('');
        });
      }),
      new Promise((resolve) => {
        mongoose.connection.close((err) => {
          if (err) {
            consola.error(err);
          } else {
            consola.success({ message: '已关闭mongodb连接', badge: true });
          }
          resolve('');
        });
      })
    ]).then(() => {
      consola.success({ message: '定值单共享平台node端正常终止', badge: true });
      process.exit(0);
    }).catch((err: Error) => {
      consola.error({ message: '定值单共享平台node端异常终止', badge: true });
      consola.error(err);
      process.exit(1);
    });
  });
}).catch((err) => {
  consola.error({ message: '服务启动失败', badge: true });
  consola.error(err);
  process.exit(2);
});
