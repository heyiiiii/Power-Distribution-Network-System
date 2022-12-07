const path = require('path');
const fs = require('fs');
const os = require('os');
const bytes = require('bytes');
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const routerBase = require('./configs/router-base');

(function() {
  if (process.env.PROD === 'true') {
    return;
  }

  function directoryWalk(filePath) {
    const ret = [];
    try {
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        // 排除带参数的路由和非vue页面
        if (file.startsWith('_')) {
          continue;
        }
        const filedir = path.join(filePath, file);
        const stats = fs.statSync(filedir);
        if (stats.isFile()) {
          if (path.extname(filedir) === '.vue') {
            ret.push(filedir);
          }
        } else if (stats.isDirectory()) {
          ret.push(...directoryWalk(filedir));
        }
      }
    } catch (error) {
      console.error(`directoryWalk(${filePath})出现异常.`);
      console.error(error);
    }

    return ret;
  }

  const dir = path.join(__dirname, 'pages');
  if (!fs.existsSync(dir)) {
    console.error('路由表无法生成, 找不到目录[' + dir + ']');
    return;
  }

  const files = directoryWalk(dir);
  const routes = [];
  for (const file of files) {
    try {
      const f = fs.openSync(file, 'r');
      const buf = Buffer.alloc(1024);
      fs.readSync(f, buf, 0, 1024, null);
      fs.closeSync(f);
      const head = buf.toString('utf-8', 0, buf.length);
      const match = head.match(/<!--meta:(.+)-->/);
      if (match && match.length > 1) {
        const meta = JSON.parse(match[1]);
        if (meta) {
          let pageFile = path.relative(dir, file).replace(/\\/g, '/').replace('.vue', '');
          if (pageFile.endsWith('index')) {
            pageFile = pageFile.substr(0, pageFile.length - 6);
          }
          const routerName = pageFile.replace(/\//ig, '-');
          const routerPath = '/' + pageFile;
          routes.push(Object.assign({
            name: routerName === '' ? 'index' : routerName,
            path: routerPath
          }, meta));
        }
      }
    } catch (error) {
      console.error('遍历路由页面时出现异常');
      console.error(error);
    }
  }

  routes.sort((x, y) => x.index - y.index);
  const routesJson = JSON.stringify(routes);
  let needRewrite = true;
  const file = path.join(__dirname, 'server', 'utils', 'routes.json');
  if (fs.existsSync(file)) {
    const str = fs.readFileSync(file, {encoding: 'utf-8'}).toString();
    needRewrite = str !== routesJson;
  }

  if (needRewrite) {
    console.log('需要向[' + file + ']重新生成路由表');
    fs.writeFileSync(file, Buffer.from(routesJson), {encoding: 'utf-8'});
  } else {
    console.log('路由表[' + file + ']无需重新生成');
  }
})();


