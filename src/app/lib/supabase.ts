import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type PlayerStats = {
  id: string
  user_id: string
  username: string
  points: number
  total_orders: number
  current_streak: number
  longest_streak: number
  last_order_date: string | null
  created_at: string
}

export type SpinReward = {
  label: string
  points: number
  color: string
  probability: number
}

export const SPIN_REWARDS: SpinReward[] = [
  { label: 'Free Delivery',   points: 50,  color: '#1D9E75', probability: 0.20 },
  { label: '10% Off',         points: 30,  color: '#EF9F27', probability: 0.25 },
  { label: '+100 Points',     points: 100, color: '#7F77DD', probability: 0.15 },
  { label: 'Free Egg',        points: 20,  color: '#D85A30', probability: 0.20 },
  { label: '+50 Points',      points: 50,  color: '#378ADD', probability: 0.12 },
  { label: 'Try Again',       points: 5,   color: '#888780', probability: 0.08 },
]

export const POINTS_PER_ORDER = 10