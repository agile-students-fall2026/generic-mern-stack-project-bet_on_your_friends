// hard-coded mock user JSON data until actual database is set up and connected
const seedUsers = [
  {
    id: 'u1',
    name: 'Maya Chen',
    email: 'maya@gmail.com',
    password: 'Password@123',
    coinBalance: 1500
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    email: 'jordan@gmail.com',
    password: 'Password@123',
    coinBalance: 1200
  },
  {
    id: 'u3',
    name: 'Priya Patel',
    email: 'priya@gmail.com',
    password: 'Password@123',
    coinBalance: 2300
  },
  {
    id: 'u4',
    name: 'Sam Rivera',
    email: 'sam@gmail.com',
    password: 'Password@123',
    coinBalance: 800
  },
  {
    id: 'u5',
    name: 'Alex Kim',
    email: 'alex@gmail.com',
    password: 'Password@123',
    coinBalance: 1000
  }
]

// copy of the user without their password
function toPublicUser(user) {
  const { password, ...publicUser } = user

  return publicUser
}

module.exports = { seedUsers, toPublicUser }
