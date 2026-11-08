import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import FilterButtons from '../components/FilterButtons'
import BetResult from '../components/BetResult'
import { useAuth } from '../context/auth'
import { getMockMyBets } from '../services/mockPredictions'

// show the user's bets and their results across groups
function MyBets() {
  const { user } = useAuth()

  // bets, selected filter, and loading errors
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('All bets')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // load bets for the signed-in user
  useEffect(() => {
    let buffer = false

    getMockMyBets(user)
      .then((bets) => {
        if (!buffer) setRows(bets)
      })
      .catch((problem) => {
        if (!buffer) setError(problem.message)
      })
      .finally(() => {
        if (!buffer) setLoading(false)
      })

    return () => {
      buffer = true
    }
  }, [user])

  // pending means a final outcome hasn't been chosen yet
  const filteredRows = rows.filter((row) => {
    if (filter === 'Pending') {
      return !row.prediction.result
    }

    if (filter === 'Resolved') {
      return Boolean(row.prediction.result)
    }

    return true
  })

  return (
    <AppLayout title="My Bets">
      <FilterButtons
        options={['All bets', 'Pending', 'Resolved']}
        value={filter}
        onChange={setFilter}
        label="Filter my bets"
      />

      {loading && (
        <p role="status" className="mt-4">
          Loading your bets...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <p className="mt-5 text-gray-500">
          No {filter === 'All bets' ? '' : filter.toLowerCase() + ' '}bets yet.
        </p>
      )}

      {/* bet details and results */}
      <ul className="mt-5 space-y-4">
        {filteredRows.map((row) => {
          const groupId = row.groupId
          const group = row.group
          const prediction = row.prediction
          const bet = row.bet

          // old bets stay visible after leaving, but the group can't be opened
          const canOpen = group && group.memberIds.includes(user.id)

          return (
            <li
              key={prediction.id}
              className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="text-sm text-gray-500">
                {group ? group.name : 'Former group'}
              </p>

              <h2 className="text-lg font-bold">{prediction.question}</h2>

              <p>
                Your pick: {bet.outcome} · {bet.amount} coins staked
              </p>

              <p className="text-sm text-gray-500">
                {bet.placedAt
                  ? new Date(bet.placedAt).toLocaleString()
                  : 'Bet date not recorded'}
              </p>

              {prediction.result && (
                <p>Final outcome: {prediction.result}</p>
              )}

              <BetResult prediction={prediction} userId={user.id} />

              {/* Return to My Bets after viewing the prediction */}
              {canOpen ? (
                <Link
                  to={`/groups/${groupId}?prediction=${prediction.id}&from=bets`}
                  className="block font-semibold text-nyu-violet"
                >
                  View prediction
                </Link>
              ) : (
                <p className="text-sm text-gray-500">
                  You are no longer in this group.
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </AppLayout>
  )
}

export default MyBets