module.exports = {
  telemetry: false,
  target: 'server',
  globalName: 'dms',
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - 配网整定计算系统',
    htmlAttrs: {
      lang: 'zh'
    },
    meta: [
      {
        charset: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        hid: 'description',
        name: 'description',
        content: '配网整定计算系统'
      },
      {
        name: 'format-detection',
        content: 'telephone=no'
      }
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: routerBase.routerBase + 'favicon.png'},
      {rel: 'favicon', type: 'image/x-icon', href: routerBase.routerBase + 'favicon.png'},
      {rel: 'stylesheet', href: routerBase.routerBase + 'vendor/fontawesome5/css/all.min.css'}
    ],
    noscript: [
      {innerHTML: '<h1>浏览器需要启用JavaScript才可以使用本系统！</h1>'}
    ],
    script: [
      {src: routerBase.routerBase + 'vendor/front-utils/pinyin.js?v=1.4'},
      {src: routerBase.routerBase + 'vendor/front-utils/qunee.min.js?v=1.0'},
      {src: routerBase.routerBase + 'vendor/front-utils/number-map.js?v=1.0'},
      {src: routerBase.routerBase + 'vendor/ping/ping.min.js'}
    ]
  },
  loading: {
    color: 'blue',
    height: '1px'
  },
  router: {
    base: routerBase.routerBase,
    middleware: ['auth', 'role', 'ua-check', 'handle-route-change']
  },
  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/static/vendor/icomoon/style.css',
    '@/assets/css/theme/index.css',
    '@/assets/css/main.less',
    '@/assets/css/ag-theme.scss',
    '@/static/vendor/element-theme/theme/index.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    {src: '@/plugins/ie-polyfill', mode: 'client'},
    {src: '@/plugins/sse-polyfill', mode: 'client'},
    {src: '@/plugins/axios', mode: 'all'},
    {src: '@/plugins/element-ui', mode: 'all'},
    {src: '@/plugins/socket', mode: 'client'},
    {src: '@/plugins/monaco', mode: 'client'},
    {src: '@/plugins/ag-grid', mode: 'all'},
    {src: '@/plugins/func-extend', mode: 'all'},
    {src: '@/plugins/fontawesome', mode: 'all'}
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxt/typescript-build',
    '@nuxtjs/moment'
  ],
  moment: {
    timezone: true,
    defaultTimezone: 'Asia/Shanghai',
    defaultLocale: 'zh-cn',
    locales: ['zh-cn']
  },
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    'nuxt-fontawesome'
  ],
  fontawesome: {
    component: 'fa',
    imports: [
      {
        set: '@fortawesome/free-solid-svg-icons',
        icons: ['fas']
      }
    ]
  },
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    credentials: true,
    maxBodyLength: bytes.parse('256MB'),
    maxContentLength: bytes.parse('512MB'),
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  typescript: {
    ignoreNotFoundWarnings: false,
    loaders: {
      ts: {
        silent: true
      },
      tsx: {
        silent: true
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    ssr: true,
    extractCSS: process.env.NODE_ENV === 'production',
    parallel: false,
    optimization: {
      minimize: true
    },
    html: {
      minify: {
        collapseBooleanAttributes: true,
        collapseWhitespace: false,
        decodeEntities: true,
        minifyCSS: true,
        minifyJS: true,
        processConditionalComments: true,
        removeAttributeQuotes: false,
        removeComments: true,
        removeEmptyAttributes: false,
        removeOptionalTags: false,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: false,
        removeStyleLinkTypeAttributes: false,
        removeTagWhitespace: false,
        sortClassName: false,
        trimCustomFragments: true,
        useShortDoctype: true
      }
    },
    transpile: [
      /(^@ag-grid|debug|io-client|element-ui|echarts|vue-socket|socket\.io|engine\.io)/
    ],
    corejs: 3,
    babel: {
      cacheDirectory: os.tmpdir(),
      presets({isServer, envName}) {
        const envTargets = {
          client: {ie: 11, chrome: 49},
          server: {node: 'current'}
        };
        return [[
          require.resolve('@nuxt/babel-preset-app'), {
            compact: false,
            corejs: {
              version: 3,
              proposals: true
            },
            buildTarget: isServer ? 'server' : 'client',
            targets: envTargets[envName]
          }
        ]];
      },
      exclude: /vendor/,
      compact: false,
      babelrc: false
    },
    plugins: [
      new MonacoWebpackPlugin(),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        _: 'lodash',
        go: path.resolve(__dirname, './static/vendor/gojs/go.v2.2.10.js'),
        Vue: ['vue/dist/vue.esm.js', 'default']
      })
    ],
    loaders: {
      less: {
        lessOptions: {
          javascriptEnabled: true,
          strictMath: false,
          noIeCompat: true
        }
      }
    },
    terser: {
      exclude: /(node_modules|vendor)/,
      terserOptions: {
        output: {
          comments: false
        },
        compress: {
          // drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production',
          warnings: process.env.NODE_ENV === 'development'
          // pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : []
        }
      },
      extractComments: false
    },
    /*
     ** You can extend webpack config here
     */
    extend(config, {isDev, isClient}) {
      config.resolve.alias.vue$ = 'vue/dist/vue.esm.js';
      config.module.rules.forEach((rule) => {
        if (String(rule.test) === String(/\.m?jsx?$/i)) {
          const oldExclude = rule.exclude;
          rule.exclude = (file) => {
            const exclude = /vendor/;
            return oldExclude(file) || exclude.test(file);
          };
        }
      });
    }
  }
};
