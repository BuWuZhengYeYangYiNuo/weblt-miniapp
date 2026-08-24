import { defineComponent } from 'vue'
import { lookupPinyin, FIRST_LETTER_INDEX } from '../lib/pinyin-data'

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
      // 英文/数字/符号模式：最近输入的字符缓冲（用于 input preview bar 显示）
      inputBuffer: '' as string,
      // 9 键点击状态：上一次按的数字键 与 该键已的位次数
      t9LastDigit: '' as string,
      t9TapCount: 0,
      // 候选汉字（来自内置 pinyin-data.ts，不依赖 native IME）
      candidates: [] as string[],
      // 当前键盘物理状态（行数不同则不同），用于通知父页面滚动区让位
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
    // 不再调 native IME.initialize()（在词典笔上可能崩溃），直接使用内置拼音数据
    this.syncHeight()
  },

  computed: {
    // 是否显示候选栏（仅中文模式）
    showCandidates(): boolean {
      return this.mode === 'chinese'
    },

    // 键盘上方 input preview bar 显示内容：
    // 中文模式显示当前拼音（pinyin），其他模式显示最近输入的字符缓冲
    inputPreview(): string {
      if (this.mode === 'chinese') return this.pinyin || ' '
      return this.inputBuffer || ' '
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

    // 根据当前拼音缓冲查候选汉字：优先全拼匹配，未匹配则退化到首字母匹配
    refreshCandidates() {
      const py = this.pinyin.trim().toLowerCase()
      if (!py) {
        this.candidates = []
        return
      }
      // 1. 完整拼音匹配（首选）
      let cands = lookupPinyin(py)
      // 2. fallback：拼音首字母匹配（如输入 "n" 看到所有 n 开头拼音的字）
      if (cands.length === 0 && py.length <= 2) {
        cands = FIRST_LETTER_INDEX[py] || []
      }
      this.candidates = cands
    },

    // 上屏一个汉字
    commitCandidate(ch: string) {
      this.$emit('input', ch)
      // IME 词频更新跳过（native IME 不可用，纯前端无法持久化频率）
      // 上屏后清空拼音缓冲，准备下一次输入
      this.pinyin = ''
      this.t9LastDigit = ''
      this.t9TapCount = 0
      this.candidates = []
    },

    // 9 键点击：经典 T9 无计时实现
    onT9Tap(digit: string) {
      const info = T9_KEYS.find((k) => k.digit === digit)
      if (!info) return
      if (this.t9LastDigit !== digit) {
        this.t9LastDigit = digit
        this.t9TapCount = 0
        this.pinyin += info.letters[0]
      } else {
        this.t9TapCount = (this.t9TapCount + 1) % info.letters.length
        this.pinyin = this.pinyin.slice(0, -1) + info.letters[this.t9TapCount]
      }
      this.refreshCandidates()
    },

    onKeyTap(key: KbKey) {
      if (key.action === 'input') {
        // 英文/数字/符号模式：直接上屏 + 同步更新 inputBuffer（用于 input preview bar 显示）
        this.inputBuffer = (this.inputBuffer + key.value).slice(-12)
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
        // 中文模式点字母：追加到拼音缓冲 + 同步更新 inputBuffer（让 input preview bar 立即显示）
        this.pinyin += key.value.toLowerCase()
        this.inputBuffer = (this.inputBuffer + key.value.toLowerCase()).slice(-12)
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
      // 切模式/清拼音时也清 inputBuffer（让 preview bar 同步）
      this.inputBuffer = ''
    },

    onBack() {
      if (this.mode === 'chinese') {
        if (this.pinyin) {
          this.pinyin = this.pinyin.slice(0, -1)
          this.inputBuffer = this.inputBuffer.slice(0, -1)
          this.t9LastDigit = ''
          this.t9TapCount = 0
          this.refreshCandidates()
          return
        }
        this.inputBuffer = this.inputBuffer.slice(0, -1)
        this.$emit('back')
        return
      }
      // 英文/数字/符号模式：退格并同步清 inputBuffer
      this.inputBuffer = this.inputBuffer.slice(0, -1)
      this.$emit('back')
    },

    onEnter() {
      if (this.mode === 'chinese') {
        if (this.candidates.length > 0) {
          this.commitCandidate(this.candidates[0])
        } else if (this.pinyin) {
          this.$emit('input', this.pinyin)
          this.clearPinyin()
        }
        return
      }
      this.$emit('enter')
    },

    // 空格：英文/数字模式直接上屏空格并更新 inputBuffer；中文模式上屏首个候选
    onSpace() {
      if (this.mode === 'chinese' && this.candidates.length > 0) {
        this.commitCandidate(this.candidates[0])
        return
      }
      this.inputBuffer = (this.inputBuffer + ' ').slice(-12)
      this.$emit('input', ' ')
    },

    // 同步键盘内容高度并通知父页面（中文模式含拼音预览行 + 候选栏）
    syncHeight() {
      if (this.mode === 'chinese') {
        // input preview(28) + 候选栏(32) + 字母行 + 底部 [空格][确定] 行(28)
        this.kbHeight = (this.layout === 't9' ? 2 : 3) * 28 + 28 + 32 + 28
      } else {
        // input preview(28) + 普通 3 行 + 底部 [空格][确定] 行(28)
        this.kbHeight = 3 * 28 + 28 + 28
      }
      this.$emit('height', this.kbHeight)
    },

    // 底部固定行的「空格」：复用 onSpace 语义
    onSpaceTap() {
      this.onSpace()
    },

    // 底部固定行的「确定」：清空拼音缓冲，发出 confirm 让父页面关闭键盘
    onConfirmTap() {
      this.clearPinyin()
      this.$emit('confirm')
    },
  },
})
