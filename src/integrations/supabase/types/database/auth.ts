
export interface AuthTables {
  profiles: {
    Row: {
      avatar_url: string | null
      billing_address: Json | null
      created_at: string
      email: string
      full_name: string | null
      id: string
      payment_method: Json | null
      updated_at: string
    }
    Insert: {
      avatar_url?: string | null
      billing_address?: Json | null
      created_at?: string
      email: string
      full_name?: string | null
      id: string
      payment_method?: Json | null
      updated_at?: string
    }
    Update: {
      avatar_url?: string | null
      billing_address?: Json | null
      created_at?: string
      email?: string
      full_name?: string | null
      id?: string
      payment_method?: Json | null
      updated_at?: string
    }
    Relationships: []
  }
}
