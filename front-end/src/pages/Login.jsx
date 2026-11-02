import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { logInMockAccount } from '../services/mockLogIn'

// form input stlying -> rounded boxes
const inputStyle =
  'mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-nyu-violet'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from || '/groups'

  // check for valid email format
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  // check for valid form submission
  const formValid = emailValid && password !== '' && !submitting

  // runs upon form submission
  async function handleSubmit(event) {
    event.preventDefault()

    if (!formValid) return

    setLoginError('')
    setSubmitting(true)

    try {
      const loggedInUser = await logInMockAccount({ email, password })
      logIn(loggedInUser)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setLoginError(error.message)
      setSubmitting(false)
    }
  }

  // skip log in page for logged-in user
  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <main className="min-h-screen bg-[#f8f5fb] px-4 py-8">
      <div className="mx-auto max-w-md px-4 py-6">

        <p className="font-semibold text-nyu-violet">Bet on Your Friends</p>

        <h1 className="mt-6 text-3xl font-bold text-nyu-violet">
          Log In
        </h1>

        <p className="mt-2 text-gray-500">
          Welcome back! Your groups are waiting.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          <label className="block font-medium">
            Email
            <input
              type="email"
              placeholder="jane.doe@example.com"
              autoComplete="email"
              required
              className={inputStyle}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setLoginError('')
              }}
            />

            {email && !emailValid && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                Please enter a valid email address.
              </span>
            )}
          </label>

          <label className="block font-medium">
            Password
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className={inputStyle}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setLoginError('')
              }}
            />
          </label>

          {loginError && (
            <p className="text-sm text-red-600" role="alert">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={!formValid}
            className="w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-nyu-violet">
            Create one
          </Link>
        </p>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-semibold text-nyu-violet">
            Back to Home
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
