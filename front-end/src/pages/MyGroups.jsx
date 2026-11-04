import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast from '../components/Toast'
import { getDisplayName, useAuth } from '../context/auth'
import { getMockGroupsForUser } from '../services/mockGroups'

// form input stlying -> rounded boxes
const inputStyle =
  'w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-nyu-violet'

// receive invite code
function getInviteCode(invite) {
  return (invite.trim().split('/').filter(Boolean).pop() ?? '').toUpperCase()
}

function MyGroups() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // welcome banner is only shown right after creating an account
  const [showWelcome, setShowWelcome] = useState(
    Boolean(location.state?.signupCompleted)
  )

  // shown after joining a group from invite or leaving a group
  const [toastMessage, setToastMessage] = useState(
    location.state?.joinedGroupName
      ? `You joined ${location.state.joinedGroupName}.`
      : location.state?.leftGroupName
        ? `You left ${location.state.leftGroupName}.`
        : ''
  )

  // join group with an invite code
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [invite, setInvite] = useState('')
  const inviteCode = getInviteCode(invite)
  const inviteValid = /^[A-Z0-9]{6}$/.test(inviteCode)

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  // load user groups
  useEffect(() => {
    let buffer = false

    getMockGroupsForUser(user.id)
      .then((userGroups) => {
        if (!buffer) setGroups(userGroups)
      })
      .catch((error) => {
        if (!buffer) setLoadError(error.message)
      })
      .finally(() => {
        if (!buffer) setLoading(false)
      })

    return () => {
      buffer = true
    }
  }, [user.id])

  // notification timeout
  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => setToastMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // run upon invite code submission
  function handleJoin(event) {
    event.preventDefault()

    if (!inviteValid) return

    navigate(`/join/${inviteCode}`)
  }

  return (
    <AppLayout title="My Groups">

      {showWelcome && (
        <section className="mb-6 rounded-xl bg-nyu-violet p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold">
              Welcome, {getDisplayName(user).split(' ')[0]}!
            </h2>

            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="text-sm text-white/80 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <p className="mt-2 text-white/90">
            You start with {user.coinBalance.toLocaleString()} coins to bet with.
          </p>
        </section>
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Your groups</h2>

        {!loading && !loadError && (
          <p className="text-sm text-gray-500">
            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          </p>
        )}
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading your groups...</p>}

      {loadError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && groups.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-gray-500">
          You are not in any groups yet. Create one or join with an invite code.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {groups.map((group) => (
          <li key={group.id}>
            <Link
              to={`/groups/${group.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-nyu-violet"
            >
              <img
                src={`https://picsum.photos/seed/${group.photoSeed || group.id}/96/96`}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg bg-nyu-lavender object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{group.name}</p>
                <p className="text-sm text-gray-500">
                  {group.memberIds.length}{' '}
                  {group.memberIds.length === 1 ? 'member' : 'members'} ·{' '}
                  {group.openPredictions} open{' '}
                  {group.openPredictions === 1 ? 'prediction' : 'predictions'}
                </p>
              </div>

              <span className="text-2xl text-gray-400" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/groups/new"
        className="mt-4 block rounded-xl border-2 border-dashed border-nyu-violet/40 p-4 text-center font-semibold text-nyu-violet hover:bg-nyu-lavender"
      >
        + Create a group
      </Link>

      {showJoinForm ? (
        <form
          onSubmit={handleJoin}
          className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <label className="block font-medium">
            Invite link or code
            <input
              type="text"
              placeholder="OTH321"
              autoFocus
              className={`mt-2 ${inputStyle}`}
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </label>

          {invite && !inviteValid && (
            <p className="mt-1 text-sm text-red-600">
              Invite codes are 6 letters and numbers.
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowJoinForm(false)
                setInvite('')
              }}
              className="flex-1 rounded-lg border border-gray-300 p-3 font-semibold text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!inviteValid}
              className="flex-1 rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowJoinForm(true)}
          className="mt-3 w-full rounded-xl border border-nyu-violet p-4 font-semibold text-nyu-violet hover:bg-nyu-lavender"
        >
          Join a group
        </button>
      )}

      <Toast message={toastMessage} />
    </AppLayout>
  )
}

export default MyGroups
