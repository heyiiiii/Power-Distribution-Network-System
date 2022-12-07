import Router from 'koa-router';
import {
  ISessInfo,
  ISystemConfig,
  SystemConfig,
  toObjectId, Voltage
} from '../mongo-schema';
import koaBody from 'koa-body';
import fs from 'fs';

const router = new Router({ prefix: '/setting' });

router.get('/system-config/list', async (ctx) => {
  ctx.body = {
    succ: true,
    result: await SystemConfig.find({}).lean()
  };
});

router.post('/system-config/delete/:id', async (ctx) => {
  const id = ctx.params.id;
  ctx.body = {
    succ: true,
    result: await SystemConfig.deleteOne({ _id: toObjectId(id) })
  };
});

router.post('/system-config/update/:id', async (ctx) => {
  const id = ctx.params.id;
  const body: ISystemConfig = ctx.request.body;
  const system = await SystemConfig.findById(toObjectId(id));
  if (!system) {
    throw new Error('更新失败，未查询到结果');
  }
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  body.modifier = toObjectId(session.user._id);
  ctx.body = {
    succ: true,
    result: await system!.update(body)
  };
});

router.post('/system-config/create', async (ctx) => {
  const { name, value, description } = ctx.request.body;
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const systemConfig = new SystemConfig({
    name,
    value,
    description,
    modifier: toObjectId(session.user._id)
  });
  ctx.body = {
    succ: true,
    result: await systemConfig.save()
  };
});

router.post('/system-config/import', koaBody({
  multipart: true,
  formidable: { maxFileSize: 5000 * 1024 * 1024 }
}), async (ctx) => {
  // @ts-ignore
  const session: ISessInfo = ctx.session;
  if (!session) {
    throw new Error('缺少用户session');
  }
  const file: any = ctx.request.files!.file || null;
  if (!file) {
    throw new Error('文件丢失');
  }
  await fs.readFile(file.filepath, 'utf-8', async (err, data) => {
    if (err) {
      throw new Error('文件读取出错');
    }
    const arr = [];
    for (const param of JSON.parse(data)) {
      param.modifier = toObjectId(session.user._id);
      arr.push(param);
    }
    await SystemConfig.deleteMany({});
    await SystemConfig.insertMany(arr);
  });
  ctx.body = {
    succ: true
  };
});

export default router;
