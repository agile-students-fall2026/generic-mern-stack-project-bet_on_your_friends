import { getDisplayName } from '../context/auth'

function PredictionCard({ prediction, creator, onOpen }) {
  let status = 'Open'
  if (prediction.bettingClosed) status = 'Closed'
  if (prediction.result) status = 'Resolved'

  return (
    <article className="rounded-lg border border-gray-300 bg-white p-4">
      <h2 className="text-lg font-semibold">{prediction.question}</h2>
      <p className="mt-2 text-sm text-gray-600">By {getDisplayName(creator)}</p>
      <p className="mt-2">{prediction.outcomes.join(' / ')}</p>
      <p className="mt-2 text-sm">Closes {new Date(prediction.deadline).toLocaleString()}</p>
      <p className="mt-2 font-medium">
        {status}{prediction.result && ` · Final outcome: ${prediction.result}`}
      </p>
      <button
        className="mt-3 font-semibold text-nyu-violet"
        onClick={onOpen}
      >
        View prediction
      </button>
    </article>
  )
}

export default PredictionCard
