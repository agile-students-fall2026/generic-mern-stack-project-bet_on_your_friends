import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/auth'
import { createMockGroup } from '../services/mockGroups'

// form input stlying -> rounded boxes
// red outline -> error
function inputStyle(hasError) {
  return `mt-2 w-full rounded-lg border p-3 font-normal outline-none ${
    hasError ? 'border-red-600' : 'border-gray-300 focus:border-nyu-violet'
  }`
}

// option button styling -> rounded boxes
function optionStyle(selected) {
  return `rounded-lg border p-3 text-center font-semibold ${
    selected
      ? 'border-nyu-violet bg-nyu-violet text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:border-nyu-violet'
  }`
}

// group name and description character limits
const maxNameLength = 40
const maxDescriptionLength = 200

function CreateGroup() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [whoCanInvite, setWhoCanInvite] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')

  const nameValid = name.trim() !== ''

  const showNameError = nameTouched && !nameValid

  const formValid = nameValid && !submitting

  // run upon form submission
  async function handleSubmit(event) {
    event.preventDefault()

    if (!formValid) return

    setCreateError('')
    setSubmitting(true)

    try {
      const group = await createMockGroup({
        name,
        description,
        whoCanInvite,
        creatorId: user.id
      })

      navigate(`/groups/${group.id}/invite`, { replace: true })
    } catch (error) {
      setCreateError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AppLayout title="My Groups" back="/groups">
      <h2 className="text-3xl font-bold text-nyu-violet">Create group</h2>

      <p className="mt-2 text-gray-500">
        A private betting group for your friends.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block font-medium">
          Group Name
          <input
            type="text"
            placeholder="NYU Roommates"
            maxLength={maxNameLength}
            className={inputStyle(showNameError)}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameTouched(true)
            }}
            onBlur={() => setNameTouched(true)}
          />

          {showNameError && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Enter a group name.
            </span>
          )}
        </label>

        <label className="block font-medium">
          Description
          <textarea
            rows={3}
            placeholder="Predictions for our list of chores."
            maxLength={maxDescriptionLength}
            className={`${inputStyle(false)} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <span className="mt-1 block text-right text-xs font-normal text-gray-500">
            {description.length}/{maxDescriptionLength}
          </span>
        </label>

        <fieldset>
          <legend className="font-medium">Group Visibility</legend>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className={optionStyle(true)}>
              Private
              <span className="block text-xs font-normal">Selected</span>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-center font-semibold text-gray-400">
              Public
              <span className="block text-xs font-normal">Coming soon</span>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Only invited members can join.
          </p>
        </fieldset>

        <fieldset>
          <legend className="font-medium">Who can invite friends?</legend>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={whoCanInvite === 'all'}
              onClick={() => setWhoCanInvite('all')}
              className={optionStyle(whoCanInvite === 'all')}
            >
              All members
            </button>

            <button
              type="button"
              aria-pressed={whoCanInvite === 'admins'}
              onClick={() => setWhoCanInvite('admins')}
              className={optionStyle(whoCanInvite === 'admins')}
            >
              Admins Only
            </button>
          </div>
        </fieldset>

        {createError && (
          <p className="text-sm text-red-600" role="alert">
            {createError}
          </p>
        )}

        <button
          type="submit"
          disabled={!formValid}
          className="w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? 'Creating group...' : 'Create group'}
        </button>
      </form>
    </AppLayout>
  )
}

export default CreateGroup
