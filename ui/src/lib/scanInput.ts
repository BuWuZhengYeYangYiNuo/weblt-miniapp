// 输入法通道封装：复用原生 ScanInput 模块。
//
// 该运行时（有道词典笔 / HaaS UI）的 Weex 原生 <input> 不会自动弹出系统输入法，
// 必须主动拉起。系统软键盘通过 `miniapp_cli start <appid> softKeyboard` 拉起，
// 输入结果写入 history.db，由 ScanInput 模块轮询并以 `scan_input` 事件回传。
//
// 注意：ScanInput 模块本身不会主动首次拉起键盘（它只在收到新词后才二次拉起），
// 所以前端点输入框时必须显式调用 showKeyboard() 打破“不先拉键盘就没输入”的死循环。
//
// 用法：
//   import { startScanInput, onScanInput, offScanInput } from '../../lib/scanInput'
//   startScanInput()              // 拉起系统软键盘并开始监听
//   onScanInput((text) => {...})  // 接收输入文字（返回解绑函数）
//   offScanInput(unbind)          // 解绑

// 维护 callback -> 包装函数 的映射，保证 offScanInput 能精确解绑
const wrapperMap = new WeakMap<(text: string) => void, (e?: { data?: string }) => void>()

export function startScanInput(): Promise<void> {
  // 先拉起系统软键盘（主动），再启动轮询监听
  // 注意：原生模块导出名为 "ScanInput"（大写 S），$falcon.jsapi['ScanInput']
  return Promise.resolve()
    .then(() => $falcon.jsapi.ScanInput.showKeyboard())
    .then(() => $falcon.jsapi.ScanInput.initialize())
    .catch((err) => {
      // initialize 可能已运行过（原生层幂等），保证键盘仍被拉起即可
      console.error('[scanInput] startScanInput warning:', err)
      return $falcon.jsapi.ScanInput.showKeyboard()
    })
}

export function stopScanInput(): Promise<void> {
  return $falcon.jsapi.ScanInput.deinitialize()
}

export function onScanInput(callback: (text: string) => void): () => void {
  const wrapper = (e?: { data?: string }) => {
    const text = e?.data ?? ''
    if (text) callback(text)
  }
  wrapperMap.set(callback, wrapper)
  $falcon.on('scan_input', wrapper)
  // 返回解绑函数，调用方在 onHide/onUnload 时使用
  return () => offScanInput(callback)
}

export function offScanInput(callback: (text: string) => void): void {
  const wrapper = wrapperMap.get(callback)
  if (wrapper) {
    $falcon.off('scan_input', wrapper)
    wrapperMap.delete(callback)
  }
}
