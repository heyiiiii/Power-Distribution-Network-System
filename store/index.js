export const state = () => ({
  user: {
    id: '',
    name: '',
    account: '',
    area: {
      name: '',
      aliasName: '',
      description: '',
      headerTitle: '',
      headerSubTitle: '',
      indexTitle: ''
    },
    token: '',
    departments: [],
    auths: [],
    roles: [],
    params: {},
    routes: []
  },
  stateConfigs: [],
  columnStatesInQuery: [],
  nodeEnv: 'development',
  layoutModel: 'default',
  combinedRole: {
    enableUpload: false,
    executeFlow: false,
    viewSelfDepartmentOnly: false,
    viewCurrentAndHistoryStore: false,
    states: [],
    executeStates: []
  },
  flowStates: [],
  voltages: [],
  conductorTypes: [],
  protectTypes: [],
  messageKey: '',
  userAgent: '',
  windowHeight: 542,
  clientHeight: 500,
  clientWidth: 500,
  configs: {},
  routes: [],
  systemConfigs: [],
  currentRouteId: '',
  allUsers: [],
  departmentTree: [],
  currentDebugInfo: '',
  ajaxPrefix: '',
  proxyAppName: '',
  settingSystem: [],
  systemParams: {
    breaker: {
      ct01: '零序CT变比一次值',
      ct02: '零序CT变比二次值',
      ct0Precision: '零序CT精度',
      ct11: '正序CT变比一次值',
      ct12: '正序CT变比二次值',
      ct1Precision: '正序CT精度',
      overCurrentIISetting: '过流Ⅱ段电流定值(A)',
      overCurrentIITime: '过流Ⅱ段时间定值(s)',
      overCurrentIIISetting: '过流Ⅲ段电流定值(A)',
      overCurrentIIITime: '过流Ⅲ段时间定值(s)',
      reclosingTime: '二次重合闸时间',
      totalCapacity: '总配变容量(kVA)',
      maxCapacity: '最大配变容量(kVA)',
      maxMotorCapacity: '最大电动机容量(kVA)'
    },
    calculate: {
      overCurrentIISetting: '过流Ⅱ段电流定值',
      overCurrentIITime: '过流Ⅱ段时间定值',
      overCurrentIIISetting: '过流Ⅲ段电流定值',
      overCurrentIIITime: '过流Ⅲ段时间定值'
    }
  }
});

