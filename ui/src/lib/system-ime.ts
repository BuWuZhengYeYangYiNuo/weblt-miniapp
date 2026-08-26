// 系统输入法（词典笔真机上的"有道输入法" app，appid=8001666679481944）
// 调起方式：$falcon.navTo('falcon://8001666679481944/index?./index.js', {contents, uuid, maxLength})
// 回传渠道：有道输入法通过 $falcon.trigger(...) 或者框架 IPC 返回时把结果回给调用方。
// 由于我们不知道框架具体走哪条渠道，把 5 种最可能的事件名都监听一遍，
// 任一触发就把结果显示出来。文本内容总是包含在 resultText / text / contents 字段。

export type SystemImeResult = {
  text: string
  source: string          // 哪个渠道传回来的（用于调试）
  raw?: any               // 原始数据
}

let _activeHandler: ((r: SystemImeResult) => void) | null = null
let _activeUuid = ''
let _registered = false

/** 注册结果监听器（全局一次，会替换旧 handler） */
export function onSystemInputResult(cb: (r: SystemImeResult) => void) {
  _activeHandler = cb
  if (_registered) return
  _registered = true

  // 把所有可能的事件名都注册一遍
  const eventNames = [
    'system_input_done',
    'input_done',
    'edit_done',
    'editFinished',
    'editConfirmed',
    'editClosed',
    'inputResult',
    'keyboardResult',
    'onResult',
    'commitText',
    'scan_input',
    // 来自有道输入法逆向上下文的新发现：
    'topAppChanged',                  // 顶层 app 改变
    'topPanelShowingStatusChanged',   // top panel 状态变化（这是有道输入法 amModule 触发的事件）
    'app:input_done',                 // app 前缀的全局事件
    'input:done',                     // input:done 命名空间
    'app:focus_changed',              // app 焦点变化
    'softKeyboardDone',               // 软键盘完成
  ]

  for (const ev of eventNames) {
    try {
      $falcon.on(ev, (data: any) => {
        // 每次触发都 push 到 event log（即使数据不包含文本也 push，方便排查）
        try { pushEventLog(ev, data) } catch {}

        if (!_activeHandler) return
        // 把 data 抽取成纯文本
        let text = ''
        if (typeof data === 'string') text = data
        else if (data && typeof data.text === 'string') text = data.text
        else if (data && typeof data.resultText === 'string') text = data.resultText
        else if (data && typeof data.contents === 'string') text = data.contents
        else if (data && typeof data.word === 'string') text = data.word
        else if (data && typeof data.commitText === 'string') text = data.commitText
        else if (data && typeof data.value === 'string') text = data.value
        else if (data) text = JSON.stringify(data)

        if (text) {
          try { _activeHandler({ text, source: `event:${ev}`, raw: data }) } catch {}
        }
      })
    } catch (e) {
      // 注册失败不致命，下个事件继续
    }
  }
}

/** 全局 debug buffer：记录所有 $falcon.on 触发过的事件（用于查回传渠道） */
export interface SysImeLogEntry { event: string; data: any; ts: number }
const _eventLog: SysImeLogEntry[] = []
;(globalThis as any).__sysImeEventLog = _eventLog

const _eventLogHandlers: Array<(log: SysImeLogEntry[]) => void> = []
export function onEventLog(cb: (log: SysImeLogEntry[]) => void) {
  _eventLogHandlers.push(cb)
}
function pushEventLog(event: string, data: any) {
  const entry = { event, data, ts: Date.now() }
  _eventLog.push(entry)
  if (_eventLog.length > 50) _eventLog.shift()
  for (const h of _eventLogHandlers) try { h(_eventLog) } catch {}
}
export function getEventLog() { return _eventLog.slice() }
export function clearEventLog() { _eventLog.length = 0 }

/** 打开系统输入法（让用户输入），返回生成的 uuid */
export function openSystemKeyboard(opts: {
  contents?: string
  uuid?: string
  maxLength?: number
} = {}): string {
  const uuid = opts.uuid || 'probe-' + Date.now()
  _activeUuid = uuid
  try {
    $falcon.navTo('falcon://8001666679481944/index?./index.js', {
      contents: opts.contents || '',
      uuid: uuid,
      maxLength: opts.maxLength || 100,
    })
  } catch (e) {
    console.error('[sysime] navTo failed:', e)
  }
  return uuid
}

/**
 * 由 page.onShow(options) 调用：如果 options 里有 resultText/text/contents，
 * 就当做输入法结果处理。这是 navTo 返回栈底 page 的最可能回传机制。
 */
export function consumeKeyboardResultFromOptions(options: any): boolean {
  if (!_activeHandler || !options) return false
  const text = options.resultText ?? options.text ?? options.contents ?? options.commitText
  if (typeof text === 'string' && text !== '') {
    try {
      _activeHandler({
        text,
        source: 'navTo:onShow:options',
        raw: options,
      })
      return true
    } catch {}
  }
  return false
}

export function getActiveUuid(): string { return _activeUuid }
export function clearActiveHandler() {
  _activeHandler = null
  _activeUuid = ''
}

// 兼容旧代码：原来 ScanInput 风格是 "每个字符 publish → 回调一段字符串"
const _charStreamHandlers: ((ch: string) => void)[] = []

/**
 * 兼容老 API — 旧 chat 页 import { startSystemKeyboard } from '../index/index'
 * 旧约定：每回调一次 onChar 收到一段字符（ScanInput.cpp publish 'scan_input' 字符串）
 * 现在有道输入法是 "整段文本提交时回调"，所以这个函数把整段文本作"一批字符"塞入。
 * 仅做编译兼容：实际 chat 页运行起来会得到整段文本而不是字符流，需要后续重写。
 */
export function startSystemKeyboard(onChar: (ch: string) => void): boolean {
  _charStreamHandlers.push(onChar)
  onSystemInputResult((r) => {
    for (const h of _charStreamHandlers) {
      try { h(r.text) } catch {}
    }
  })
  return openSystemKeyboard() !== ''
}
