<template>
  <Card :class="{'ie-login-panel': isIE, 'glass-login-panel': !isIE}" :style="{'--background': bgImgUrl}">
    <div slot="title">
      <table>
        <tbody>
        <tr>
          <td>
            <i class="icon-sgcc animated m-r-15 shadow-10" @dblclick="sgccDblClick"></i>
          </td>
          <td>
            <h2 class="main-title shadow-10">国家电网</h2>
            <h3 class="main-title2 shadow-10">S<small>TATE</small> G<small>RID</small></h3>
          </td>
          <td>
            <div class="m-l-15 shadow-10">
              <h2 class="sub-title m-r-15"
                  :style="{color: title1.color, letterSpacing: title1.letterSpacing, fontSize: title1.fontSize}">
                {{ title1.text }}</h2>
              <h4 class="sub-title2 m-t-5"
                  :style="{color: title2.color, letterSpacing: title2.letterSpacing, fontSize: title2.fontSize}">
                {{ title2.text }}</h4>
            </div>
          </td>
          <td>
              <span style="margin-left: auto"
                    @dblclick="onShowVersion">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
      <transition name="fade" mode="out-in" @after-enter="onTransitionFinish">
        <div class="login-panel-bottom" v-if="loginStep==='account'" key="account-panel">
          <div>
            <table class="login-field-table">
              <tbody>
              <tr>
                <th :class="{'shadow-5': !isIE}" style="font-size: large; width: 100px"
                    :style="{color: isIE ? '#006569' : 'white'}">登录账号
                </th>
                <td class="p-l-4">
                  <Input name="uuusss" type="text" style="display:none"/>
                  <Input v-model="loginData.account" size="large" type="text" @on-enter="onNext"
                         name="uuusss"
                         placeholder="请在此处输入"
                         tabindex="1" ref="username"
                         :maxlength="24">
                  </Input>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: auto; display: flex; align-items: center;">
            <Button type="text" @click="onModifyPassword" ghost class="text-success m-b-0" :class="{'shadow-5': !isIE}"
                    :disabled="loading">
              修改密码
            </Button>
            <Button type="text" v-if="enableRegister" class="text-info" :class="{'shadow-5': !isIE}" ghost
                    @click="onRegisterUser"
                    :disabled="loading">
              新用户注册
            </Button>
            <div style="margin-left: auto">
              <Checkbox v-model="rememberAccount" class="text-warning" :class="{'shadow-5': !isIE}">
                保存账号
              </Checkbox>
              <Button type="primary" @click="onNext" size="large" tabindex="2"
                      class="login-button" :disabled="!loginData.account">
                下一步
                <Icon type="md-arrow-round-forward"/>
              </Button>
            </div>
          </div>
        </div>
        <div class="login-panel-bottom" v-if="loginStep==='password'" key="password-panel">
          <div>
            <table class="login-field-table">
              <tbody>
              <tr>
                <th :class="{'shadow-5': !isIE}" style="font-size: large; width: 100px"
                    :style="{color: isIE ? '#006569' : 'white'}">登录密码
                </th>
                <td class="p-l-4">
                  <Input v-model="loginData.password" size="large" type="password" @on-enter="login"
                         @click.native="onPasswordClick"
                         @on-keydown="onPasswordKeyDown" clearable :placeholder="'请输入' + loginData.account + '的密码'"
                         :readonly="pwdReadonly" @on-keypress="onPasswordKeyPress" ref="password" :maxlength="24">
                  </Input>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: auto; display: flex; justify-content: space-between">
            <Button type="text" class="text-success" :class="{'shadow-5': !isIE}" size="large" ghost @click="onPrev">
              <Icon type="md-arrow-round-back"/>
              上一步
            </Button>
            <Button type="primary" @click="login" size="large" tabindex="1" :disabled="!loginData.password"
                    class="login-button">
              登录
              <Icon type="md-return-left"/>
            </Button>
          </div>
        </div>
      </transition>
  </Card>
</template>

<script>
import sha1 from 'crypto-js/sha1';
import {mapActions, mapGetters, mapMutations} from 'vuex';
import store from 'store';

