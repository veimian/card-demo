export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          role: string | null
          plan: 'free' | 'premium' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          role?: string | null
          plan?: 'free' | 'premium' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          role?: string | null
          plan?: 'free' | 'premium' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          user_id: string
          current_streak: number
          longest_streak: number
          total_reviews: number
          last_review_date: string | null
          daily_goal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          current_streak?: number
          longest_streak?: number
          total_reviews?: number
          last_review_date?: string | null
          daily_goal?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_streak?: number
          longest_streak?: number
          total_reviews?: number
          last_review_date?: string | null
          daily_goal?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      review_logs: {
        Row: {
          id: string
          user_id: string
          card_id: string | null
          rating: number | null
          review_date: string
          time_spent: number | null
        }
        Insert: {
          id?: string
          user_id: string
          card_id?: string | null
          rating?: number | null
          review_date?: string
          time_spent?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string | null
          rating?: number | null
          review_date?: string
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_card_id_fkey"
            columns: ["card_id"]
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          order_index?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cards: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          title: string
          content: string
          summary: string | null
          is_public: boolean
          share_token: string | null
          next_review: string
          interval: number
          ease_factor: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          title: string
          content: string
          summary?: string | null
          is_public?: boolean
          share_token?: string | null
          next_review?: string
          interval?: number
          ease_factor?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          title?: string
          content?: string
          summary?: string | null
          is_public?: boolean
          share_token?: string | null
          next_review?: string
          interval?: number
          ease_factor?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      card_tags: {
        Row: {
          card_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          card_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          card_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_tags_card_id_fkey"
            columns: ["card_id"]
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      },
      comments: {
        Row: {
          id: string
          card_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_card_id_fkey"
            columns: ["card_id"]
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_category_statistics: {
        Args: {
          query_user_id: string
        }
        Returns: {
          name: string
          count: number
          due_count: number
          average_retention: number
          color: string
        }[]
      }
      get_daily_review_stats: {
        Args: {
          query_user_id: string
          start_date: string
        }
        Returns: {
          date: string
          reviews: number
          new_cards: number
          retention_rate: number
        }[]
      }
      get_hourly_review_patterns: {
        Args: {
          query_user_id: string
          user_timezone?: string
        }
        Returns: {
          hour: number
          count: number
          avg_rating: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
