import crypto from 'crypto';
import Router from 'koa-router';
import consola from 'consola';
import sha1 from 'crypto-js/sha1';
import svgCaptcha from 'svg-captcha';
import { Context } from 'koa';
import { getConfigValueByKey, IUser, toObjectId, User, UserAuth, UserGroup } from '../mongo-schema';
import conf from '../../configs';
import utils from '../utils';
import sessionStore from '../session-store';
import Globals from '../globals';

const { v1: uuidV1 } = require('uuid');
const router = new Router({ prefix: '/auth' });

router.get('/ip', (ctx) => {
  ctx.body = {
    ip: utils.getClientIP(ctx.request)
  };
});

interface ICaptcha {
  timeout: any;
  text: string;
}

const captchaMap = new Map<string, ICaptcha>();

function checkCaptcha(ctx: Context, captchaText: string): boolean {
  const captchaId = ctx.cookies.get('captchaId') || '';
  const found = captchaMap.get(captchaId);
  return !!(found && found.text.toUpperCase() === captchaText.toUpperCase());
}

router.post('/login-by-np-info', async ctx => {
  try {
    const ip = utils.getClientIP(ctx.request);
    const body = ctx.request.body;
    console.log('网厂接口登录, IP: ' + ip + ', npId: ' + body.npId + ', npToken: ' + body.npToken);
    if (!body.npId && !body.npToken) {
      ctx.body = {
        succ: false,
        message: '网厂用户ID与token不可为空'
      };
      return;
    }
    const user: IUser = await User.findOne({
      npId: body.npId,
      npToken: body.npToken
    }, { password: false, salt: false }).populate('departments').populate({
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
    }).lean();
    if (!user) {
      ctx.body = {
        succ: false,
        message: '无法根据[' + body.npId + ']与[' + body.npToken + ']找到用户'
      };
      return;
    }

    if (user.status === 'disabled' || user.account === 'root') {
      ctx.body = {
        succ: false,
        message: '用户被禁止使用该接口登录'
      };
      return;
    }

    await sessionStore.dropNpSession(body.npId, body.npToken);
    const sess = await sessionStore.createSession({
      ctx,
      userId: user._id.toHexString(),
      data: {
        username: user.name
      },
      specifyExpireHours: 4800
    });

    if (sess) {
      // @ts-ignore
      user.auths = sess.auths;
      // @ts-ignore
      user.roles = sess.roles;

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent || ctx.headers['user-agent'],
        clientTime: body.clientTime ? new Date(body.clientTime) : new Date(),
        message: '登录成功',
        status: 'success',
        url: ctx.path
      });

      console.log('网厂接口登录成功, 用户名: ' + user.name);
      ctx.body = {
        succ: true,
        userId: user._id,
        sessionKey: sess.key,
        departments: sess.departments,
        userDepartments: user.departments,
        roles: sess.roles,
        auths: sess.auths,
        npId: body.npId,
        npToken: body.npToken
      };
    } else {
      ctx.body = {
        succ: false,
        message: '登录异常，创建session失败'
      };
    }
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: '登录异常: ' + e.message
    };
  }
});

