import { supabase, POINTS_PER_ORDER, SPIN_REWARDS, type PlayerStats, type SpinReward } from './supabase'

// ─── Player ────────────────────────────────────────────────────────────────

export async function getOrCreatePlayer(userId: string, username: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) return data

  const { data: created, error: createError } = await supabase
    .from('player_stats')
    .insert({ user_id: userId, username })
    .select()
    .single()

  if (createError) throw createError
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

// ─── Order + Points + Streak ────────────────────────────────────────────────

export async function recordOrder(userId: string, orderTotal: number): Promise<{
  player: PlayerStats
  pointsEarned: number
  streakUpdated: boolean
  newStreak: number
}> {
  const player = await getPlayer(userId)
  if (!player) throw new Error('Player not found')

  const today = new Date().toISOString().split('T')[0]
  const lastDate = player.last_order_date

  // Calculate streak
  let newStreak = player.current_streak
  let streakUpdated = false

  if (!lastDate) {
    newStreak = 1
    streakUpdated = true
  } else {
    const last = new Date(lastDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / 86400000)

    if (diffDays === 0) {
      // Same day — streak unchanged
    } else if (diffDays === 1) {
      newStreak = player.current_streak + 1
      streakUpdated = true
    } else {
      // Streak broken
      newStreak = 1
      streakUpdated = true
    }
  }

  // Points: base per order + bonus for streaks
  const basePoints = POINTS_PER_ORDER * Math.floor(orderTotal)
  const streakBonus = newStreak >= 7 ? 50 : newStreak >= 3 ? 20 : 0
  const pointsEarned = basePoints + streakBonus

  const newLongest = Math.max(player.longest_streak, newStreak)

  // Update player stats
  const { data: updated, error } = await supabase
    .from('player_stats')
    .update({
      points: player.points + pointsEarned,
      total_orders: player.total_orders + 1,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_order_date: today,
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  // Log the order
  await supabase.from('orders').insert({
    user_id: userId,
    points_earned: pointsEarned,
  })

  return { player: updated, pointsEarned, streakUpdated, newStreak }
}

// ─── Spin the Wheel ─────────────────────────────────────────────────────────

export function pickReward(): SpinReward {
  const rand = Math.random()
  let cumulative = 0
  for (const reward of SPIN_REWARDS) {
    cumulative += reward.probability
    if (rand <= cumulative) return reward
  }
  return SPIN_REWARDS[SPIN_REWARDS.length - 1]
}

export async function recordSpin(userId: string, reward: SpinReward): Promise<PlayerStats> {
  const player = await getPlayer(userId)
  if (!player) throw new Error('Player not found')

  // Add reward points to player
  const { data: updated, error } = await supabase
    .from('player_stats')
    .update({ points: player.points + reward.points })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  // Log spin
  await supabase.from('spin_history').insert({
    user_id: userId,
    reward: reward.label,
  })

  return updated
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

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