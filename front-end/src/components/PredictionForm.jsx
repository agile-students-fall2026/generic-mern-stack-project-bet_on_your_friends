import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import { getPredictionErrors, maxOutcomes, maxOutcomeLength } from '../services/mockPredictions'

function inputStyle(hasError) {
  return `mt-2 w-full rounded-lg border p-3 ${hasError ? 'border-red-600' : 'border-gray-300'}`
}

function localDeadline(deadline) {
  if (!deadline) return ''
  const date = new Date(deadline)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function PredictionForm({ prediction, onSave, onCancel, error }) {
  const [question, setQuestion] = useState(prediction ? prediction.question : '')
  const [outcomes, setOutcomes] = useState(prediction ? [...prediction.outcomes] : ['', ''])
  const [deadline, setDeadline] = useState(localDeadline(prediction?.deadline))
  const [stake, setStake] = useState(prediction?.stake ?? '')
  const [saving, setSaving] = useState(false)
  const [removeIndex, setRemoveIndex] = useState(null)
  const errors = getPredictionErrors({ question, outcomes, deadline, stake })
  const showOutcomeError = outcomes.some((outcome) => outcome !== '') && errors.outcomes
  const formValid = Object.keys(errors).length === 0 && !saving

  function changeOutcome(index, value) {
    const updated = [...outcomes]
    updated[index] = value
    setOutcomes(updated)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formValid) return
    setSaving(true)
    await onSave({ question, outcomes, deadline, stake })
    setSaving(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <h2 className="text-3xl font-bold text-nyu-violet">{prediction ? 'Edit Prediction' : 'Create Prediction'}</h2>
        <label className="block font-medium">
          Question
          <textarea required value={question} onChange={(event) => setQuestion(event.target.value)} className={inputStyle(question && errors.question)} />
          {question && errors.question && <span role="alert" className="mt-1 block text-sm text-red-600">{errors.question}</span>}
        </label>
        <fieldset className="space-y-3">
          <legend className="font-medium">Outcomes</legend>
          {outcomes.map((outcome, index) => (
            <div key={index}>
              <label className="block">
                Outcome {index + 1}
                <input required maxLength={maxOutcomeLength} value={outcome} onChange={(event) => changeOutcome(index, event.target.value)} className={inputStyle(showOutcomeError)} />
              </label>
              {outcomes.length > 2 && (
                <button type="button" onClick={() => setRemoveIndex(index)} className="mt-1 text-sm text-nyu-violet">
                  Remove outcome {index + 1}
                </button>
              )}
            </div>
          ))}
          {showOutcomeError && <p role="alert" className="text-sm text-red-600">{errors.outcomes}</p>}
          <button type="button" disabled={outcomes.length >= maxOutcomes} onClick={() => setOutcomes([...outcomes, ''])} className="font-semibold text-nyu-violet disabled:text-gray-400">
            + Add outcome
          </button>
        </fieldset>
        <label className="block font-medium">
          Coins per bet
          <input type="number" min="1" step="1" required value={stake} onChange={(event) => setStake(event.target.value)} className={inputStyle(stake !== '' && errors.stake)} />
          {stake !== '' && errors.stake && <span role="alert" className="mt-1 block text-sm text-red-600">{errors.stake}</span>}
        </label>
        <label className="block font-medium">
          Betting deadline
          <input type="datetime-local" required value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputStyle(deadline && errors.deadline)} />
          {deadline && errors.deadline && <span role="alert" className="mt-1 block text-sm text-red-600">{errors.deadline}</span>}
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 p-3">Cancel</button>
          <button disabled={!formValid} className="flex-1 rounded-lg bg-nyu-violet p-3 font-semibold text-white disabled:bg-gray-300">
            {prediction ? 'Save changes' : 'Post prediction'}
          </button>
        </div>
      </form>
      {removeIndex !== null && (
        <ConfirmModal
          title="Remove outcome?"
          message={`The text for outcome ${removeIndex + 1} will be lost.`}
          confirmText="Remove"
          onConfirm={() => { setOutcomes(outcomes.filter((value, index) => index !== removeIndex)); setRemoveIndex(null) }}
          onCancel={() => setRemoveIndex(null)}
        />
      )}
    </>
  )
}

export default PredictionForm