export const getters = {
  getSystemParams(state) {
    return state.systemParams;
  },
  getProxyAppName(state) {
    return state.proxyAppName;
  },
  getAjaxPrefix(state) {
    return state.proxyAppName ? '/api-' + state.proxyAppName : '';
  },
  getCurrentDebugInfo(state) {
    return state.currentDebugInfo;
  },
  getAllUsers(state) {
    return state.allUsers;
  },
  getUsedDepartmentTree(state) {
    return state.departmentTree;
  },
  getUsedDepartments(state) {
    const departments = [];
    for (const u of state.allUsers) {
      if (Array.isArray(u.departments) && u.departments.length > 0) {
        for (const d of u.departments) {
          if (!departments.some(x => x._id === d._id)) {
            departments.push(_.cloneDeep(d));
          }
        }
      }
    }
    return departments;
  },
  getUsedRoles(state) {
    const roles = [];
    for (const u of state.allUsers) {
      if (Array.isArray(u.roles) && u.roles.length > 0) {
        for (const r of u.roles) {
          if (!roles.some(x => x.role === r.role)) {
            roles.push(r);
          }
        }
      }
    }
    return roles.sort((a, b) => a.index - b.index);
  },
  getRouterBase(state) {
    return state.configs.service.routerBase;
  },
  getStateConfigs(state) {
    return state.stateConfigs;
  },
  getColumnStatesInQuery(state) {
    return state.columnStatesInQuery;
  },
  isDebug(state) {
    return state.nodeEnv === 'development';
  },
  getOnlyofficeApiUrl(state) {
    return `${state.configs.onlyoffice.prefix}${state.configs.onlyoffice.host}:${state.configs.onlyoffice.port}${state.configs.onlyoffice.apiJsPath}`;
  },
  isUploadEnable(state) {
    return state.combinedRole.enableUpload;
  },
  isExecuteFlowEnable(state) {
    return state.combinedRole.executeFlow;
  },
  isViewCurrentAndHistoryStore(state) {
    return state.combinedRole.viewCurrentAndHistoryStore;
  },
  getSystemConfigs(state) {
    return state.systemConfigs;
  },
  getExecuteFileStates(state) {
    return state.combinedRole.executeStates;
  },
  messageKey(state) {
    return state.messageKey;
  },
  isAuthenticated(state) {
    return state.user.id && state.user.token;
  },
  getIndexPage(state) {
    return state.user.params.indexPage ? state.user.params.indexPage : 'index';
  },
  getCurrentRouteId(state) {
    return state.currentRouteId;
  },
  isIE(state) {
    return state.userAgent.includes('Trident/');
  },
  isChrome(state) {
    return state.userAgent.includes('Chrome/');
  },
  getParams(state) {
    return state.user.params;
  },
  getUserAgent(state) {
    return state.userAgent;
  },
  getFlowStates(state) {
    return state.flowStates;
  },
  getUser(state) {
    return state.user;
  },
  getVoltages(state) {
    return state.voltages;
  },
  getConductorTypes(state) {
    return state.conductorTypes;
  },
  getProtectTypes(state) {
    return state.protectTypes;
  },
  getAuths(state) {
    return state.user.auths || ['readonly'];
  },
  hasAdminAuth(state) {
    return state.user.auths.includes('admin');
  },
  hasMasterAuth(state) {
    return state.user.auths.includes('master');
  },
  hasBrowseRole(state) {
    return state.user.roles.includes('browse');
  },
  hasRepealRole(state) {
    return state.user.roles.includes('repeal');
  },
  hasAuditRole(state) {
    return state.user.roles.includes('audit');
  },
  hasLaunchRole(state) {
    return state.user.roles.includes('launch');
  },
  getDepartments(state) {
    return state.user.departments;
  },
  getDepartmentCodes(state) {
    return state.user.departments.map(x => x.code);
  },
  getRoles(state) {
    return state.user.roles || [];
  },
  getCombinedRole(state) {
    return state.combinedRole;
  },
  getUserId(state) {
    return state.user.id;
  },
  getUserAccount(state) {
    return state.user.account;
  },
  getUserName(state) {
    return state.user.name;
  },
  getWindowHeight(state) {
    return state.windowHeight;
  },
  getClientHeight(state) {
    return state.clientHeight;
  },
  getClientWidth(state) {
    return state.clientWidth;
  },
  getConfigs(state) {
    return state.configs;
  },
  isProvince(state) {
    return state.configs.service.isProvince;
  },
  getRoutes(state) {
    return state.routes;
  },
  getUserRoutes(state) {
    return state.user.routes;
  },
  getLayoutModel(state) {
    return state.layoutModel;
  },
  getAxiosHeader(state) {
    return {
      Authorization: state.user.token,
      'area-code': state.user?.departments?.[0]?.code || ''
    };
  },
  getAreaCode(state) {
    return state.user?.departments?.[0]?.code || '';
  },
  getSettingConfig(state) {
    return state.settingSystem;
  }
};

