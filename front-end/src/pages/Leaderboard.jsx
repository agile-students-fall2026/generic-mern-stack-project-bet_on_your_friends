import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getDisplayName, useAuth } from '../context/auth'
import { apiRequest } from '../services/api'

function Leaderboard() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const selected = params.get('group') || ''
  // Reload rankings when the selected group or user changes.

  const [today] = useState(() =>
  new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
)

  useEffect(() => {
    let active = true
    async function load() {
      setError('')

      const groups = await apiRequest(`/api/users/${user.id}/groups`)
      let group = groups.find((item) => item.id === selected)
      if (!group) {
        group = groups[0]
      }
      let members = []
      if (group) {
        // the backend sends members sorted by coin balance
        members = await apiRequest(`/api/groups/${group.id}/leaderboard`)
      } 

      if (active) setData({ groups, group, members, selected })
    
    }
    load().catch((reason) => {
      if (active) setError(reason.message)
    })
    return () => {
      active = false
    }
  }, [selected, user])
  function handleGroupChange(event) {
    setParams({ group: event.target.value })
  }

  const ready = data && data.selected === selected
  let visibleMembers = []

  // Show the top three, plus your row if you're outside the top three.
  // Ranks use the full list, so tied balances share a rank.
  if (ready) {
    visibleMembers = data.members.slice(0, 3)

    const currentMember = data.members.find((member) => {
      return member.id === user.id
    })

    const userInTopThree = visibleMembers.some((member) => {
      return member.id === user.id
    })

    // Add your row if you are outside the top three.
    if (currentMember && !userInTopThree) {
      visibleMembers.push(currentMember)
    }
  }

  return (
    <AppLayout title="Leaderboard">
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!ready && !error && <p role="status">Loading rankings...</p>}
      {ready && data.groups.length > 0 && (
        <>
          <label className="block font-semibold">
            Group
            <select
              value={data.group.id}
              onChange={handleGroupChange}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3"
            >
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-sm text-gray-500">
            {data.members.length} members · {today}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Ranked by available virtual coins, highest first. Stakes in open
              bets are not available coins.
              </p>
          <ol className="mt-4 space-y-3">
            {/* put member's name + their coin balance as one slot in the leaderboard */}
            {/* ranked from highest coin to least amount */}
            {visibleMembers.map((member) => {
              // Equal balances share a rank based on the full member list.
              const rank =
                data.members.findIndex(
                  (item) => item.coinBalance === member.coinBalance
                ) + 1
              return (
                <li
                  key={member.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${member.id === user.id ? 'border-nyu-violet bg-nyu-lavender' : 'border-gray-200 bg-white'}`}
                >
                  <span className="w-6 font-bold" aria-label={`Rank ${rank}`}>
                    {rank}
                  </span>
                  <img
                  // user profile image shown on the leaderboard
                    src={`https://picsum.photos/seed/${member.id}/80/80`}
                    alt=""
                    className="h-9 w-9 rounded-full"
                  />
                  {/* leaderboard will always include where signed in user is
                   on the leaderboard with the ranking you're at within the group */}
                  <span className="min-w-0 flex-1 break-words font-semibold">
                    {getDisplayName(member)}
                    {member.id === user.id && ' (You)'}
                  </span>
                  <span className="text-right text-sm">
                    {member.coinBalance.toLocaleString()}
                    <br />
                    coins
                  </span>
                </li>
              )
            })}
          </ol>
          <Link
            to={`/groups/${data.group.id}`}
            className="mt-5 block text-center font-semibold text-nyu-violet"
          >
            Back to group
          </Link>
        </>
      )}
      {ready && data.groups.length === 0 && (
        <p>
          You have no groups yet.{' '}
          <Link to="/groups" className="text-nyu-violet underline">
            Find or create a group
          </Link>
          .
        </p>
      )}
    </AppLayout>
  )
}

export default Leaderboard