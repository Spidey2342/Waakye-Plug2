import { supabase, POINTS_PER_ORDER, SPIN_REWARDS, type PlayerStats, type SpinReward } from './supabase'

// Player identity is now keyed by phone number, not by a random per-device
// id. The per-device id changes across browsers/devices for the same
// person, which was creating a "new player" every time someone signed in
// from somewhere else.
export async function getOrCreatePlayer(phone: string, username: string): Promise<PlayerStats> {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('phone', phone)
    .single()

  if (data) {
    // Keep the display name fresh in case they typed it differently this time
    if (data.username !== username) {
      const { data: renamed } = await supabase
        .from('player_stats')
        .update({ username })
        .eq('phone', phone)
        .select()
        .single()
      return renamed ?? data
    }
    return data
  }

  const { data: created, error } = await supabase
    .from('player_stats')
    .insert({ phone, username })
    .select()
    .single()

  if (error) throw error
  return created
}

export async function getPlayer(phone: string): Promise<PlayerStats | null> {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('phone', phone)
    .single()
  return data
}

export async function recordOrder(phone: string, username: string, orderTotal: number): Promise<{
  player: PlayerStats
  pointsEarned: number
  streakUpdated: boolean
  newStreak: number
}> {
  let player = await getPlayer(phone)
  if (!player) player = await getOrCreatePlayer(phone, username)

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

  const { data: updated, error } = await supabase
    .from('player_stats')
    .update({
      points: player.points + pointsEarned,
      total_orders: player.total_orders + 1,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_order_date: today,
      spins_remaining: 3, // reset to 3 on every order
    })
    .eq('phone', phone)
    .select()
    .single()

  if (error) throw error

  // Use the canonical player row's own user_id for the `orders` FK, not the
  // caller's local device id — the two can differ once a phone number gets
  // matched to an existing account created from a different device.
  // NOTE: this used to be table "orders" — renamed to order_points_log by
  // multi_vendor_schema.sql to make room for the real transactional
  // orders table the vendor app writes to.
  await supabase.from('order_points_log').insert({ user_id: updated.user_id, points_earned: pointsEarned })

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

export async function recordSpin(phone: string, reward: SpinReward): Promise<PlayerStats> {
  const player = await getPlayer(phone)
  if (!player) throw new Error('Player not found')

  if (player.spins_remaining <= 0) {
    throw new Error('No spins left! Place an order to unlock 3 more spins.')
  }

  const { data: updated, error } = await supabase
    .from('player_stats')
    .update({
      points: player.points + reward.points,
      spins_remaining: player.spins_remaining - 1,
    })
    .eq('phone', phone)
    .select()
    .single()

  if (error) throw error

  await supabase.from('spin_history').insert({ user_id: updated.user_id, reward: reward.label })

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

export async function getPlayerRank(phone: string): Promise<number> {
  const { data } = await supabase
    .from('player_stats')
    .select('phone, points')
    .order('points', { ascending: false })

  if (!data) return 0
  const rank = data.findIndex((p) => p.phone === phone)
  return rank === -1 ? 0 : rank + 1
}