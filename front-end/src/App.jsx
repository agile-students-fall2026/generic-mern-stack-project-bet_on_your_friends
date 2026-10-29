
import { Link, Routes, Route } from 'react-router-dom'

// Home page, links to sign up or log in
function Home() {
  return (
    <main>
      <h1>Bet on Your Friends</h1>
      <p>Make predictions with your friends using virtual coins!</p>
      <nav>
        <Link to="/signup">Create Account</Link>
        <Link to="/login">Log In</Link>
      </nav>
    </main>
  )
}

// temp page until we build the actual screens
function TempPage({ title }) {
  return (
    <main>
      <h1>{title}</h1>
      <p> tbd. we like agile software development and devops </p>

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
      <Route path="/signup" element={<TempPage title="Create Account" />} />
      <Route path="/login" element={<TempPage title="Log In" />} />
      <Route path="/groups" element={<TempPage title="My Groups" />} />

      <Route path="*" element={<TempPage title="Page Not Found" />} />
    </Routes>
  )
}

export default App
