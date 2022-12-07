const rb = require('./router-base');
export default {
  service: { // nodejs express 服务地址
    id: process.env.SERVICE_ID || 'localhost',
    rememberDays: Number(process.env.REMEMBER_DAYS || 14),
    routerBase: rb.routerBase,
    prefix: process.env.SERVICE_PREFIX || 'http://',
    host: process.env.SERVICE_HOST || 'localhost',
    port: Number(process.env.SERVICE_PORT || 4001),
    isProvince: process.env.IS_PROVINCE ? process.env.IS_PROVINCE === 'true' : true,
    enableRoot: process.env.ENABLE_ROOT === 'true',
    enableRegister: process.env.ENABLE_REGISTER === 'true',
    fileLockTimeout: Number(process.env.FILE_LOCK_TIMEOUT || 600000),
    preferHttps: process.env.PREFER_HTTPS === 'true',
    rebuild: true,
    showScriptLog: process.env.SHOW_SCRIPT_LOG === 'true' || false
  },
  monitor: {
    prefix: process.env.MONITOR_PREFIX || 'http://',
    host: process.env.NODE_ENV === 'development' ? '192.168.1.102' : process.env.MONITOR_HOST || process.env.SERVICE_HOST || '127.0.0.1',
    port: Number(process.env.MONITOR_PORT || 8006)
  },
  dz: {
    ip: process.env.DZ_IP || '192.168.1.140',
    groupNumber: Number(process.env.DZ_GROUP_NUMBER || 0),
    local: {
      host: process.env.DZ_LOCAL_HOST || '192.168.1.140',
      port: Number(process.env.DZ_LOCAL_PORT || 22),
      username: process.env.DZ_LOCAL_USERNAME || 'lh',
      password: process.env.DZ_LOCAL_PASSWORD || 'lh123'
    },
    remote: {
      host: process.env.DZ_REMOTE_HOST || '192.168.1.140',
      port: Number(process.env.DZ_REMOTE_PORT || 22),
      username: process.env.DZ_REMOTE_USERNAME || 'lh',
      password: process.env.DZ_REMOTE_PASSWORD || 'lh123'
    }
  },
  pdfc: {
    prefix: process.env.PDFC_PREFIX || 'http://',
    host: process.env.PDFC_HOST || '192.168.1.168',
    port: process.env.PDFC_PORT || '7780',
    path: process.env.PDFC_PATH || '/compare',
    force: process.env.PDFC_FORCE === 'true',
    showAutoConvertOnUpload: process.env.SHOW_AUTO_CONVERT === 'true',
    convDocxOnUpload: process.env.CONV_DOCX === 'true',
    convDocxDefaultMarginCM: Number(process.env.DEFAULT_CONV_MARGIN_CM || 0.9)
  },
  downloadProxy: {
    prefix: process.env.DOWNLOAD_PROXY_PREFIX || 'http://',
    host: process.env.DOWNLOAD_PROXY_HOST || '192.168.1.102',
    port: process.env.DOWNLOAD_PROXY_PORT || '7789',
    path: process.env.DOWNLOAD_PROXY_PATH || '/'
  },
  onlyoffice: { // 文档服务器地址
    selfAddress: process.env.ONLYOFFICE_FILE_ADDRESS || process.env.SERVICE_HOST || '192.168.1.168',
    onlyofficeBackAddress: process.env.ONLYOFFICE_BACK_ADDRESS,
    prefix: process.env.ONLYOFFICE_PREFIX || 'http://',
    host: process.env.ONLYOFFICE_HOST || '192.168.1.102',
    port: process.env.ONLYOFFICE_PORT || '8124',
    path: process.env.ONLYOFFICE_PATH || '/',
    apiJsPath: process.env.ONLYOFFICE_APIJS_PATH || '/web-apps/apps/api/documents/api.js'
  },
  dsrv: {
    prefix: process.env.DSRV_PREFIX || 'http://',
    host: process.env.DSRV_HOST || '192.168.1.102',
    port: process.env.DSRV_PORT || '10086'
  },
  mongodb: { // mongodb连接配置，生产环境中必须使用uid和pwd连接mongodb
    backendOnly: true,
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || '27017',
    db: process.env.MONGODB_DB || 'dms2',
    uid: process.env.MONGODB_UID || '',
    pwd: process.env.MONGODB_PWD || '',
    replicaSet: process.env.MONGODB_REPLICA_SET || '',
    useTransaction: process.env.MONGODB_USE_TRANSACTION === 'true',
    backupDir: process.env.MONGODB_BACKUP_DIR || '/usr/local/backup',
    autoBackupTime: process.env.MONGODB_BACKUP_SCHEDULE || '0 0 02 1/1 * ?',
    reserveDate: process.env.MONGODB_BACKUP_DATE || 50
  },
  backend: { // 后端服务地址
    backendOnly: true,
    prefix: process.env.BACKEND_PREFIX || 'http://',
    host: process.env.BACKEND_HOST || 'localhost',
    port: process.env.BACKEND_PORT || '10086',
    path: process.env.BACKEND_PATH || '/xbac'
  },
  session: {
    backendOnly: true,
    proxy: process.env.PROXY === 'true' || false,
    autoRefreshMinutes: Number(process.env.SESSION_AUTO_REFRESH_MINUTE || 30),
    cookieKey: 'dms:sess',
    appKeys: ['759fcbe0-6829-4044-ae04-ddf4090b0013']
  }
};
