import crypto from 'crypto';
import Koa from 'koa';
import _ from 'lodash';
import {v1 as uuidV1} from 'uuid';
import moment from 'moment';
import urlencode from 'urlencode';
import conf from '../configs';
import {getConfigNumberValue, IUser, ObjectId, toObjectId, User, UserSession} from './mongo-schema';
import utils from './utils';

const unless = require('koa-unless');

export interface ISessInfo {
  key: string;
  user: {
    _id: string;
    name: string;
    status: string;
    account: string;
    npId: string;
    npToken: string;
  };
  roles: string[];
  auths: string[];
  departments: string[];
  expireTime: Date;
  invalidTime: Date;
  temporary: boolean;
  deprecated?: boolean;
  data?: any;
}

class SessionStore {
  private sessions: Map<string, ISessInfo>;

  constructor() {
    this.sessions = new Map<string, ISessInfo>();
    setInterval(this.checkExpires.bind(this), 10000);
  }

  public clearMemoryCache() {
    this.sessions.clear();
  }

  public clearSessionData() {
    return UserSession.deleteMany({});
  }

  public getSessionByKey(key: string) {
    return this.sessions.get(key);
  }

  private checkExpires() {
    const dropKeys = [];
    const now = new Date();
    for (const sess of this.sessions.values()) {
      if (sess.invalidTime < now || sess.expireTime < now) {
        dropKeys.push(sess.key);
      }
    }
    if (dropKeys.length > 0) {
      for (const key of dropKeys) {
        this.sessions.delete(key);
      }
      UserSession.deleteMany({
        key: {
          $in: dropKeys
        }
      }).exec((err: any) => {
        if (err) {
          console.error('UserSession.deleteMany错误');
          console.error(err);
        }
      });
    }
  }

  public updateUserInfo(userId: string, {roles, auths, departments, npId, npToken}: {roles: string[], auths: string[], departments: string[], npId?: string, npToken?: string}) {
    for (const sess of this.sessions.values()) {
      if (sess.user._id === userId) {
        sess.roles.splice(0, sess.roles.length);
        sess.roles.push(...roles);
        sess.auths.splice(0, sess.auths.length);
        sess.auths.push(...auths);
        sess.departments.splice(0, sess.departments.length);
        sess.departments.push(...departments);
        if (npId !== undefined) {
          sess.user.npId = npId;
        }
        if (npToken !== undefined) {
          sess.user.npToken = npToken;
        }
      }
    }
  }

  private async generateUserCache({
                                    key,
                                    userId,
                                    expireTime,
                                    invalidTime,
                                    data
                                  }: {key: string, userId: ObjectId, expireTime: Date, invalidTime: Date, data: any}): Promise<ISessInfo | null> {
    try {
      const user: IUser | null = await User.findById(userId).populate({
        path: 'groups',
        select: 'name',
        populate: [
          {
            path: 'auths',
            select: 'auth',
            options: {
              sort: {
                index: 1
              }
            }
          },
          {
            path: 'roles',
            select: 'role',
            options: {
              sort: {
                index: 1
              }
            }
          }
        ]
      });
      if (user && user.groups) {
        const auths = new Set<string>();
        const roles = new Set<string>();
        for (const group of user.groups) {
          if (group.auths) {
            group.auths.forEach((x: any) => auths.add(x.auth));
          }
          if (group.roles) {
            group.roles.forEach((x: any) => roles.add(x.role));
          }
        }

        const temporary = auths.has('admin');
        return {
          key,
          user: {
            _id: userId.toHexString(),
            name: user.name,
            status: user.status,
            account: user.account,
            npId: user.npId,
            npToken: user.npToken
          },
          roles: Array.from(roles),
          auths: Array.from(auths),
          departments: user.departments.map((x: any) => x.toHexString()),
          expireTime,
          invalidTime,
          temporary,
          data
        };
      }
    } catch (err: any) {
      console.log('generateUserCache错误');
      console.error(err);
    }

    return null;
  }