export const mutations = {
  appendTempAdminAuth(state) {
    if (!state.user.auths.includes('admin')) {
      state.user.auths.push('admin');
    }
    const routes = [];
    let _id = 1;
    for (const r of state.routes) {
      const route = _.cloneDeep(r);
      route._id = String(_id++);
      route.parentId = '';
      routes.push(route);
    }
    state.user.routes = routes;
  },
  setProxyAppName(state, b) {
    state.proxyAppName = b || '';
  },
  setCurrentDebugInfo(state, str) {
    state.currentDebugInfo = str;
  },
  setAllUsers(state, users) {
    state.allUsers = users;
  },
  setDepartmentTree(state, departmentTree) {
    state.departmentTree = departmentTree;
  },
  setStateConfigs(state, stateConfigs) {
    state.stateConfigs = stateConfigs;
  },
  setColumnStatesInQuery(state, columnStatesInQuery) {
    state.columnStatesInQuery = columnStatesInQuery;
  },
  setSettingSystem(state, config) {
    state.settingSystem = config;
  },
  modifySystemConfig(state, config) {
    const found = state.systemConfigs.find(x => x._id === config._id);
    if (found) {
      found.serviceId = config.serviceId;
      found.name = config.name;
      found.key = config.key;
      found.value = config.value;
      found.description = config.description;
      found.backendOnly = config.backendOnly;
    }
  },
  removeSystemConfig(state, id) {
    const index = state.systemConfigs.findIndex(x => x._id === id);
    if (index >= 0) {
      state.systemConfigs.splice(index, 1);
    }
  },
  addSystemConfig(state, config) {
    state.systemConfigs.push(config);
  },
  setSystemConfigs(state, configs) {
    if (Array.isArray(configs) && configs.length > 0) {
      state.systemConfigs = configs;
    } else {
      state.systemConfigs = [];
    }
  },
  setNodeEnv(state, env) {
    state.nodeEnv = env;
  },
  setMessageKey(state, key) {
    state.messageKey = key;
  },
  setUserAgent(state, userAgent) {
    state.userAgent = userAgent;
  },
  setCurrentRouteId(state, currentRouteId) {
    state.currentRouteId = currentRouteId;
  },
  setParams(state, params) {
    state.user.params = params;
  },
  setLayoutModel(state, layoutModel) {
    state.layoutModel = layoutModel;
  },
  setWindowHeight(state, windowHeight) {
    state.windowHeight = windowHeight;
  },
  setClientHeight(state, clientHeight) {
    state.clientHeight = clientHeight;
  },
  setClientWidth(state, clientWidth) {
    state.clientWidth = clientWidth;
  },
  setConfigs(state, configs) {
    state.configs = configs;
  },
  setRoutes(state, routes) {
    state.routes = routes;
  },
  setCombinedRole(state, combinedRole) {
    state.combinedRole = combinedRole;
  },
  setUserRoutes(state, routes) {
    routes.forEach(x => {
      if (!x.parentId) {
        x.parentId = '';
      }
    });
    state.user.routes.splice(0, state.user.routes.length, ...routes.sort((x, y) => x.index - y.index));
  },
  setUserRoles(state, roles) {
    state.user.roles = roles;
  },
  setUserAuths(state, auths) {
    state.user.auths = auths;
  },
  setUser(state, { id, auths, departments, token, roles }) {
    state.user.id = id;
    state.user.departments = departments;
    state.user.token = token;
    state.user.auths = auths;
    state.user.roles = roles;
  },
  acquireAdminAuth(state) {
    if (!state.user.auths.includes('admin')) {
      state.user.auths.push('admin');
    }
  },
  acquireMasterAuth(state) {
    if (!state.user.auths.includes('master')) {
      state.user.auths.push('master');
    }
  },
  setUserAccount(state, account) {
    state.user.account = account;
  },
  setUserName(state, userName) {
    state.user.name = userName;
  },
  setDepartments(state, departments) {
    state.user.departments = departments;
  },
  clearUser(state) {
    state.user = {
      id: '',
      name: '',
      account: '',
      area: {
        name: '',
        aliasName: '',
        description: '',
        headerTitle: '',
        headerSubTitle: '',
        indexTitle: ''
      },
      token: '',
      departments: [],
      auths: [],
      roles: [],
      params: {},
      routes: []
    };
  },
  setFlowStates(state, states) {
    state.flowStates = states;
  },
  setVoltage(state, voltages) {
    state.voltages = voltages;
  },
  setConductorType(state, conductorTypes) {
    state.conductorTypes = conductorTypes;
  },
  setProtectTypes(state, protectTypes) {
    state.protectTypes = protectTypes;
  },
  clearFlowState(state) {
    state.flowStates = [];
  }
};

function getCookieValue(key, cookie) {
  const array = cookie.split(';');
  for (const s of array) {
    const kv = s.trim();
    if (kv.startsWith(key + '=')) {
      return kv.substr(key.length + 1);
    }
  }

  return '';
}

