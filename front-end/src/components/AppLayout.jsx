import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/auth'

// bottom navigation share icon props
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-6 w-6',
  'aria-hidden': true
}

// bottom navigation tabs
const navItems = [
  {
    to: '/groups',
    label: 'Groups',
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.5a5 5 0 0 1 5 5.5" />
      </svg>
    )
  },
  {
    to: '/bets',
    label: 'My Bets',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    )
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg {...iconProps}>
        <path d="M5 20v-8M12 20V5M19 20v-11" />
      </svg>
    )
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    )
  }
]

// page layout after log in
function AppLayout({ title, back, children }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#f8f5fb]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        {/* ensures the title gets the rest of header space */}
        <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div>
            {back && (
              <Link to={back} className="text-sm font-semibold text-nyu-violet">
                ‹ Back
              </Link>
            )}
          </div>

          {/* long titles get cut off with "..." instead of overlapping the coins */}
          <h1 className="truncate text-center text-lg font-bold">
            {title}
          </h1>

          {/* coin balance shown on every page */}
          <p className="justify-self-end rounded-full bg-nyu-lavender px-3 py-1 text-xs font-semibold whitespace-nowrap text-nyu-violet">
            {user.coinBalance.toLocaleString()} coins
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-3 text-xs ${
                    isActive
                      ? 'font-semibold text-nyu-violet'
                      : 'text-gray-500 hover:text-nyu-violet'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default AppLayout
