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
      this.msg = message || ''
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

  beforeUnmount() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = 0
    }
  },
})