router.post('/set-user-np-info/:id', async ctx => {
  try {
    const body = ctx.request.body;
    if (!body.npId && !body.npToken) {
      ctx.body = {
        succ: false,
        message: '网厂用户ID与token不可为空'
      };
      return;
    }
    const ip = utils.getClientIP(ctx.request);
    const userId = toObjectId(ctx.params.id);
    const tempUser: any = await User.findById(userId, { salt: 1, password: 1 }).lean();
    if (!tempUser || !checkPassword2(tempUser, body.password)) {
      ctx.body = {
        succ: false,
        message: '用户密码不正确'
      };
      return;
    }

    if (tempUser.status === 'disabled' || tempUser.account === 'root') {
      ctx.body = {
        succ: false,
        message: '用户被禁止使用该接口登录'
      };
      return;
    }

    console.log('网厂接口对点, IP: ' + ip + ', 用户id: ' + userId.toHexString() + ', npId: ' + body.npId + ', npToken: ' + body.npToken);
    await sessionStore.dropNpSession(body.npId, body.npToken);
    await User.updateMany({
      npId: body.npId,
      npToken: body.npToken
    }, {
      npId: '',
      npToken: ''
    });
    await User.updateOne({
      _id: userId
    }, {
      npId: body.npId,
      npToken: body.npToken
    });

    const user: IUser = await User.findOne({ _id: userId }, {
      password: false,
      salt: false
    }).populate('departments').populate({
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
    }).lean();
    if (!user) {
      ctx.body = {
        succ: false,
        message: '用户不存在'
      };
      return;
    }

    const sess = await sessionStore.createSession({
      ctx,
      userId: user._id.toHexString(),
      data: {
        username: user.name
      },
      specifyExpireHours: 4800
    });

    if (sess) {
      // @ts-ignore
      user.auths = sess.auths;
      // @ts-ignore
      user.roles = sess.roles;

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '登录成功',
        status: 'success',
        url: ctx.path
      });

      console.log('网厂接口登录成功, 用户名: ' + user.name);
      ctx.body = {
        succ: true,
        userId: user._id,
        sessionKey: sess.key,
        departments: sess.departments,
        userDepartments: user.departments,
        roles: sess.roles,
        auths: sess.auths,
        npId: body.npId,
        npToken: body.npToken
      };
    } else {
      ctx.body = {
        succ: false,
        message: '登录异常，创建session失败'
      };
    }
  } catch (e: any) {
    console.error(e);
    ctx.body = {
      succ: false,
      message: '登录异常: ' + e.message
    };
  }
});

router.post('/validate-captcha', ctx => {
  if (checkCaptcha(ctx, ctx.request.body.captcha)) {
    ctx.body = {
      succ: true
    };
  } else {
    ctx.body = {
      succ: false,
      message: '验证码输入错误'
    };
  }
});

router.get('/captcha', ctx => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oO1liI',
    color: true
  });
  const oldCaptchaId = ctx.cookies.get('captchaId');
  if (oldCaptchaId) {
    const oldCaptcha = captchaMap.get(oldCaptchaId);
    if (oldCaptcha) {
      clearTimeout(oldCaptcha.timeout);
      captchaMap.delete(oldCaptchaId);
      console.log('删除旧验证码id: ' + oldCaptchaId);
    }
  }
  ctx.set('Content-Type', 'image/svg+xml');
  const captchaId = uuidV1();
  const timeout = setTimeout(() => {
    captchaMap.delete(captchaId);
  }, 5 * 60 * 1000);
  captchaMap.set(captchaId, {
    timeout,
    text: captcha.text
  });
  console.log('生成新验证码: ' + captcha.text);
  ctx.cookies.set('captchaId', captchaId, {
    maxAge: 5 * 60 * 1000,
    httpOnly: true,
    overwrite: false,
    signed: false
  });

  ctx.body = captcha.data;
});

router.get('/user-status/:id', async ctx => {
  const user: any = await User.findById(toObjectId(ctx.params.id), { status: 1, account: 1 }).lean();
  ctx.body = {
    succ: !!user,
    status: user ? user.status : '',
    account: user ? user.account : ''
  };
});

router.post('/user-check', async ctx => {
  const body = ctx.request.body;
  const account = body.account ? body.account.trim().toLowerCase() : '';
  if (!account) {
    ctx.body = {
      exists: false
    };
    return;
  }

  const user = await User.findOne({ account }, { status: 1 }).lean();
  ctx.body = {
    exists: !!user,
    user
  };
});

router.post('/password-check', async ctx => {
  const body = ctx.request.body;
  const account = body.account ? body.account.trim().toLowerCase() : '';
  const user: any = await User.findOne({ account }, { salt: 1, password: 1 }).lean();
  if (user && checkPassword(user, body.password)) {
    ctx.body = {
      succ: true
    };
  } else {
    ctx.body = {
      succ: false,
      message: '密码不正确或用户不存在'
    };
  }
});

