import { useState } from 'react'

const inputStyle = 'mt-2 w-full rounded-lg border border-gray-300 p-3'

function PredictionForm({ prediction, onSave, onCancel }) {
  const [question, setQuestion] = useState(prediction ? prediction.question : '')
  const [outcomes, setOutcomes] = useState(prediction ? [...prediction.outcomes] : ['', ''])
  const [deadline, setDeadline] = useState(prediction ? prediction.deadline : '')
  const [saving, setSaving] = useState(false)

  function changeOutcome(index, value) {
    const updated = [...outcomes]
    updated[index] = value
    setOutcomes(updated)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    await onSave({ question, outcomes, deadline })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <h2 className="text-xl font-bold">{prediction ? 'Edit Prediction' : 'Create Prediction'}</h2>
      <label className="block font-medium">
        Question
        <textarea required value={question} onChange={(event) => setQuestion(event.target.value)} className={inputStyle} />
      </label>
      <fieldset className="space-y-3">
        <legend className="font-medium">Outcomes</legend>
        {outcomes.map((outcome, index) => (
          <div key={index}>
            <label className="block">
              Outcome {index + 1}
              <input required value={outcome} onChange={(event) => changeOutcome(index, event.target.value)} className={inputStyle} />
            </label>
            {outcomes.length > 2 && (
              <button type="button" onClick={() => setOutcomes(outcomes.filter((value, position) => position !== index))} className="mt-1 text-sm text-nyu-violet">
                Remove outcome {index + 1}
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setOutcomes([...outcomes, ''])} className="font-semibold text-nyu-violet">
          + Add outcome
        </button>
      </fieldset>
      <label className="block font-medium">
        Betting deadline
        <input type="datetime-local" required value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputStyle} />
      </label>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 p-3">Cancel</button>
        <button disabled={saving} className="flex-1 rounded-lg bg-nyu-violet p-3 font-semibold text-white disabled:bg-gray-300">
          {prediction ? 'Save changes' : 'Post prediction'}
        </button>
      </div>
    </form>
  )
}

export default PredictionForm
