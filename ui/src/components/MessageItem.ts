import { defineComponent } from 'vue'

interface Segment {
  type: 'text' | 'bold' | 'underline' | 'image'
  value: string
}

export default defineComponent({
  props: {
    text: { type: String, default: '' },
  },

  computed: {
    segments(): Segment[] {
      return this.parseContent(this.text)
    },
  },

  methods: {
    parseContent(text: string): Segment[] {
      if (!text) return []
      const segments: Segment[] = []
      let remaining = text

      const patterns: { regex: RegExp; type: string; group: number }[] = [
        { regex: /!\[([^\]]*)\]\(([^)]+)\)/, type: 'image', group: 2 },
        { regex: /\[img\]([^\]]+)\[\/img\]/, type: 'image', group: 1 },
        { regex: /\[b\]([^\[]+)\[\/b\]/, type: 'bold', group: 1 },
        { regex: /\*\*([^*]+)\*\*/, type: 'bold', group: 1 },
        { regex: /\[u\]([^\[]+)\[\/u\]/, type: 'underline', group: 1 },
      ]

      while (remaining.length > 0) {
        let earliest: { index: number; type: string; value: string; length: number } | null = null

        for (const p of patterns) {
          p.regex.lastIndex = 0
          const m = p.regex.exec(remaining)
          if (m && m.index !== undefined) {
            if (!earliest || m.index < earliest.index) {
              earliest = { index: m.index, type: p.type, value: m[p.group], length: m[0].length }
            }
          }
        }

        if (earliest) {
          if (earliest.index > 0) {
            segments.push({ type: 'text', value: remaining.slice(0, earliest.index) })
          }
          segments.push({ type: earliest.type as any, value: earliest.value })
          remaining = remaining.slice(earliest.index + earliest.length)
        } else {
          segments.push({ type: 'text', value: remaining })
          remaining = ''
        }
      }

      return segments
    },
  },
})
