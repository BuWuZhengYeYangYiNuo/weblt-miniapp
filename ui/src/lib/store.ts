import { loadToken, setToken } from './api'

export interface UserInfo {
  id: string
  uid: string
  username: string
  email: string
  nickname: string
  avatar: string
  role: string
  theme_color: string
  points: number
}

let _user: UserInfo | null = null

export function getUser(): UserInfo | null { return _user }
export function setUser(user: UserInfo | null) { _user = user }

export async function saveAuth(token: string, user: UserInfo) {
  setToken(token)
  _user = user
  try {
    await $falcon.jsapi.storage.setStorage({ key: 'token', data: token })
    await $falcon.jsapi.storage.setStorage({ key: 'user', data: JSON.stringify(user) })
  } catch {}
}

export async function clearAuth() {
  setToken('')
  _user = null
  try {
    await $falcon.jsapi.storage.setStorage({ key: 'token', data: '' })
    await $falcon.jsapi.storage.setStorage({ key: 'user', data: '' })
  } catch {}
}

export async function initAuth() {
  await loadToken()
  try {
    const res = await $falcon.jsapi.storage.getStorage({ key: 'user' })
    if (res.data) _user = JSON.parse(res.data)
  } catch {}
}
