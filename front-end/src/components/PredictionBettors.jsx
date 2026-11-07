import { useState } from 'react'
import { getDisplayName, useAuth } from '../context/auth'
import FilterButtons from './FilterButtons'

function PredictionBettors({ data, prediction, onBack }) {
  const { user } = useAuth()
  // Start with the first outcome. Clicking a tab changes which bets we show.
  const [outcome, setOutcome] = useState(prediction.outcomes[0])
  // Filter the saved bets instead of creating a second mock bettor list.
  // filter keeps matching bets and leaves the original saved list alone.
  const bets = prediction.bets.filter((bet) => bet.outcome === outcome)
  // Add only the wagers for the selected outcome.
  let total = 0
  for (const bet of bets) total += bet.amount

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-xl font-bold">Who bet on each outcome?</h2>
      <p className="rounded-lg border border-gray-200 bg-white p-4 font-semibold">
        {prediction.question}
      </p>
       <FilterButtons
        options={prediction.outcomes}
        value={outcome}
        onChange={setOutcome}
        label="Choose a betting outcome"
      />
      <h3 className="font-bold">
        {outcome} · {total} virtual coins
      </h3>
      <p className="text-sm text-gray-500">{bets.length} members</p>
      {/* An outcome can have no bets yet. */}
      {bets.length === 0 && <p>No one has bet on this outcome yet.</p>}
      {/* These are the actual saved bets for this outcome. */}
      <ul className="space-y-3">
        {bets.map((bet) => {
          // Look up the person using their ID so we can show their saved photo.
          let member = data.users.find((person) => person.id === bet.userId)
          if (bet.userId === user.id) {
            member = user
          }
          return (
            <li
              key={bet.userId}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <img
                src={
                  member?.photoUrl ||
                  `https://picsum.photos/seed/user-${bet.userId}/64/64`
                }
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">
                  {member ? getDisplayName(member) : 'Former member'}
                  {bet.userId === data.currentUserId && ' (You)'}
                </p>
                <p className="text-xs text-gray-500">
                  {bet.placedAt
                    ? new Date(bet.placedAt).toLocaleString()
                    : 'Date not recorded'}
                </p>
              </div>
              {/* This is the amount this member staked, not their full coin balance. */}
              <p className="text-sm font-semibold">{bet.amount} coins</p>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white"
      >
        Back to prediction
      </button>
    </section>
  )
}

export default PredictionBettors