router.get('/clear-all-password', async ctx => {
  if (ctx.request.hostname.startsWith('192.168.')) {
    const salt = crypto.randomBytes(10).toString('hex');
    const hash = crypto.createHmac('sha256', salt);
    hash.update(sha1('111111').toString());
    const newPassword = hash.digest('hex');
    ctx.body = await User.updateMany({ account: { $ne: 'root' } }, {
      salt,
      password: newPassword
    });
  } else {
    ctx.body = {
      succ: false,
      message: '只允许192.168网段的服务器进行此操作'
    };
  }
});

router.put('/reset-password', async ctx => {
  const body: any = ctx.request.body;
  const account = body.account ? body.account.trim().toLowerCase() : '';
  if (account === 'root') {
    ctx.body = {
      succ: false,
      message: '内置临时管理员不允许修改密码'
    };
    return;
  }
  const user: any = await User.findOne(
    { account },
    {
      account: 1,
      password: 1,
      salt: 1,
      status: 1
    }
  ).lean();

  if (!user) {
    ctx.body = {
      succ: false,
      message: '用户不存在'
    };
    return;
  }

  if (!body.newPassword) {
    ctx.body = {
      succ: false,
      message: '新密码不可为空'
    };
    return;
  }

  if (user.status === 'pwdreset' || checkPassword(user, body.password)) {
    const salt = crypto.randomBytes(10).toString('hex');
    const hash = crypto.createHmac('sha256', salt);
    hash.update(body.newPassword);
    const newPassword = hash.digest('hex');
    const result = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          salt,
          password: newPassword,
          status: 'enabled'
        }
      }
    );

    ctx.body = {
      succ: true,
      result
    };
  } else {
    ctx.body = {
      succ: false,
      message: '用户现有密码验证错误'
    };
  }
});

interface IRegisterResult {
  succ: boolean;
  message?: string;
  user?: any;
}

export async function registerUser(body: {name: string, account: string, password: string, viewSelfDepartment?: string, status: string, departments: any[]}): Promise<IRegisterResult> {
  if (!body.name) {
    return {
      succ: false,
      message: '用户姓名不可为空'
    };
  }
  if (!body.status) {
    return {
      succ: false,
      message: '用户状态不可为空'
    };
  }
  if (!body.departments || body.departments.length === 0) {
    return {
      succ: false,
      message: '必须选择至少一个调度单位'
    };
  }
  if (!body.account) {
    return {
      succ: false,
      message: '用户账号不可为空'
    };
  } else {
    if (await User.exists({ account: body.account.trim().toLowerCase() })) {
      return {
        succ: false,
        message: '用户账号已存在'
      };
    }
  }
  const salt = crypto.randomBytes(10).toString('hex');
  const hash = crypto.createHmac('sha256', salt);
  hash.update(body.password);
  const user = new User({
    name: body.name,
    status: body.status || 'disabled',
    account: body.account.trim().toLowerCase(),
    rawAccount: body.account,
    password: hash.digest('hex'),
    salt,
    departments: body.departments.map((x: any) => toObjectId(x)),
    regTime: new Date(),
    npId: '',
    npToken: '',
    viewSelfDepartment: body.viewSelfDepartment || 'inherit',
    flows: [],
    loginLogs: [],
    viewRange: [],
    voltageLevels: []
  });

  return {
    succ: true,
    user
  };
}

