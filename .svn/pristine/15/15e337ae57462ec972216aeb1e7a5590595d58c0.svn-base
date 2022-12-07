export default function () {
  if (process.client) {
    const monaco = require('monaco-editor');
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems(model, position, context, token) {
        return {
          suggestions: [
            {
              label: '$axios',
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: '$axios',
              detail: 'http接口调用'
            },
            {
              label: '$log',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: '$log();',
              detail: '日志'
            },
            {
              label: '$input',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$input({
  title: '',// 标题
  content: '',// 内容
  defaultValue: ''// 默认值
});`,
              detail: '触发用户输入文本'
            },
            {
              label: '$select',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$select({
  title: '',// 标题
  content: '',// 内容
  options: [],// 可选项
  defaultValue: ''// 默认值
});`,
              detail: '触发用户选择'
            },
            {
              label: '$confirm',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$confirm({
  title: '',// 标题
  content: ''// 内容
});`,
              detail: '触发浏览器确认框'
            }, {
              label: '$checks',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$checks({
  title: '',// 标题
  options: [// 勾选项
    {
      label: '',
      checked: true,
      description: '',
      width: '' ,// 长度 560px即换行
      divider: false // 底部横线
    }
  ]
});`,
              detail: '触发用户勾选'
            },
            {
              label: '$radio',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$radio({
  title: '',// 标题
  options: [
    {
      label: '',// 单选项
      width: '' ,// 长度 560px即换行
      divider: false // 底部横线
    }
  ]
});`,
              detail: '触发用户单选'
            },
            {
              label: '$message',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$message({
  type: '',// 类型：success warning error info
  content: ''// 内容
});`,
              detail: '触发浏览器上方消息条'
            },
            {
              label: '$notice',
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: `$notice({
  title: '',// 标题
  desc: '',// 内容
  type: '',// 类型：success warning error info
  duration: 5// N秒后自动消失(0为不消失)
});`,
              detail: '触发浏览器右上角通知框'
            }
          ]
        };
      },
      triggerCharacters: ['$']
    });
    window.monaco = monaco;
  }
}
