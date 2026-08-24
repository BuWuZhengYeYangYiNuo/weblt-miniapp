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
    throw new Error(data?.error || `请求失败 (${sc})`)
  }
  return data
}

// 简易Toast提示
export function showToast(msg: string) {
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
  getUserByUid: (uid: string) => request(`/users/uid/${uid}`),

  // 群聊
  createGroup: (name: string) => request('/groups', { method: 'POST', data: { name } }),
  joinGroup: (id: string) => request(`/groups/${id}/join`, { method: 'POST' }),
  leaveGroup: (id: string) => request(`/groups/${id}/leave`, { method: 'POST' }),
  disbandGroup: (id: string) => request(`/groups/${id}/disband`, { method: 'POST' }),
  getMyGroups: () => request('/groups/mine'),
  getGroupMembers: (id: string) => request(`/groups/${id}/members`),

  // 消息
  sendPrivateMessage: (receiverId: string, content: string) =>
    request('/messages/private', { method: 'POST', data: { receiverId, content } }),
  getPrivateMessages: (userId: string, limit = 50) =>
    request(`/messages/private/${userId}?limit=${limit}`),
  sendGroupMessage: (groupId: string, content: string) =>
    request(`/messages/group/${groupId}`, { method: 'POST', data: { content } }),
  getGroupMessages: (groupId: string, limit = 50) =>
    request(`/messages/group/${groupId}?limit=${limit}`),
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
