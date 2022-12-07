import fs from 'fs';
import Router from 'koa-router';
import moment from 'moment';
import _ from 'lodash';
import urlencode from 'urlencode';
import { Context, DefaultState } from 'koa';
import koaBody from 'koa-body';
import utils from '../utils';
import {
  Address,
  Config,
  Department,
  DzdFile,
  FileShare,
  FlowStateSetting,
  generateObjectId,
  IColumnState,
  IFlowState,
  IUser,
  IUserAuth,
  IUserRole,
  ProtectType,
  queryGridColumns,
  Substation,
  taskGridColumns,
  toObjectId,
  User,
  UserAuth,
  UserGroup,
  UserRole,
  Voltage
} from '../mongo-schema';
import globals from '../globals';
import sessionStore, { ISessInfo } from '../session-store';
import { Auth } from '../controller/middleware';
import stream from 'stream';

const Master = Auth.Master;

const router = new Router<DefaultState, Context>({ prefix: '/user' });

router.post('/notify/:id', ctx => {
  ctx.body = {
    succ: true,
    count: globals.socket.postNotifyMessage(ctx.params.id, ctx.request.body)
  };
});

router.get('/role-states/:roleId', async ctx => {
  const role = await UserRole.findById(toObjectId(ctx.params.roleId), { stateConfigs: 1 }).lean();
  if (role) {
    ctx.body = {
      succ: true,
      stateConfigs: role.stateConfigs
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到id: ' + ctx.params.roleId + '对应的角色'
    };
  }
});

router.get('/export-role-state-config/:roleId', async ctx => {
  const role = await UserRole.findById(toObjectId(ctx.params.roleId)).lean();
  if (role) {
    const filename = role.name + '角色相关配置(' + moment().format('YYYYMMDDHHmmss') + ').json';
    const json = JSON.stringify({
      name: role.name,
      role: role.role,
      stateConfigs: role.stateConfigs,
      columnStatesInQuery: role.columnStatesInQuery
    });
    const buffer = Buffer.from(json);
    ctx.set('Content-Type', 'application/json;charset=UTF-8');
    ctx.set('Content-Disposition', 'attachment; filename=' + urlencode(filename) + '; filename*=utf-8\'\'' + urlencode(filename));
    ctx.set('Content-Length', String(buffer.length));
    const Duplex = require('stream').Duplex;
    const outputStream = new Duplex();
    outputStream.push(buffer);
    outputStream.push(null);
    ctx.body = outputStream;
  } else {
    ctx.throw(501, '未找到' + ctx.params.roleId + '对应的角色');
  }
});

router.post('/import-role-state-config/:roleId', async ctx => {
  const role = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (role) {
    try {
      const importData = ctx.request.body;
      if (importData.role !== role.role) {
        ctx.body = {
          succ: false,
          message: '不允许将' + importData.name + '角色(' + importData.role + ')的配置导入' + role.name + '角色(' + role.role + ')内'
        };
      } else {
        if (Array.isArray(importData.stateConfigs) && Array.isArray(importData.columnStatesInQuery)) {
          role.stateConfigs = importData.stateConfigs;
          role.columnStatesInQuery = importData.columnStatesInQuery;
          await role.save();
          ctx.body = {
            succ: true
          };
        } else {
          ctx.body = {
            succ: false,
            message: '要导入的数据内容不合法'
          };
        }
      }
    } catch (err: any) {
      ctx.body = {
        succ: false,
        // @ts-ignore
        message: err.message
      };
    }
  } else {
    ctx.body = {
      succ: false,
      message: '未找到' + ctx.params.roleId + '对应的角色'
    };
  }
});

router.delete('/role-state/:roleId/:stateId', async ctx => {
  ctx.body = await UserRole.findOneAndUpdate({
    _id: toObjectId(ctx.params.roleId)
  }, {
    $pull: {
      stateConfigs: {
        state: toObjectId(ctx.params.stateId)
      }
    }
  }, {
    upsert: true,
    new: true
  });
});

router.post('/update-role-query-column-state/:roleId', async ctx => {
  const body = ctx.request.body;
  ctx.body = await UserRole.findOneAndUpdate({
    _id: toObjectId(ctx.params.roleId),
    'columnStatesInQuery.colId': body.colId
  }, {
    $set: {
      'columnStatesInQuery.$.headerName': body.headerName,
      'columnStatesInQuery.$.width': body.width,
      'columnStatesInQuery.$.hide': body.hide,
      'columnStatesInQuery.$.index': body.index,
      'columnStatesInQuery.$.drop': body.drop
    }
  });
});

