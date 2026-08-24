import { defineComponent } from 'vue'
import { api } from '../../lib/api'
import { saveAuth, initAuth } from '../../lib/store'
import { startScanInput, onScanInput } from '../../lib/scanInput'

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
      _scanUnbind: null as null | (() => void),
    }
  },

  // 页面生命周期：进入前台时由 BasePage 统一调度，必须定义在选项顶层
  async onShow() {
    await initAuth()
    this._scanUnbind = onScanInput(this.handleScanInput)
    try {
      await api.getMe()
      $falcon.navTo('page', {})
    } catch {}
  },

  onHide() {
    if (this._scanUnbind) {
      this._scanUnbind()
      this._scanUnbind = null
    }
  },

  onUnload() {
    if (this._scanUnbind) {
      this._scanUnbind()
      this._scanUnbind = null
    }
  },

  methods: {
    // ScanInput 回传的输入文字：按当前聚焦字段回填
    handleScanInput(text: string) {
      if (this.activeField === 'username') this.username += text
      else if (this.activeField === 'password') this.password += text
      else if (this.activeField === 'email') this.email += text
      else if (this.activeField === 'code') this.code += text
    },

    // 点击输入框：记录聚焦字段并拉起系统软键盘（原生 input 不会自动弹）
    focusField(field: string) {
      this.activeField = field
      startScanInput()
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
