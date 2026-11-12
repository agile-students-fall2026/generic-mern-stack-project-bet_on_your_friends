const seedPredictions = [
  { id: 'p1', groupId: 'g1', creatorId: 'u2', question: 'Will Sam clean the kitchen this week?' },
  { id: 'p2', groupId: 'g1', creatorId: 'u1', question: 'Will everyone make it to dinner on Friday?' },
  { id: 'p3', groupId: 'g1', creatorId: 'u3', question: 'Will Jordan finish the assignment early?' },
  { id: 'p4', groupId: 'g2', creatorId: 'u2', question: 'Will our study session start on time?' },
  { id: 'p5', groupId: 'g4', creatorId: 'u4', question: 'Will Alex visit this weekend?' },
  { id: 'p6', groupId: 'g4', creatorId: 'u5', question: 'Will everyone join the family call?' }
].map((prediction) => ({
  ...prediction,
  outcomes: ['Yes', 'No'],
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  stake: 25,
  bets: [],
  comments: [],
  result: null
}))

module.exports = { seedPredictions }
