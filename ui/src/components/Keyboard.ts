import { defineComponent } from 'vue'

interface KbKey {
  id: string
  display: string
  value: string
  cls: string
  action: string
}

export default defineComponent({
  data() {
    return {
      mode: 'letters' as 'letters' | 'numbers' | 'symbols',
      shift: false,
    }
  },

  computed: {
    currentRows(): KbKey[][] {
      if (this.mode === 'letters') return this.letterRows
      if (this.mode === 'numbers') return this.numberRows
      return this.symbolRows
    },

    letterRows(): KbKey[][] {
      const s = this.shift
      return [
        this.makeRow('qwertyuiop', s),
        this.makeRow('asdfghjkl', s),
        [
          { id: 'shift', display: s ? 'A' : 'a', value: '', cls: 'kb-key-shift', action: 'shift' },
          ...this.makeRow('zxcvbnm', s),
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
          { id: 'abc', display: 'ABC', value: '', cls: 'kb-key-mode', action: 'mode' },
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
          { id: 'abc', display: 'abc', value: '', cls: 'kb-key-mode', action: 'mode' },
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
        action: 'input',
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

    onKeyTap(key: KbKey) {
      if (key.action === 'input') {
        this.$emit('input', key.value)
      } else if (key.action === 'back') {
        this.$emit('back')
      } else if (key.action === 'enter') {
        this.$emit('enter')
      } else if (key.action === 'shift') {
        this.shift = !this.shift
      } else if (key.action === 'mode') {
        this.mode = this.mode === 'letters' ? 'numbers' : this.mode === 'numbers' ? 'symbols' : 'letters'
      }
    },
  },
})
