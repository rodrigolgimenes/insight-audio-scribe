
import { Json } from './common';

export interface AuthTables {
  profiles: {
    Row: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      billing_address: Json | null;
      payment_method: Json | null;
      updated_at: string;
      created_at: string;
    };
    Insert: {
      id: string;
      email: string;
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
      billing_address?: Json | null;
      payment_method?: Json | null;
      updated_at?: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
      billing_address?: Json | null;
      payment_method?: Json | null;
      updated_at?: string;
      created_at?: string;
    };
    Relationships: [];
  };
}
