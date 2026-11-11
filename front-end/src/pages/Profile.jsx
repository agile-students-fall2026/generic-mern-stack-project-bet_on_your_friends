import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast from '../components/Toast'
import { getDisplayName, useAuth } from '../context/auth'
import { apiRequest } from '../services/api'
import {
  updateMockDisplayName,
  updateMockProfilePhoto
} from '../services/mockProfile'

// form input stlying -> rounded boxes
// red outline -> error
function inputStyle(hasError) {
  return `mt-2 w-full rounded-lg border p-3 font-normal outline-none ${
    hasError ? 'border-red-600' : 'border-gray-300 focus:border-nyu-violet'
  }`
}

// display name length limit
const maxDisplayNameLength = 30

// password requirements: 8-64 characters, uppercase, lowercase, and a number
function isValidPassword(password) {
  return (
    password.length >= 8 &&
    password.length <= 64 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

function Profile() {
  const navigate = useNavigate()
  const { user, logIn, logOut } = useAuth()

  // display profile name
  const [displayName, setDisplayName] = useState(getDisplayName(user))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // change and display error for profile picture
  const [changingPhoto, setChangingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // notification after save on the page
  const [toastMessage, setToastMessage] = useState('')

  // fall back to the prior photo if unchanged
  const photoUrl =
    user.photoUrl || `https://picsum.photos/seed/user-${user.id}/192/192`

  // name too short or long check
  const displayNameTooShort = displayName.replace(/\s/g, '').length < 3
  const displayNameTooLong = displayName.length > maxDisplayNameLength

  const displayNameValid = !displayNameTooShort && !displayNameTooLong

  // only save if entered name is different from saved
  const changed = displayName.trim() !== getDisplayName(user)

  const formValid = displayNameValid && changed && !saving

  // check new password rules and that both fields match
  const newPasswordValid = isValidPassword(newPassword)
  const passwordsMatch =
    confirmPassword !== '' && newPassword === confirmPassword

  // allow submitting once every password field is valid
  const passwordFormValid =
    currentPassword !== '' &&
    newPasswordValid &&
    passwordsMatch &&
    !changingPassword

  // popup notification timeout
  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => setToastMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // run upon new name save
  async function handleSubmit(event) {
    event.preventDefault()

    if (!formValid) return

    setSaveError('')
    setSaving(true)

    try {
      const updatedUser = await updateMockDisplayName(user, displayName)

      // save updated user so the new name updates everywhere
      logIn(updatedUser)
      setDisplayName(getDisplayName(updatedUser))
      setToastMessage('Display name updated.')
    } catch (error) {
      setSaveError(error.message)
    }

    setSaving(false)
  }

  // run upon picking a new profile picture
  async function handlePhotoChange(event) {
    const file = event.target.files[0]

    event.target.value = ''

    if (!file || changingPhoto) return

    setPhotoError('')
    setChangingPhoto(true)

    try {
      const updatedUser = await updateMockProfilePhoto(user, file)

      // save updated user so new photo updates everywhere
      logIn(updatedUser)
      setToastMessage('Profile picture updated.')
    } catch (error) {
      setPhotoError(error.message)
    }

    setChangingPhoto(false)
  }

  // run upon changing password
  async function handlePasswordSubmit(event) {
    event.preventDefault()

    if (!passwordFormValid) return

    setPasswordError('')
    setChangingPassword(true)

    try {
      // the back-end checks the current password and saves the new one
      await apiRequest(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        body: { currentPassword, newPassword, confirmPassword }
      })

      // clear the form so passwords aren't left on the screen
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setToastMessage('Password updated.')
    } catch (error) {
      setPasswordError(error.message)
    }

    setChangingPassword(false)
  }

  // run upon log out of app
  async function handleLogOut() {
    try {
      // inform back-end that user is logging out
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch {
      // still log out even if the server can't be reached
    }

    // forget the saved user and go back to the home page
    logOut()
    navigate('/', { replace: true })
  }

  return (
    <AppLayout title="Profile">

      {/* profile picture display and change, name, and email display */}
      <section className="flex flex-col items-center text-center">
        <img
          src={photoUrl}
          alt=""
          className="h-24 w-24 rounded-full bg-nyu-lavender object-cover ring-4 ring-white shadow-sm"
        />

        {/* opens photo gallery or files */}
        <label
          className={`mt-3 rounded text-sm font-semibold focus-within:ring-2 focus-within:ring-nyu-violet ${
            changingPhoto
              ? 'cursor-not-allowed text-gray-400'
              : 'cursor-pointer text-nyu-violet hover:text-nyu-ultraviolet'
          }`}
        >
          {changingPhoto ? 'Changing profile picture...' : 'Change profile picture'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={changingPhoto}
            onChange={handlePhotoChange}
          />
        </label>

        {photoError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {photoError}
          </p>
        )}

        <h2 className="mt-4 text-2xl font-bold">{getDisplayName(user)}</h2>
        <p className="text-gray-500">{user.email}</p>
      </section>

      {/* change display name */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label className="block font-medium">
          Display name
          <input
            type="text"
            autoComplete="nickname"
            aria-invalid={!displayNameValid}
            className={inputStyle(!displayNameValid)}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setSaveError('')
            }}
          />

          {/* character count for name input, red error when above the limit */}
          <span
            className={`mt-1 block text-right text-xs font-normal ${
              displayNameTooLong ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {displayName.length}/{maxDisplayNameLength}
          </span>
        </label>

        <p className="mt-1 text-sm text-gray-500">
          Shown to friends in groups and on leaderboards.
        </p>

        {displayNameTooShort && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            Display name must be at least 3 characters.
          </p>
        )}

        {displayNameTooLong && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            Display name must be {maxDisplayNameLength} characters or less.
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

      {/* change password */}
      <form
        onSubmit={handlePasswordSubmit}
        className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold">Change password</h2>

        <label className="mt-4 block font-medium">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            className={inputStyle(false)}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setPasswordError('')
            }}
          />
        </label>

        <label className="mt-4 block font-medium">
          New password
          <input
            type="password"
            autoComplete="new-password"
            aria-invalid={newPassword !== '' && !newPasswordValid}
            className={inputStyle(newPassword !== '' && !newPasswordValid)}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setPasswordError('')
            }}
          />

          {/* same password rules as Create Account */}
          <span className="mt-1 block text-xs font-normal text-gray-500">
            Between 8-64 characters, one uppercase, one lowercase, and one number.
          </span>
        </label>

        {/* show error if the new password is invalid */}
        {newPassword && !newPasswordValid && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            Password does not meet the requirements.
          </p>
        )}

        <label className="mt-4 block font-medium">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            aria-invalid={confirmPassword !== '' && !passwordsMatch}
            className={inputStyle(confirmPassword !== '' && !passwordsMatch)}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setPasswordError('')
            }}
          />
        </label>

        {/* error if new passwords don't match */}
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            Passwords do not match.
          </p>
        )}

        {/* backend errors */}
        {passwordError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {passwordError}
          </p>
        )}

        <button
          type="submit"
          disabled={!passwordFormValid}
          className="mt-4 w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {changingPassword ? 'Changing password...' : 'Change Password'}
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
