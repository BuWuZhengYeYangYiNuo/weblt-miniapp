// API 帮助模块 - 有道词典笔版
const API_BASE = 'https://api.lt.132453.xyz'

let _token: string = ''

export async function loadToken() {
  try {
    const res = await $falcon.jsapi.storage.getStorage({ key: 'token' })
    _token = res.data || ''
  } catch {
    _token = ''
  }
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
    res = await $falcon.jsapi.http.request({
      url: `${API_BASE}/api${path}`,
      method: (options.method || 'GET') as any,
      headers,
      data: options.data ? JSON.stringify(options.data) : undefined,
      timeout: 10000,
    })
  } catch (err: any) {
    // native http.request 抛错时通常是网络/DNS 失败（词典笔没网），带 message 让上层 toast 提示
    throw new Error(err?.message || '网络异常，请检查网络连接')
  }

  // 防止 res 为 null/undefined（native 引擎异常）
  if (!res) {
    throw new Error('网络异常，请稍后重试')
  }

  let data = res.data
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch {}
  }

  // statusCode 为 0 或缺失通常意味着网络层失败
  const sc = res.statusCode
  if (typeof sc !== 'number' || sc === 0) {
    throw new Error('网络异常，请检查网络连接')
  }
  if (sc >= 400) {
    const errMsg = (data && typeof data === 'object' && data.error) || `请求失败 (${sc})`
    // 401/403 token 失效：清本地凭证 + 回调跳登录页
    if (sc === 401 || sc === 403) {
      try { setToken('') } catch {}
      if (_onAuthFailed) _onAuthFailed(new Error(errMsg))
    }
    throw new Error(errMsg)
  }
  return data
}

// 错误/提示浮层：
// 1. 触发 app:toast 全局事件，由 BasePage 转发给当前页面的 <ErrorBanner ref="errorBanner">，
//    在屏幕顶部居中显示（词典笔 260px 屏小，原生 showToast 在底部看不见）。
// 2. 同时保留 native $falcon.jsapi.ui.showToast 兜底（如 banner 还没挂载时仍能提示）。
export function showToast(msg: string) {
  try {
    ($falcon as any).trigger('app:toast', { msg })
  } catch {}
  try {
    if ($falcon?.jsapi?.ui?.showToast) {
      ($falcon as any).jsapi.ui.showToast({ message: msg })
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
