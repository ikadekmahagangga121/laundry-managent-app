import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { setAuthToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [userRole, setUserRole] = useState(localStorage.getItem('role'))

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
    setAuthToken(token)
  }, [token])
  useEffect(() => {
    if (userRole) localStorage.setItem('role', userRole); else localStorage.removeItem('role')
  }, [userRole])

  const login = (newToken, role) => {
    setToken(newToken)
    setUserRole(role)
  }
  const logout = () => {
    setToken(null)
    setUserRole(null)
  }

  const value = useMemo(() => ({ token, userRole, login, logout }), [token, userRole])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

