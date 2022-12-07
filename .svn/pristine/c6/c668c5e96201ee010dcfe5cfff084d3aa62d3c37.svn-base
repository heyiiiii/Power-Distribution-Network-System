module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  env: {
    browser: true,
    node: true,
    jquery: true,
    es6: true
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
      // 不允许 return 语句出现在 global 环境下
      globalReturn: false,
      // 开启全局 script 模式
      impliedStrict: true,
      jsx: true
    },
    // 即使没有 babelrc 配置文件，也使用 babel-eslint 来解析
    requireConfigFile: false,
    // 仅允许 import export 语句出现在模块的顶层
    allowImportExportEverywhere: false
  },
  plugins: ['@typescript-eslint'],
  extends: [
    '@nuxtjs',
    'plugin:nuxt/recommended',
    '@nuxtjs/eslint-config-typescript'
  ],
  globals: {
    '$': true,
    '_': true,
    'Q': true,
    'go': true,
    'BpmnModeler': true
  },
  // add your custom rules here
  rules: {
    'import/no-named-as-default': 'off',
    'nuxt/no-cjs-in-config': 'off',
    'indent': ['off'],
    'quotes': [1, 'single'],
    'object-curly-newline': ['off'],
    'no-lonely-if': ['off'],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'space-before-function-paren': ['off'],
    'semi': ['error', 'always'],
    'multiline-ternary': ['off'],
    'no-console': ['error', {allow: ['warn', 'log', 'error']}],
    'no-trailing-spaces': ['error', {'skipBlankLines': true}],
    'new-cap': ['error', {'capIsNew': false}],
    'no-eval': ['error', {'allowIndirect': true}],
    'object-curly-spacing': ['error', 'always'],
    //空行最多不能超过100行
    'no-multiple-empty-lines': [0, {'max': 100}],
    //关闭禁止混用tab和空格
    'no-mixed-spaces-and-tabs': [0],
    'no-var': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'warn',
    'arrow-parens': ['off'],
    'vue/script-indent': ['off'],
    /**
     * 限制自定义组件的属性风格
     */
    'vue/attribute-hyphenation': 'off',
    /**
     * 标签属性必须按规则排序
     */
    'vue/attributes-order': 'off',
    /**
     * 变量名必须是 camelcase 风格的
     * @reason 很多 api 或文件名都不是 camelcase 风格的
     */
    'vue/camelcase': 'off',
    /**
     * 支持在模版中使用 eslint-disable-next-line 等注释
     */
    'vue/comment-directive': 'error',
    /**
     * 限制组件名的风格
     */
    'vue/component-name-in-template-casing': 'off',
    /**
     * 必须使用 === 或 !==，禁止使用 == 或 !=
     */
    'vue/eqeqeq': ['error', 'always'],
    /**
     * 修复 no-unused-vars 不检查 jsx 的问题
     */
    'vue/jsx-uses-vars': 'warn',
    /**
     * 组件名称必须和文件名一致
     */
    'vue/match-component-file-name': 'off',
    /**
     * 限制组件的 name 属性的值的风格
     */
    'vue/one-component-per-file': 'off',
    'vue/component-definition-name-casing': 'off',
    'vue/name-property-casing': 'off',
    'vue/mustache-interpolation-spacing': 'off',
    /**
     * 计算属性禁止包含异步方法
     */
    'vue/no-async-in-computed-properties': 'error',
    /**
     * 禁止给布尔值 props 添加默认值
     */
    'vue/no-boolean-default': 'off',
    /**
     * 禁止重复的键名
     */
    'vue/no-dupe-keys': 'error',
    /**
     * 禁止出现重复的属性
     */
    'vue/max-attributes-per-line': ['off'],
    'vue/no-duplicate-attributes': [
      'error',
      {
        allowCoexistClass: true,
        allowCoexistStyle: true
      }
    ],
    /**
     * 禁止出现语法错误
     */
    'vue/no-parsing-error': ['off'],
    /**
     * 禁止覆盖保留字
     */
    'vue/no-reserved-keys': 'error',
    /**
     * 禁止使用指定的语法
     */
    'vue/no-restricted-syntax': 'off',
    /**
     * 组件的 data 属性的值必须是一个函数
     */
    'vue/no-shared-component-data': 'off',
    /**
     * 禁止在计算属性中对属性修改
     */
    'vue/no-side-effects-in-computed-properties': 'off',
    /**
     * 禁止 <template> 使用 key 属性
     */
    'vue/no-template-key': 'off',
    /**
     * 模版中的变量名禁止与前一个作用域重名
     */
    'vue/no-template-shadow': 'off',
    /**
     * 禁止在 <textarea> 中出现模版语法 {{message}}
     */
    'vue/no-textarea-mustache': 'error',
    /**
     * 禁止定义在 components 中的组件未使用
     */
    'vue/no-unused-components': 'off',
    /**
     * 模版中已定义的变量必须使用
     */
    'vue/no-unused-vars': 'warn',
    /**
     * 禁止在同一个元素上使用 v-if 和 v-for 指令
     */
    'vue/no-use-v-if-with-v-for': 'warn',
    /**
     * 禁止使用 v-html
     */
    'vue/no-v-html': 'off',
    /**
     * 组件的属性必须为一定的顺序
     */
    'vue/order-in-components': 'off',
    /**
     * props 必须用驼峰式
     */
    'vue/prop-name-casing': 'off',
    /**
     * <component> 必须有 v-bind:is
     */
    'vue/require-component-is': 'error',
    /**
     * props 如果不是 required 的字段，必须有默认值
     */
    'vue/require-default-prop': 'error',
    /**
     * props 的取值必须是构造函数
     */
    'vue/require-prop-type-constructor': 'error',
    /**
     * prop 必须有类型限制
     */
    'vue/require-prop-types': 'off',
    /**
     * render 函数必须有返回值
     */
    'vue/require-render-return': 'error',
    /**
     * v-for 指令的元素必须有 v-bind:key
     */
    'vue/require-v-for-key': 'error',
    /**
     * prop 的默认值必须匹配它的类型
     */
    'vue/require-valid-default-prop': 'off',
    /**
     * 计算属性必须有返回值
     */
    'vue/return-in-computed-property': 'error',
    /**
     * 禁止在模版中用 this
     */
    'vue/this-in-template': 'error',
    /**
     * 当一个节点上出现两个 v-on:click 时，其中一个必须为 exact
     */
    'vue/use-v-on-exact': 'error',
    /**
     * 限制 v-bind 的风格
     */
    'vue/v-bind-style': 'off',
    /**
     * 禁止在 v-on 的值中调用函数
     */
    'vue/v-on-function-call': 'error',
    'vue/first-attribute-linebreak': 'off',
    /**
     * 限制 v-on 的风格
     */
    'vue/v-on-style': 'off',
    /**
     * template 的根节点必须合法
     */
    'vue/valid-template-root': 'error',
    /**
     * v-bind 指令必须合法
     */
    'vue/valid-v-bind': 'error',
    /**
     * v-cloak 指令必须合法
     */
    'vue/valid-v-cloak': 'error',
    /**
     * v-else 指令必须合法
     */
    'vue/valid-v-else': 'error',
    /**
     * v-else-if 指令必须合法
     */
    'vue/valid-v-else-if': 'error',
    /**
     * v-for 指令必须合法
     */
    'vue/valid-v-for': 'error',
    'vue/html-self-closing': ['off'],
    'vue/html-indent': ['off'],
    'vue/html-closing-bracket-spacing': ['off'],
    'vue/html-closing-bracket-newline': ['off'],
    /**
     * v-html 指令必须合法
     */
    'vue/valid-v-html': 'error',
    /**
     * v-if 指令必须合法
     */
    'vue/valid-v-if': 'error',
    /**
     * v-model 指令必须合法
     */
    'vue/valid-v-model': 'error',
    /**
     * v-on 指令必须合法
     */
    'vue/valid-v-on': 'error',
    /**
     * v-once 指令必须合法
     */
    'vue/valid-v-once': 'error',
    /**
     * v-pre 指令必须合法
     */
    'vue/valid-v-pre': 'error',
    /**
     * v-show 指令必须合法
     */
    'vue/valid-v-show': 'error',
    /**
     * v-text 指令必须合法
     */
    'vue/valid-v-text': 'error',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/require-direct-export': ['off']
  }
};
