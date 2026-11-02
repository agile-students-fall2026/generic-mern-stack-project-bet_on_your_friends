
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import CreateAccount from './pages/CreateAccount'
import Predictions from './pages/Predictions'

// home page with just links to sign up or log in
function Home() {
  return (
    <main className="min-h-screen bg-[#f8f5fb] px-4 py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold text-nyu-violet">
          Bet on Your Friends
        </h1>

        <p className="mt-4 text-gray-600">
          Make predictions.
          Challenege your friends.
        </p>

        <nav className="mt-8 flex flex-col gap-4">
          <Link
            to="/signup"
            className="rounded-lg bg-nyu-violet p-3 font-semibold text-white"
          >
            Create Account
          </Link>

          <Link
            to="/login"
            className="rounded-lg border border-nyu-violet p-3 font-semibold text-nyu-violet"
          >
            Log In
          </Link>
        </nav>
      </div>
    </main>
  )
}

// login page -> to be implemented
function Login() {
  return (
    <main className="p-6">
      <h1>Log In</h1>
      <p>This page has not been implemented yet.</p>
      <Link to="/">Back to Home</Link>
    </main>
  )
}

// my groups page -> to be implemented
function MyGroups() {
  const location = useLocation()

  return (
    <main className="p-6">
      <h1>My Groups</h1>

      {location.state?.signupCompleted && (
        <p>Account registration completed successfully.</p>
      )}
      {/* for team, remove this comment once you implemented this -> carry over the 
      same user from create account to this page, and the rest of the pages in the app. we should
      display their coin balance here and on other pages + require account to be 
      logged in every time the given page is open */}
      <p>This page has not been implemented yet.</p>
      <p><Link to="/predictions">View predictions</Link></p>
      <Link to="/">Back to Home</Link>
    </main>
  )
}

// app itself, routes for the homepage, sign up, login, and
// a bare bones page not found
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<CreateAccount />} />
      <Route path="/login" element={<Login />} />
      <Route path="/groups" element={<MyGroups />} />
      <Route path="/predictions" element={<Predictions />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}

export default App
