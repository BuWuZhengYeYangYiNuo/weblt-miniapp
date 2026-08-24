// 输入法通道封装：复用原生 ScanInput 模块。
//
// 该运行时（有道词典笔 / HaaS UI）的原生 <input> 不会自动弹出系统输入法，
// 但系统软键盘可通过 `miniapp_cli start <appid> softKeyboard` 拉起（ScanInput.cpp 已验证），
// 输入结果写入 history.db，由 ScanInput 模块轮询并以 `scan_input` 事件回传。
//
// 用法：
//   import { startScanInput, onScanInput, offScanInput } from '../../lib/scanInput'
//   startScanInput()              // 拉起系统软键盘并开始监听
//   onScanInput((text) => {...})  // 接收输入文字
//   offScanInput(cb)              // 解绑

let bound = false

function ensureBound() {
  if (bound) return
  bound = true
}

export function startScanInput(): Promise<void> {
  ensureBound()
  return $falcon.jsapi.scanInput.initialize()
}

export function stopScanInput(): Promise<void> {
  ensureBound()
  return $falcon.jsapi.scanInput.deinitialize()
}

export function onScanInput(callback: (text: string) => void): void {
  ensureBound()
  $falcon.on('scan_input', (e?: { data?: string }) => {
    const text = e?.data ?? ''
    if (text) callback(text)
  })
}

export function offScanInput(callback?: (text: string) => void): void {
  ensureBound()
  $falcon.off('scan_input', callback as any)
}
