import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/auth'
import {
  getMockGroupByInviteCode,
  isGroupFull,
  joinMockGroup
} from '../services/mockGroups'

function JoinGroup() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  // load group for invite
  useEffect(() => {
    let buffer = false

    getMockGroupByInviteCode(inviteCode)
      .then((foundGroup) => {
        if (!buffer) setGroup(foundGroup)
      })
      .catch((loadError) => {
        if (!buffer) setError(loadError.message)
      })
      .finally(() => {
        if (!buffer) setLoading(false)
      })

    return () => {
      buffer = true
    }
  }, [inviteCode])

  // check if user already in group
  const alreadyMember = group?.memberIds.includes(user.id)

  // check if group has reached member limit
  const groupFull = group ? isGroupFull(group) : false

  // run upon acceptance
  async function handleJoin() {
    setError('')
    setJoining(true)

    try {
      await joinMockGroup(group.id, user.id)

      navigate('/groups', { state: { joinedGroupName: group.name } })
    } catch (joinError) {
      setError(joinError.message)
      setJoining(false)
    }
  }

  return (
    <AppLayout title="Join a group" back="/groups">
      {loading && <p className="text-gray-500">Loading invite...</p>}

      {!loading && !group && !error && (
        <>
          <h2 className="text-3xl font-bold text-nyu-violet">
            Invite not found
          </h2>
          <p className="mt-2 text-gray-500">
            This invite link is invalid or has expired. Ask your friend to send
            you a new one.
          </p>
          <Link
            to="/groups"
            className="mt-6 block rounded-lg border border-nyu-violet p-3 text-center font-semibold text-nyu-violet hover:bg-nyu-lavender"
          >
            Back to My Groups
          </Link>
        </>
      )}

      {group && (
        <>
          <h2 className="text-3xl font-bold text-nyu-violet">
            {alreadyMember ? "You're already in this group" : 'You have been invited'}
          </h2>

          <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <img
              src={`https://picsum.photos/seed/${group.photoSeed || group.id}/600/240`}
              alt=""
              className="h-32 w-full bg-nyu-lavender object-cover"
            />

            <div className="p-5">
              <p className="text-2xl font-bold">{group.name}</p>
              <p className="mt-1 text-sm text-gray-500">
                {group.memberIds.length}
                {group.memberLimit != null && `/${group.memberLimit}`}{' '}
                {group.memberIds.length === 1 && group.memberLimit == null
                  ? 'member'
                  : 'members'}
              </p>
              <p className="mt-3 text-gray-700">
                {group.description || 'Make predictions with your friends.'}
              </p>
            </div>
          </section>

          {alreadyMember ? (
            <Link
              to={`/groups/${group.id}`}
              className="mt-6 block rounded-lg bg-nyu-violet p-3 text-center font-semibold text-white hover:bg-nyu-ultraviolet"
            >
              Go to group
            </Link>
          ) : (
            <>
              {/* group hit limit message */}
              {groupFull && (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  This group is full and cannot take any new members.
                </p>
              )}

              <button
                type="button"
                onClick={handleJoin}
                disabled={joining || groupFull}
                className="mt-6 w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {joining ? 'Joining...' : 'Join group'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/groups')}
                className="mt-3 w-full p-3 font-semibold text-gray-600 hover:text-nyu-violet"
              >
                Decline
              </button>
            </>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </AppLayout>
  )
}

export default JoinGroup