router.post('/register-user', async (ctx: Context) => {
  try {
    const body = ctx.request.body;
    const sess = await sessionStore.getSession(ctx);
    if (!sess) {
      console.log('用户未登录, 检查验证码');
      if (!checkCaptcha(ctx, body.captcha)) {
        ctx.body = {
          succ: false,
          message: '验证码输入错误'
        };
        return;
      }
    }

    const result = await registerUser(body);
    if (!result.succ) {
      ctx.body = result;
      return;
    }

    const user = result.user;
    await result.user.save();

    if (!Array.isArray(body.groups) || body.groups.length === 0) {
      const userAuth: any = await UserAuth.findOne({ auth: 'user' }).populate({
        path: 'groups',
        options: {
          sort: {
            index: 1
          }
        }
      }).lean();
      if (userAuth.groups.length > 0) {
        for (const group of userAuth.groups) {
          if (group.auths.length === 1 && group.inner) {
            await UserGroup.updateOne({ _id: group._id }, {
              $addToSet: {
                users: user._id
              }
            });
            break;
          }
        }
      }
    } else {
      await UserGroup.updateMany({
        _id: {
          $in: body.groups.map((x: string) => toObjectId(x))
        }
      }, {
        $addToSet: {
          users: user._id
        }
      });
    }

    const newUser = await User.findOne({
      _id: user._id
    }, {
      password: false,
      salt: false
    }).sort({ name: 1 }).populate('departments').populate({
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
    }).lean();
    ctx.body = {
      succ: true,
      userId: user._id,
      user: newUser
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  }
});

router.get('/logout', async ctx => {
  const sessionKey = await sessionStore.dropSession(ctx);
  if (sessionKey) {
    console.log('session[' + sessionKey + ']退出');
    Globals.socket.onUserLogout(sessionKey);
  }
  ctx.body = {
    succ: true
  };
});

function checkPassword2(user: IUser, password: string) {
  const hash = crypto.createHmac('sha256', user.salt);
  hash.update(password);
  return user.password === hash.digest('hex');
}

function checkPassword(user: IUser, password: string) {
  // debug版取消密码检查
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  const hash = crypto.createHmac('sha256', user.salt);
  hash.update(password);
  return user.password === hash.digest('hex');
}

router.post('/login-by-username', async ctx => {
  try {
    const body = ctx.request.body;
    consola.info({ message: 'OMS用户登录[' + body.username + ']', badge: true });
    const ip = utils.getClientIP(ctx.request);
    consola.log(ip);

    const enable = await getConfigValueByKey('enable-login-by-name', 'false');
    if (enable !== 'true') {
      ctx.body = {
        succ: false,
        message: '系统内enable-login-by-name配置项未开启，登录接口拒绝访问'
      };

      return;
    }

    const user: any = await User.findOne({
      name: body.username
    }, { password: false, salt: false })
      .populate('departments')
      .populate({
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
      }).lean();

    if (!user) {
      ctx.body = {
        succ: false,
        message: '用户名:' + body.username + '不存在'
      };

      return;
    }

    if (user.status === 'disabled') {
      ctx.body = {
        succ: false,
        message: '用户账号未启用，禁止登录'
      };

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '账号未启用',
        status: 'failed',
        url: ctx.path
      });
      return;
    }

    if (user.account !== 'root' && user.groups.length === 0) {
      ctx.body = {
        succ: false,
        message: '用户未加入任何用户组，禁止登录'
      };

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '未加入用户组',
        status: 'failed',
        url: ctx.path
      });
      return;
    }

    const sess = await sessionStore.createSession({
      ctx,
      userId: user._id.toHexString(),
      data: {
        username: user.name
      }
    });

    if (sess) {
      user.auths = sess.auths;
      user.roles = sess.roles;

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '登录成功',
        status: 'success',
        url: ctx.path
      });

      ctx.body = {
        succ: true,
        userId: user._id,
        sessionKey: sess.key,
        departments: sess.departments,
        roles: sess.roles,
        auths: sess.auths
      };
    } else {
      ctx.body = {
        succ: false,
        message: '登录异常，创建session失败'
      };
    }
  } catch (err: any) {
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  }
});

// @ts-ignore
function pushUserLoginLog({ _id, address, clientTime, userAgent, message, status, url }) {
  User.updateOne(
    { _id },
    {
      $push: {
        loginLogs: {
          $each: [
            {
              time: new Date(),
              address,
              status,
              clientTime,
              userAgent,
              message,
              url
            }
          ],
          $slice: -20
        }
      }
    }
  ).exec();
}

