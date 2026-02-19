import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, Category, Tag, CardWithDetails } from '../types/app'
import { Database } from '../types/supabase'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type CardInsert = Database['public']['Tables']['cards']['Insert']

// --- Categories ---

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true })
      
      if (error) throw error
      return data as Category[]
    }
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newCategory: CategoryInsert) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['cards'] }) // Cards might reference categories
    }
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

// --- Tags ---

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data as Tag[]
    }
  })
}

export const useCreateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newTag: TagInsert) => {
      const { data, error } = await supabase
        .from('tags')
        .insert([newTag])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}

export const useUpdateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

export const useDeleteTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

// --- Cards ---

export const useCards = () => {
  return useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select(`
          *,
          categories (*),
          card_tags (
            tags (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data as unknown as CardWithDetails[]
    }
  })
}

// Fetch a single card by ID or Share Token
export const useCard = (idOrToken: string) => {
  return useQuery({
    queryKey: ['card', idOrToken],
    queryFn: async () => {
      // Try to fetch by ID first (authenticated user)
      // Or by share_token (public access)
      
      // We need to determine if it's a UUID (ID) or potentially a token?
      // Actually, let's try to query by ID first.
      
      let query = supabase
        .from('cards')
        .select(`
          *,
          categories (*),
          card_tags (
            tags (*)
          )
        `)
        .eq('id', idOrToken)
        .single()
        
      let { data, error } = await query
      
      if (error || !data) {
        // If not found by ID, try by share_token
        const tokenQuery = supabase
          .from('cards')
          .select(`
            *,
            categories (*),
            card_tags (
              tags (*)
            )
          `)
          .eq('share_token', idOrToken)
          .single()
          
        const tokenResult = await tokenQuery
        if (tokenResult.error) throw tokenResult.error
        data = tokenResult.data
      }

      return data as unknown as CardWithDetails
    },
    retry: 1
  })
}

export const useComments = (cardId: string) => {
  return useQuery({
    queryKey: ['comments', cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!cardId
  })
}

export const useCreateComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ card_id, content, user_id }: { card_id: string, content: string, user_id: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ card_id, content, user_id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.card_id] })
    }
  })
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    }
  })
}

export const useUpdateCardSharing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_public }: { id: string, is_public: boolean }) => {
      const { data, error } = await supabase
        .from('cards')
        .update({ is_public })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

export const useCreateCard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newCard: CardInsert) => {
      const { data, error } = await supabase
        .from('cards')
        .insert([newCard])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

export const useDeleteCard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    }
  })
}

