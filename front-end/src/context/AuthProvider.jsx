import { startTransition, useState } from 'react'
import { AuthContext } from './auth'
import { getRegisteredMockAccount, saveMockAccount } from '../services/mockSignUp'

// where the logged-in user is saved
const storageKey = 'betOnYourFriendsUser'

function loadSavedUser() {
  try {
    const savedUser = JSON.parse(sessionStorage.getItem(storageKey))
    if (!savedUser) return null
    const account = getRegisteredMockAccount(savedUser.email) || savedUser
    saveMockAccount(account)
    return account
  } catch {
    return null
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSavedUser)

  // log in with saved user
  function logIn(newUser) {
    saveMockAccount(newUser)
    sessionStorage.setItem(storageKey, JSON.stringify(newUser))
    setUser(newUser)
  }

  // forget the user on log out
  function logOut() {
    sessionStorage.removeItem(storageKey)
    startTransition(() => setUser(null))
  }

  return (
    <AuthContext.Provider value={{ user, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
