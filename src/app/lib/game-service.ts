import { supabase, POINTS_PER_ORDER, SPIN_REWARDS, type PlayerStats, type SpinReward } from './supabase'

export async function getOrCreatePlayer(userId: string, username: string): Promise<PlayerStats> {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) return data

  const { data: created, error } = await supabase
    .from('player_stats')
    .insert({ user_id: userId, username })
    .select()
    .single()

  if (error) throw error
  return created
}

export async function getPlayer(userId: string): Promise<PlayerStats | null> {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function recordOrder(userId: string, username: string, orderTotal: number): Promise<{
  player: PlayerStats
  pointsEarned: number
  streakUpdated: boolean
  newStreak: number
}> {
  let player = await getPlayer(userId)
  if (!player) player = await getOrCreatePlayer(userId, username)

  const today = new Date().toISOString().split('T')[0]
  const lastDate = player.last_order_date
  let newStreak = player.current_streak
  let streakUpdated = false

  if (!lastDate) {
    newStreak = 1
    streakUpdated = true
  } else {
    const diffDays = Math.floor(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000
    )
    if (diffDays === 0) {
      // same day, no change
    } else if (diffDays === 1) {
      newStreak = player.current_streak + 1
      streakUpdated = true
    } else {
      newStreak = 1
      streakUpdated = true
    }
  }

  const basePoints = POINTS_PER_ORDER * Math.max(1, Math.floor(orderTotal))
  const streakBonus = newStreak >= 7 ? 50 : newStreak >= 3 ? 20 : 0
  const pointsEarned = basePoints + streakBonus
  const newLongest = Math.max(player.longest_streak, newStreak)
// In recordOrder — add spins_remaining to the update:
const { data: updated, error } = await supabase
  .from('player_stats')
  .update({
    points: player.points + pointsEarned,
    total_orders: player.total_orders + 1,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_order_date: today,
    spins_remaining: 3,   // ← RESET TO 3 ON EVERY ORDER
  })
  .eq('user_id', userId)
  .select()
  .single()

  if (error) throw error

  await supabase.from('orders').insert({ user_id: userId, points_earned: pointsEarned })

  return { player: updated, pointsEarned, streakUpdated, newStreak }
}

export function pickReward(): SpinReward {
  const rand = Math.random()
  let cumulative = 0
  for (const reward of SPIN_REWARDS) {
    cumulative += reward.probability
    if (rand <= cumulative) return reward
  }
  return SPIN_REWARDS[SPIN_REWARDS.length - 1]
}

// In recordSpin — add limit check at the top:
export async function recordSpin(userId: string, reward: SpinReward): Promise<PlayerStats> {
  const player = await getPlayer(userId)
  if (!player) throw new Error('Player not found')

  if (player.spins_remaining <= 0) {
    throw new Error('No spins left! Place an order to unlock 3 more spins.')
  }

  const { data: updated, error } = await supabase
    .from('player_stats')
    .update({
      points: player.points + reward.points,
      spins_remaining: player.spins_remaining - 1,  // ← DEDUCT 1
    })
    .eq('user_id', userId)
    .select()
    .single()
  

  if (error) throw error

  await supabase.from('spin_history').insert({ user_id: userId, reward: reward.label })

  return updated
}

export async function getLeaderboard(limit = 10): Promise<PlayerStats[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .order('points', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getPlayerRank(userId: string): Promise<number> {
  const { data } = await supabase
    .from('player_stats')
    .select('user_id, points')
    .order('points', { ascending: false })

  if (!data) return 0
  const rank = data.findIndex(p => p.user_id === userId)
  return rank === -1 ? 0 : rank + 1
}
