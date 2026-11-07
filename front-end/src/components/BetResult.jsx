import { getBetResult } from '../services/mockPredictions'

// shared result badge for predictions and My Bets
function BetResult({ prediction, userId }) {
  const result = getBetResult(prediction, userId)
  let change = ''

  // pending bets and predictions you didn't bet on have no coin result
  if (result.net !== null) {
    let sign = ''

    if (result.net > 0) {
      sign = '+'
    }

    change = ` ${sign}${result.net} coins`
  }

  return (
    <span className="inline-block rounded bg-nyu-lavender px-3 py-1 text-sm font-semibold text-nyu-violet">
      {result.label}
      {change}
    </span>
  )
}

export default BetResult