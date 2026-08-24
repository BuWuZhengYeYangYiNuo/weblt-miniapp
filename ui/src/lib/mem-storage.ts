// 安全的 storage 封装
//
// jsapi.storage 在词典笔运行时不稳定（用户报告：调用时直接崩溃）。
// 这里做两件事：
// 1. 每个调用包 try/catch，避免单个调用失败扩散到整个页面渲染
// 2. fallback 到进程级内存 Map，保证 token / user 在一次会话内仍能保持
//
// 注意：进程级内存不持久化，应用重启后 token 丢失，用户需重新登录。
// 这是词典笔上 storage 不可用时的妥协方案。

const memStore: Map<string, string> = new Map()

export async function setItem(key: string, value: string): Promise<void> {
  memStore.set(key, value)
  try {
    await $falcon.jsapi.storage.setItem({ key, value })
  } catch (e) {
    // native 调用失败时内存值已保存，不向上抛错
  }
}

export async function getItem(key: string): Promise<string> {
  // 优先从 native 读（跨进程可能持久化），但要先 catch 防止崩溃
  try {
    const v = await $falcon.jsapi.storage.getItem({ key })
    if (v !== undefined && v !== null && v !== '') {
      memStore.set(key, v)
      return v
    }
  } catch (e) {
    // 崩溃时 fallback 到内存
  }
  return memStore.get(key) || ''
}

export async function removeItem(key: string): Promise<void> {
  memStore.delete(key)
  try {
    await $falcon.jsapi.storage.removeItem({ key })
  } catch (e) {
    // ignore
  }
}

export function clearMemory() {
  memStore.clear()
}