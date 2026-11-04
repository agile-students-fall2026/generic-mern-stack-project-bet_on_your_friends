import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast from '../components/Toast'
import { useAuth } from '../context/auth'
import {
  createMockGroup,
  getRandomMockGroupPhotoSeed,
  uploadMockGroupPhoto
} from '../services/mockGroups'

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

// above character count styling -> red text
function countStyle(hasError) {
  return `mt-1 block text-right text-xs font-normal ${
    hasError ? 'text-red-600' : 'text-gray-500'
  }`
}

// group name and description character limits
const maxNameLength = 40
const maxDescriptionLength = 200

// members per group range
const minMember = 2
const maxMember = 20

function CreateGroup() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // group name, description, and invite permissions
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [whoCanInvite, setWhoCanInvite] = useState('all')

  // max number of members that can join
  const [memberLimit, setMemberLimit] = useState('')
  const [memberLimitTouched, setMemberLimitTouched] = useState(false)

  // random mock group picture until changed
  const [photoSeed, setPhotoSeed] = useState(getRandomMockGroupPhotoSeed)

  // change and display error for group picture
  const [changingPhoto, setChangingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // notification after picture change on the page
  const [toastMessage, setToastMessage] = useState('')

  // create group and display error
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')

  const nameEmpty = name.trim() === ''

  // name too long check
  const nameTooLong = name.length > maxNameLength

  const nameValid = !nameEmpty && !nameTooLong

  // show empty name error after the user has typed or left the input
  const showNameEmptyError = nameTouched && nameEmpty

  // description too long check
  const descriptionTooLong = description.length > maxDescriptionLength

  // member limit empty check
  const memberLimitEmpty = memberLimit === ''

  // member limit within range check
  const memberLimitInRange =
    /^\d+$/.test(memberLimit) &&
    Number(memberLimit) >= minMember &&
    Number(memberLimit) <= maxMember

  const memberLimitValid = !memberLimitEmpty && memberLimitInRange

  // show empty member error after the user has typed or left the input
  const showMemberLimitEmptyError = memberLimitTouched && memberLimitEmpty

  const showMemberLimitRangeError = !memberLimitEmpty && !memberLimitInRange

  const formValid =
    nameValid && !descriptionTooLong && memberLimitValid && !submitting

  // popup notification timeout
  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => setToastMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // run upon picking a new group picture from device
  async function handlePhotoChange(event) {
    const file = event.target.files[0]

    event.target.value = ''

    if (!file || changingPhoto) return

    setPhotoError('')
    setChangingPhoto(true)

    try {
      const newPhotoSeed = await uploadMockGroupPhoto(file)

      setPhotoSeed(newPhotoSeed)
      setToastMessage('Group picture updated.')
    } catch (error) {
      setPhotoError(error.message)
    }

    setChangingPhoto(false)
  }

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
        memberLimit: Number(memberLimit),
        photoSeed,
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
        {/* group picture display and change */}
        <div>
          <p className="font-medium">Group Picture</p>

          <img
            src={`https://picsum.photos/seed/${photoSeed}/600/240`}
            alt=""
            className="mt-2 h-32 w-full rounded-xl bg-nyu-lavender object-cover shadow-sm"
          />

          {/* opens photo gallery or files */}
          <label
            className={`mt-2 inline-block rounded text-sm font-semibold focus-within:ring-2 focus-within:ring-nyu-violet ${
              changingPhoto
                ? 'cursor-not-allowed text-gray-400'
                : 'cursor-pointer text-nyu-violet hover:text-nyu-ultraviolet'
            }`}
          >
            {changingPhoto ? 'Changing group picture...' : 'Change group picture'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={changingPhoto}
              onChange={handlePhotoChange}
            />
          </label>

          {photoError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {photoError}
            </p>
          )}
        </div>

        <label className="block font-medium">
          Group Name
          <input
            type="text"
            placeholder="NYU Roommates"
            aria-invalid={showNameEmptyError || nameTooLong}
            className={inputStyle(showNameEmptyError || nameTooLong)}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameTouched(true)
            }}
            onBlur={() => setNameTouched(true)}
          />

          {/* character count for name */}
          <span className={countStyle(nameTooLong)}>
            {name.length}/{maxNameLength}
          </span>

          {showNameEmptyError && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Enter a group name.
            </span>
          )}

          {nameTooLong && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Group name must be {maxNameLength} characters or less.
            </span>
          )}
        </label>

        <label className="block font-medium">
          Description
          <textarea
            rows={3}
            placeholder="Predictions for our list of chores."
            aria-invalid={descriptionTooLong}
            className={`${inputStyle(descriptionTooLong)} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />


          {/* character count for description */}
          <span className={countStyle(descriptionTooLong)}>
            {description.length}/{maxDescriptionLength}
          </span>

          {descriptionTooLong && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Description must be {maxDescriptionLength} characters or less.
            </span>
          )}
        </label>

        <label className="block font-medium">
          Member Limit
          <input
            type="text"
            inputMode="numeric"
            placeholder="10"
            aria-invalid={showMemberLimitEmptyError || showMemberLimitRangeError}
            className={inputStyle(
              showMemberLimitEmptyError || showMemberLimitRangeError
            )}
            value={memberLimit}
            onChange={(e) => {
              setMemberLimit(e.target.value.trim())
              setMemberLimitTouched(true)
            }}
            onBlur={() => setMemberLimitTouched(true)}
          />

          {showMemberLimitEmptyError && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Enter a member limit.
            </span>
          )}

          {showMemberLimitRangeError && (
            <span className="mt-1 block text-sm text-red-600" role="alert">
              Member limit is from {minMember} to{' '}
              {maxMember}.
            </span>
          )}
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

      <Toast message={toastMessage} />
    </AppLayout>
  )
}

export default CreateGroup
