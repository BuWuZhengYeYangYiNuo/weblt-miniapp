import { setItem, getItem } from './mem-storage'

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
  const { setToken } = await import('./api')
  setToken(token)
  _user = user
  await setItem('token', token)
  await setItem('user', JSON.stringify(user))
}

export async function clearAuth() {
  const { setToken } = await import('./api')
  setToken('')
  _user = null
  await setItem('token', '')
  await setItem('user', '')
}

export async function initAuth() {
  const { loadToken } = await import('./api')
  await loadToken()
  try {
    const userStr = await getItem('user')
    if (userStr) _user = JSON.parse(userStr)
  } catch {}
}