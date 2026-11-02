import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast from '../components/Toast'
import { getDisplayName, useAuth } from '../context/auth'
import { updateMockDisplayName } from '../services/mockProfile'

// form input stlying -> rounded boxes
const inputStyle =
  'mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal outline-none focus:border-nyu-violet'

// display name length limit
const maxDisplayNameLength = 30

function Profile() {
  const navigate = useNavigate()
  const { user, logIn, logOut } = useAuth()

  const [displayName, setDisplayName] = useState(getDisplayName(user))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // valid name check
  const displayNameValid = displayName.replace(/\s/g, '').length >= 3

  // TODO: add functionality for the user to change their profile picture

  const changed = displayName.trim() !== getDisplayName(user)

  const formValid = displayNameValid && changed && !saving

  // toast timeout
  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => setToastMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // run upon name new save
  async function handleSubmit(event) {
    event.preventDefault()

    if (!formValid) return

    setSaveError('')
    setSaving(true)

    try {
      const updatedUser = await updateMockDisplayName(user, displayName)

      logIn(updatedUser)
      setDisplayName(getDisplayName(updatedUser))
      setToastMessage('Display name updated.')
    } catch (error) {
      setSaveError(error.message)
    }

    setSaving(false)
  }

  // run upon log out
  function handleLogOut() {
    logOut()
    navigate('/', { replace: true })
  }

  return (
    <AppLayout title="Profile">

      <section className="flex flex-col items-center text-center">
        <img
          src={`https://picsum.photos/seed/user-${user.id}/192/192`}
          alt=""
          className="h-24 w-24 rounded-full bg-nyu-lavender object-cover ring-4 ring-white shadow-sm"
        />

        <h2 className="mt-4 text-2xl font-bold">{getDisplayName(user)}</h2>
        <p className="text-gray-500">{user.email}</p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label className="block font-medium">
          Display name
          <input
            type="text"
            autoComplete="nickname"
            maxLength={maxDisplayNameLength}
            className={inputStyle}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setSaveError('')
            }}
          />
        </label>

        <p className="mt-1 text-sm text-gray-500">
          Shown to friends in groups and on leaderboards.
        </p>

        {!displayNameValid && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            Display name must be at least 3 characters.
          </p>
        )}

        {saveError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {saveError}
          </p>
        )}

        <button
          type="submit"
          disabled={!formValid}
          className="mt-4 w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleLogOut}
        className="mt-6 w-full rounded-lg border border-red-600 bg-white p-3 font-semibold text-red-600 hover:bg-red-50"
      >
        Log Out
      </button>

      <Toast message={toastMessage} />
    </AppLayout>
  )
}

export default Profile
