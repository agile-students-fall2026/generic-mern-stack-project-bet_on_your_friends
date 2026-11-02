import { Link, Navigate, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import { useAuth } from './context/auth'
import CreateAccount from './pages/CreateAccount'
import CreateGroup from './pages/CreateGroup'
import InviteFriends from './pages/InviteFriends'
import JoinGroup from './pages/JoinGroup'
import Login from './pages/Login'
import MyGroups from './pages/MyGroups'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'

// home page with sign up or login
function Home() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/groups" replace />
  }

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

// group predictions page
function GroupPredictions() {
  return (
    <AppLayout title="Group" back="/groups">
      <p>This page has not been implemented yet.</p>
      <Link to="invite" className="font-semibold text-nyu-violet">
        Invite friends
      </Link>
    </AppLayout>
  )
}

// my bets page
function MyBets() {
  return (
    <AppLayout title="My Bets">
      <p>This page has not been implemented yet.</p>
    </AppLayout>
  )
}

// routes for the homepage, sign up, login, etc.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<CreateAccount />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/groups" element={<MyGroups />} />
        <Route path="/groups/new" element={<CreateGroup />} />
        <Route path="/groups/:groupId" element={<GroupPredictions />} />
        <Route path="/groups/:groupId/invite" element={<InviteFriends />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />
        <Route path="/bets" element={<MyBets />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}

export default App