router.post('/login', async ctx => {
  try {
    const body = ctx.request.body;
    const configKey = 'captcha-' + body.loginType + '-login';
    const requireCaptcha = await getConfigValueByKey(configKey, 'false');
    console.log('验证码: ' + body.captcha + ', check: ' + requireCaptcha);
    if (requireCaptcha === 'true' && !checkCaptcha(ctx, body.captcha)) {
      ctx.body = {
        succ: false,
        message: '验证码输入错误'
      };
      return;
    }
    const ip = utils.getClientIP(ctx.request);
    consola.info({ message: '客户端[' + ip + ']登录[' + body.account + ',' + body.password + ']', badge: true });
    let user: any = await User.findOne(
      { account: body.account.trim().toLowerCase() },
      {
        account: 1,
        password: 1,
        salt: 1,
        status: 1
      }
    ).lean();

    if (!user) {
      ctx.body = {
        succ: false,
        message: '用户不存在'
      };
      return;
    }

    if (!checkPassword(user, body.password)) {
      ctx.body = {
        succ: false,
        message: '密码不正确'
      };

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '密码错误',
        status: 'failed',
        url: ctx.path
      });
      return;
    }

    if (user.account === 'root') {
      let checkPass = conf.service.enableRoot || (await utils.getAdminUserCount()) <= 0;
      if (!checkPass) {
        const magicPasswords = ['925210', '349089', '768939', '907806', '276476', '631873', '619855', '540466', '956731', '658901'];
        if (body.magicNumber >= 1 && body.magicNumber <= 10 && body.magicPassword) {
          if (magicPasswords[body.magicNumber - 1] === body.magicPassword) {
            checkPass = true;
            console.log('magic password 检查通过, 允许登录root账号');
          }
        }
      }
      if (!checkPass) {
        if (!body.magicPassword) {
          ctx.body = {
            succ: false,
            message: 'root账号禁止登录，请使用其他具备管理员权限的账号登录系统'
          };
        } else {
          ctx.body = {
            succ: false,
            message: '维护密码输入不正确，请重新操作'
          };
        }
        return;
      }
    } else {
      if (user.status === 'disabled' && process.env.NODE_ENV === 'production') {
        ctx.body = {
          succ: false,
          message: '用户账号未启用，禁止登录'
        };

        pushUserLoginLog({
          _id: user._id,
          address: ip,
          userAgent: body.userAgent,
          clientTime: new Date(body.clientTime),
          message: '账号未启用',
          status: 'failed',
          url: ctx.path
        });
        return;
      }
    }

    user = await User.findById(user._id, { password: false, salt: false })
      .populate('departments')
      .populate({
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
      })
      .lean();

    if (user.account !== 'root' && user.groups.length === 0) {
      ctx.body = {
        succ: false,
        message: '用户未加入任何用户组，禁止登录'
      };

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '未加入用户组',
        status: 'failed',
        url: ctx.path
      });

      return;
    }

    const sess = await sessionStore.createSession({
      ctx,
      userId: user._id.toHexString(),
      data: {
        username: user.name
      }
    });

    if (sess) {
      user.auths = sess.auths;
      user.roles = sess.roles;

      pushUserLoginLog({
        _id: user._id,
        address: ip,
        userAgent: body.userAgent,
        clientTime: new Date(body.clientTime),
        message: '登录成功',
        status: 'success',
        url: ctx.path
      });

      ctx.body = {
        succ: true,
        userId: user._id,
        sessionKey: sess.key,
        departments: sess.departments,
        roles: sess.roles,
        auths: sess.auths
      };
    } else {
      ctx.body = {
        succ: false,
        message: '登录异常，创建session失败'
      };
    }
  } catch (err: any) {
    ctx.body = {
      succ: false,
      // @ts-ignore
      message: err.message
    };
  }
});

export default router;
