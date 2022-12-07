<template>
  <el-card :class="{'ie-login-panel': isIE, 'glass-login-panel': !isIE}" :style="{'--background': bgImgUrl}">
    <div slot="header">
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
    <div class="login-panel-bottom">
      <el-form ref="loginForm" class="m-t-10" :model="loginData" :rules="loginRule" @submit.native.prevent>
        <el-form-item prop="account">
          <el-input v-model="loginData.account" size="medium" type="text"
                 name="uid"
                 tabindex="1" ref="username"
                 autocomplete="off"
                    clearable
                 :maxlength="24"
                 placeholder="请输入系统登录账号">
            <i slot="prepend" class="fas fa-user"></i>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginData.password"
                 tabindex="2"
                 name="pwd"
                 :maxlength="24"
                    ref="password"
                 autocomplete="off"
                 size="medium" type="password"
                 clearable @keydown.native="onPasswordKeydown"
                 placeholder="请输入密码">
            <i slot="prepend" class="fas fa-lock"></i>
          </el-input>
        </el-form-item>
        <!--          <FormItem prop="rememberMe" class="m-b-0">-->
        <!--            <Checkbox v-model="loginData.rememberMe" tabindex="3" size="small">自动登录</Checkbox>-->
        <!--          </FormItem>-->
        <!--        <FormItem prop="rememberMe">-->
        <!--          <Row>-->
        <!--            <Col span="12">-->
        <!--              <Checkbox v-model="loginData.rememberMe" size="large">自动登录</Checkbox>-->
        <!--            </Col>-->
        <!--            <Col span="12" style="text-align: right">-->
        <!--              <Button :type="isIE ? 'info' : 'text'" ghost @click="modifyPassword">-->
        <!--                修改密码-->
        <!--              </Button>-->
        <!--            </Col>-->
        <!--          </Row>-->
        <!--        </FormItem>-->
        <!--        <FormItem>-->
        <!--          <Button type="primary" @click="login" size="large" long :loading="loading">-->
        <!--            &nbsp;&nbsp;&nbsp;&nbsp;登 录&nbsp;&nbsp;&nbsp;&nbsp;-->
        <!--          </Button>-->
        <!--        </FormItem>-->
      </el-form>
      <div style="margin-top: auto; display: flex; align-items: center;">
        <el-button type="text" @click="onModifyPassword" tabindex="5" ghost class="text-success m-b-0"
                :class="{'shadow-5': !isIE}" :disabled="loading">
          修改密码
        </el-button>
        <el-button type="text" v-if="enableRegister" class="text-info" :class="{'shadow-5': !isIE}" ghost
                @click="onRegisterUser" :disabled="loading">
          新用户注册
        </el-button>
        <el-button type="primary" @click="login" size="large" tabindex="4" style="margin-left: auto" :loading="loading"
                class="login-button">
          登 录
          <i class="fas fa-sign-in" />
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script>
  import sha1 from 'crypto-js/sha1';
  import {mapActions, mapGetters, mapMutations} from 'vuex';

  export default {
    name: 'Common-Login',
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
        loginData: {
          account: '',
          password: '',
          rememberMe: false
        },
        loginRule: {
          account: [
            {
              required: true,
              message: '请输入账号',
              trigger: 'blur'
            },
            {
              validator: this.validateAccount,
              trigger: 'blur'
            }
          ],
          password: [
            {
              required: true,
              message: '请输入密码',
              trigger: 'blur'
            }
          ]
        }
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
      this.$nextTick(() => {
        this.$refs.username.focus();
      });
    },
    methods: {
      ...mapMutations(['setUser', 'clearUser', 'setUserAgent']),
      ...mapActions(['refreshHeaderData']),
      onPasswordKeydown(e) {
        if (e.keyCode === 13) {
          this.login();
        }
      },
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
        this.$refs.loginForm.validate(valid => {
          if (valid) {
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
                  loginType: 'common'
                });
              });
            } else {
              this.$emit('login', {
                account: this.loginData.account,
                rawPassword: this.loginData.password,
                password: sha1(this.loginData.password).toString(),
                rememberMe: this.loginData.rememberMe,
                loginType: 'common'
              });
            }
          } else {
            if (!this.loginData.account) {
              this.$refs.username.focus();
            } else if (!this.loginData.password) {
              this.$refs.password.focus();
            }
          }
        });
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
      }
    }
  };
</script>

<style scoped>
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
    height: 300px;
    overflow: hidden;
    box-shadow: 0 0 15px 4px #aaa;
  }

  .glass-login-panel {
    transition: background-image 2s;
    width: 520px;
    height: 320px;
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

  .login-panel-bottom {
    display: flex;
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