export const actions = {
  async nuxtServerInit({ commit, dispatch }, { req }) {
    if (req.headers.cookie) {
      const proxyAppName = getCookieValue('app', req.headers.cookie);
      if (proxyAppName) {
        commit('setProxyAppName', proxyAppName);
      }
    }
    commit('setNodeEnv', process.env.NODE_ENV);
    await dispatch('reloadConfigs');
    await dispatch('reloadSystemConfig');
    if (req.session) {
      commit('setUser', {
        id: req.session.user._id,
        token: req.session.key,
        auths: req.session.auths,
        roles: req.session.roles
      });
      await dispatch('refreshHeaderData');
    }
  },
  async reloadConfigs({ commit }) {
    try {
      const { data } = await this.$axios.get('/resource/configs/configs');
      commit('setConfigs', data.configs);
    } catch (err) {
      console.error(err);
      commit('setConfigs', {});
    }
  },
  async reloadSystemConfig({ commit }) {
    try {
      const { data } = await this.$axios.get('/setting/system-config/list');
      commit('setSettingSystem', data.result);
    } catch (err) {
      console.error(err);
      commit('setSettingSystem', []);
    }
  },
  async refreshHeaderData({ commit, getters, dispatch }) {
    try {
      if (getters.getUserId) {
        const { data } = await this.$axios.get('/user/session-data/' + getters.getUserId);
        if (data.succ) {
          commit('setStateConfigs', data.stateConfigs);
          commit('setColumnStatesInQuery', data.columnStatesInQuery);
          commit('setSystemConfigs', data.systemConfigs);
          commit('setUserName', data.user.name);
          commit('setDepartments', data.user.departments);
          commit('setParams', data.user.params);
          commit('setUserRoutes', data.user.routes);
          commit('setUserRoles', data.user.roles);
          commit('setUserAuths', data.user.auths);
          commit('setCombinedRole', data.combinedRole);
          commit('setRoutes', data.routeMetas);
          commit('setFlowStates', data.flowStates);
          commit('setVoltage', data.voltages);
          commit('setProtectTypes', data.protectTypes);
        } else {
          console.error('初始化session数据失败');
          console.error(data.message);
        }

        await dispatch('fetchUserAndDepartments');
        await dispatch('refreshVoltage');
        await dispatch('refreshConductorType');
      }
    } catch (err) {
      console.error(err);
      commit('clearUser');
    }
  },
  async fetchUserAndDepartments({ commit }) {
    try {
      const { data } = await this.$axios.get('/sys/fetch-users');
      if (data.succ) {
        const departmentTree = [];
        const departments = [];
        for (const u of data.users) {
          if (Array.isArray(u.departments) && u.departments.length > 0) {
            for (const d of u.departments) {
              if (!departments.some(x => x._id === d._id)) {
                const dep = _.cloneDeep(d);
                dep.children = [];
                dep.expand = true;
                dep.title = dep.aliasName || dep.name;
                departments.push(dep);
              }
            }
          }
        }
        departments.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        departments.sort((a, b) => a.index - b.index);
        for (const d of departments) {
          if (!departments.some(x => x.code === d.parentCode)) {
            departmentTree.push(d);
          }
        }

        function fetchTree(deps) {
          for (const d of deps) {
            d.children.push(...departments.filter(x => x.parentCode === d.code));
            fetchTree(d.children);
          }
        }

        fetchTree(departmentTree);
        commit('setDepartmentTree', departmentTree);
        commit('setAllUsers', data.users);
      } else {
        console.error(data.message);
        commit('setAllUsers', []);
        commit('setDepartmentTree', []);
      }
    } catch (e) {
      console.error(e);
      commit('setAllUsers', []);
      commit('setDepartmentTree', []);
    }
  },
  async refreshFlowState({ commit }) {
    try {
      const { data: states } = await this.$axios.get('/flow-state-setting/flow-state-setting');
      commit('setFlowStates', states);
    } catch (err) {
      console.error(err);
      commit('setFlowStates', []);
    }
  },
  async refreshVoltage({ commit }) {
    try {
      const { data: vol } = await this.$axios.get('/models/xml-voltage/list');
      commit('setVoltage', vol.result);
    } catch (err) {
      console.error(err);
      commit('setVoltage', []);
    }
  },
  async refreshConductorType({ commit }) {
    try {
      const { data: vol } = await this.$axios.get('/models/conductor-types/list');
      commit('setConductorType', vol.result);
    } catch (err) {
      console.error(err);
      commit('setConductorType', []);
    }
  },
  async SOCKET_preferLogout({ getters, commit }) {
    const currentRouteId = getters.getCurrentRouteId;
    if (currentRouteId) {
      const rf = getters.getUserRoutes.find(x => x._id === currentRouteId);
      if (rf && rf.name !== 'index') {
        commit('clearUser');
        await this.$router.push({
          name: 'login',
          query: {
            redirect: rf.path
          }
        });
        return;
      }
    }

    commit('clearUser');
    await this.$router.push({ name: 'login' });
  },
  async logout({ commit }) {
    try {
      await this.$axios.get('/auth/logout');
      commit('clearUser');
      const appPrefix = getCookieValue('app', document.cookie);
      const loc = getCookieValue('loc', document.cookie);
      if (appPrefix && loc) {
        const url = loc + '/' + appPrefix + '/login';
        console.log('跳转至: ' + url);
        window.location.replace(url);
      } else {
        await this.$router.push({ name: 'login' });
      }
    } catch (err) {
      console.error(err);
      commit('clearUser');
    } finally {
      commit('clearUser');
    }
  }
};
