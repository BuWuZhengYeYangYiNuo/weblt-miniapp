import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      visible: false,
      msg: '',
      _timer: 0 as any,
    }
  },

  methods: {
    // 显示 banner，duration ms 后自动消失（默认 2500ms）
    show(message: string, duration = 2500) {
      this.msg = (message === undefined || message === null) ? '' : String(message)
      this.visible = true
      // 清掉旧 timer 避免重叠 banner 提早消失
      if (this._timer) {
        clearTimeout(this._timer)
        this._timer = 0
      }
      this._timer = setTimeout(() => {
        this.visible = false
        this.msg = ''
        this._timer = 0
      }, duration)
    },

    // 点击 banner 立即消失
    dismiss() {
      if (this._timer) {
        clearTimeout(this._timer)
        this._timer = 0
      }
      this.visible = false
      this.msg = ''
    },
  },

  mounted() {
    // 全局唯一 banner 引用：mount 时挂到 globalThis，showToast 直接调 show(msg)
    // 关键原因：之前 base-page.js 转发 toast 时用 this.$root.$refs.errorBanner，
    // 但 falcon Page 实例的 this.$root 是 undefined（falcon Page 不是 Vue 组件），
    // msg 永远是空，banner 红色显示但文字看不见。
    // 改成 banner 实例自己挂全局 + showToast 直接调用，零依赖、最稳。
    try { (globalThis as any).__webltErrorBanner = this } catch (e) { /* ignore */ }
  },

  beforeUnmount() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = 0
    }
    try {
      if ((globalThis as any).__webltErrorBanner === this) {
        delete (globalThis as any).__webltErrorBanner
      }
    } catch (e) { /* ignore */ }
  },
})
