// API 帮助模块 - 有道词典笔版
const API_BASE = 'https://api.lt.132453.xyz'

let _token: string = ''

import { getItem } from './mem-storage'

export async function loadToken() {
  // 使用 mem-storage 兜底（jsapi.storage 可能崩溃）
  _token = await getItem('token')
}

export function getToken() { return _token }
export function setToken(token: string) { _token = token }

// 401 token 失效时回调（在 page.ts 中设置），由 BasePage 触发跳登录页
let _onAuthFailed: ((err: Error) => void) | null = null
export function setAuthFailedHandler(cb: (err: Error) => void) { _onAuthFailed = cb }

async function request(path: string, options: { method?: string; data?: any } = {}): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  let res: any
  try {
    // 文档明确：HTTP 请求入口是 $falcon.jsapi.net.request（不是 jsapi.http.request）
    // 入参 data 应传对象（不是已 stringify 的字符串），headers 复数
    res = await ($falcon as any).jsapi.net.request({
      url: `${API_BASE}/api${path}`,
      method: options.method || 'GET',
      headers,
      data: options.data,  // 传对象，原生 libcurl/网络层会自己 JSON.stringify
      timeout: 20000,  // 词典笔网络可能慢，20s 兜底
    })
  } catch (err: any) {
    // native net.request 抛错时通常是网络/DNS 失败（词典笔没网），带 message 让上层 toast 提示
    throw new Error(err?.message || '网络异常，请检查网络连接')
  }

  // 防止 res 为 null/undefined（native 引擎异常）
  if (!res) {
    throw new Error('网络异常，请稍后重试')
  }

  // 响应格式：原生层在 res.data 里塞 JSON 字符串，统一 parse
  let data = res.data
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch {}
  }

  // statusCode：res.statusCode 是 number；为 0/缺失通常意味着网络层失败
  const sc = res.statusCode
  if (typeof sc !== 'number' || sc === 0) {
    throw new Error('网络异常，请检查网络连接')
  }
  if (sc >= 400) {
    // 兼容多种服务端错误格式：
    //   { error: "string" }
    //   { error: { message: "string" } }
    //   { message: "string" }
    let errMsg = `请求失败 (${sc})`
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') errMsg = data.error
      else if (data.error && typeof data.error.message === 'string') errMsg = data.error.message
      else if (typeof data.message === 'string') errMsg = data.message
    }
    // 401/403 token 失效：清本地凭证 + 回调跳登录页
    // 注意：不在这里清 user，让 page.ts 的 onShow catch 统一处理避免双重 navTo
    if (sc === 401 || sc === 403) {
      try { setToken('') } catch {}
      if (_onAuthFailed) _onAuthFailed(new Error(errMsg))
    }
    throw new Error(errMsg)
  }
  return data
}

// 错误/提示浮层：
// 1. 直接调 globalThis.__webltErrorBanner.show(msg) - 挂载在 ErrorBanner 组件
//    mounted 时的全局引用。避免之前 base-page.js 转发 toast 时 this.$root 失效的 bug
//    （falcon Page 不是 Vue 组件，$root 是 undefined，导致 banner 红色显示但文字看不见）
// 2. 兼容 trigger 事件（其他可能仍在监听的代码）
// 3. native $falcon.jsapi.ui.showToast 兜底（防止 banner 还没挂载时也能提示）
export function showToast(msg: string) {
  const text = (msg === undefined || msg === null) ? '' : String(msg)
  try {
    const banner = (globalThis as any).__webltErrorBanner
    if (banner && typeof banner.show === 'function') {
      banner.show(text)
    }
  } catch {}
  try {
    if (typeof $falcon !== 'undefined' && typeof $falcon.trigger === 'function') {
      $falcon.trigger('app:toast', { msg: text })
    }
  } catch {}
  try {
    if ($falcon?.jsapi?.ui?.showToast) {
      ($falcon as any).jsapi.ui.showToast({ message: text })
    }
  } catch {}
}

export const api = {
  // 认证
  sendCode: (email: string) =>
    request('/auth/send-code', { method: 'POST', data: { email } }),
  register: (username: string, password: string, email: string, code: string) =>
    request('/auth/register', { method: 'POST', data: { username, password, email, code } }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', data: { username, password } }),
  getMe: () => request('/auth/me'),

  // 用户
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request('/users/profile', { method: 'PUT', data }),
  updateThemeColor: (themeColor: string) =>
    request('/users/theme-color', { method: 'PUT', data: { themeColor } }),

  // 好友
  searchUsers: (q: string) => request(`/friends/search?q=${encodeURIComponent(q)}`),
  sendFriendRequest: (friendId: string) =>
    request('/friends/request', { method: 'POST', data: { friendId } }),
  handleFriendRequest: (requestId: number, action: string) =>
    request('/friends/handle', { method: 'PUT', data: { requestId, action } }),
  getFriends: () => request('/friends/list'),
  getFriendRequests: () => request('/friends/requests'),
  getUserByUid: (uid: string) => request(`/users/uid/${encodeURIComponent(uid)}`),

  // 群聊
  createGroup: (name: string) => request('/groups', { method: 'POST', data: { name } }),
  joinGroup: (id: string) => request(`/groups/${encodeURIComponent(id)}/join`, { method: 'POST' }),
  leaveGroup: (id: string) => request(`/groups/${encodeURIComponent(id)}/leave`, { method: 'POST' }),
  disbandGroup: (id: string) => request(`/groups/${encodeURIComponent(id)}/disband`, { method: 'POST' }),
  getMyGroups: () => request('/groups/mine'),
  getGroupMembers: (id: string) => request(`/groups/${encodeURIComponent(id)}/members`),

  // 消息
  sendPrivateMessage: (receiverId: string, content: string) =>
    request('/messages/private', { method: 'POST', data: { receiverId, content } }),
  getPrivateMessages: (userId: string, limit = 50) =>
    request(`/messages/private/${encodeURIComponent(userId)}?limit=${limit}`),
  sendGroupMessage: (groupId: string, content: string) =>
    request(`/messages/group/${encodeURIComponent(groupId)}`, { method: 'POST', data: { content } }),
  getGroupMessages: (groupId: string, limit = 50) =>
    request(`/messages/group/${encodeURIComponent(groupId)}?limit=${limit}`),
  sendPublicMessage: (content: string, permanent = false) =>
    request('/messages/public', { method: 'POST', data: { content, permanent } }),
  getPublicMessages: (limit = 50) =>
    request(`/messages/public?limit=${limit}`),
  getUnread: () => request('/messages/unread'),

  // 签到
  checkin: () => request('/checkin', { method: 'POST' }),
  getCheckinStatus: () => request('/checkin/status'),
  buyLoudspeaker: () => request('/checkin/buy-loudspeaker', { method: 'POST' }),
  getItems: () => request('/checkin/items'),

  // 公告
  getAnnouncement: () => request('/announcement'),
}