export default {
  name: 'Security-Login',
  props: {
    requireCaptcha: {
      type: Boolean,
      required: true
    },
    enableRegister: {
      type: Boolean,
      required: true
    },
    title1: {
      type: Object,
      default() {
        return {};
      }
    },
    title2: {
      type: Object,
      default() {
        return {};
      }
    },
    bgImgUrl: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      rememberAccount: false,
      loginStep: 'account',
      loginData: {
        account: '',
        password: '',
        rememberMe: false
      },
      pwdReadonly: true,
      pwdTimeout: null,
      pwdClickCount: 0
    };
  },
  computed: {
    ...mapGetters([
      'getConfigs',
      'getUser',
      'getUserId',
      'isIE',
      'isDebug',
      'isChrome',
      'getIndexPage',
      'getUserRoutes',
      'getUserName'
    ]),
    enableRoot() {
      return this.getConfigs.service.enableRoot;
    }
  },
  mounted() {
    const account = store.get('rememberAccount');
    if (account) {
      this.rememberAccount = true;
      this.loginData.account = account;
    }
    this.$nextTick(() => {
      this.$refs.username.focus();
    });
  },
  beforeDestroy() {
    if (this.pwdTimeout) {
      clearTimeout(this.pwdTimeout);
    }
  },
  methods: {
    ...mapMutations(['setUser', 'clearUser', 'setUserAgent']),
    ...mapActions(['refreshHeaderData']),
    async validateAccount(rule, value, callback) {
      const {data} = await this.$axios.post('/auth/user-check', {
        account: value
      });

      if (!data.exists) {
        callback(new Error('用户不存在'));
        return;
      }

      switch (data.user.status) {
        case 'disabled': {
          callback(new Error('用户被禁止登录'));
          break;
        }
        case 'pwdreset': {
          callback(new Error('请先修改密码后再尝试登录'));
          break;
        }
        case 'warning': {
          callback(new Error('用户状态异常'));
          break;
        }
        default: {
          if (String(value).length > 24) {
            callback(new Error('账号输入过长'));
          } else {
            callback();
          }
          break;
        }
      }
    },
    login() {
      if (this.requireCaptcha) {
        this.$captcha.validate({
          title: '请输入验证码进行安全登录'
        }).then(captcha => {
          this.$emit('login', {
            account: this.loginData.account,
            rawPassword: this.loginData.password,
            password: sha1(this.loginData.password).toString(),
            rememberMe: this.loginData.rememberMe,
            captcha,
            loginType: 'security'
          });
        });
      } else {
        this.$emit('login', {
          account: this.loginData.account,
          rawPassword: this.loginData.password,
          password: sha1(this.loginData.password).toString(),
          rememberMe: this.loginData.rememberMe,
          loginType: 'security'
        });
      }
    },
    sgccDblClick() {
      this.$emit('switch-to-manager');
    },
    onShowVersion() {
      this.$emit('show-version');
    },
    onModifyPassword() {
      this.$emit('modify-password', this.loginData.account);
    },
    onRegisterUser() {
      this.$emit('register-user');
    },
    async onNext() {
      const {data} = await this.$axios.post('/auth/user-check', {
        account: this.loginData.account
      });

      if (!data.exists) {
        this.$Message.error('用户不存在');
        this.$refs.username.focus();
        return;
      }

      switch (data.user.status) {
        case 'disabled': {
          this.$Message.error('用户被禁止登录');
          this.$refs.username.focus();
          return;
        }
        case 'pwdreset': {
          this.$Message.error('请先修改密码后再尝试登录');
          this.$refs.username.focus();
          return;
        }
        case 'warning': {
          this.$Message.error('用户状态异常');
          this.$refs.username.focus();
          return;
        }
        default: {
          this.loginStep = 'password';
          if (this.rememberAccount) {
            store.set('rememberAccount', this.loginData.account);
          } else {
            store.remove('rememberAccount');
          }
          break;
        }
      }
    },
    onPrev() {
      this.loginStep = 'account';
      this.loginData.password = '';
    },
    onTransitionFinish() {
      this.$nextTick(() => {
        if (this.loginStep === 'account') {
          if (!this.rememberAccount) {
            this.loginData.account = '';
          }
          this.$refs.username.focus();
        } else {
          this.$refs.password.focus();
        }
      });
    },
    onPasswordKeyDown($event) {
      if (this.pwdReadonly) {
        if ($event.key === 'Delete') {
          this.loginData.password = '';
        }
        if ($event.key === 'Backspace' && this.loginData.password.length > 0) {
          this.loginData.password = this.loginData.password.substr(0, this.loginData.password.length - 1);
        }
      }
    },
    onPasswordKeyPress($event) {
      // console.log($event);
      if (this.pwdReadonly) {
        if ($event.key.length === 1) {
          this.loginData.password += $event.key;
        }
      }
    },
    onPasswordClick() {
      if (this.pwdReadonly) {
        if (!this.pwdTimeout) {
          this.pwdTimeout = setTimeout(() => {
            this.pwdTimeout = null;
            this.pwdClickCount = 0;
          }, 1200);
        } else {
          clearTimeout(this.pwdTimeout);
          this.pwdTimeout = setTimeout(() => {
            this.pwdTimeout = null;
            this.pwdClickCount = 0;
          }, 1200);
        }

        if (++this.pwdClickCount > 4) {
          this.pwdReadonly = false;
          clearTimeout(this.pwdTimeout);
          this.pwdTimeout = null;
        }
      }
    }
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all .3s ease;
}

