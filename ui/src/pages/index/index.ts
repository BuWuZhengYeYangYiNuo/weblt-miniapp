import { defineComponent } from 'vue'
import { api, getToken } from '../../lib/api'
import { saveAuth, initAuth, getUser } from '../../lib/store'

export default defineComponent({
  data() {
    return {
      username: '',
      password: '',
      statusText: '',
      loading: false,
      // 自绘键盘：显示开关
      showKeyboard: false,
      // 自绘键盘目标字段：'username' | 'password'
      keyboardTarget: 'username' as 'username' | 'password',
      // statusText 自动消失计时器
      _statusTimer: 0 as any,
    }
  },

  async onLoad() {
    try {
      await initAuth()
    } catch {
      this.username = ''
      this.password = ''
    }
  },

  // onShow 现在由 base-page.js 转发，签名 (options?: any) 以接收框架传回的 options
  async onShow(options?: any) {
    try {
      await initAuth()
    } catch {
      this.username = ''
      this.password = ''
    }

    // navTo 回栈底时把字段填回去（如果 webblt 被框架重启并传了 IME 结果）
    if (options && options.field && typeof options.text === 'string') {
      if (options.field === 'username') this.username = options.text
      else if (options.field === 'password') this.password = options.text
    }

    if (getToken() && getUser()) {
      $falcon.navTo('page', {})
    }
  },

  methods: {
    setStatus(text: string) {
      this.statusText = text
      if (this._statusTimer) {
        clearTimeout(this._statusTimer)
        this._statusTimer = 0
      }
      this._statusTimer = setTimeout(() => {
        this.statusText = ''
        this._statusTimer = 0
      }, 3000)
    },

    async showError(title: string, content: string) {
      try {
        if ($falcon?.jsapi?.ui?.showAlert) {
          await ($falcon as any).jsapi.ui.showAlert({ title, content, confirmText: '确定' })
          return
        }
      } catch (e) { /* fallback */ }
      this.setStatus(`${title}: ${content}`)
    },

    // 打开自绘键盘（点用户名/密码行触发）
    openKeyboard(field: 'username' | 'password') {
      this.keyboardTarget = field
      this.showKeyboard = true
    },

    // 自绘键盘 emit input（一个字符）
    onKbInput(ch: string) {
      if (this.keyboardTarget === 'username') this.username += ch
      else this.password += ch
    },

    // 自绘键盘 emit backspace
    onKbBack() {
      if (this.keyboardTarget === 'username') this.username = this.username.slice(0, -1)
      else this.password = this.password.slice(0, -1)
    },

    // 自绘键盘 emit enter（提交登录）
    onKbEnter() {
      this.showKeyboard = false
      this.handleSubmit()
    },

    // 自绘键盘 emit confirm（点"确定"，只关键盘）
    onKbConfirm() {
      this.showKeyboard = false
    },

    async handleSubmit() {
      if (this.loading) return
      if (!this.username || !this.password) {
        await this.showError('提示', '请填写用户名和密码')
        return
      }

      this.loading = true
      this.setStatus('登录中...')

      try {
        const data = await api.login(this.username, this.password)
        await saveAuth(data.token, data.user)
        this.setStatus('登录成功')
        setTimeout(() => {
          this.statusText = ''
          $falcon.navTo('page', {})
        }, 500)
      } catch (err: any) {
        await this.showError('登录失败', err.message || '操作失败')
      } finally {
        this.loading = false
      }
    },
  },
})