'use client'

import { createContext, useContext, ReactNode } from 'react'

interface UserContextValue {
  userToken: string
  userId: 'a' | 'b'
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  userToken,
  userId,
  children,
}: UserContextValue & { children: ReactNode }) {
  return <UserContext.Provider value={{ userToken, userId }}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}

// Helper for making authenticated API calls
export function useApi() {
  const { userToken } = useUser()

  return {
    get: (url: string) =>
      fetch(url, { headers: { 'x-user-token': userToken } }),
    post: (url: string, body?: unknown) =>
      fetch(url, {
        method: 'POST',
        headers: { 'x-user-token': userToken, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    postForm: (url: string, formData: FormData) =>
      fetch(url, {
        method: 'POST',
        headers: { 'x-user-token': userToken },
        body: formData,
      }),
  }
}