  public async initCache() {
    try {
      this.sessions.clear();
      const now = new Date();
      await UserSession.deleteMany({
        expireTime: {
          $lt: now
        }
      });
      const cursor = UserSession.find({}).cursor();
      const dropIds = [];
      for (let sess = await cursor.next(); sess != null; sess = await cursor.next()) {
        const invalidTime = moment(sess.createTime).add(Number(conf.service.rememberDays), 'days').toDate();
        if (invalidTime > now) {
          const userCache = await this.generateUserCache({
            key: sess.key,
            userId: sess.user as ObjectId,
            expireTime: sess.expireTime,
            invalidTime,
            data: sess.data
          });
          if (userCache) {
            this.sessions.set(sess.key, userCache);
          }
        } else {
          dropIds.push(sess._id);
        }
      }
      await cursor.close();

      if (dropIds.length > 0) {
        UserSession.deleteMany({
          _id: {
            $in: dropIds
          }
        }).exec((err: any) => {
          if (err) {
            console.error('UserSession.deleteMany错误');
            console.error(err);
          }
        });
      }
    } catch (err: any) {
      console.error('initCache错误');
      console.error(err);
    }

    return this.sessions.size;
  }

  private static async generateKey(userId: string): Promise<string> {
    let key = '';
    let exists = true;
    do {
      const src = uuidV1() + userId;
      const hash = crypto.createHash('sha1');
      hash.update(src);
      key = hash.digest('hex');
      // @ts-ignore
      exists = await UserSession.exists({key});
    } while (exists);
    return key;
  }

  public async createSession({
                               ctx,
                               userId,
                               data,
                               specifyExpireHours
                             }: {ctx: Koa.Context, userId: string, data?: any, specifyExpireHours?: number}): Promise<ISessInfo | null> {
    try {
      const rememberDays = Number(conf.service.rememberDays);
      const now = new Date();
      const domain = ctx.headers.host;
      const clientAddress = utils.getClientIP(ctx.request);
      const userAgent = ctx.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';
      const key = await SessionStore.generateKey(userId);
      const expireHours = specifyExpireHours || await getConfigNumberValue({key: 'session-expire-hours', min: 0, max: 49, defaultValue: 8});
      const momentNow = moment(now);
      const momentExpires = expireHours === 0 ? moment(now).add(rememberDays, 'days') : moment(now).add(expireHours, 'hours');
      const expireTime = momentExpires.toDate();
      const invalidTime = moment(now).add(rememberDays, 'days').toDate();

      const sess = await this.generateUserCache({
        key,
        userId: toObjectId(userId),
        expireTime,
        invalidTime,
        data
      });

      if (sess) {
        this.sessions.set(key, sess);
        ctx.cookies.set(conf.session.cookieKey, key, {
          httpOnly: true,
          signed: true,
          sameSite: 'strict',
          overwrite: false,
          maxAge: sess.temporary || expireHours === 0 ? 0 : momentExpires.diff(momentNow, 'ms')
        });
        const hash = crypto.createHash('sha1');
        hash.update(userAgent);
        const uaHash = hash.digest('hex');
        UserSession.findOneAndUpdate({
          domain,
          clientAddress,
          uaHash,
          user: toObjectId(userId)
        }, {
          key,
          createTime: now,
          expireTime,
          domain,
          clientAddress,
          userAgent,
          uaHash,
          refreshTime: now,
          temporary: sess.temporary,
          user: toObjectId(userId),
          data
        }, {
          new: true,
          upsert: true
        }).exec((err, res) => {
          if (err) {
            console.error('向数据库中写入session错误');
            console.error(err);
          } else {
            console.log('已写入用户' + userId + '的session');
            console.log(res);
          }
        });

        return sess;
      }
    } catch (err: any) {
      console.error('createSession(' + ctx.path + ',' + userId + ')错误');
      console.error(err);
    }

    return null;
  }

  public async dropSession(ctx: Koa.Context): Promise<string | undefined> {
    try {
      const key = ctx.cookies.get(conf.session.cookieKey, {signed: true}) || ctx.headers.authorization;
      if (key) {
        ctx.cookies.set(conf.session.cookieKey, '', {
          maxAge: 0,
          signed: true
        });
        (ctx as any).session = null;
        this.sessions.delete(key);
        await UserSession.deleteOne({key});
        return key;
      }
    } catch (err: any) {
      console.error('dropSession(' + ctx.path + ')错误');
      console.error(err);
    }
  }

  public async dropNpSession(npId: string, npToken: string) {
    const dropKeys = [];
    for (const [key, value] of this.sessions.entries()) {
      if (value.user.npId === npId && value.user.npToken === npToken) {
        dropKeys.push(key);
      }
    }
    for (const key of dropKeys) {
      this.sessions.delete(key);
      await UserSession.deleteOne({key});
    }
  }

