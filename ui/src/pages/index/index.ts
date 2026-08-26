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
      // statusText 自动消失计时器（兜底遮罩，3s 后自动关闭）
      _statusTimer: 0 as any,
    }
  },

  // 页面生命周期：进入前台时由 BasePage 统一调度，必须定义在选项顶层
  async onShow() {
    try {
      await initAuth()
    } catch {
      this.username = ''
      this.password = ''
    }
    if (getToken() && getUser()) {
      $falcon.navTo('page', {})
    }
  },

  methods: {
    // 设置 statusText 错误提示，3s 后自动消失（兜底显示）
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

    // 用 falcon 系统级弹窗显示错误（用户要求：原生窗口）
    // 系统弹窗 100% 可见，不会被任何 UI 元素覆盖
    async showError(title: string, content: string) {
      try {
        if ($falcon?.jsapi?.ui?.showAlert) {
          await ($falcon as any).jsapi.ui.showAlert({
            title,
            content,
            confirmText: '确定',
          })
          return
        }
      } catch (e) { /* native 调用失败 → fallback 兜底 */ }
      // fallback：页面内 statusText 兜底显示
      this.setStatus(`${title}: ${content}`)
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