import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// let any page get the logged-in user and functions
export function useAuth() {
  const auth = useContext(AuthContext)

  if (!auth) {
    throw new Error('useAuth must be used inside of an AuthProvider')
  }

  return auth
}

// fall back to the name used to sign up if the user never changed it
export function getDisplayName(user) {
  return user.displayName || user.name
}
