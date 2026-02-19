import { Database } from './supabase'

export type Card = Database['public']['Tables']['cards']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']

export interface CardWithDetails extends Card {
  categories: Category | null
  card_tags: { tags: Tag | null }[]
}
