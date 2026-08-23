import { defineComponent } from 'vue'
import { PINYIN_MAP } from './pinyin-data'

interface KbKey {
  id: string
  display: string
  value: string
  cls: string
  action: string
}

// 9 键每个数字键对应的拼音字母（经典 T9 布局）
const T9_KEYS: { digit: string; letters: string }[] = [
  { digit: '2', letters: 'abc' },
  { digit: '3', letters: 'def' },
  { digit: '4', letters: 'ghi' },
  { digit: '5', letters: 'jkl' },
  { digit: '6', letters: 'mno' },
  { digit: '7', letters: 'pqrs' },
  { digit: '8', letters: 'tuv' },
  { digit: '9', letters: 'wxyz' },
]

export default defineComponent({
  data() {
    return {
      // letters | numbers | symbols | chinese
      mode: 'chinese' as 'letters' | 'numbers' | 'symbols' | 'chinese',
      shift: false,
      // 中文模式下：qwerty(全键) | t9(9键)
      layout: 'qwerty' as 'qwerty' | 't9',
      // 中文拼音缓冲（已拼好的拼音串，例如 "ni"）
      pinyin: '',
      // 9 键点击状态：上一次按的数字键 与 该键已点次数
      t9LastDigit: '' as string,
      t9TapCount: 0,
      // 候选汉字
      candidates: [] as string[],
      // 当前键盘物理高度（行数不同则不同），用于通知父页面滚动区让位
      kbHeight: 156,
    }
  },

  watch: {
    mode() {
      this.syncHeight()
    },
    layout() {
      this.syncHeight()
    },
  },

  mounted() {
    this.syncHeight()
  },

  computed: {
    // 是否显示候选栏（仅中文模式）
    showCandidates(): boolean {
      return this.mode === 'chinese'
    },

    currentRows(): KbKey[][] {
      switch (this.mode) {
        case 'letters':
          return this.letterRows
        case 'numbers':
          return this.numberRows
        case 'symbols':
          return this.symbolRows
        case 'chinese':
          return this.layout === 't9' ? this.t9Rows : this.chineseQwertyRows
      }
    },

    // 全键盘中文：复用字母键盘布局，点击字母即追加到拼音缓冲
    chineseQwertyRows(): KbKey[][] {
      const s = this.shift
      return [
        [...this.makeRow('qwertyuiop', s), { id: 'ch-123', display: '123', value: '', cls: 'kb-key-mode', action: 'to123' }],
        [...this.makeRow('asdfghjkl', s), { id: 'ch-9', display: '9键', value: '', cls: 'kb-key-mode', action: 't9toggle' }],
        [
          { id: 'ch-en', display: 'EN', value: '', cls: 'kb-key-mode', action: 'ch2en' },
          ...this.makeRow('zxcvbnm', s),
          { id: 'back', display: '←', value: '', cls: 'kb-key-back', action: 'back' },
        ],
      ]
    },

    // 9 键中文：数字键行 + 功能键行
    t9Rows(): KbKey[][] {
      const digitRow = T9_KEYS.map((k) => ({
        id: 't9-' + k.digit,
        display: k.digit,
        value: k.digit,
        cls: 'kb-key-t9',
        action: 't9',
      }))
      const funcRow: KbKey[] = [
        { id: 'ch-123', display: '123', value: '', cls: 'kb-key-mode', action: 'to123' },
        { id: 'ch-en', display: 'EN', value: '', cls: 'kb-key-mode', action: 'ch2en' },
        { id: 'ch-back', display: '←', value: '', cls: 'kb-key-back', action: 'back' },
        { id: 'ch-space', display: '空', value: ' ', cls: 'kb-key-space', action: 'space' },
        { id: 'ch-enter', display: '→', value: '', cls: 'kb-key-enter', action: 'enter' },
      ]
      return [digitRow, funcRow]
    },

    letterRows(): KbKey[][] {
      const s = this.shift
      return [
        this.makeRow('qwertyuiop', s),
        this.makeRow('asdfghjkl', s),
        [
          { id: 'to-ch', display: '中', value: '', cls: 'kb-key-mode', action: 'tochinese' },
          ...this.makeRow('zxcvbnm', s),
          { id: 'shift', display: s ? 'A' : 'a', value: '', cls: 'kb-key-shift', action: 'shift' },
          { id: 'back', display: '←', value: '', cls: 'kb-key-back', action: 'back' },
        ],
      ]
    },

    numberRows(): KbKey[][] {
      return [
        this.makeRow('1234567890'),
        [
          { id: 'dash', display: '-', value: '-', cls: '', action: 'input' },
          { id: 'at', display: '@', value: '@', cls: '', action: 'input' },
          { id: 'dot', display: '.', value: '.', cls: '', action: 'input' },
          { id: 'uscore', display: '_', value: '_', cls: '', action: 'input' },
          { id: 'slash', display: '/', value: '/', cls: '', action: 'input' },
          { id: 'back', display: '←', value: '', cls: 'kb-key-back', action: 'back' },
        ],
        [
          { id: 'to-ch', display: '中', value: '', cls: 'kb-key-mode', action: 'tochinese' },
          { id: 'space', display: '空', value: ' ', cls: 'kb-key-space', action: 'input' },
          { id: 'enter', display: '→', value: '', cls: 'kb-key-enter', action: 'enter' },
        ],
      ]
    },

    symbolRows(): KbKey[][] {
      return [
        this.makeSymRow('!@#$%^&*('),
        [
          { id: 'rp', display: ')', value: ')', cls: '', action: 'input' },
          { id: 'eq', display: '=', value: '=', cls: '', action: 'input' },
          { id: 'pl', display: '+', value: '+', cls: '', action: 'input' },
          { id: 'mn', display: '-', value: '-', cls: '', action: 'input' },
          { id: 'cl', display: ':', value: ':', cls: '', action: 'input' },
          { id: 'sc', display: ';', value: ';', cls: '', action: 'input' },
          { id: 'qt', display: "'", value: "'", cls: '', action: 'input' },
          { id: 'dq', display: '"', value: '"', cls: '', action: 'input' },
          { id: 'back', display: '←', value: '', cls: 'kb-key-back', action: 'back' },
        ],
        [
          { id: 'to-ch', display: '中', value: '', cls: 'kb-key-mode', action: 'tochinese' },
          { id: 'space', display: '空', value: ' ', cls: 'kb-key-space', action: 'input' },
          { id: 'enter', display: '→', value: '', cls: 'kb-key-enter', action: 'enter' },
        ],
      ]
    },
  },

  methods: {
    makeRow(chars: string, upper = false): KbKey[] {
      return chars.split('').map((c) => ({
        id: c,
        display: upper ? c.toUpperCase() : c,
        value: upper ? c.toUpperCase() : c,
        cls: '',
        action: this.mode === 'chinese' ? 'pinyin' : 'input',
      }))
    },

    makeSymRow(chars: string): KbKey[] {
      return chars.split('').map((c) => ({
        id: c,
        display: c,
        value: c,
        cls: '',
        action: 'input',
      }))
    },

    // 根据当前拼音缓冲刷新候选汉字
    refreshCandidates() {
      const py = this.pinyin.trim().toLowerCase()
      if (!py) {
        this.candidates = []
        return
      }
      const chars = PINYIN_MAP[py]
      this.candidates = chars ? chars.split('') : []
    },

    // 上屏一个汉字
    commitCandidate(ch: string) {
      this.$emit('input', ch)
      // 上屏后清空拼音缓冲，准备下一次输入
      this.pinyin = ''
      this.t9LastDigit = ''
      this.t9TapCount = 0
      this.candidates = []
    },

    // 9 键点击：经典 T9 无计时实现
    // 点同一数字键：在该键字母间循环；点不同键：先定稿上一键字母，再开始新键
    onT9Tap(digit: string) {
      const info = T9_KEYS.find((k) => k.digit === digit)
      if (!info) return
      if (this.t9LastDigit !== digit) {
        // 切换键：先定稿上一键（已追加的字母保留在拼音串）
        this.t9LastDigit = digit
        this.t9TapCount = 0
        this.pinyin += info.letters[0]
      } else {
        // 同一键重复点击：循环该键字母，替换拼音串最后一个字符
        this.t9TapCount = (this.t9TapCount + 1) % info.letters.length
        const last = this.pinyin.slice(0, -1) + info.letters[this.t9TapCount]
        this.pinyin = last
      }
      this.refreshCandidates()
    },

    onKeyTap(key: KbKey) {
      if (key.action === 'input') {
        this.$emit('input', key.value)
      } else if (key.action === 'back') {
        this.onBack()
      } else if (key.action === 'enter') {
        this.onEnter()
      } else if (key.action === 'shift') {
        this.shift = !this.shift
      } else if (key.action === 'mode') {
        this.mode = this.mode === 'letters' ? 'numbers' : this.mode === 'numbers' ? 'symbols' : 'letters'
      } else if (key.action === 'tochinese') {
        this.enterChinese()
      } else if (key.action === 'to123') {
        this.mode = 'numbers'
        this.clearPinyin()
      } else if (key.action === 'ch2en') {
        this.mode = 'letters'
        this.clearPinyin()
      } else if (key.action === 't9toggle') {
        this.layout = this.layout === 'qwerty' ? 't9' : 'qwerty'
      } else if (key.action === 'space') {
        this.onSpace()
      } else if (key.action === 'pinyin') {
        // 全键盘中文：点击字母追加到拼音缓冲
        this.pinyin += key.value.toLowerCase()
        this.refreshCandidates()
      } else if (key.action === 't9') {
        this.onT9Tap(key.value)
      }
    },

    enterChinese() {
      this.mode = 'chinese'
      this.clearPinyin()
    },

    clearPinyin() {
      this.pinyin = ''
      this.t9LastDigit = ''
      this.t9TapCount = 0
      this.candidates = []
    },

    onBack() {
      if (this.mode === 'chinese') {
        // 优先删拼音缓冲；缓冲空了再删已上屏内容
        if (this.pinyin) {
          this.pinyin = this.pinyin.slice(0, -1)
          this.t9LastDigit = ''
          this.t9TapCount = 0
          this.refreshCandidates()
          return
        }
        this.$emit('back')
        return
      }
      this.$emit('back')
    },

    onEnter() {
      if (this.mode === 'chinese') {
        // 有候选则上屏第一个候选；否则把拼音串原样上屏（处理无对应汉字的情况）
        if (this.candidates.length > 0) {
          this.commitCandidate(this.candidates[0])
        } else if (this.pinyin) {
          this.$emit('input', this.pinyin)
          this.pinyin = ''
          this.t9LastDigit = ''
          this.t9TapCount = 0
          this.candidates = []
        }
        return
      }
      this.$emit('enter')
    },

    // 空格：中文模式上屏首个候选
    onSpace() {
      if (this.mode === 'chinese' && this.candidates.length > 0) {
        this.commitCandidate(this.candidates[0])
        return
      }
      this.$emit('input', ' ')
    },

    // 同步键盘内容高度并通知父页面（中文模式含拼音预览行 + 候选栏）
    syncHeight() {
      if (this.mode === 'chinese') {
        // 拼音预览行(28) + 候选栏(32) + 字母行
        this.kbHeight = (this.layout === 't9' ? 2 : 3) * 28 + 60
      } else {
        this.kbHeight = 3 * 28
      }
      this.$emit('height', this.kbHeight)
    },
  },
})
