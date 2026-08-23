import { defineComponent } from 'vue'
import { api } from '../../lib/api'
import { saveAuth, initAuth } from '../../lib/store'
import { openIME, onIMEInput, onIMEState, offIMEInput, offIMEState } from '../../lib/systemIme'

export default defineComponent({
  data() {
    return {
      isRegister: false,
      username: '',
      password: '',
      email: '',
      code: '',
      codeSent: false,
      activeField: '' as string,
      statusText: '',
      loading: false,
    }
  },

  computed: {
    maskPassword(): string {
      return '•'.repeat(this.password.length)
    },
  },

  // 页面生命周期：进入前台时由 BasePage 统一调度，必须定义在选项顶层
  async onShow() {
    await initAuth()
    onIMEInput(this.handleIMEInput)
    onIMEState(this.handleIMEState)
    try {
      await api.getMe()
      $falcon.navTo('page', {})
    } catch {}
  },

  onHide() {
    offIMEInput(this.handleIMEInput)
    offIMEState(this.handleIMEState)
  },

  onUnload() {
    offIMEInput(this.handleIMEInput)
    offIMEState(this.handleIMEState)
  },

  methods: {
    // 系统输入法回传文字：按当前聚焦字段回填
    handleIMEInput(text: string) {
      if (!this.activeField) return
      if (this.activeField === 'username') this.username += text
      else if (this.activeField === 'password') this.password += text
      else if (this.activeField === 'email') this.email += text
      else if (this.activeField === 'code') this.code += text
    },

    // 系统输入法前台/后台状态变化
    handleIMEState(open: boolean) {
      // 输入法退到后台时，清空聚焦（自绘键盘也一并隐藏）
      if (!open) this.activeField = ''
    },

    focusField(field: string) {
      this.activeField = field
      const hintMap: Record<string, string> = {
        username: '输入用户名',
        password: '输入密码',
        email: '输入邮箱',
        code: '输入验证码',
      }
      // 主路径：拉起系统输入法（有道输入法）
      openIME(hintMap[field] || '')
    },

    onInput(char: string) {
      if (this.activeField === 'username') this.username += char
      else if (this.activeField === 'password') this.password += char
      else if (this.activeField === 'email') this.email += char
      else if (this.activeField === 'code') this.code += char
    },

    onBack() {
      if (this.activeField === 'username') this.username = this.username.slice(0, -1)
      else if (this.activeField === 'password') this.password = this.password.slice(0, -1)
      else if (this.activeField === 'email') this.email = this.email.slice(0, -1)
      else if (this.activeField === 'code') this.code = this.code.slice(0, -1)
    },

    onEnter() {
      this.activeField = ''
      this.handleSubmit()
    },

    toggleMode() {
      this.isRegister = !this.isRegister
      this.statusText = ''
      this.code = ''
      this.codeSent = false
    },

    async sendCode() {
      if (!this.email) { this.statusText = '请先输入邮箱'; return }
      if (this.codeSent) return
      this.loading = true
      try {
        await api.sendCode(this.email)
        this.codeSent = true
        this.statusText = '验证码已发送'
      } catch (err: any) {
        this.statusText = err.message
      } finally {
        this.loading = false
      }
    },

    async handleSubmit() {
      if (!this.username || !this.password) {
        this.statusText = '请填写用户名和密码'
        return
      }

      if (this.isRegister) {
        if (!this.email || !this.code) {
          this.statusText = '请填写所有字段'
          return
        }
      }

      this.loading = true
      this.statusText = this.isRegister ? '注册中...' : '登录中...'

      try {
        if (this.isRegister) {
          const data = await api.register(this.username, this.password, this.email, this.code)
          await saveAuth(data.token, data.user)
        } else {
          const data = await api.login(this.username, this.password)
          await saveAuth(data.token, data.user)
        }
        this.statusText = ''
        $falcon.navTo('page', {})
      } catch (err: any) {
        this.statusText = err.message
      } finally {
        this.loading = false
      }
    },
  },
})
