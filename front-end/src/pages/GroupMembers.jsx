import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getDisplayName, useAuth } from '../context/auth'
import {
  getMockGroupById,
  getMockGroupMembers,
  leaveMockGroup
} from '../services/mockGroups'

function GroupMembers() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // group, group's members, and display error
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // leave group confirmation and display error
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  // load group and its members
  useEffect(() => {
    let buffer = false

    Promise.all([getMockGroupById(groupId), getMockGroupMembers(groupId)])
      .then(([foundGroup, groupMembers]) => {
        if (buffer) return

        setGroup(foundGroup)
        setMembers(groupMembers)
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
  }, [groupId])

  // close confirmation with the escape key
  useEffect(() => {
    if (!showLeaveConfirm) return

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !leaving) setShowLeaveConfirm(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLeaveConfirm, leaving])

  // check if user in the group
  const isMember = group?.memberIds.includes(user.id)

  // show the user first, then everyone else
  const sortedMembers = [
    ...members.filter((member) => member.id === user.id),
    ...members.filter((member) => member.id !== user.id)
  ]

  // run upon closing the confirmation
  function handleCancel() {
    if (leaving) return

    setShowLeaveConfirm(false)
    setLeaveError('')
  }

  // run upon confirming leave group
  async function handleLeave() {
    setLeaveError('')
    setLeaving(true)

    try {
      await leaveMockGroup(group.id, user.id)

      // return to my groups with notification
      navigate('/groups', {
        replace: true,
        state: { leftGroupName: group.name }
      })
    } catch (error) {
      setLeaveError(error.message)
      setLeaving(false)
    }
  }

  return (
    <AppLayout title={group?.name || 'Group'} back={`/groups/${groupId}`}>
      {loading && <p className="text-gray-500">Loading members...</p>}

      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}

      {/* group not found or user not in group */}
      {!loading && !loadError && !isMember && (
        <p className="text-gray-500">This group could not be found.</p>
      )}

      {isMember && (
        <>
          <h2 className="text-2xl font-bold">
            Group members · {members.length}
          </h2>

          {/* member list with the user first */}
          <ul className="mt-4 space-y-3">
            {sortedMembers.map((member) => {
              const isYou = member.id === user.id

              return (
                <li
                  key={member.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <img
                    src={
                      isYou && user.photoUrl
                        ? user.photoUrl
                        : `https://picsum.photos/seed/user-${member.id}/96/96`
                    }
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full bg-nyu-lavender object-cover"
                  />

                  <p className="min-w-0 flex-1 truncate font-medium">
                    {isYou ? `${getDisplayName(user)} (You)` : member.name}
                  </p>

                  {member.isAdmin && (
                    <span className="rounded-full bg-nyu-lavender px-3 py-1 text-xs font-semibold text-nyu-violet">
                      Admin
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="mt-8 w-full rounded-lg border border-red-600 bg-white p-3 font-semibold text-red-600 hover:bg-red-50"
          >
            Leave group
          </button>
        </>
      )}

      {/* leave group confirmation popup */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4"
          onClick={handleCancel}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-group-title"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="leave-group-title" className="text-xl font-bold">
              Leave {group.name}?
            </h3>

            <p className="mt-2 text-gray-600">
              You will need a new invitation to join this group again.
            </p>

            {leaveError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {leaveError}
              </p>
            )}

            <button
              type="button"
              autoFocus
              onClick={handleCancel}
              disabled={leaving}
              className="mt-6 w-full rounded-lg border border-gray-300 bg-white p-3 font-semibold text-gray-700 hover:border-nyu-violet disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="mt-3 w-full rounded-lg bg-red-600 p-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {leaving ? 'Leaving...' : 'Leave group'}
            </button>
          </section>
        </div>
      )}
    </AppLayout>
  )
}

export default GroupMembers
