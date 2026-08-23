// 系统输入法（有道输入法，appid 8001666679481944）前端封装。
//
// 原生侧通过 miniapp_cli 以 softKeyboard 服务拉起系统输入法
// （机制与 ScanInput 一致，已在真机验证可用）。
//
// 回传通道说明（需真机确认）：
//   系统输入法完成输入后，可能通过 publish 事件把文字回传给本 miniapp。
//   这里同时监听两类事件，任一有数据即回填：
//     - 'system_ime_input' : { text: string }  —— 假设走 publish 通道
//     - 'system_ime_state' : { open: boolean } —— 软键盘前台/后台状态
//   若真机上两路都收不到文字，说明系统输入法走的是别的通道（如数据库/storage），
//   需据真机现象再接。

type ImeInputCallback = (text: string) => void
type ImeStateCallback = (open: boolean) => void

let inputCbs: ImeInputCallback[] = []
let stateCbs: ImeStateCallback[] = []
let bound = false

function ensureBound() {
  if (bound) return
  bound = true

  $falcon.on<{ text: string }>('system_ime_input', (e) => {
    const text = e?.data?.text
    if (typeof text === 'string') {
      inputCbs.forEach((cb) => cb(text))
    }
  })

  $falcon.on<{ open: boolean }>('system_ime_state', (e) => {
    const open = !!e?.data?.open
    stateCbs.forEach((cb) => cb(open))
  })
}

export function onIMEInput(cb: ImeInputCallback) {
  ensureBound()
  inputCbs.push(cb)
}

export function onIMEState(cb: ImeStateCallback) {
  ensureBound()
  stateCbs.push(cb)
}

export function offIMEInput(cb: ImeInputCallback) {
  inputCbs = inputCbs.filter((c) => c !== cb)
}

export function offIMEState(cb: ImeStateCallback) {
  stateCbs = stateCbs.filter((c) => c !== cb)
}

// 拉起系统输入法。hint 透传给输入法作为输入框提示。
export function openIME(hint?: string): Promise<boolean> {
  ensureBound()
  try {
    return $falcon.jsapi.systemIME.open({ hint: hint || '' })
  } catch (e) {
    console.error('openIME failed', e)
    return Promise.resolve(false)
  }
}

export function closeIME(): Promise<boolean> {
  try {
    return $falcon.jsapi.systemIME.close()
  } catch (e) {
    console.error('closeIME failed', e)
    return Promise.resolve(false)
  }
}
