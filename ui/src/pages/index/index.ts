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
      // statusText 自动消失计时器（错误全屏遮罩，3s 后自动关闭）
      _statusTimer: 0 as any,
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
    // 仅当本地已有 token 和 user 时才自动跳到聊天页
    if (getToken() && getUser()) {
      $falcon.navTo('page', {})
    }
  },

  methods: {
    // 设置 statusText 错误提示，3s 后自动消失
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

    async handleSubmit() {
      if (this.loading) return
      if (!this.username || !this.password) {
        this.setStatus('请填写用户名和密码')
        return
      }

      this.loading = true
      this.setStatus('登录中...')

      try {
        const data = await api.login(this.username, this.password)
        await saveAuth(data.token, data.user)
        this.setStatus('登录成功')
        // 成功后短暂显示成功提示再跳转
        setTimeout(() => {
          this.statusText = ''
          $falcon.navTo('page', {})
        }, 500)
      } catch (err: any) {
        this.setStatus(err.message || '登录失败')
      } finally {
        this.loading = false
      }
    },
  },
})