.fade-enter, .fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.login-button {
  width: 130px;
}

.login-button:hover {
  background: linear-gradient(rgba(142, 183, 194, 0.8), rgba(0, 101, 105, 0.91));
}

.login-button:active {
  background: linear-gradient(rgba(0, 101, 105, 0.91), rgba(142, 183, 194, 0.8));
}

.ie-login-panel {
  width: 520px;
  height: 250px;
  overflow: hidden;
  box-shadow: 0 0 15px 4px #aaa;
}

.glass-login-panel {
  transition: background-image 2s;
  width: 520px;
  height: 250px;
  overflow: hidden;
  box-shadow: 0 0 15px 4px #aaa;
  z-index: 1;
  background-repeat: no-repeat;
  background-color: rgba(0, 0, 0, 0.3);
}

.shadow-10 {
  text-shadow: white 1px 0 10px;
}

.shadow-5 {
  text-shadow: darkblue 1px 0 5px;
}

.glass-login-panel:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: var(--background);
  background-position: center top;
  background-size: cover;
  background-attachment: fixed;
  -webkit-filter: blur(12px);
  -moz-filter: blur(12px);
  -ms-filter: blur(12px);
  -o-filter: blur(12px);
  filter: blur(12px);
  z-index: -1;
  margin: -10px;
  transition: background-image 2s;
}

.login-field-table {
  table-layout: fixed;
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0 0;
}

.login-panel-bottom {
  display: flex;
  height: 130px;
  flex-direction: column;
  align-content: space-between;
}

.main-title {
  color: #006569;
}

.main-title2 {
  color: #006569;
  font-family: "Times New Roman", serif;
}

.sub-title {
  /*color: #006569;*/
  padding-bottom: 6px;
  border-bottom: 1px solid #006569;
  /*letter-spacing: 3px;*/
  /*font-size: 22px;*/
}

.sub-title2 {
  /*letter-spacing: 4px;*/
  /*font-size: 15px;*/
  /*color: #006569;*/
}

.icon-sgcc {
  font-size: 45px;
  color: #006569;
}

.animated {
  animation: twinkling 14s infinite ease-in-out;
  animation-duration: 14s;
  animation-fill-mode: both;
}

@keyframes twinkling {
  0% {
    color: rgba(0, 77, 80, 0.92);
  }
  50% {
    color: rgba(142, 222, 198, 0.8);
  }
  100% {
    color: rgba(0, 77, 80, 0.92);
  }
}

</style>
