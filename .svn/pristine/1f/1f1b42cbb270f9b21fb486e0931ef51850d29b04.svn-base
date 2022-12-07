import Vue from 'vue';
import Element from 'element-ui';
import locale from 'element-ui/lib/locale/lang/zh-CN';

Element.Dialog.props.closeOnClickModal.default = false;
Element.Dialog.props.closeOnPressEscape.default = false;
Element.MessageBox.setDefaults({ closeOnClickModal: false, closeOnPressEscape: false });
Element.Tooltip.props.enterable = 'false';

const $message = options => {
  const opt = Object.assign({ showClose: true, duration: 6000 }, options);
  return Element.Message(opt);
};

['success', 'warning', 'info', 'error'].forEach(type => {
  $message[type] = options => {
    if (typeof options === 'string') {
      options = {
        message: options,
        showClose: true,
        duration: type === 'success' ? 3000 : 6000
      };
    }
    options.type = type;
    return Element.Message(options);
  };
});

Vue.use(Element, { size: 'small', locale });
Vue.prototype.$message = $message;
