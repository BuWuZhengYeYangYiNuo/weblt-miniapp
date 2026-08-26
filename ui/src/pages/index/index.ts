import { defineComponent } from 'vue'
import { api, getToken } from '../../lib/api'
import { saveAuth, initAuth, getUser } from '../../lib/store'
import {
  openSystemKeyboard,
  onSystemInputResult,
  consumeKeyboardResultFromOptions,
  onEventLog,
  SysImeLogEntry,
} from '../../lib/system-ime'

// 兼容老 API（chat 页 import startSystemKeyboard from '../index/index'）
export { startSystemKeyboard } from '../../lib/system-ime'

export default defineComponent({
  data() {
    return {
      username: '',
      password: '',
      statusText: '',
      loading: false,
      // IME 结果
      imeResult: null as { text: string; source: string; raw?: any } | null,
      // 实时事件流（$falcon.on 触发的所有事件都记在这里，便于排查回传渠道）
      imeEventLog: [] as SysImeLogEntry[],
      // 当前激活的 IME 字段
      _activeImeField: '' as 'username' | 'password' | '',
      // 调试面板开关
      showDebug: false,
      // statusText 自动消失计时器
      _statusTimer: 0 as any,
    }
  },

  async onLoad(options?: any) {
    try {
      await initAuth()
    } catch {
      this.username = ''
      this.password = ''
    }
    onSystemInputResult((r) => {
      this.imeResult = r
    })
    onEventLog((log) => {
      this.imeEventLog = log.slice()
    })
    consumeKeyboardResultFromOptions(options)
  },

  async onNewOptions(options?: any) {
    // navTo 重新启动此页时（比如关闭子 app 回到本 page），options 里可能有 IME 结果
    consumeKeyboardResultFromOptions(options)
  },

  // onShow 现在由 base-page.js 转发，签名 (options?: any) 以接收框架传回的 options
  async onShow(options?: any) {
    try {
      await initAuth()
    } catch {
      this.username = ''
      this.password = ''
    }

    // 注册系统输入法结果监听（一次性）
    onSystemInputResult((r) => {
      // 全屏置顶展示收到的文本
      this.imeResult = r
    })
    onEventLog((log) => {
      this.imeEventLog = log.slice()
    })

    // navTo 返回时框架把结果放在 onShow options 里（渠道 A：onShow:options）
    consumeKeyboardResultFromOptions(options)

    if (getToken() && getUser()) {
      $falcon.navTo('page', {})
    }
  },

  onHide() {
    // 用户切走时清理 IME 面板避免页面回来时残留
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

    // 调起系统输入法（用于登录）：把 username 字段当前值传进去
    openImeFor(field: 'username' | 'password') {
      this._activeImeField = field
      openSystemKeyboard({
        contents: field === 'username' ? this.username : this.password,
        uuid: 'login-' + field + '-' + Date.now(),
        maxLength: field === 'password' ? 50 : 30,
      })
    },

    // 应用 IME 结果到对应字段
    applyImeResult(field: 'username' | 'password') {
      if (!this.imeResult) return
      if (field === 'username') this.username = this.imeResult.text
      else this.password = this.imeResult.text
      this.imeResult = null
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

    dismissImeResult() {
      this.imeResult = null
    },
  },
})