router.post('/update-role-task-column-state/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const state = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (state) {
      const column = state.columnStatesInTask.find(x => x.colId === body.colId);
      if (column) {
        column.headerName = body.headerName;
        column.width = body.width;
        column.hide = body.hide;
        column.index = body.index;
        column.drop = body.drop;
        ctx.body = {
          succ: true,
          result: await found.save()
        };
        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/update-role-own-column-state/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const state = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (state) {
      const column = state.columnStatesInOwn.find(x => x.colId === body.colId);
      if (column) {
        column.headerName = body.headerName;
        column.width = body.width;
        column.hide = body.hide;
        column.index = body.index;
        column.drop = body.drop;
        ctx.body = {
          succ: true,
          result: await found.save()
        };
        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.delete('/task-button/:roleId/:stateId/:func', async ctx => {
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      const index = config.buttonsInTask.findIndex(x => x.func === ctx.params.func);
      if (index >= 0) {
        config.buttonsInTask.splice(index, 1);
        ctx.body = {
          succ: true,
          result: await found.save()
        };

        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/check-user-name-exists', async ctx => {
  ctx.body = await User.exists({
    name: ctx.request.body.name
  });
});

router.post('/append-task-buttons/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      let update = false;
      for (const btn of body.buttons) {
        if (!config.buttonsInTask.some(x => x.func === btn.func)) {
          // @ts-ignore
          config.buttonsInTask.push({
            index: btn.index,
            size: btn.size,
            text: btn.text,
            fontSize: btn.fontSize,
            bold: btn.bold,
            backgroundColor: btn.backgroundColor,
            textColor: btn.textColor,
            icon: btn.icon,
            iconColor: btn.iconColor,
            showMainForm: btn.showMainForm,
            func: btn.func,
            additional: ''
          });
          update = true;
        }
      }

      if (update) {
        ctx.body = {
          succ: true,
          result: await found.save()
        };
      } else {
        ctx.body = {
          succ: true,
          result: found
        };
      }

      return;
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/update-role-button-field/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      if (body.type === 'task') {
        const update = config.buttonsInTask.find(x => x.func === body.func);
        if (update) {
          // @ts-ignore
          update[body.field] = body.value;
          ctx.body = {
            succ: true,
            result: await found.save()
          };
          return;
        }
      } else if (body.type === 'own') {
        const update = config.buttonsInOwn.find(x => x.func === body.func);
        if (update) {
          // @ts-ignore
          update[body.field] = body.value;
          ctx.body = {
            succ: true,
            result: await found.save()
          };
          return;
        }
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/update-task-button/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      const update = config.buttonsInTask.find(x => x.func === body.func);
      if (update) {
        update.index = body.index;
        update.size = body.size;
        update.text = body.text;
        update.fontSize = body.fontSize;
        update.bold = body.bold;
        update.additional = body.additional;

        ctx.body = {
          succ: true,
          result: await found.save()
        };
        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.delete('/own-button/:roleId/:stateId/:func', async ctx => {
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      const index = config.buttonsInOwn.findIndex(x => x.func === ctx.params.func);
      if (index >= 0) {
        config.buttonsInOwn.splice(index, 1);
        ctx.body = {
          succ: true,
          result: await found.save()
        };

        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/append-own-buttons/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      let update = false;
      for (const btn of body.buttons) {
        if (!config.buttonsInOwn.some(x => x.func === btn.func)) {
          // @ts-ignore
          config.buttonsInOwn.push({
            index: btn.index,
            size: btn.size,
            text: btn.text,
            fontSize: btn.fontSize,
            bold: btn.bold,
            backgroundColor: btn.backgroundColor,
            textColor: btn.textColor,
            icon: btn.icon,
            iconColor: btn.iconColor,
            showMainForm: btn.showMainForm,
            func: btn.func,
            additional: ''
          });
          update = true;
        }
      }

      if (update) {
        ctx.body = {
          succ: true,
          result: await found.save()
        };
      } else {
        ctx.body = {
          succ: true,
          result: found
        };
      }

      return;
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/update-own-button/:roleId/:stateId', async ctx => {
  const body = ctx.request.body;
  const found = await UserRole.findById(toObjectId(ctx.params.roleId));
  if (found) {
    const config = found.stateConfigs.find(x => x.state.toHexString() === ctx.params.stateId);
    if (config) {
      const update = config.buttonsInOwn.find(x => x.func === body.func);
      if (update) {
        update.index = body.index;
        update.size = body.size;
        update.text = body.text;
        update.fontSize = body.fontSize;
        update.bold = body.bold;
        update.additional = body.additional;

        ctx.body = {
          succ: true,
          result: await found.save()
        };
        return;
      }
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或状态配置'
  };
});

router.post('/update-role-state/:roleId', async ctx => {
  const role = await UserRole.findById(toObjectId(ctx.params.roleId), { stateConfigs: 1 });
  if (role) {
    const body = ctx.request.body;
    const found = role.stateConfigs.find((x) => x.state.toHexString() === body.state);
    if (found) {
      found.availableInQuery = body.availableInQuery;
      found.nameInQuery = body.nameInQuery;
      found.indexInQuery = body.indexInQuery;
      found.availableInTask = body.availableInTask;
      found.stepVisibleInTask = body.stepVisibleInTask;
      found.batchInTask = body.batchInTask;
      found.nameInTask = body.nameInTask;
      found.indexInTask = body.indexInTask;
      found.showPreviewInTaskProcess = body.showPreviewInTaskProcess;
      found.showHistoryInTaskProcess = body.showHistoryInTaskProcess;
      found.doubleClickActionInTask = body.doubleClickActionInTask;
      found.formIdInTaskProcess = body.formIdInTaskProcess;
      found.showCancelInTaskProcess = body.showCancelInTaskProcess;
      found.historyQueryStatusInTaskProcess = body.historyQueryStatusInTaskProcess;
      found.hideWhenEmptyInTask = body.hideWhenEmptyInTask;
      found.availableInOwn = body.availableInOwn;
      found.stepVisibleInOwn = body.stepVisibleInOwn;
      found.batchInOwn = body.batchInOwn;
      found.nameInOwn = body.nameInOwn;
      found.indexInOwn = body.indexInOwn;
      found.showPreviewInOwnProcess = body.showPreviewInOwnProcess;
      found.showHistoryInOwnProcess = body.showHistoryInOwnProcess;
      found.doubleClickActionInOwn = body.doubleClickActionInOwn;
      found.formIdInOwnProcess = body.formIdInOwnProcess;
      found.showCancelInOwnProcess = body.showCancelInOwnProcess;
      found.historyQueryStatusInOwnProcess = body.historyQueryStatusInOwnProcess;
      found.hideWhenEmptyInOwn = body.hideWhenEmptyInOwn;
      ctx.body = {
        succ: true,
        result: await role.save()
      };
      return;
    }
  }

  ctx.body = {
    succ: false,
    message: '未找到角色或流程节点状态'
  };
});

router.post('/append-role-states/:roleId', async ctx => {
  const stateIds = ctx.request.body.stateIds;
  const states = await FlowStateSetting.find({
    _id: {
      $in: stateIds.map((x: string) => toObjectId(x))
    }
  }).lean();

  const configs = [];
  for (const state of states) {
    configs.push({
      state: state._id,
      availableInQuery: true,
      stepVisibleInTask: true,
      nameInQuery: state.name,
      indexInQuery: 0,
      availableInTask: true,
      batchInTask: false,
      nameInTask: state.name,
      indexInTask: 0,
      showPreviewInTaskProcess: true,
      showHistoryInTaskProcess: true,
      doubleClickActionInTask: 'preview',
      formIdInTaskProcess: '',
      showCancelInTaskProcess: false,
      historyQueryStatusInTaskProcess: '',
      hideWhenEmptyInTask: false,
      buttonsInTask: [],
      availableInOwn: true,
      stepVisibleInOwn: true,
      batchInOwn: false,
      nameInOwn: state.name,
      indexInOwn: 0,
      showPreviewInOwnProcess: true,
      showHistoryInOwnProcess: true,
      doubleClickActionInOwn: 'preview',
      formIdInOwnProcess: '',
      showCancelInOwnProcess: false,
      historyQueryStatusInOwnProcess: '',
      hideWhenEmptyInOwn: false,
      buttonsInOwn: [],
      columnStatesInTask: taskGridColumns,
      columnStatesInOwn: taskGridColumns
    });
  }

  ctx.body = await UserRole.findOneAndUpdate({
    _id: toObjectId(ctx.params.roleId)
  }, {
    $push: {
      stateConfigs: {
        // @ts-ignore
        $each: configs
      }
    }
  }, {
    upsert: true,
    new: true
  });
});

router.get('/get-user-id-map', async ctx => {
  ctx.body = await User.find({
    account: {
      $ne: 'root'
    }
  }, { name: 1, account: 1 }).lean();
});

router.get('/reload-sessions', Auth.Admin, async ctx => {
  const count = await sessionStore.initCache();
  ctx.body = {
    succ: true,
    count
  };
});

router.delete('/drop-cached-sessions', Auth.Admin, ctx => {
  sessionStore.clearMemoryCache();
  ctx.body = {
    succ: true
  };
});

router.delete('/drop-session-data', Auth.Admin, async ctx => {
  sessionStore.clearMemoryCache();
  const result = await sessionStore.clearSessionData();
  ctx.body = {
    succ: true,
    deletedCount: result.deletedCount
  };
});

router.post('/set-role-view-auths/:id', Master, async ctx => {
  const body = ctx.request.body;
  const roleId = ctx.params.id;
  const role: any = await UserRole.findById(toObjectId(roleId));
  role.appAuths = body.appAuths.map((x: any) => toObjectId(x));
  role.executeAuths = body.executeAuths.map((x: any) => toObjectId(x));
  role.viewSelfDepartmentOnly = body.viewSelfDepartmentOnly;
  ctx.body = await role.save();
});

router.post('/update-department-indexes', Master, async ctx => {
  const body = ctx.request.body;
  const cursor = Department.find({
    code: {
      $in: body.indexes.map((x: any) => x.code)
    }
  }).cursor();
  for (let department = await cursor.next(); department; department = await cursor.next()) {
    const found = body.indexes.find((x: any) => x.code === department.code);
    if (found) {
      department.index = found.index;
      await department.save();
    }
  }
  await cursor.close();

  ctx.body = {
    succ: true
  };
});

router.get('/department-id-map', async ctx => {
  ctx.body = await Department.find({ code: { $ne: '0' } }, { name: 1 }).sort({ name: 1 }).lean();
});

router.post('/update-department', Master, async ctx => {
  const body = ctx.request.body;
  const originalCode = String(body.originalCode || body.code);
  if (originalCode === '0') {
    ctx.throw(403, '不允许修改根部门');
    return;
  }
  try {
    const result = await Department.findOneAndUpdate({
      code: originalCode
    }, {
      code: String(body.code),
      name: body.name,
      parentCode: String(body.parentCode),
      index: body.index,
      phone: body.phone ? body.phone : '',
      fax: body.fax ? body.phone : '',
      aliasName: body.aliasName ? body.aliasName : '',
      description: body.description ? body.description : '',
      headerTitle: body.headerTitle ? body.headerTitle : '',
      headerSubTitle: body.headerSubTitle ? body.headerSubTitle : '',
      indexTitle: body.indexTitle ? body.indexTitle : ''
    }, {
      upsert: true,
      new: true
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.delete('/delete-department/:code', Master, async ctx => {
  if (ctx.params.code === '0') {
    ctx.throw(403, '不允许删除根部门');
    return;
  }

  const departments: any[] = await Department.aggregate([
    {
      $match: {
        code: String(ctx.params.code)
      }
    },
    {
      $graphLookup: {
        from: 'user.department',
        startWith: '$code',
        connectFromField: 'code',
        connectToField: 'parentCode',
        as: 'children'
      }
    }
  ]);

  const codes: any[] = [];
  for (const department of departments) {
    if (!codes.some((x: any) => x.code === department.code)) {
      codes.push(department.code);
    }
    if (department.children && department.children.length > 0) {
      for (const child of department.children) {
        if (!codes.some((x: any) => x.code === department.code)) {
          codes.push(child.code);
        }
      }
    }

    const shareCount = await FileShare.countDocuments({
      'metadata.department': department._id
    });
    if (shareCount > 0) {
      ctx.body = {
        succ: false,
        message: `调度单位${department.aliasName || department.name}下关联有共享模板文件${shareCount}个，不可直接删除`
      };
      return;
    }

    const dzdFiles = await DzdFile.find({
      'metadata.department': department._id
    }).limit(5).lean();
    if (dzdFiles && dzdFiles.length > 0) {
      const dzNumbers = dzdFiles.map((x: any) => x.metadata.dzNumber);
      ctx.body = {
        succ: false,
        message: `调度单位${department.aliasName || department.name}下关联有定值单[${dzNumbers.join(',')}]等，不可直接删除`
      };
      return;
    }
  }

  const departmentsToDelete: any[] = await Department.find({
    code: {
      $in: codes
    }
  })
    .populate('users', '_id')
    .lean();
  const departmentHasUsers = departmentsToDelete.find((x: any) => x.users && x.users.length > 0);
  if (departmentHasUsers) {
    ctx.body = {
      succ: false,
      message:
        '调度单位"' +
        (departmentHasUsers.aliasName || departmentHasUsers.name) +
        '"关联有' +
        departmentHasUsers.users.length +
        '个用户，不可直接删除'
    };
    return;
  }

  const result = await Department.deleteMany({
    code: {
      $in: codes
    }
  });

  ctx.body = {
    succ: true,
    codes,
    result
  };
});

router.post('/delete-users', Master, async ctx => {
  const body = ctx.request.body;
  const ids: any[] = body.ids.map((x: string) => toObjectId(x));

  const conditions = {
    $or: [
      {
        'metadata.disabler': {
          $in: ids
        }
      },
      {
        'metadata.applier': {
          $in: ids
        }
      },
      {
        'metadata.sender': {
          $in: ids
        }
      },
      {
        'metadata.verifier': {
          $in: ids
        }
      },
      {
        'metadata.creator': {
          $in: ids
        }
      }
    ]
  };
  const shareCount = await FileShare.countDocuments({
    'metadata.uploadUserId': {
      $in: ids
    }
  });
  if (shareCount > 0) {
    ctx.body = {
      succ: false,
      message: `用户关联有${shareCount}张共享模版, 不可直接删除`
    };
    return;
  }
  const fileCount = await DzdFile.countDocuments(conditions);
  const files = await DzdFile.find(conditions).limit(5).lean();
  if (fileCount > 0 && files && files.length > 0) {
    ctx.body = {
      succ: false,
      message: `用户关联有${fileCount}张定值单[${files.map((x: any) => x.metadata.dzNumber).join(', ')} ${fileCount > 5 ? ' ...' : ''}], 不可直接删除`
    };
    return;
  }

  const result = await User.deleteMany({
    _id: {
      $in: ids
    },
    account: {
      $ne: 'root'
    }
  });
  await UserGroup.updateMany(
    {},
    {
      $pull: {
        users: {
          // @ts-ignore
          $in: ids
        }
      }
    }
  );
  if (body.logout) {
    sessionStore.dropSession(ctx);
  }
  ctx.body = {
    succ: true,
    result
  };
});

router.post('/set-users-status', Master, async ctx => {
  const body = ctx.request.body;
  const result = await User.updateMany(
    {
      _id: {
        $in: body.ids.map((x: string) => toObjectId(x))
      }
    },
    {
      $set: {
        status: body.status
      }
    }
  );
  ctx.body = {
    succ: true,
    result
  };
});

router.put('/set-user-departments/:id', Master, async ctx => {
  const body = ctx.request.body;
  const result = await User.updateOne(
    {
      _id: toObjectId(ctx.params.id)
    },
    {
      $set: {
        departments: body.departments.map((x: any) => toObjectId(x))
      }
    }
  );
  await sessionStore.reloadSessionCache(ctx.params.id);
  ctx.body = result;
});

router.post('/set-users-groups', Master, async ctx => {
  const body = ctx.request.body;
  const userIds: string[] = body.userIds;
  const groupIds: string[] = body.groupIds;
  const groups: any[] = await UserGroup.find({});
  const updatedGroups = [];
  for (const group of groups) {
    let needSave = false;
    if (groupIds.includes(group._id.toHexString())) {
      for (const userId of userIds) {
        if (!group.users.some((x: any) => x.toHexString() === userId)) {
          group.users.push(toObjectId(userId));
          needSave = true;
        }
      }
    } else {
      for (const userId of userIds) {
        const index = group.users.findIndex((x: any) => x.toHexString() === userId);
        if (index >= 0) {
          group.users.splice(index, 1);
          needSave = true;
        }
      }
    }
    if (needSave) {
      await group.save();
      updatedGroups.push(group);
    }
  }

  const updatedUsers = await User.find(
    {
      _id: {
        $in: userIds.map((x: string) => toObjectId(x))
      }
    },
    { password: 0, salt: 0 }
  )
    .populate('departments')
    .populate({
      path: 'flows'
    })
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

  for (const userId of userIds) {
    await sessionStore.reloadSessionCache(userId);
  }
  ctx.body = {
    succ: true,
    updatedGroups,
    updatedUsers
  };
});

router.get('/get-params/:id', async ctx => {
  const user: any = await User.findById(toObjectId(ctx.params.id))
    .populate({
      path: 'groups',
      select: 'params',
      options: {
        sort: {
          index: -1
        }
      }
    })
    .lean();
  const paramsArray = user.groups.map((x: any) => x.params);
  let ret: any = {};
  for (const params of paramsArray) {
    if (params) {
      ret = Object.assign(ret, params);
    }
  }
  ctx.body = ret;
});

router.get('/list-users', async ctx => {
  const condition: any = {
    account: {
      $ne: 'root'
    }
  };
  const session = ctx.session as unknown as ISessInfo;
  if (session) {
    const found = await User.findById(toObjectId(session.user._id)).lean();
    if (found && found.account === 'root') {
      delete condition.account;
    }
  }
  const users = await User.find(condition, {
    password: false,
    salt: false,
    loginLogs: false
  }).sort({ name: 1 })
    .populate('departments')
    .populate({
      path: 'flows'
    })
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
  for (const user of users) {
    const roleIds: string[] = [];
    const authIds: string[] = [];
    if (Array.isArray(user.groups) && user.groups.length > 0) {
      for (const group of user.groups) {
        if (group.roles) {
          // @ts-ignore
          roleIds.push(...group.roles.map((x: any) => x._id.toHexString()));
        }
        if (group.auths) {
          // @ts-ignore
          authIds.push(...group.auths.map((x: any) => x._id.toHexString()));
        }
      }
    }
    user.roleIds = Array.from(new Set(roleIds));
    user.authIds = Array.from(new Set(authIds));
  }
  ctx.body = users;
});

router.get('/get-user/:id', async ctx => {
  const user: IUser | null = await User.findOne({ _id: toObjectId(ctx.params.id) }, { password: 0, salt: 0, loginLogs: 0 })
    .populate('departments')
    .populate({
      path: 'groups',
      options: {
        sort: {
          index: -1
        }
      },
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

  if (user) {
    const paramsArray = user.groups.map((x: any) => x.params);
    let userParams: any = {};
    for (const params of paramsArray) {
      if (params) {
        userParams = Object.assign(userParams, params);
      }
    }
    user.params = userParams;

    if (user.account !== 'root') {
      const routesArray = user.groups.sort((x: any, y: any) => x.index - y.index).map((x: any) => x.routes);
      let routes = [];
      for (const array of routesArray) {
        if (Array.isArray(array) && array.length > 0) {
          routes = array;
          break;
        }
      }
      user.routes = routes;
    } else {
      user.routes = utils.getMetaRoutes().map((x: any) => Object.assign({ _id: generateObjectId() }, x));
      user.auths = await UserAuth.find({
        auth: {
          $in: ['admin', 'master', 'user']
        }
      }).lean();
      user.roles = await UserRole.find({
        role: {
          $in: ['audit', 'launch']
        }
      }).lean();
    }

    ctx.body = user;
  } else {
    ctx.body = null;
  }
});

router.post('/combine-roles', async ctx => {
  const roles: any[] = await UserRole.find({
    role: {
      $in: ctx.request.body.roles
    }
  }).populate('appAuths').populate('executeAuths').lean();

  const stateMap = new Map<string, any>();
  const executeStateMap = new Map<string, any>();
  for (const role of roles) {
    if (role.appAuths) {
      for (const state of role.appAuths) {
        stateMap.set(state._id.toHexString(), state);
      }
    }
    if (role.executeAuths) {
      for (const state of role.executeAuths) {
        executeStateMap.set(state._id.toHexString(), state);
      }
    }
  }

  const executeStates = Array.from(executeStateMap.values());
  if (ctx.request.body.roles.includes('repeal')) {
    const found = executeStates.find((x: any) => x.name === '已执行');
    if (found) {
      found.name = '待回执';
    }
  }
  ctx.body = {
    enableUpload: roles.some((x: any) => x.enableUpload),
    executeFlow: roles.some((x: any) => x.executeFlow),
    viewSelfDepartmentOnly: roles.every((x: any) => x.viewSelfDepartmentOnly),
    viewCurrentAndHistoryStore: roles.some((x: any) => x.viewCurrentAndHistoryStore),
    states: Array.from(stateMap.values()),
    executeStates
  };
});

router.get('/session-data/:userId', async ctx => {
  try {
    const sess = ctx.session as unknown as ISessInfo;
    if (!sess || sess.user._id !== ctx.params.userId) {
      ctx.body = {
        succ: false,
        message: '已登录的用户session与要获取的用户信息id不符'
      };
      return;
    }
    // @ts-ignore
    const user: IUser = await User.findById(toObjectId(ctx.params.userId), { password: 0, salt: 0, loginLogs: 0 })
      .populate('departments').populate({
        path: 'groups',
        options: {
          sort: {
            index: -1
          }
        },
        populate: [
          {
            path: 'auths',
            options: {
              sort: {
                index: 1
              }
            }
          },
          {
            path: 'roles',
            options: {
              sort: {
                index: 1
              }
            },
            populate: [
              {
                path: 'stateConfigs.state',
                sort: {
                  index: 1
                }
              },
              {
                path: 'appAuths'
              },
              {
                path: 'executeAuths'
              }
            ]
          }
        ]
      }).lean();
    if (!user) {
      ctx.body = {
        succ: false,
        message: '未找到id[' + ctx.params.userId + ']对应的用户'
      };
      return;
    }

    const paramsArray = user.groups.map((x: any) => x.params);
    let userParams: any = {};
    for (const params of paramsArray) {
      if (params) {
        userParams = Object.assign(userParams, params);
      }
    }

    const auths: IUserAuth[] = [];
    const roles: IUserRole[] = [];
    const routes = [];
    if (user.account === 'root') {
      routes.push(...utils.getMetaRoutes().map((x: any) => Object.assign({ _id: generateObjectId() }, x)));
      const roleArray = await UserRole.find({
        role: {
          $in: ['launch', 'audit']
        }
      }).populate('stateConfigs.state').populate('appAuths').populate('executeAuths');
      const authArray = await UserAuth.find({
        auth: {
          $in: ['admin', 'master', 'user']
        }
      });
      roles.push(...roleArray);
      auths.push(...authArray);
    } else {
      const routesArray = user.groups.sort((x: any, y: any) => x.index - y.index).map((x: any) => x.routes);
      for (const array of routesArray) {
        if (Array.isArray(array) && array.length > 0) {
          routes.push(...array);
          break;
        }
      }
      for (const group of user.groups) {
        if (group.auths) {
          for (const auth of group.auths) {
            if (!auths.some(x => x.auth === (auth as IUserAuth).auth)) {
              auths.push(auth as IUserAuth);
            }
          }
        }
        if (group.roles) {
          for (const role of group.roles) {
            if (!roles.some(x => x.role === (role as IUserRole).role)) {
              roles.push((role as IUserRole));
            }
          }
        }
      }
    }

    const columnStatesInQuery: IColumnState[] = [];
    const stateConfigs: IFlowState[] = [];
    for (const role of roles) {
      if (role.columnStatesInQuery) {
        for (const col of role.columnStatesInQuery) {
          const found = columnStatesInQuery.find(x => x.colId === col.colId);
          if (!found) {
            columnStatesInQuery.push(col);
          } else {
            found.colId = col.colId;
            found.headerName = col.headerName;
            found.width = col.width;
            found.suppressMenu = col.suppressMenu;
            found.hide = col.hide;
            found.index = col.index;
            found.drop = col.drop;
          }
        }
      }
      for (const config of role.stateConfigs) {
        if (config.state) {
          const stateConfig = stateConfigs.find(x => (x.state as any)._id.equals((config.state as any)._id));
          if (stateConfig) {
            for (const i in stateConfig) {
              (stateConfig as any)[i] = (config as any)[i];
            }
          } else {
            stateConfigs.push(config);
          }
        }
      }
    }

    for (const state of stateConfigs) {
      for (const i of state.buttonsInTask) {
        i.disabled = false;
        i.loading = false;
      }
      for (const i of state.buttonsInOwn) {
        i.disabled = false;
        i.loading = false;
      }
      state.buttonsInTask.sort((x: any, y: any) => x.index - y.index);
      state.buttonsInOwn.sort((x: any, y: any) => x.index - y.index);
      state.columnStatesInTask.sort((x: any, y: any) => x.index - y.index);
      state.columnStatesInOwn.sort((x: any, y: any) => x.index - y.index);
      state.taskCount = 0;
    }

    sessionStore.updateUserInfo(user._id.toHexString(), {
      roles: roles.map(x => x.role),
      auths: auths.map(x => x.auth),
      departments: user.departments.map((x: any) => x._id.toHexString())
    });

    const systemConfigs = await Config.find({
      $or: [
        {
          backendOnly: {
            $exists: false
          }
        },
        {
          backendOnly: {
            $eq: false
          }
        }
      ]
    }).lean();
    const flowStates = await FlowStateSetting.find({}).sort({ index: 1 }).lean();
    const voltages = await Voltage.find({}).lean();
    const protectTypes = await ProtectType.find({}, { name: 1 }).sort({ name: 1 }).lean();
    ctx.body = {
      succ: true,
      stateConfigs,
      columnStatesInQuery: columnStatesInQuery.sort((a, b) => a.index - b.index),
      systemConfigs,
      user: {
        name: user.name,
        params: userParams,
        routes,
        departments: user.departments,
        roles: roles.map(x => x.role),
        auths: auths.map(x => x.auth)
      },
      routeMetas: utils.getMetaRoutes(),
      combinedRole: {
        enableUpload: roles.some((x: any) => x.enableUpload),
        executeFlow: roles.some((x: any) => x.executeFlow),
        viewSelfDepartmentOnly: roles.every((x: any) => x.viewSelfDepartmentOnly),
        viewCurrentAndHistoryStore: roles.some((x: any) => x.viewCurrentAndHistoryStore),
        states: stateConfigs.filter(x => x.availableInQuery).map(x => x.state),
        executeStates: stateConfigs.filter(x => x.availableInTask).map(x => x.state)
      },
      flowStates,
      voltages,
      protectTypes: protectTypes.map((x: any) => Object.assign({ title: x.name }, x))
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/flows/:id', async ctx => {
  const user: any = await User.findById(toObjectId(ctx.params.id)).lean();
  ctx.body = user.flows || [];
});

router.put('/bind-flow', async ctx => {
  const body = ctx.request.body;
  const flowIds = body.flowIds.map((x: any) => toObjectId(x));
  ctx.body = await User.updateMany({
    _id: {
      $in: body.userIds.map((x: any) => toObjectId(x))
    }
  }, {
    $set: {
      flows: flowIds
    }
  });
});

router.put('/update-user/:id', async ctx => {
  try {
    const session = ctx.session as unknown as ISessInfo;
    const body = ctx.request.body;
    const fields: any = {};
    if (body.name !== undefined) {
      fields.name = body.name;
    }
    if (body.status !== undefined) {
      fields.status = body.status;
    }
    if (body.npId !== undefined) {
      fields.npId = body.npId;
    }
    if (body.npToken !== undefined) {
      fields.npToken = body.npToken;
    }
    if (body.viewSelfDepartment !== undefined) {
      fields.viewSelfDepartment = body.viewSelfDepartment;
    }
    if (body.account !== undefined) {
      fields.account = body.account.trim().toLowerCase();
      fields.rawAccount = body.account;
      if (await User.exists({
        _id: {
          $ne: toObjectId(ctx.params.id)
        },
        account: body.account.trim().toLowerCase()
      })) {
        ctx.body = {
          succ: false,
          message: '用户账号已存在'
        };
        return;
      }
    }

    const found = await User.findById(toObjectId(session.user._id)).lean();
    const isRoot = found ? found.account === 'root' : false;
    if (isRoot) {
      delete fields.account;
      delete fields.rawAccount;
    }
    const result = await User.updateOne({ _id: toObjectId(ctx.params.id) }, { $set: fields });
    await sessionStore.reloadSessionCache(ctx.params.id);
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.delete('/delete-user/:id', Master, async ctx => {
  const result = await User.deleteOne({
    _id: toObjectId(ctx.params.id),
    account: {
      $ne: 'root'
    }
  });
  await sessionStore.initCache();
  ctx.body = result;
});

router.get('/list-user-groups', async ctx => {
  ctx.body = await UserGroup.find({})
    .sort({ index: 1 })
    .lean();
});

router.get('/login-logs/:id', async ctx => {
  const user: IUser | null = await User.findById(toObjectId(ctx.params.id), { loginLogs: 1, name: 1, account: 1 }).lean();
  if (user) {
    user.loginLogs.sort((x: any, y: any) => y.time - x.time);
    ctx.body = {
      succ: true,
      logs: user.loginLogs.map((x: any) => {
        return {
          name: user.name,
          account: user.account,
          time: moment(x.time).format('YYYY-MM-DD HH:mm:ss'),
          clientTime: moment(x.clientTime).format('YYYY-MM-DD HH:mm:ss'),
          address: x.address,
          status: x.status,
          userAgent: x.userAgent,
          message: x.message,
          url: x.url
        };
      })
    };
  } else {
    ctx.body = {
      succ: false,
      message: '未找到用户'
    };
  }
});

router.post('/create-user-group', Master, async ctx => {
  const body = ctx.request.body;
  if (await UserGroup.exists({ name: body.name })) {
    ctx.body = {
      succ: false,
      message: '不允许创建同名的用户组'
    };
    return;
  }
  const object = new UserGroup({
    name: body.name,
    description: body.description,
    index: body.index,
    users: body.users ? body.users : [],
    auths: body.auths ? body.auths : [],
    roles: body.roles ? body.roles : []
  });
  await object.save();
  ctx.body = {
    succ: true,
    group: object
  };
});

router.put('/set-group-params/:id', Master, async ctx => {
  ctx.body = await UserGroup.updateOne(
    {
      _id: toObjectId(ctx.params.id)
    },
    {
      $set: {
        params: ctx.request.body.params
      }
    }
  );
});

router.post('/import-group-route', koaBody({
  multipart: true,
  formidable: { maxFileSize: 500 * 1024 * 1024 }
}), async ctx => {
  const file: any = ctx.request.files ? ctx.request.files.file : null;
  if (!file) {
    throw new Error('文件丢失');
  }
  const buffer: any = await readFile(fs.createReadStream(file.filepath));
  const content = JSON.parse(buffer.toString());

  const { groupId } = ctx.request.body;
  ctx.body = await UserGroup.updateOne({
    _id: toObjectId(groupId)
  }, {
    $set: {
      routes: content
    }
  });
});

router.put('/set-group-route/:groupId/:routeId', Master, async ctx => {
  const body = ctx.request.body;
  ctx.body = await UserGroup.updateOne(
    {
      _id: toObjectId(ctx.params.groupId),
      routes: {
        $elemMatch: {
          _id: toObjectId(ctx.params.routeId)
        }
      }
    },
    {
      $set: {
        'routes.$.label': body.label,
        'routes.$.description': body.description,
        'routes.$.icon': body.icon,
        'routes.$.name': body.name,
        'routes.$.path': body.path,
        'routes.$.params': body.params,
        'routes.$.index': body.index,
        'routes.$.parentId': body.parentId ? toObjectId(body.parentId) : undefined
      }
    }
  );
});

router.put('/remove-group-routes/:groupId', Master, async ctx => {
  const body = ctx.request.body;
  ctx.body = await UserGroup.updateOne(
    {
      _id: toObjectId(ctx.params.groupId)
    },
    {
      $pull: {
        routes: {
          _id: {
            $in: body.ids.map((x: any) => toObjectId(x))
          }
        }
      }
    }
  );
});

router.put('/update-group-route-indexes/:groupId', Master, async ctx => {
  const body = ctx.request.body;
  const group: any = await UserGroup.findById(toObjectId(ctx.params.groupId));
  for (const route of group.routes) {
    const found = body.indexes.find((x: any) => x._id === route._id.toHexString());
    if (found) {
      route.index = found.index;
    }
  }
  group.routes.sort((x: any, y: any) => x.index - y.index);
  ctx.body = await group.save();
});

router.put('/set-group-routes/:id', Master, async ctx => {
  ctx.body = await UserGroup.updateOne(
    {
      _id: toObjectId(ctx.params.id)
    },
    {
      $set: {
        routes: ctx.request.body.routes.map((x: any) => {
          return {
            _id: toObjectId(x._id),
            label: x.label,
            description: x.description,
            icon: x.icon,
            name: x.name,
            path: x.path,
            params: x.params,
            index: x.index,
            parentId: x.parentId ? toObjectId(x.parentId) : undefined
          };
        })
      }
    }
  );
});

router.post('/delete-user-groups', Master, async ctx => {
  const ids = ctx.request.body.ids.map((x: string) => toObjectId(x));
  const groups: any[] = await UserGroup.find(
    {
      _id: {
        $in: ids
      }
    },
    { name: 1, users: 1 }
  ).lean();
  for (const group of groups) {
    if (group.users && group.users.length > 0) {
      ctx.body = {
        succ: false,
        message: '用户组"' + group.name + '"关联有' + group.users.length + '个用户，不可直接删除'
      };
      return;
    }
  }
  const result = await UserGroup.deleteMany({
    _id: {
      $in: ids
    }
  });

  await sessionStore.initCache();
  ctx.body = {
    succ: true,
    result
  };
});

router.get('/get-user-group/:id', async ctx => {
  ctx.body = await UserGroup.findOne({ _id: toObjectId(ctx.params.id) })
    .populate('users')
    .populate('auths')
    .populate('roles')
    .lean();
});

router.post('/update-view-range', async ctx => {
  const body = ctx.request.body;
  ctx.body = await User.updateMany({
    _id: {
      $in: body.userIds.map((x: string) => toObjectId(x))
    }
  }, {
    $set: {
      viewRange: body.viewRange
    }
  });
});

router.post('/update-voltages', async ctx => {
  const body = ctx.request.body;
  ctx.body = await User.updateMany({
    _id: {
      $in: body.userIds.map((x: string) => toObjectId(x))
    }
  }, {
    $set: {
      voltageLevels: body.voltageLevels
    }
  });
});

router.put('/update-user-group/:id', Master, async ctx => {
  const body = ctx.request.body;
  if (
    await UserGroup.exists({
      _id: {
        $ne: toObjectId(ctx.params.id)
      },
      name: body.name
    })
  ) {
    const group = await UserGroup.findOne({ _id: toObjectId(ctx.params.id) }, { name: 1, description: 1 }).lean();
    ctx.body = {
      succ: false,
      message: '已经存在同名的用户组',
      group
    };
    return;
  }

  const fields: any = {};
  if (body.name !== undefined) {
    fields.name = body.name;
  }
  if (body.description !== undefined) {
    fields.description = body.description;
  }
  if (Array.isArray(body.users) && body.users.length > 0) {
    fields.users = body.users;
  }
  if (Array.isArray(body.auths) && body.auths.length > 0) {
    fields.auths = body.auths;
  }
  if (Array.isArray(body.roles) && body.roles.length > 0) {
    fields.roles = body.roles;
  }

  const result = await UserGroup.updateOne(
    { _id: toObjectId(ctx.params.id) },
    {
      $set: fields
    }
  );

  await sessionStore.initCache();

  ctx.body = {
    succ: true,
    result
  };
});

router.delete('/delete-user-group/:id', Master, async ctx => {
  const group: any = await UserGroup.findOne({ _id: toObjectId(ctx.params.id) }, { users: 1 }).lean();
  if (group.users && group.users.length > 0) {
    ctx.body = {
      succ: false,
      message: '用户组下关联有' + group.users.length + '个用户，不可直接删除'
    };
    return;
  }
  const result = await UserGroup.deleteOne({ _id: toObjectId(ctx.params.id) });
  ctx.body = {
    succ: true,
    result
  };

  await sessionStore.initCache();
});

router.get('/list-user-auths', async ctx => {
  ctx.body = await UserAuth.find({})
    .sort({ index: 1 })
    .populate({ path: 'groups', select: '_id' })
    .lean();
});

router.post('/create-user-auth', Master, async ctx => {
  const body = ctx.request.body;
  const object = new UserAuth({
    auth: body.auth,
    name: body.name,
    description: body.description,
    index: body.index
  });
  await object.save();
  ctx.body = {
    succ: true,
    auth: object
  };
});

router.get('/get-user-auth/:id', async ctx => {
  ctx.body = await UserAuth.findOne({ _id: toObjectId(ctx.params.id) })
    .populate({
      path: 'groups',
      populate: {
        path: 'users'
      }
    })
    .lean();
});

router.put('/update-user-role-indexes', Master, async ctx => {
  const body = ctx.request.body;
  for (const role of body.indexes) {
    await UserRole.updateOne(
      { _id: toObjectId(role._id) },
      {
        $set: {
          index: role.index
        }
      }
    );
  }

  ctx.body = {
    succ: true
  };
});

router.put('/update-user-auth-indexes', Master, async ctx => {
  const body = ctx.request.body;
  for (const auth of body.indexes) {
    await UserAuth.updateOne(
      { _id: toObjectId(auth._id) },
      {
        $set: {
          index: auth.index
        }
      }
    );
  }

  ctx.body = {
    succ: true
  };
});

router.put('/update-user-group-indexes', Master, async ctx => {
  const body = ctx.request.body;
  for (const group of body.indexes) {
    await UserGroup.updateOne(
      { _id: toObjectId(group._id) },
      {
        $set: {
          index: group.index
        }
      }
    );
  }

  ctx.body = {
    succ: true
  };
});

router.put('/update-user-auth/:id', Master, async ctx => {
  const body = ctx.request.body;
  const fields: any = {};
  if (body.auth !== undefined) {
    fields.auth = body.auth;
  }
  if (body.name !== undefined) {
    fields.name = body.name;
  }
  if (body.description !== undefined) {
    fields.description = body.description;
  }
  if (body.index !== undefined) {
    fields.index = body.index;
  }

  ctx.body = await UserAuth.updateOne(
    { _id: toObjectId(ctx.params.id) },
    {
      $set: fields
    }
  );

  await sessionStore.initCache();
});

router.get('/list-roles-min', async ctx => {
  ctx.body = await UserRole.find({}, { role: 1, name: 1 }).sort({ index: 1 }).lean();
});

router.get('/list-user-roles', async ctx => {
  const roles = await UserRole.find({})
    .sort({ index: 1 })
    .populate({ path: 'groups', select: '_id' })
    .lean();
  for (const r of roles) {
    if (!r.groups) {
      r.groups = [];
    }
  }
  ctx.body = roles;
});

router.post('/create-user-role', Master, async ctx => {
  const body = ctx.request.body;
  const object = new UserRole({
    role: body.role,
    name: body.name,
    description: body.description,
    index: body.index,
    columnStatesInQuery: queryGridColumns
  });
  await object.save();
  ctx.body = {
    succ: true,
    role: object
  };
});

router.get('/get-user-role/:id', async ctx => {
  ctx.body = await UserRole.findOne({ _id: toObjectId(ctx.params.id) })
    .populate({
      path: 'groups',
      populate: {
        path: 'users'
      }
    })
    .lean();
});

router.put('/update-user-role/:id', Master, async ctx => {
  const body = ctx.request.body;
  const fields: any = {};
  if (body.role !== undefined) {
    fields.role = body.role;
  }
  if (body.name !== undefined) {
    fields.name = body.name;
  }
  if (body.description !== undefined) {
    fields.description = body.description;
  }
  if (body.index !== undefined) {
    fields.index = body.index;
  }
  if (body.viewSelfDepartmentOnly !== undefined) {
    fields.viewSelfDepartmentOnly = typeof body.viewSelfDepartmentOnly === 'string' ? body.viewSelfDepartmentOnly === 'true' : body.viewSelfDepartmentOnly;
  }
  if (body.enableUpload !== undefined) {
    fields.enableUpload = typeof body.enableUpload === 'string' ? body.enableUpload === 'true' : body.enableUpload;
  }
  if (body.executeFlow !== undefined) {
    fields.executeFlow = typeof body.executeFlow === 'string' ? body.executeFlow === 'true' : body.executeFlow;
  }
  if (body.viewCurrentAndHistoryStore !== undefined) {
    fields.viewCurrentAndHistoryStore = typeof body.viewCurrentAndHistoryStore === 'string' ? body.viewCurrentAndHistoryStore === 'true' : body.viewCurrentAndHistoryStore;
  }

  await sessionStore.initCache();

  ctx.body = await UserRole.updateOne(
    { _id: toObjectId(ctx.params.id) },
    {
      $set: fields
    }
  );
});

router.post('/set-department-contact-group/:departmentId', async ctx => {
  try {
    const result = await Department.updateOne({
      _id: toObjectId(ctx.params.departmentId)
    }, {
      $set: {
        contactGroup: ctx.request.body.contactGroup
      }
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/department/:departmentId', async ctx => {
  try {
    const department = await Department.findById(toObjectId(ctx.params.departmentId)).lean();
    ctx.body = {
      succ: true,
      department
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/department-contact-groups', async ctx => {
  try {
    const result = await Department.distinct('contactGroup').lean();
    ctx.body = {
      succ: true,
      result: result.filter(x => !!x).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/update-department-contact/:departmentId/:contactId', async ctx => {
  try {
    const body = ctx.request.body;
    const department = await Department.findById(toObjectId(ctx.params.departmentId));
    if (department) {
      const address = department.addressList.find(x => x._id.equals(ctx.params.contactId));
      if (address) {
        address.contact = body.contact;
        address.phone = body.phone;
        address.index = body.index;
        address.headship = body.headship;
        await department.save();
        ctx.body = {
          succ: true,
          department
        };
      } else {
        ctx.body = {
          succ: false,
          message: '未找到对应的联系人'
        };
      }
    } else {
      ctx.body = {
        succ: false,
        message: '未找到对应的单位'
      };
    }
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.delete('/delete-department-contact/:departmentId/:contactId', async ctx => {
  try {
    const result = await Department.findOneAndUpdate({
      _id: toObjectId(ctx.params.departmentId)
    }, {
      $pull: {
        addressList: {
          _id: toObjectId(ctx.params.contactId)
        }
      }
    }, {
      upsert: true,
      new: true
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/add-department-contact/:departmentId', async ctx => {
  try {
    const result = await Department.findOneAndUpdate({
      _id: toObjectId(ctx.params.departmentId)
    }, {
      $push: {
        addressList: ctx.request.body
      }
    }, {
      upsert: true,
      new: true
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.delete('/delete-substation-contact/:substationId/:contactId', async ctx => {
  try {
    const result = await Substation.findOneAndUpdate({
      _id: toObjectId(ctx.params.substationId)
    }, {
      $pull: {
        addressList: {
          _id: toObjectId(ctx.params.contactId)
        }
      }
    }, {
      upsert: true,
      new: true
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/add-substation-contact/:substationId', async ctx => {
  try {
    const result = await Substation.findOneAndUpdate({
      _id: toObjectId(ctx.params.substationId)
    }, {
      $push: {
        addressList: ctx.request.body
      }
    }, {
      upsert: true,
      new: true
    });
    ctx.body = {
      succ: true,
      result
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.get('/all-headships', async ctx => {
  try {
    const departmentHeadships = await Department.distinct('addressList.headship').lean();
    const substationHeadships = await Substation.distinct('addressList.headship').lean();
    departmentHeadships.push(...substationHeadships);
    ctx.body = {
      succ: true,
      result: Array.from(new Set(departmentHeadships)).filter(x => !!x).sort((a, b) => a.localeCompare(b, 'zh-CN'))
    };
  } catch (err: any) {
    console.error(err);
    ctx.body = {
      succ: false,
      message: err.message
    };
  }
});

router.post('/delete-user-auths', Master, async ctx => {
  const ids: any[] = ctx.request.body.ids.map((x: string) => toObjectId(x));
  const groups = await UserGroup.find({}).lean();
  for (const group of groups) {
    if (group.auths) {
      // @ts-ignore
      const groupRoleIds = group.auths.map((x: any) => x.toHexString());
      for (const id of ctx.request.body.ids) {
        if (groupRoleIds.includes(id)) {
          ctx.body = {
            succ: false,
            message: `权限被用户组${group.name}关联，不能直接删除`
          };
          return;
        }
      }
    }
  }

  await UserGroup.updateMany({}, {
    $pull: {
      auths: {
        // @ts-ignore
        $in: ids
      }
    }
  });

  const { deletedCount } = await UserAuth.deleteMany({
    _id: {
      $in: ids
    }
  });

  await sessionStore.initCache();

  ctx.body = {
    succ: true,
    deletedCount
  };
});

router.post('/delete-user-roles', Master, async ctx => {
  const ids: any[] = ctx.request.body.ids.map((x: string) => toObjectId(x));
  const groups = await UserGroup.find({}).lean();
  for (const group of groups) {
    if (group.roles) {
      // @ts-ignore
      const groupRoleIds = group.roles.map((x: any) => x.toHexString());
      for (const id of ctx.request.body.ids) {
        if (groupRoleIds.includes(id)) {
          ctx.body = {
            succ: false,
            message: `角色被用户组${group.name}关联，不能直接删除`
          };
          return;
        }
      }
    }
  }

  await UserGroup.updateMany({}, {
    $pull: {
      roles: {
        // @ts-ignore
        $in: ids
      }
    }
  });

  const { deletedCount } = await UserRole.deleteMany({
    _id: {
      $in: ids
    }
  });

  await sessionStore.initCache();

  ctx.body = {
    succ: true,
    deletedCount
  };
});

router.post('/set-group-roles/:groupId', Master, async ctx => {
  const body = ctx.request.body;
  const groupFound = await UserGroup.findById(toObjectId(ctx.params.groupId))
    .populate('roles')
    .lean();
  const roleFound = await UserRole.findById(toObjectId(body.roleId)).lean();
  if (!groupFound) {
    ctx.body = {
      succ: false,
      message: '未找到[' + ctx.params.groupId + ']对应的用户组'
    };
    return;
  }
  if (!roleFound) {
    ctx.body = {
      succ: false,
      message: '未找到[' + body.roleId + ']对应的角色'
    };
    return;
  }

  function dropRoles(roles: IUserRole[], role: string) {
    let index = roles.findIndex(x => x.role === role);
    while (index >= 0) {
      roles.splice(index, 1);
      index = roles.findIndex(x => x.role === role);
    }
  }

  if ((groupFound.roles as unknown as IUserRole[]).some(x => x._id.equals(body.roleId))) {
    const index = (groupFound.roles as unknown as IUserRole[]).findIndex(x => x._id.equals(body.roleId));
    groupFound.roles.splice(index, 1);
    const roleIds = (groupFound.roles as unknown as IUserRole[]).map(x => x._id);
    await UserGroup.updateOne({
      _id: groupFound._id
    }, {
      roles: roleIds
    });
    ctx.body = {
      succ: true,
      roleIds
    };
    return;
  }

  const oldRoleIds = _.cloneDeep(groupFound.roles);
  const roleIds = [];
  if (roleFound.role === 'repeal' || roleFound.role === 'browse' || roleFound.role === 'readonly') {
    roleIds.push(roleFound._id);
  } else {
    dropRoles(groupFound.roles as unknown as IUserRole[], 'repeal');
    dropRoles(groupFound.roles as unknown as IUserRole[], 'browse');
    dropRoles(groupFound.roles as unknown as IUserRole[], 'readonly');
    dropRoles(groupFound.roles as unknown as IUserRole[], roleFound.role);
    roleIds.push(...(groupFound.roles as unknown as IUserRole[]).map(x => x._id));
    roleIds.push(roleFound._id);
  }

  const { modifiedCount } = await UserGroup.updateOne({
    _id: groupFound._id
  }, {
    roles: roleIds
  });

  if (!modifiedCount) {
    ctx.body = {
      succ: false,
      message: '未能更新任何用户组记录'
    };
    return;
  }

  const userRoles: string[] = [];
  if (groupFound.users) {
    for (const userId of groupFound.users) {
      const user = await User.findById(userId).populate({
        path: 'groups',
        populate: [
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
      if (user && user.groups) {
        for (const g of user.groups) {
          // @ts-ignore
          for (const r of g.roles) {
            // @ts-ignore
            if (!userRoles.includes(r.role)) {
              // @ts-ignore
              userRoles.push(r.role);
            }
          }
        }
      }
    }
  }

  if ((userRoles.includes('repeal') || userRoles.includes('browse') || userRoles.includes('readonly')) && userRoles.length > 1) {
    await UserGroup.updateOne({
      _id: groupFound._id
    }, {
      roles: oldRoleIds
    });
    ctx.body = {
      succ: false,
      message: '用户隶属的角色(调度员、回执人)必须独立存在'
    };
    return;
  }

  ctx.body = {
    succ: true,
    roleIds
  };
});

router.put('/set-group-role/:groupId/:roleId', Master, async ctx => {
  const role: any = await UserRole.findById(toObjectId(ctx.params.roleId)).lean();
  const group: any = await UserGroup.findById(ctx.params.groupId);
  let excludeRoleId = null;
  if (role.role === 'repeal') {
    const excludeRole: IUserRole | null = await UserRole.findOne({ role: 'browse' }).lean();
    if (excludeRole) {
      // @ts-ignore
      excludeRoleId = excludeRole._id;
    }
  } else if (role.role === 'browse') {
    const excludeRole: IUserRole | null = await UserRole.findOne({ role: 'repeal' }).lean();
    if (excludeRole) {
      // @ts-ignore
      excludeRoleId = excludeRole._id;
    }
  }

  const index = group.roles.map((x: any) => x.toHexString()).findIndex((x: string) => x === ctx.params.roleId);
  if (index < 0) {
    group.roles.push(toObjectId(ctx.params.roleId));
    if (excludeRoleId) {
      const excludeRoleIndex = group.roles.indexOf(excludeRoleId);
      if (excludeRoleIndex >= 0) {
        group.roles.splice(excludeRoleIndex, 1);
      }
    }
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      roles: group.roles
    };
  } else {
    group.roles.splice(index, 1);
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      roles: group.roles
    };
  }

  await sessionStore.initCache();
});

router.delete('/delete-group-role/:groupId/:roleId', Master, async ctx => {
  const group: any = await UserGroup.findById(ctx.params.groupId);
  const index = group.roles.map((x: any) => x.toHexString()).findIndex(ctx.params.roleId);
  if (index >= 0) {
    group.roles.splice(index, 1);
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      roles: group.roles
    };
  } else {
    ctx.body = {
      succ: false,
      message: '用户组不存在要去除的角色'
    };
  }

  await sessionStore.initCache();
});

router.put('/set-group-auth/:groupId/:authId', Master, async ctx => {
  const group: any = await UserGroup.findById(ctx.params.groupId);
  const index = group.auths.map((x: any) => x.toHexString()).findIndex((x: string) => x === ctx.params.authId);
  if (index < 0) {
    group.auths.push(toObjectId(ctx.params.authId));
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      auths: group.auths
    };
  } else {
    group.auths.splice(index, 1);
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      auths: group.auths
    };
  }

  await sessionStore.initCache();
});

router.delete('/delete-group-auth/:groupId/:authId', Master, async ctx => {
  const group: any = await UserGroup.findById(ctx.params.groupId);
  const index = group.auths.map((x: any) => x.toHexString()).findIndex(ctx.params.authId);
  if (index >= 0) {
    group.auths.splice(index, 1);
    const result = await group.save();
    ctx.body = {
      succ: true,
      result,
      auths: group.auths
    };
  } else {
    ctx.body = {
      succ: false,
      message: '用户组不存在要去除的权限'
    };
  }

  await sessionStore.initCache();
});

router.get('/get-departments-userId/:id', async ctx => {
  ctx.body = await User.find({
    account: {
      $ne: 'root'
    },
    departments: {
      $exists: true,
      $elemMatch: {
        $eq: ctx.params.id
      }
    }
  });
});

router.get('/addresses', async ctx => {
  ctx.body = await Address.find({}).sort({
    department: 1
  }).lean();
});

router.post('/add-address', async ctx => {
  const body = ctx.request.body;
  const address = new Address({
    groups: body.groups,
    index: body.index,
    department: body.department,
    principle: body.principle,
    phone: body.phone,
    fax: body.fax,
    address: body.address
  });
  ctx.body = await address.save();
});

router.put('/update-address/:id', async ctx => {
  const body = ctx.request.body;
  ctx.body = await Address.updateOne({
    _id: toObjectId(ctx.params.id)
  }, {
    groups: body.groups,
    index: body.index,
    department: body.department,
    principle: body.principle,
    phone: body.phone,
    fax: body.fax,
    address: body.address
  });
});

router.post('/delete-addresses', async ctx => {
  ctx.body = await Address.deleteMany({
    _id: {
      $in: ctx.request.body.ids.map((x: string) => toObjectId(x))
    }
  });
});

function readFile (readerStream: stream.Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: any[] = [];
    readerStream.on('data', function (chunk) {
      data.push(chunk);
    });

    readerStream.on('error', function (err) {
      reject(err);
    });

    readerStream.on('end', function () {
      resolve(Buffer.concat(data));
    });
  });
}

export default router;
