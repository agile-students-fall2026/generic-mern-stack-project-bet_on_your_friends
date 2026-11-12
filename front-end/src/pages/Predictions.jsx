import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { getDisplayName, useAuth } from '../context/auth'
import PredictionCard from '../components/PredictionCard'
import ConfirmModal from '../components/ConfirmModal'
import PredictionForm from '../components/PredictionForm'
import FilterButtons from '../components/FilterButtons'
import PredictionComments from '../components/PredictionComments'
import PredictionBettors from '../components/PredictionBettors'
import { getPredictionData, createPrediction, editPrediction, deletePrediction, placeBet, resolvePrediction } from '../services/predictions'
import BetResult from '../components/BetResult'

const buttonStyle = 'rounded-lg bg-nyu-violet p-3 font-semibold text-white disabled:bg-gray-300'
const inputStyle = 'mt-2 w-full rounded-lg border border-gray-300 p-3'

function Predictions() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user: account, logIn } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('All predictions')
  const [showBettors, setShowBettors] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [betOutcome, setBetOutcome] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [winningOutcome, setWinningOutcome] = useState('')
  const selectedId = params.get('prediction')
  const fromMyBets = params.get('from') === 'bets'

  function setSelectedId(id) {
  if (!id) {
    setParams({})
  } else if (fromMyBets) {
    setParams({ prediction: id, from: 'bets' })
  } else {
    setParams({ prediction: id })
  } }

  async function loadData() {
    const result = await getPredictionData(groupId, account.id)
    setData({ ...result })
    logIn({ ...result.users.find((person) => person.id === account.id) })
  }

  useEffect(() => {
    let buffer = false
    getPredictionData(groupId, account.id, selectedId)
      .then((result) => {
        if (!buffer) {
          setData(result)
          const savedUser = result.users.find((person) => person.id === account.id)
          if (savedUser.coinBalance !== account.coinBalance) logIn(savedUser)
        }
      })
      .catch((problem) => { if (!buffer) setError(problem.message) })
    return () => { buffer = true }
  }, [groupId, account.id, account.coinBalance, selectedId, logIn])

  function openPrediction(id) {
    setShowBettors(false)
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
        await editPrediction(data, editing.id, values)
        setSelectedId(editing.id)
      } else {
        const prediction = await createPrediction(data, values)
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

  function requestBet(event) {
    event.preventDefault()
    if (!betOutcome || !canBet) return
    setError('')
    setDialog({
      type: 'placeBet',
      title: 'Confirm my bet?',
      message: `Bet ${coinsToBet} coins on ${betOutcome}? This cannot be undone.`,
      predictionId: selectedId,
      outcome: betOutcome,
      amount: coinsToBet,
    })
  }

  async function confirmAction() {
    const action = dialog.type
    setDialog(null)
    setError('')
    try {
      if (action === 'placeBet') {
        await placeBet(data, dialog.predictionId, dialog.outcome, dialog.amount)
        await loadData()
        setBetAmount('')
        setDialog({ type: 'bet', title: 'Bet placed', message: `Your bet of ${dialog.amount} coins on ${dialog.outcome} was recorded.` })
        return
      }
      if (action === 'delete') {
        await deletePrediction(data, selectedId)
        setSelectedId(null)
        setMessage('Prediction deleted.')
      }
      if (action === 'resolve') {
        await resolvePrediction(data, selectedId, winningOutcome)
        setMessage('Final outcome saved and coin balances updated.')
      }
      if (action !== 'bet') await loadData()
    } catch (problem) {
      setError(problem.message)
    }
  }

  if (!data || data.group.id !== groupId) {
    return (
      <AppLayout title="Predictions" back={fromMyBets ? '/bets' : '/groups'}>
        <p role="status">{error || 'Loading predictions...'}</p>
      </AppLayout>
    )
  }

  const user = data.users.find((person) => person.id === data.currentUserId)
  const selected = data.predictions.find((prediction) => prediction.id === selectedId)
  const creator = selected && data.users.find((person) => person.id === selected.creatorId)
  const isCreator = selected && selected.creatorId === user.id
  const userBet = selected && selected.bets.find((bet) => bet.userId === user.id)
  const bettingClosed = selected && selected.bettingClosed
  const coinsToBet = selected?.stake ?? Number(betAmount)
  const canBet = Number.isSafeInteger(coinsToBet) && coinsToBet > 0 && coinsToBet <= user.coinBalance

// filter the list without changing the saved predictions
const filteredPredictions = data.predictions.filter((prediction) => {
  if (filter === 'Resolved') {
    return Boolean(prediction.result)
  }

  if (filter === 'Open') {
    return !prediction.result && !prediction.bettingClosed
  }

  return true
})

  let confirmText = 'Confirm'
  if (dialog?.type === 'bet') confirmText = 'Done'
  if (dialog?.type === 'placeBet') confirmText = 'Place bet'

  function outcomeTotal(outcome) {
    let total = 0
    for (const bet of selected.bets) {
      if (bet.outcome === outcome) total += bet.amount
    }
    return total
  }

  return (
    <AppLayout title={data.group.name} back={fromMyBets ? '/bets' : '/groups'}>
        <Link to="invite" className="block font-semibold text-nyu-violet">
          Invite friends
        </Link>
        <Link to="members" className="mt-2 block font-semibold text-nyu-violet">
          Group members
        </Link>
        {!showForm && error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 text-nyu-violet">{message}</p>}

        {showForm ? (
          <PredictionForm
            key={editing ? editing.id : 'new'}
            prediction={editing}
            error={error}
            onSave={savePrediction}
            onCancel={() => { setShowForm(false); setEditing(null); setError('') }}
          />
          ) : selected && showBettors ? (
          <PredictionBettors
            key={selected.id}
            data={data}
            prediction={selected}
            onBack={() => setShowBettors(false)}
          />
        ) : selected ? (
          <section className="mt-6 space-y-5">
          
          <button type="button" onClick={() => {
             if (fromMyBets) {
              navigate('/bets')
              return
            } 
            setSelectedId(null); setError(''); setMessage('') }} className="text-nyu-violet" > {fromMyBets ? 'Back to My Bets' : 'Back to predictions'} </button>
            
            <h2 className="text-xl font-bold">{selected.question}</h2>
            <p>By {getDisplayName(creator)}</p>
            <p>Closes {new Date(selected.deadline).toLocaleString()}</p>
            {selected.stake !== undefined && <p>{selected.stake} coins per bet</p>}
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
                <div className="mt-2">
                  <BetResult prediction={selected} userId={data.currentUserId} />
                </div>
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
              <form onSubmit={requestBet} className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="font-medium">Choose an outcome</legend>
                  {selected.outcomes.map((outcome) => (
                    <label key={outcome} className="block">
                      <input type="radio" name="bet-outcome" required value={outcome} checked={betOutcome === outcome} onChange={(event) => setBetOutcome(event.target.value)} /> {outcome}
                    </label>
                  ))}
                </fieldset>
                {selected.stake === undefined && (
                  <label className="block font-medium">
                    Coins to bet
                    <input type="number" min="1" max={user.coinBalance} step="1" required value={betAmount} onChange={(event) => setBetAmount(event.target.value)} className={inputStyle} />
                  </label>
                )}
                {coinsToBet > user.coinBalance && <p role="alert" className="text-red-600">You do not have enough coins.</p>}
                <button disabled={!betOutcome || !canBet} className={buttonStyle}>Place bet</button>
              </form>
            )}
              <button
              type="button"
              onClick={() => setShowBettors(true)}
              className={buttonStyle}
            >
              View bettors
            </button>
            
            {/* Show comments below the prediction, including after it is resolved. */}
            {/* A different key gives each prediction its own fresh comment form. */}
            <PredictionComments
              key={selected.id}
              data={data}
              prediction={selected}
              onUpdate={() => {
                // Saved the comment. Update state so it appears on screen.
                setData({ ...data })
              }}
            />
          </section>
        ) : (
          <section className="mt-6 space-y-4">
             <FilterButtons
              options={['All predictions', 'Resolved', 'Open']}
              value={filter}
              onChange={setFilter}
              label="Filter predictions"
            />

            <button onClick={() => { setEditing(null); setShowForm(true); setError(''); setMessage('') }} className={buttonStyle}>
              New prediction
            </button>

            {filteredPredictions.length === 0 && (
              <p>No predictions in this tab yet.</p>
            )}

            {filteredPredictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                currentUserId={data.currentUserId}
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
            confirmText={confirmText}
            onConfirm={confirmAction}
            onCancel={dialog.type === 'bet' ? undefined : () => setDialog(null)}
          />
        )}
    </AppLayout>
  )
}

export default Predictions