  private async refreshSession(session: ISessInfo): Promise<ISessInfo> {
    const oldKey = session.key;
    const now = new Date();
    const newKey = await SessionStore.generateKey(session.user._id);
    const expireHours = await getConfigNumberValue({key: 'session-expire-hours', min: 0, max: 49, defaultValue: 8});
    const newSession = _.cloneDeep(session);
    newSession.expireTime = moment(now).add(expireHours, 'hours').toDate();
    newSession.key = newKey;
    this.sessions.set(newKey, newSession);
    await UserSession.updateOne({
      key: oldKey
    }, {
      key: newKey,
      expireTime: newSession.expireTime,
      refreshTime: now
    });

    console.log('session已刷新, oldKey[' + oldKey + '], newKey[' + newKey + ']');
    setTimeout(() => {
      this.sessions.delete(oldKey);
    }, 10000);
    return newSession;
  }

  public async getSession(ctx: Koa.Context): Promise<ISessInfo | null> {
    try {
      const npId = ctx.headers.npid || '';
      const npToken = ctx.headers.nptoken || '';
      if (npId || npToken) {
        for (const sess of this.sessions.values()) {
          if (sess.user.npId === npId && sess.user.npToken === npToken) {
            return sess;
          }
        }
      }

      const cookieKey = ctx.cookies.get(conf.session.cookieKey, {signed: true}) || '';
      const headerKey = ctx.headers.authorization || '';
      if (cookieKey && headerKey && cookieKey !== headerKey) {
        console.warn('cookie中的key[' + cookieKey + ']与页面上的sessionKey[' + headerKey + ']不相同，说明用户未完全退出或登录了其他用户');
      }
      const key = cookieKey || headerKey;
      if (key) {
        const sess = this.sessions.get(key);
        if (!sess) {
          console.error('未找到key[' + key + ']对应的session');
          return null;
        }

        const now = new Date();
        if (sess.invalidTime < now || sess.expireTime < now) {
          await this.dropSession(ctx);
          console.error('key[' + key + ']对应的session已过期');
          return null;
        }

        if (sess.deprecated) {
          return sess;
        }

        const momentNow = moment(now);
        const minutes = moment(sess.expireTime).diff(momentNow, 'minutes');
        if (minutes <= conf.session.autoRefreshMinutes) {
          const newSession = await this.refreshSession(sess);
          sess.deprecated = true;
          newSession.deprecated = false;
          ctx.cookies.set(conf.session.cookieKey, newSession.key, {
            httpOnly: true,
            signed: true,
            sameSite: 'strict',
            overwrite: false,
            maxAge: sess.temporary ? 0 : moment(newSession.expireTime).diff(momentNow, 'milliseconds')
          });
        }

        return sess;
      }
    } catch (err: any) {
      console.error('getSession(' + ctx.path + ')错误');
      console.error(err);
    }

    return null;
  }

  public async reloadSessionCache(userId: string) {
    for (const [key, value] of this.sessions.entries()) {
      if (value.user._id === userId) {
        const newSess = await this.generateUserCache({
          key,
          userId: toObjectId(userId),
          expireTime: value.expireTime,
          invalidTime: value.invalidTime,
          data: value.data
        });
        if (newSess) {
          this.sessions.set(key, newSess);
        }
      }
    }
  }

  public getKoaMiddleware({passThroughUrls}: {passThroughUrls: string | RegExp[]} = {passThroughUrls: []}) {
    const result = async (ctx: Koa.Context, next: Koa.Next) => {
      const sess = await this.getSession(ctx);
      if (!sess) {
        let passThrough = false;
        for (const url of passThroughUrls) {
          if (typeof url === 'string') {
            if (ctx.path === url) {
              passThrough = true;
              break;
            }
          } else {
            if (url.test(ctx.path)) {
              passThrough = true;
              break;
            }
          }
        }

        if (!passThrough) {
          ctx.cookies.set('statusCode', '403', {
            maxAge: 0,
            httpOnly: true,
            overwrite: false,
            signed: false,
            sameSite: 'strict'
          });
          ctx.cookies.set('message', urlencode('请先登录您的账号'), {
            maxAge: 0,
            httpOnly: true,
            overwrite: false,
            signed: false,
            sameSite: 'strict'
          });
          ctx.redirect(conf.service.routerBase + 'throw');
          return;
        } else {
          ctx.cookies.set('statusCode', '');
          ctx.cookies.set('message', '');
        }
      }
      // @ts-ignore
      ctx.session = sess;
      await next();
    };
    result.unless = unless;
    return result;
  }
}

const store = new SessionStore();
export default store;
