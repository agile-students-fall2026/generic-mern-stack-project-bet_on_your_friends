// group helpers shared by group pages

// picsum seed for default group picture
export function getRandomGroupPhotoSeed() {
  return Math.random().toString(36).slice(2)
}

// check if group has reached member limit
export function isGroupFull(group) {
  return group.memberLimit != null && group.memberIds.length >= group.memberLimit
}
