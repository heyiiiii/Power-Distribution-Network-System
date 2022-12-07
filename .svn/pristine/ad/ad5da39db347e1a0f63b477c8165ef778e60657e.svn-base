import Router from 'koa-router';
import {Department} from '../mongo-schema';
import {Auth} from '../controller/middleware';

const Master = Auth.Master;
const router = new Router({prefix: '/department'});

router.post('/check-name-exists', async ctx => {
  ctx.body = await Department.exists({
    name: ctx.request.body.name
  });
});

router.post('/delete-many', Master, async ctx => {
  const body = ctx.request.body;
  ctx.body = await Department.deleteMany({
    code: {
      $in: body.codes
    }
  });
});

router.get('/get-children/:parentCode', async ctx => {
  ctx.body = await Department.find({
    parentCode: ctx.params.parentCode
  }).sort({name: 1}).lean();
});

router.post('/update-one/:code', Master, async ctx => {
  const body = ctx.request.body;
  ctx.body = await Department.findOneAndUpdate(
    {
      code: ctx.params.code
    },
    {
      code: body.code,
      name: body.name,
      parentCode: body.parentCode,
      phone: body.phone,
      fax: body.fax,
      aliasName: body.aliasName,
      description: body.description,
      headerTitle: body.headerTitle,
      headerSubTitle: body.headerSubTitle,
      indexTitle: body.indexTitle
    },
    {upsert: true, new: true}
  );
});

export default router;
