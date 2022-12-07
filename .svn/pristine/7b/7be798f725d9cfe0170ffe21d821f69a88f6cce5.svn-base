<template>
  <div class="login-background" :style="{backgroundImage: bgImgUrl}">
    <span style="position:absolute;left:0;top:0" @dblclick="onHiddenClick(2)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <span style="position:absolute;right:0;top:0" @dblclick="onHiddenClick(1)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <span style="position:absolute;right:0;bottom:0" @dblclick="onHiddenClick(4)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <span style="position:absolute;left:0;bottom:0" @dblclick="onHiddenClick(3)">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <common-login :title1="title1" :title2="title2" :bg-img-url="bgImgUrl" :loading="loading"
                  :enable-register="enableRegister" :require-captcha="commonCaptchaRequired"
                  @login="onLogin"
                  @switch-to-manager="switchToUserManager"
                  @modify-password="modifyPassword"
                  @register-user="registerUser"
                  @show-version="showVersion"></common-login>
    <el-drawer title="系统升级日志" width="620" :visible.sync="versionDialog.visible">
      <p>代码版本：{{ versionDialog.version }}</p>
      <p>发布时间：{{ versionDialog.time }}</p>
      <p>发布日志：<span
          style="vertical-align: top; white-space: pre-line; display: inline-block">{{ versionDialog.log }}</span></p>
      <el-divider />
      <div v-html="versionDialog.releaseNotes"></div>
    </el-drawer>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations} from 'vuex';
  import * as marked from 'marked';
  import sha1 from 'crypto-js/sha1';
  import {decode} from 'urlencode';
  import store from 'store';
  import CommonLogin from '@/components/login/Common';

  export default {
    name: 'topic-login',
    head() {
      return {
        title: '登录',
        meta: [
          {'http-equiv': 'Cache-Control', content: 'no-cache'},
          {'http-equiv': 'Pragma', content: 'no-cache'}
        ]
      };
    },
    layout: 'empty',
    components: {
      CommonLogin
    },
    data() {
      const vm = this;
      return {
        versionDialog: {
          visible: false,
          version: '',
          time: '',
          log: '',
          releaseNotes: ''
        },
        bgImgUrlPrev: '',
        bgImgUrl: '',
        imageId: '',
        focused: false,
        autoLoginModalVisible: false,
        departmentTree: [],
        departments: [],
        loading: false,
        modifyPasswordDialog: {
          visible: false,
          forget: false,
          loading: false
        },
        modifyPasswordFormData: {
          account: '',
          oldPassword: '',
          newPassword: '',
          newPassword2: ''
        },
        modifyPasswordFormRule: {
          account: [
            {required: true, message: '请输入账号', trigger: 'blur'},
            {
              validator(rule, value, callback) {
                if (value === 'root') {
                  callback(new Error('无权限进行该操作'));
                  return;
                }
                vm.$axios.post('/auth/user-check', {
                  account: value
                }).then(({data}) => {
                  if (!data.exists) {
                    callback(new Error('用户不存在'));
                  } else {
                    if (data.user.status === 'pwdreset') {
                      vm.modifyPasswordDialog.forget = true;
                    }
                    callback();
                  }
                }).catch(err => {
                  callback(err);
                });
              },
              trigger: 'blur'
            }
          ],
          oldPassword: [
            {
              validator(rule, value, callback) {
                if (vm.modifyPasswordDialog.forget) {
                  callback();
                } else {
                  if (value.length <= 0) {
                    callback(new Error('请输入正确的密码'));
                    return;
                  }
                  vm.$axios.post('/auth/password-check', {
                    account: vm.modifyPasswordFormData.account,
                    password: sha1(value).toString()
                  }).then(({data}) => {
                    if (data.succ) {
                      callback();
                    } else {
                      callback(new Error(data.message));
                    }
                  }).catch(err => {
                    callback(err);
                  });
                }
              },
              trigger: 'blur'
            }
          ],
          newPassword: [
            {required: true, message: '请输入新密码', trigger: 'blur'},
            {
              type: 'string',
              min: 4,
              message: '密码不可少于4位',
              trigger: 'blur'
            },
            {
              validator(rule, value, callback) {
                if (!vm.modifyPasswordDialog.forget && value === vm.modifyPasswordFormData.oldPassword) {
                  callback(new Error('新旧密码不可相同'));
                } else {
                  if (vm.pwdCheckRegex) {
                    const reg = new RegExp(vm.pwdCheckRegex, 'g');
                    if (!reg.test(value)) {
                      callback(new Error(vm.pwdCheckMessage || '密码复杂度过低'));
                    } else {
                      callback();
                    }
                  } else {
                    callback();
                  }
                }
              },
              trigger: 'blur'
            }
          ],
          newPassword2: [
            {
              validator(rule, value, callback) {
                if (vm.modifyPasswordFormData.newPassword !== value) {
                  callback(new Error('两次输入的密码不一致'));
                } else {
                  callback();
                }
              },
              trigger: 'blur'
            }
          ]
        },
        registerDialog: {
          loading: false,
          visible: false,
          accountChanged: false,
          captchaSvg: ''
        },
        registerFormData: {
          name: '',
          account: '',
          departments: [],
          departmentNames: '',
          viewSelfDepartment: '',
          password: '',
          password2: '',
          captcha: ''
        },
        registerFormRule: {
          name: [{required: true, message: '请输入用户姓名', trigger: 'blur'}],
          account: [
            {required: true, message: '请输入登录账号', trigger: 'blur'},
            {
              validator(rule, value, callback) {
                if (value === 'root') {
                  callback(new Error('该账号不允许注册'));
                  return;
                }
                vm.$axios.post('/auth/user-check', {
                  account: value
                }).then(({data}) => {
                  if (data.exists) {
                    callback(new Error('登录账号已存在'));
                  } else {
                    callback();
                  }
                }).catch(err => {
                  callback(err);
                });
              },
              trigger: 'blur'
            }
          ],
          departments: [
            {
              validator(rule, value, callback) {
                if (!Array.isArray(value) || value.length === 0) {
                  callback(new Error('隶属单位不可为空'));
                } else {
                  callback();
                }
              },
              trigger: 'blur'
            }
          ],
          password: [
            {required: true, message: '请输入密码', trigger: 'blur'},
            {
              validator(rule, value, callback) {
                if (!value) {
                  callback(new Error('密码不可为空'));
                  return;
                }
                if (String(value).length < 4) {
                  callback(new Error('密码不可少于4个字符'));
                  return;
                }
                if (vm.pwdCheckRegex) {
                  const reg = new RegExp(vm.pwdCheckRegex, 'g');
                  if (!reg.test(value)) {
                    callback(new Error(vm.pwdCheckMessage || '密码复杂度过低'));
                  } else {
                    callback();
                  }
                } else {
                  callback();
                }
              },
              trigger: 'blur'
            }
          ],
          password2: [
            {
              validator(rule, value, callback) {
                if (vm.registerFormData.password !== value) {
                  callback(new Error('两次输入的密码不一致'));
                } else {
                  callback();
                }
              },
              trigger: 'blur'
            }
          ],
          captcha: [
            {
              required: true,
              message: '请输入验证码',
              trigger: 'blur'
            },
            {
              validator(rule, value, callback) {
                vm.$axios.post('/auth/validate-captcha', {
                  captcha: value
                }).then(({data}) => {
                  if (data.succ) {
                    callback();
                  } else {
                    callback(new Error(data.message));
                    vm.onRegisterCaptchaRefresh();
                    vm.registerFormData.captcha = '';
                    vm.$nextTick(() => {
                      vm.$refs.registerCaptchaInput.focus();
                    });
                  }
                }).catch(err => {
                  callback(err);
                });
              },
              trigger: 'blur'
            }
          ]
        },
        hiddenIndexes: [],
        hiddenTimeout: null,
        bgImgInterval: null,
        is102: false,
        loginDisallow: '',
        registerCaptchaTimeout: null
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
    async asyncData({$axios, query, error}) {
      try {
        const {data: loginConfigs} = await $axios.get('/resource/login-configs');
        const routePaths = loginConfigs.routePaths;
        return {
          bgInterval: loginConfigs.bgInterval,
          imageIds: loginConfigs.bgImageIds || [],
          title1: loginConfigs.title1,
          title2: loginConfigs.title2,
          pwdCheckRegex: loginConfigs.pwdCheckRegex,
          pwdCheckMessage: loginConfigs.pwdCheckMessage,
          internetDisallow: loginConfigs.internetDisallow,
          enableRegister: loginConfigs.enableRegister,
          loginType: loginConfigs.loginType,
          securityCaptchaRequired: loginConfigs.securityCaptchaRequired,
          commonCaptchaRequired: loginConfigs.commonCaptchaRequired,
          adminUserCount: loginConfigs.loginType,
          redirect: query && query.redirect && routePaths.includes(query.redirect) ? query.redirect : '',
          username: query.username,
          password: query.password
        };
      } catch (err) {
        error({
          statusCode: 500,
          message: JSON.stringify(err)
        });
      }
    },
    async mounted() {
      if (this.internetDisallow) {
        const internet = await this.pingInternet();
        if (internet === 'success') {
          this.loginDisallow = '检测到您的设备与Internet外网有连接，禁止登录本系统';
          return;
        } else {
          this.loginDisallow = '';
        }
      }
      this.is102 = this.isDebug || location.hostname === '192.168.1.101' || location.hostname === '192.168.1.102' || location.hostname === '192.168.1.103';
      this.setUserAgent(navigator.userAgent);
      if (this.imageIds.length > 0) {
        this.imageId = this.imageIds[0];
        const width = $(window).width();
        this.bgImgUrl = `url(/resource/image/${this.imageId}/${width})`;
        if (this.imageIds.length > 1) {
          let index = 0;

          this.bgImgInterval = setInterval(() => {
            if (++index >= this.imageIds.length) {
              index = 0;
            }
            this.imageId = this.imageIds[index];
            const url = `/resource/image/${this.imageId}/${width}`;
            const img = new Image();
            img.src = url;
            img.onload = () => {
              this.bgImgUrl = `url(${url})`;
            };
          }, this.bgInterval);
        }
      }

      if (this.username) {
        try {
          this.autoLoginModalVisible = true;
          const {data} = await this.$axios.post('/auth/user-check', {
            account: this.username
          });

          if (data.exists) {
            await this.autoLoginByAccountAndPassword();
          } else {
            await this.autoLoginByUsername();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setTimeout(() => {
            this.autoLoginModalVisible = false;
          }, 1400);
        }
      }
    },
    beforeDestroy() {
      if (this.hiddenTimeout) {
        clearTimeout(this.hiddenTimeout);
        this.hiddenTimeout = null;
      }
      if (this.bgImgInterval) {
        clearInterval(this.bgImgInterval);
        this.bgImgInterval = null;
      }
      if (this.registerCaptchaTimeout) {
        clearTimeout(this.registerCaptchaTimeout);
        this.registerCaptchaTimeout = null;
      }
    },
    methods: {
      ...mapMutations(['setUser', 'clearUser', 'setUserAgent']),
      ...mapActions(['refreshHeaderData']),
      setHiddenTimeout() {
        if (this.hiddenTimeout) {
          clearTimeout(this.hiddenTimeout);
        }
        this.hiddenTimeout = setTimeout(() => {
          this.hiddenIndexes = [];
          this.hiddenTimeout = null;
        }, 4000);
      },
      pingInternet() {
        function pingUrl(url) {
          return new Promise(resolve => {
            const p = new window.Ping();
            p.ping(url, (err, data) => {
              if (err) {
                resolve('failed');
              } else {
                resolve('success');
              }
            });
          });
        }

        return pingUrl('https://www.baidu.com');
      },
      getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
      },
      onHiddenClick(i) {
        this.hiddenIndexes.push(i);
        if (this.hiddenIndexes.join(',') === '1,2,3,4,1') {
          this.hiddenIndexes = [];
          if (this.enableRoot) {
            this.switchToUserManager();
          } else {
            const magicNumber = this.getRandom(1, 10);
            this.$input.show('请求进入维护模式', '请输入第' + magicNumber + '个维护密码').then(({value}) => {
              this.switchToUserManager(magicNumber, value);
            });
          }
        }
        this.setHiddenTimeout();
      },
      modifyPassword(account) {
        this.modifyPasswordDialog.visible = true;
        this.$refs.modifyPasswordForm.resetFields();
        this.modifyPasswordFormData.account = account;
        this.$refs.modifyPasswordForm.validateField('account');
      },
      async showVersion() {
        try {
          // const marked = require('marked/marked.min.js');
          const {data} = await this.$axios.get('/resource/version');
          if (data.succ) {
            this.versionDialog.version = data.info.version;
            this.versionDialog.time = data.info.time;
            this.versionDialog.log = data.info.log;
            this.versionDialog.releaseNotes = marked.parse(data.releaseNotes);
            this.versionDialog.visible = true;
          } else {
            this.$message.error(data.message);
          }
        } catch (err) {
          console.error(err);
          this.$message.error(err.message);
        }
      },
      doChangePassword() {
        this.$refs.modifyPasswordForm.validate(async value => {
          if (value) {
            try {
              this.modifyPasswordDialog.loading = true;
              const {data} = await this.$axios.put('/auth/reset-password', {
                account: this.modifyPasswordFormData.account,
                password: sha1(this.modifyPasswordFormData.oldPassword).toString(),
                newPassword: sha1(this.modifyPasswordFormData.newPassword).toString()
              });
              if (data.succ) {
                this.$message.success('密码修改成功！');
                setTimeout(() => {
                  this.modifyPasswordDialog.visible = false;
                }, 1000);
              } else {
                this.$message.error('修改密码失败，' + data.message);
              }
            } catch (err) {
              console.error(err);
              this.$message.error('修改密码失败，' + err.message);
            } finally {
              setTimeout(() => {
                this.modifyPasswordDialog.loading = false;
              }, 1200);
            }
          }
        });
      },
      doRegister() {
        this.$refs.registerForm.validate(async value => {
          if (value) {
            try {
              this.registerDialog.loading = true;
              const {data} = await this.$axios.post('/auth/register-user', {
                name: this.registerFormData.name,
                status: 'disabled',
                departments: this.registerFormData.departments,
                account: this.registerFormData.account.trim(),
                password: sha1(this.registerFormData.password).toString(),
                captcha: this.registerFormData.captcha,
                viewSelfDepartment: this.registerFormData.viewSelfDepartment
              });
              if (data.succ && data.userId) {
                this.$message.success('用户注册成功！请联系管理员进行启用后即可登录系统');
                setTimeout(() => {
                  this.registerDialog.visible = false;
                }, 1000);
              } else {
                this.$message.error('用户注册失败，' + data.message);
              }
            } catch (err) {
              console.error(err);
              this.$message.error('用户注册失败，' + err.message);
            } finally {
              setTimeout(() => {
                this.registerDialog.loading = false;
              }, 1200);
            }
          }
        });
      },
      async onRegisterCaptchaRefresh() {
        const {data: captcha} = await this.$axios.get('/auth/captcha', {responseType: 'text'});
        this.registerDialog.captchaSvg = captcha;
        if (this.registerCaptchaTimeout) {
          clearTimeout(this.registerCaptchaTimeout);
        }
        this.registerCaptchaTimeout = setTimeout(() => {
          this.onRegisterCaptchaRefresh();
        }, 290 * 1000);
      },
      onRegisterDialogVisibleChange(visible) {
        if (!visible) {
          this.registerDialog.captchaSvg = '';
          if (this.registerCaptchaTimeout) {
            clearTimeout(this.registerCaptchaTimeout);
            this.registerCaptchaTimeout = null;
          }
        }
      },
      async registerUser() {
        try {
          this.registerDialog.loading = true;
          this.registerDialog.accountChanged = false;
          this.registerFormData.viewSelfDepartment = 'inherit';
          if (this.departments.length === 0) {
            const {data: array} = await this.$axios.get('/sys/departments');
            this.departments = array;
            const {data: tree} = await this.$axios.get('/sys/department-tree');
            this.departmentTree = tree;
          }

          this.$refs.registerForm.resetFields();
          this.onRegisterCaptchaRefresh().then();
          this.registerDialog.visible = true;
          this.$nextTick(() => {
            this.$refs.registerNameInput.focus();
          });
        } catch (e) {
          console.error(e);
        } finally {
          this.registerDialog.loading = false;
        }
      },
      async autoLoginByAccountAndPassword() {
        const {data} = await this.$axios.post('/auth/login', {
          account: decode(this.username),
          password: sha1(this.password || '111111').toString(),
          clientTime: Date.now(),
          userAgent: navigator.userAgent
        });
        if (data.succ) {
          this.setUser({
            id: data.userId,
            token: data.sessionKey,
            departments: data.departments,
            auths: data.auths,
            roles: data.roles
          });
          this.$socket.emit('setUserInfo', this.getUser);
          await this.refreshHeaderData();
          if (this.redirect) {
            const found = this.getUserRoutes.find(x => x.path === this.redirect);
            if (found) {
              this.$router.push({name: found.name});
            }
          } else {
            const found = this.getUserRoutes.find(x => x.name === this.getIndexPage);
            if (found) {
              this.$router.push({name: found.name});
            } else {
              if (this.getIndexPage !== 'index') {
                this.$notify.warning({
                  title: '自动跳转失败',
                  message: '当前用户"' + this.getUserName + '"所在的顶层用户组未配置"' + this.getIndexPage + '"页面'
                });
              }

              this.$router.push({name: 'index'});
            }
          }
        } else {
          this.$message.error('自动登录失败，' + data.message);
        }
      },
      async autoLoginByUsername() {
        const {data} = await this.$axios.post('/auth/login-by-username', {
          username: decode(this.username),
          clientTime: Date.now()
        });
        if (data.succ) {
          this.setUser({
            id: data.userId,
            token: data.sessionKey,
            departments: data.departments,
            auths: data.auths,
            roles: data.roles
          });
          this.$socket.emit('setUserInfo', this.getUser);
          await this.refreshHeaderData();
          if (this.redirect) {
            const found = this.getUserRoutes.find(x => x.path === this.redirect);
            if (found) {
              this.$router.push({name: found.name});
            }
          } else {
            const found = this.getUserRoutes.find(x => x.name === this.getIndexPage);
            if (found) {
              this.$router.push({name: found.name});
            } else {
              if (this.getIndexPage !== 'index') {
                this.$notify.warning({
                  title: '自动跳转失败',
                  message: '当前用户"' + this.getUserName + '"所在的顶层用户组未配置"' + this.getIndexPage + '"页面'
                });
              }

              this.$router.push({name: 'index'});
            }
          }
        } else {
          this.$message.error('自动登录失败，' + data.message);
        }
      },
      async switchToUserManager(magicNumber, magicPassword) {
        try {
          this.loading = true;
          if (!magicPassword && !this.enableRoot && this.adminUserCount > 0) {
            return;
          }
          const {data} = await this.$axios.post('/auth/login', {
            account: 'root',
            password: sha1('root').toString(),
            clientTime: Date.now(),
            userAgent: navigator.userAgent,
            magicNumber,
            magicPassword
          });

          if (data.succ) {
            this.setUser({
              id: data.userId,
              token: data.sessionKey,
              departments: data.departments,
              auths: data.auths,
              roles: data.roles
            });
            this.$socket.emit('setUserInfo', this.getUser);
            await this.refreshHeaderData();
            this.$router.push({name: 'manage-user'});
          } else {
            this.$message.error('登录失败：' + data.message);
          }
        } catch (err) {
          console.error(err);
          this.$message.error(err.message);
        } finally {
          this.loading = false;
        }
      },
      async generateAccount() {
        if (!this.registerDialog.accountChanged) {
          if (this.registerFormData.name.length > 0) {
            const {data} = await this.$axios.post('/sys/pinyin', {
              chinese: this.registerFormData.name.substr(0, 1)
            });
            let account = data;
            if (this.registerFormData.name.length > 1) {
              const {data: firstletter} = await this.$axios.post('/sys/firstletter', {
                chinese: this.registerFormData.name.substr(1)
              });
              account += firstletter ? String(firstletter).toLowerCase() : '';
            }

            this.registerFormData.account = account;
          } else {
            this.registerFormData.account = '';
          }
        }
      },
      async onLogin({rawPassword, account, password, rememberMe, captcha, loginType}) {
        // console.log('用户登录: account[' + account + '], password[' + rawPassword + ']');
        // this.$message.close();
        try {
          this.loading = true;
          const {data} = await this.$axios.post('/auth/login', {
            account,
            password,
            rememberMe,
            captcha,
            loginType,
            clientTime: Date.now(),
            userAgent: navigator.userAgent
          });
          if (data.succ) {
            if (this.pwdCheckRegex) {
              const reg = new RegExp(this.pwdCheckRegex, 'g');
              if (!reg.test(rawPassword)) {
                console.warn(this.pwdCheckMessage || '密码复杂度过低');
                const lastDisableDate = store.get('pwdNoticeDisableDate');
                const days = lastDisableDate ? this.$moment(lastDisableDate).diff(this.$moment(), 'days') : 100;
                if (days > 7) {
                  this.$notify.warning({
                    title: '您的密码不符合安全规范',
                    message: this.pwdCheckMessage
                  });
                }
              }
            }
            this.setUser({
              id: data.userId,
              token: data.sessionKey,
              departments: data.departments,
              auths: data.auths,
              roles: data.roles
            });
            this.$socket.emit('setUserInfo', this.getUser);
            await this.refreshHeaderData();
            if (this.redirect) {
              const found = this.getUserRoutes.find(x => x.path === this.redirect);
              if (found) {
                this.$router.push({name: found.name});
              }
            } else {
              const found = this.getUserRoutes.find(x => x.name === this.getIndexPage);
              if (found) {
                this.$router.push({name: found.name});
              } else {
                if (this.getIndexPage !== 'index') {
                  this.$notify.warning({
                    title: '自动跳转失败',
                    message: '当前用户"' + this.getUserName + '"所在的顶层用户组未配置"' + this.getIndexPage + '"页面'
                  });
                }

                this.$router.push({name: 'index'});
              }
            }
          } else {
            this.$message.error('登录失败：' + data.message);
          }
        } catch (err) {
          this.$message.error('登录错误：' + err.message);
          console.error(err);
        } finally {
          setTimeout(() => {
            this.loading = false;
          }, 1400);
        }
      },
      disableWeeklyNotice() {
        store.set('pwdNoticeDisableDate', Date.now());
        this.$notify.close();
      }
    }
  };
</script>

<style scoped>
  .login-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgb(0, 101, 105), rgba(252, 253, 254, 0.47));
    background-position: center top;
    background-size: cover;
    background-attachment: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-image 2s;
  }
</style>
