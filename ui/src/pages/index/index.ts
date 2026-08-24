import { defineComponent } from 'vue'
import { api, showToast, getToken } from '../../lib/api'
import { saveAuth, initAuth, getUser } from '../../lib/store'

export default defineComponent({
  data() {
    return {
      isRegister: false,
      username: '',
      password: '',
      email: '',
      code: '',
      codeSent: false,
      statusText: '',
      loading: false,
      activeField: '' as string,
      keyboardVisible: false,
    }
  },

  // 页面生命周期：进入前台时由 BasePage 统一调度，必须定义在选项顶层
  async onShow() {
    try {
      await initAuth()
    } catch {
      // 初始化失败不致命，清空本地状态继续等用户输入
      this.username = ''
      this.password = ''
    }
    // 仅当本地已有 token 和 user 时才自动跳到聊天页，避免与用户点登录的 handleSubmit 抢时序：
    // 旧实现每次 onShow 都调 api.getMe()，如果 token 有效，await 完成瞬间会 navTo('page')
    // 把用户跳走，此时用户刚点的 handleSubmit 还在 await api.login，登录结果被丢弃，用户感觉"没反应"。
    // 现在改为：只在本地缓存有效（已登录）时才跳，否则停在登录页等用户输入。
    if (getToken() && getUser()) {
      $falcon.navTo('page', {})
    }
  },

  methods: {
    // 点击输入框：记录聚焦字段并弹出自绘键盘（系统输入法在此运行时不自动弹）
    focusField(field: string) {
      this.activeField = field
      this.keyboardVisible = true
    },

    closeKeyboard() {
      this.keyboardVisible = false
      this.activeField = ''
    },

    // 键盘上屏一个字符/汉字：回填到当前聚焦字段
    onKeyboardInput(ch: string) {
      if (this.activeField === 'username') this.username += ch
      else if (this.activeField === 'password') this.password += ch
      else if (this.activeField === 'email') this.email += ch
      else if (this.activeField === 'code') this.code += ch
    },

    // 键盘退格：删除当前聚焦字段最后一个字符
    onKeyboardBack() {
      if (this.activeField === 'username') this.username = this.username.slice(0, -1)
      else if (this.activeField === 'password') this.password = this.password.slice(0, -1)
      else if (this.activeField === 'email') this.email = this.email.slice(0, -1)
      else if (this.activeField === 'code') this.code = this.code.slice(0, -1)
    },

    // 键盘「确定」：收起自绘键盘并清空聚焦字段
    onKeyboardConfirm() {
      this.keyboardVisible = false
      this.activeField = ''
    },

    toggleMode() {
      this.isRegister = !this.isRegister
      this.statusText = ''
      this.code = ''
      this.codeSent = false
    },

    async sendCode() {
      if (!this.email) { this.statusText = '请先输入邮箱'; showToast('请先输入邮箱'); return }
      if (this.codeSent) return
      this.loading = true
      try {
        await api.sendCode(this.email)
        this.codeSent = true
        this.statusText = '验证码已发送'
        showToast('验证码已发送')
      } catch (err: any) {
        this.statusText = err.message
        showToast(err.message || '发送失败')
      } finally {
        this.loading = false
      }
    },

    async handleSubmit() {
      if (!this.username || !this.password) {
        this.statusText = '请填写用户名和密码'
        showToast('请填写用户名和密码')
        return
      }

      if (this.isRegister) {
        if (!this.email || !this.code) {
          this.statusText = '请填写所有字段'
          showToast('请填写所有字段')
          return
        }
      }

      this.loading = true
      this.statusText = this.isRegister ? '注册中...' : '登录中...'
      showToast(this.isRegister ? '注册中...' : '登录中...')

      try {
        if (this.isRegister) {
          const data = await api.register(this.username, this.password, this.email, this.code)
          await saveAuth(data.token, data.user)
          this.statusText = '注册成功'
          showToast('注册成功')
        } else {
          const data = await api.login(this.username, this.password)
          await saveAuth(data.token, data.user)
          this.statusText = '登录成功'
          showToast('登录成功')
        }
        this.statusText = ''
        $falcon.navTo('page', {})
      } catch (err: any) {
        this.statusText = err.message || '操作失败'
        showToast(err.message || '操作失败')
      } finally {
        this.loading = false
      }
    },
  },
})
