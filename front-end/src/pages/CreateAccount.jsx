import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { isEmailRegistered, registerMockAccount } from '../services/mockSignUp'

// form input stlying -> rounded boxes
const inputStyle =
  'mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-nyu-violet'

// check whether the user is at least 21 years old or not
function isOldEnough(dateOfBirth) {

  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const birthDate = new Date(dateOfBirth + 'T00:00:00')
  const today = new Date()

  // check for valid date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return false
  }

  // prevent user from inputting a non-date date of birth or a date in the future
  // e.g. putting in "hello world" or 11/01/3005 as your DOB will not go through
  if (
    Number.isNaN(birthDate.getTime()) || // isNaN = is not a number
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() + 1 !== month ||
    birthDate.getDate() !== day ||
    birthDate > today
  ) {
    return false
  }

  let age = today.getFullYear() - year

  // subtract one if the user has not had their birthday this year 
  // e.g. if today is 11/01/2026 and user puts DOB as 11/02/2009, 
  // their age will be 16, even though they'd be turning 17 the following day
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age--
  }

  return age >= 21
}

function CreateAccount() {
  const navigate = useNavigate()
  const { logIn } = useAuth()

  // state variables for each form field
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState('')


  // name must have at least 3 characters, not counting spaces
  const nameValid = name.replace(/\s/g, '').length >= 3

  // check user's age
  const oldEnough = isOldEnough(dateOfBirth)

  // password requirements: 8-64 characters, uppercase, lowercase, & a number
  const passwordValid =
    password.length >= 8 &&
    password.length <= 64 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)

  // check whether both passwords match
  const passwordsMatch =
    confirmPassword !== '' && password === confirmPassword

  // check if email has a valid format
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  // check whether the email is already registered
  const emailAlreadyRegistered =
  email.trim() !== '' && isEmailRegistered(email)

  // submission is only allowed when ALL fields are valid
  const formValid =
    nameValid &&
    emailValid &&
    !emailAlreadyRegistered &&
    oldEnough &&
    passwordValid &&
    passwordsMatch


// runs when the user submits the form
async function handleSubmit(event) {
  event.preventDefault()

  if (!formValid) return

  setEmailError('')

  try {
    // register the account and get the new user
    const user = await registerMockAccount({ name, email })

    // log the new user for every page to access
    logIn(user)

    // redirect to My Groups after successful registration
    navigate('/groups', {
      state: { signupCompleted: true, user: user },
    })
  } catch (error) {
    // display an error if registration fails
    setEmailError(error.message)
  }
}

  return (
    <main className="min-h-screen bg-[#f8f5fb] px-4 py-8">
      <div className="mx-auto max-w-md px-4 py-6">

        <h1 className="text-3xl font-bold text-nyu-violet">
          Create Account
        </h1>

        <p className="mt-2 text-gray-500">
          Join your friends and start making predictions.
        </p>

        {/* create account form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          {/* Full Name */}
          <label className="block font-medium">
            Full Name
            <input
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
              className={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* error if name is too short */}
            {name && !nameValid && (
              <p className="mt-1 text-sm text-red-600">
                Please enter your full name.
              </p>
            )}
          </label>

          {/* email */}
          <label className="block font-medium">
            Email
            <input
              type="email"
              placeholder="jane.doe@example.com"
              autoComplete="email"
              required
              className={inputStyle}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError('')
              }}
            />

            {/* error if email format is invalid */}
            {email && !emailValid && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                Please enter a valid email address.
              </span>
            )}
            
            {/* error if email is already registered */}
            {emailAlreadyRegistered && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                This email is already associated with an account.
              </span>
            )}

            {/* error if registration fails */}
            {emailError && !emailAlreadyRegistered && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                {emailError}
              </span>
            )}
          </label>

          {/* date of birth */}
          <label className="block font-medium">
            Date of Birth
            <input
              type="date"
              autoComplete="bday"
              required
              className={inputStyle}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            {/* Show an error if the user is under 21 */}
            {dateOfBirth && !oldEnough && (
              <p className="mt-1 text-sm text-red-600">
                You must be at least 21 years old.
              </p>
            )}
          </label>

          {/* password */}
          <label className="block font-medium">
            Password
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="new-password"
              required
              className={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p className="mt-1 text-xs text-gray-500">
              Between 8-64 characters, one uppercase, one lowercase, and one number.
            </p>

            {/* Show an error if the password is invalid */}
            {password && !passwordValid && (
              <p className="mt-1 text-sm text-red-600">
                Password does not meet the requirements.
              </p>
            )}
          </label>

          {/* confirm password */}
          <label className="block font-medium">
            Confirm Password
            <input
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              className={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* error if passwords don't match */}
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">
                Passwords do not match.
              </p>
            )}
          </label>

          {/* button disabled until all fields are valid */}
          <button
            type="submit"
            disabled={!formValid}
            className="w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white hover:bg-nyu-ultraviolet disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Create Account
          </button>
        </form>

        {/* link to Login screen in case the user came here by accident */}
        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-nyu-violet">
            Log in
          </Link>
        </p>

        {/* link to Home screen in case the user came here by accident */}
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-semibold text-nyu-violet">
            Back to Home
          </Link>
        </p>
      </div>
    </main>
  )
}

export default CreateAccount