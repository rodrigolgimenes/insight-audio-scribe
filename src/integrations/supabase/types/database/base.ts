
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: Tables;
    Views: {
      [_ in never]: never
    };
    Functions: Functions;
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

import { AuthTables } from './auth';
import { ContentTables } from './content';
import { OrganizationTables } from './organization';
import { SubscriptionTables } from './subscription';

export type Tables = AuthTables & ContentTables & OrganizationTables & SubscriptionTables;

export interface Functions {
  generate_audio_url: {
    Args: {
      file_path: string
    }
    Returns: string
  }
  move_note_to_folder: {
    Args: {
      p_note_id: string
      p_folder_id: string
    }
    Returns: void
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
