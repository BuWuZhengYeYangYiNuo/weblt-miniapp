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
    // 文档明确：$falcon.jsapi.storage.setItem({key, value})，
    // 字段名是 value 不是 data
    await $falcon.jsapi.storage.setItem({ key: 'token', value: token })
    await $falcon.jsapi.storage.setItem({ key: 'user', value: JSON.stringify(user) })
  } catch {}
}

export async function clearAuth() {
  setToken('')
  _user = null
  try {
    await $falcon.jsapi.storage.setItem({ key: 'token', value: '' })
    await $falcon.jsapi.storage.setItem({ key: 'user', value: '' })
  } catch {}
}

export async function initAuth() {
  await loadToken()
  try {
    // getItem 直接返回 string 值（不是 {data: string}）
    const userStr: string = await $falcon.jsapi.storage.getItem({ key: 'user' })
    if (userStr) _user = JSON.parse(userStr)
  } catch {}
}