import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast from '../components/Toast'
import { useAuth } from '../context/auth'
import { apiRequest } from '../services/api'
import { isGroupFull } from '../services/mockGroups'

function InviteFriends() {
  const { groupId } = useParams()
  const { user } = useAuth()

  // group being invited to and display error form
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // notification after copying link on the page
  const [toastMessage, setToastMessage] = useState('')

  // load group user is inviting another user to
  useEffect(() => {
    let buffer = false

    apiRequest(`/api/groups/${groupId}`)
      .then((foundGroup) => {
        if (!buffer) setGroup(foundGroup)
      })
      .catch((error) => {
        // back-end's 404 error when group doesn't exist
        if (!buffer) setLoadError(error.message)
      })
      .finally(() => {
        if (!buffer) setLoading(false)
      })

    return () => {
      buffer = true
    }
  }, [groupId])

  // popup notification timeout
  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => setToastMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // check if user in group
  const isMember = group?.memberIds.includes(user.id)

  // check if user can invite
  const canInvite =
    isMember &&
    (group.whoCanInvite === 'all' || group.adminIds.includes(user.id))

  // check if group has reached member limit
  const groupFull = group ? isGroupFull(group) : false

  // current member count
  const memberCount = group
    ? `${group.memberIds.length}${
        group.memberLimit != null ? `/${group.memberLimit}` : ''
      } ${
        group.memberIds.length === 1 && group.memberLimit == null
          ? 'member'
          : 'members'
      }`
    : ''

  // link to join group
  const inviteLink = group
    ? `${window.location.origin}/join/${group.inviteCode}`
    : ''

  // run upon copying invite link
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setToastMessage('Link copied to clipboard.')
    } catch {
      setToastMessage('Unable to copy the link. Please try again.')
    }
  }

  return (
    <AppLayout title="My Groups" back="/groups">
      <h2 className="text-3xl font-bold text-nyu-violet">Invite friends</h2>

      {loading && <p className="mt-4 text-gray-500">Loading group...</p>}

      {loadError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {/* group not found or user not in group */}
      {!loading && !loadError && !isMember && (
        <p className="mt-4 text-gray-500">
          This group could not be found.
        </p>
      )}

      {/* admins only message for others */}
      {isMember && !canInvite && (
        <>
          <p className="mt-1 text-gray-500">
            {group.name} · {memberCount}
          </p>
          <p className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-gray-600">
            Only admins can invite friends to this group.
          </p>
        </>
      )}

      {/* group name and member count */}
      {canInvite && (
        <p className="mt-1 text-gray-500">
          {group.name} · {memberCount}
        </p>
      )}

      {/* group hit limit message instead of invite link */}
      {canInvite && groupFull && (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-600"
          role="alert"
        >
          This group is full. No more friends can join.
        </p>
      )}

      {/* invite link display and copy */}
      {canInvite && !groupFull && (
        <>
          <p className="mt-6 text-gray-700">
            Copy the link and send it to friends you want to invite.
          </p>

          <label className="mt-6 block font-medium" htmlFor="invite-link">
            Invite link
          </label>

          <div className="mt-2 flex gap-3">
            <input
              id="invite-link"
              type="text"
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white p-3 text-gray-700 outline-none focus:border-nyu-violet"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg bg-nyu-violet px-5 font-semibold text-white hover:bg-nyu-ultraviolet"
            >
              Copy
            </button>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Anyone with this link can join.
          </p>
        </>
      )}

      {/* link back to group */}
      {isMember && (
        <Link
          to={`/groups/${group.id}`}
          className="mt-10 block rounded-lg border border-nyu-violet p-3 text-center font-semibold text-nyu-violet hover:bg-nyu-lavender"
        >
          Go to group
        </Link>
      )}

      <Toast message={toastMessage} />
    </AppLayout>
  )
}

export default InviteFriends
