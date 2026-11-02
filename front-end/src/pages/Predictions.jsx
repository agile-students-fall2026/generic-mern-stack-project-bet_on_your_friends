import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PredictionCard from '../components/PredictionCard'
import ConfirmModal from '../components/ConfirmModal'
import PredictionForm from '../components/PredictionForm'
import {
  getMockPredictionData,
  createMockPrediction,
  editMockPrediction,
  deleteMockPrediction,
  placeMockBet,
  resolveMockPrediction,
} from '../services/mockPredictions'

const buttonStyle = 'rounded-lg bg-nyu-violet p-3 font-semibold text-white disabled:bg-gray-300'
const inputStyle = 'mt-2 w-full rounded-lg border border-gray-300 p-3'

function Predictions() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [betOutcome, setBetOutcome] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [winningOutcome, setWinningOutcome] = useState('')

  async function loadData() {
    const result = await getMockPredictionData()
    setData({ ...result })
  }

  useEffect(() => {
    getMockPredictionData()
      .then((result) => setData({ ...result }))
      .catch((problem) => setError(problem.message))
  }, [])

  function openPrediction(id) {
    loadData().catch((problem) => setError(problem.message))
    setSelectedId(id)
    setError('')
    setMessage('')
    setBetAmount('')
    setBetOutcome('')
    setWinningOutcome('')
  }

  async function savePrediction(values) {
    setError('')
    try {
      if (editing) {
        await editMockPrediction(editing.id, values)
        setSelectedId(editing.id)
      } else {
        const prediction = await createMockPrediction(values)
        setSelectedId(prediction.id)
      }
      await loadData()
      setShowForm(false)
      setEditing(null)
      setMessage('Prediction saved.')
    } catch (problem) {
      setError(problem.message)
    }
  }

  async function placeBet(event) {
    event.preventDefault()
    setError('')
    try {
      await placeMockBet(selectedId, betOutcome, betAmount)
      await loadData()
      setDialog({ type: 'bet', title: 'Bet placed', message: `Your bet of ${betAmount} coins on ${betOutcome} was recorded.` })
      setBetAmount('')
    } catch (problem) {
      setError(problem.message)
    }
  }

  async function confirmAction() {
    const action = dialog.type
    setDialog(null)
    setError('')
    try {
      if (action === 'delete') {
        await deleteMockPrediction(selectedId)
        setSelectedId(null)
        setMessage('Prediction deleted.')
      }
      if (action === 'resolve') {
        await resolveMockPrediction(selectedId, winningOutcome)
        setMessage('Final outcome saved and coin balances updated.')
      }
      if (action !== 'bet') await loadData()
    } catch (problem) {
      setError(problem.message)
    }
  }

  if (!data) {
    return (
      <main className="p-6">
        <p role="status">{error || 'Loading predictions...'}</p>
        {error && <Link to="/signup">Create account</Link>}
      </main>
    )
  }

  const user = data.users.find((person) => person.id === data.currentUserId)
  const selected = data.predictions.find((prediction) => prediction.id === selectedId)
  const isCreator = selected && selected.creatorId === user.id
  const userBet = selected && selected.bets.find((bet) => bet.userId === user.id)
  const bettingClosed = selected && selected.bettingClosed

  function outcomeTotal(outcome) {
    let total = 0
    for (const bet of selected.bets) {
      if (bet.outcome === outcome) total += bet.amount
    }
    return total
  }

  return (
    <main className="min-h-screen bg-[#f8f5fb] px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link to="/groups" className="text-nyu-violet">Back to Groups</Link>
        <h1 className="mt-4 text-2xl font-bold text-nyu-violet">{data.groupName}</h1>
        <p className="mt-2 font-semibold">{user.coinBalance} coins</p>
        {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 text-nyu-violet">{message}</p>}

        {showForm ? (
          <PredictionForm
            key={editing ? editing.id : 'new'}
            prediction={editing}
            onSave={savePrediction}
            onCancel={() => { setShowForm(false); setEditing(null); setError('') }}
          />
        ) : selected ? (
          <section className="mt-6 space-y-5">
            <button onClick={() => { setSelectedId(null); setError(''); setMessage('') }} className="text-nyu-violet">Back to predictions</button>
            <h2 className="text-xl font-bold">{selected.question}</h2>
            <p>By {data.users.find((person) => person.id === selected.creatorId).name}</p>
            <p>Closes {new Date(selected.deadline).toLocaleString()}</p>
            <ul className="space-y-3">
              {selected.outcomes.map((outcome) => (
                <li key={outcome} className="rounded-lg border border-gray-300 bg-white p-3">
                  <strong>{outcome}</strong>
                  <p>{outcomeTotal(outcome)} coins</p>
                </li>
              ))}
            </ul>

            {selected.result ? (
              <div className="rounded-lg bg-white p-4">
                <h3 className="font-bold">Final outcome: {selected.result}</h3>
                <p className="mt-2">This prediction has been resolved and cannot be changed.</p>
                {selected.refunded && <p className="mt-2">No one bet on this outcome, so all bets were refunded.</p>}
              </div>
            ) : isCreator ? (
              <div className="space-y-4">
                <p>You cannot bet on your own prediction.</p>
                <div className="flex gap-3">
                  <button disabled={selected.bets.length > 0} onClick={() => { setEditing(selected); setShowForm(true); setError('') }} className={buttonStyle}>Edit prediction</button>
                  <button disabled={selected.bets.length > 0} onClick={() => setDialog({ type: 'delete', title: 'Delete prediction?', message: 'This will remove your prediction.' })} className={buttonStyle}>Delete prediction</button>
                </div>
                {selected.bets.length > 0 && <p>Editing and deletion are unavailable after someone bets.</p>}
                <label className="block font-medium">
                  Final outcome
                  <select value={winningOutcome} onChange={(event) => setWinningOutcome(event.target.value)} className={inputStyle}>
                    <option value="">Choose an outcome</option>
                    {selected.outcomes.map((outcome) => <option key={outcome} value={outcome}>{outcome}</option>)}
                  </select>
                </label>
                <button disabled={!winningOutcome} onClick={() => setDialog({ type: 'resolve', title: 'Confirm final outcome?', message: `Record ${winningOutcome} as the final outcome? This cannot be changed.` })} className={buttonStyle}>Resolve prediction</button>
              </div>
            ) : userBet ? (
              <p>You bet {userBet.amount} coins on {userBet.outcome}. You can only bet once on each prediction.</p>
            ) : bettingClosed ? (
              <p>Betting is closed.</p>
            ) : (
              <form onSubmit={placeBet} className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="font-medium">Choose an outcome</legend>
                  {selected.outcomes.map((outcome) => (
                    <label key={outcome} className="block">
                      <input type="radio" name="bet-outcome" required value={outcome} checked={betOutcome === outcome} onChange={(event) => setBetOutcome(event.target.value)} /> {outcome}
                    </label>
                  ))}
                </fieldset>
                <label className="block font-medium">
                  Coins to bet
                  <input type="number" min="1" max={user.coinBalance} step="1" required value={betAmount} onChange={(event) => setBetAmount(event.target.value)} className={inputStyle} />
                </label>
                {Number(betAmount) > user.coinBalance && <p role="alert" className="text-red-600">You do not have enough coins.</p>}
                <button disabled={!betOutcome || !betAmount || Number(betAmount) > user.coinBalance} className={buttonStyle}>Place bet</button>
              </form>
            )}
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            <button onClick={() => { setEditing(null); setShowForm(true); setError(''); setMessage('') }} className={buttonStyle}>New prediction</button>
            {data.predictions.length === 0 && <p>No predictions yet.</p>}
            {data.predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                creator={data.users.find((person) => person.id === prediction.creatorId)}
                onOpen={() => openPrediction(prediction.id)}
              />
            ))}
          </section>
        )}

        {dialog && (
          <ConfirmModal
            title={dialog.title}
            message={dialog.message}
            confirmText={dialog.type === 'bet' ? 'Done' : 'Confirm'}
            onConfirm={confirmAction}
            onCancel={dialog.type === 'bet' ? undefined : () => setDialog(null)}
          />
        )}
      </div>
    </main>
  )
}

export default Predictions
