import { defineComponent } from 'vue'
import { api, getToken } from '../../lib/api'
import { saveAuth, initAuth, getUser } from '../../lib/store'

// ScanInput 系统软键盘 - 抄自 jsapi/src/ScanInput/ScanInput.cpp:69
//   void ScanInput::showKeyboard()
//   {
//       system("miniapp_cli start 8001145142333001 softKeyboard");
//   }
// 这是词典笔 OS 自带的系统级软键盘 app，比自绘键盘和 native input 都稳。
// 流程：
//   1. ScanInput.initialize() 启动 native 线程轮询 history.db
//   2. 用户在系统软键盘输入完成 → softKeyboard app 写 history.db
//   3. native 线程发现新数据 → publish('scan_input', str) → 前端 $falcon.on('scan_input') 收到
//   4. 前端把字符追加到 input 框

let _scanInputInited = false
let _scanInputHandler: any = null

export function startSystemKeyboard(onChar: (ch: string) => void) {
  try {
    if (!$falcon?.jsapi?.ScanInput) {
      console.warn('[kb] ScanInput module not available, fallback to native input')
      return false
    }
    // 不管之前是否注册过，都先解除旧 handler（防止 $falcon.on 累积）
    if (_scanInputHandler) {
      try { $falcon.off('scan_input', _scanInputHandler) } catch {}
      _scanInputHandler = null
    }
    // 注册新 handler：native 软键盘每输入一个字符 publish('scan_input', data) 都会触发
    _scanInputHandler = (data: any) => {
      try {
        // data 可能是字符串，也可能是 {text/word/data} 包装对象，统一抽取
        let s = ''
        if (typeof data === 'string') s = data
        else if (data && typeof data.text === 'string') s = data.text
        else if (data && typeof data.word === 'string') s = data.word
        else if (data && typeof data.data === 'string') s = data.data
        else if (data) s = String(data)
        if (s) onChar(s)
      } catch (e) { /* ignore */ }
    }
    $falcon.on('scan_input', _scanInputHandler)
    if (!_scanInputInited) {
      // 启动 native 监听线程（只第一次）
      $falcon.jsapi.ScanInput.initialize().catch((e: any) => {
        console.warn('[kb] ScanInput.initialize failed:', e)
      })
      _scanInputInited = true
    }
    // 弹起系统软键盘
    $falcon.jsapi.ScanInput.showKeyboard().catch((e: any) => {
      console.warn('[kb] ScanInput.showKeyboard failed:', e)
    })
    return true
  } catch (e) {
    console.error('[kb] startSystemKeyboard failed:', e)
    return false
  }
}

export default defineComponent({
  data() {
    return {
      username: '',
      password: '',
      statusText: '',
      loading: false,
      // 当前激活的输入字段（用系统软键盘往这个字段追加字符）
      activeField: '' as 'username' | 'password' | '',
      // statusText 自动消失计时器
      _statusTimer: 0 as any,
    }
  },

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

    // 点 native input 时：focus 已经在 native input 上，**额外**弹起系统软键盘
    // 因为词典笔运行时 native input focus 不一定自动调起 softKeyboard
    onInputFocus(field: 'username' | 'password') {
      this.activeField = field
      startSystemKeyboard((ch) => {
        if (this.activeField === 'username') this.username += ch
        else if (this.activeField === 'password') this.password += ch
      })
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