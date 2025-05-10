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
      bug_report_attachments: {
        Row: {
          bug_report_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
        }
        Insert: {
          bug_report_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
        }
        Update: {
          bug_report_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_attachments_bug_report_id_fkey"
            columns: ["bug_report_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          browser_info: Json | null
          created_at: string
          description: string
          email: string
          id: string
          platform_info: Json | null
          priority: string | null
          status: string
          title: string
          total_attachments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string
          description: string
          email: string
          id?: string
          platform_info?: Json | null
          priority?: string | null
          status?: string
          title: string
          total_attachments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_info?: Json | null
          created_at?: string
          description?: string
          email?: string
          id?: string
          platform_info?: Json | null
          priority?: string | null
          status?: string
          title?: string
          total_attachments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      meeting_minutes: {
        Row: {
          content: string
          created_at: string
          format: string
          id: string
          note_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          format?: string
          id?: string
          note_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          format?: string
          id?: string
          note_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes_without_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_personas: {
        Row: {
          created_at: string
          custom_role: string | null
          custom_vocabulary: string[] | null
          focus_areas: string[] | null
          primary_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role?: string | null
          custom_vocabulary?: string[] | null
          focus_areas?: string[] | null
          primary_role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role?: string | null
          custom_vocabulary?: string[] | null
          focus_areas?: string[] | null
          primary_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          audio_url: string | null
          created_at: string
          duration: number | null
          error_message: string | null
          full_prompt: string | null
          id: string
          original_transcript: string | null
          processed_content: string
          processing_progress: number | null
          recording_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          full_prompt?: string | null
          id?: string
          original_transcript?: string | null
          processed_content?: string
          processing_progress?: number | null
          recording_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          full_prompt?: string | null
          id?: string
          original_transcript?: string | null
          processed_content?: string
          processing_progress?: number | null
          recording_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: true
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_projects: {
        Row: {
          created_at: string
          note_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_projects_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_projects_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_without_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_tags: {
        Row: {
          created_at: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_without_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_logs: {
        Row: {
          details: Json | null
          id: string
          message: string
          note_id: string | null
          recording_id: string
          stage: string
          status: string | null
          timestamp: string
          visible_to_user: boolean | null
        }
        Insert: {
          details?: Json | null
          id?: string
          message: string
          note_id?: string | null
          recording_id: string
          stage: string
          status?: string | null
          timestamp?: string
          visible_to_user?: boolean | null
        }
        Update: {
          details?: Json | null
          id?: string
          message?: string
          note_id?: string | null
          recording_id?: string
          stage?: string
          status?: string | null
          timestamp?: string
          visible_to_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_logs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_logs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_without_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_logs_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          payment_method: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          payment_method?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          payment_method?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          business_area: string[] | null
          created_at: string
          description: string | null
          id: string
          key_terms: string[] | null
          meeting_types: string[] | null
          name: string
          objective: string | null
          scope: string | null
          updated_at: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          business_area?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          key_terms?: string[] | null
          meeting_types?: string[] | null
          name: string
          objective?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          business_area?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          key_terms?: string[] | null
          meeting_types?: string[] | null
          name?: string
          objective?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          audio_url: string | null
          created_at: string
          duration: number | null
          error_message: string | null
          file_path: string
          id: string
          needs_audio_extraction: boolean | null
          needs_compression: boolean | null
          original_file_path: string | null
          original_file_type: string | null
          processed_at: string | null
          processed_audio_url: string | null
          processed_content: string | null
          status: string | null
          task_id: string | null
          title: string
          transcription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          file_path: string
          id?: string
          needs_audio_extraction?: boolean | null
          needs_compression?: boolean | null
          original_file_path?: string | null
          original_file_type?: string | null
          processed_at?: string | null
          processed_audio_url?: string | null
          processed_content?: string | null
          status?: string | null
          task_id?: string | null
          title: string
          transcription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          file_path?: string
          id?: string
          needs_audio_extraction?: boolean | null
          needs_compression?: boolean | null
          original_file_path?: string | null
          original_file_type?: string | null
          processed_at?: string | null
          processed_audio_url?: string | null
          processed_content?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
          transcription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      storage_logs: {
        Row: {
          bucket_id: string | null
          created_at: string
          id: string
          object_path: string | null
          operation: string | null
          user_id: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string
          id?: string
          object_path?: string | null
          operation?: string | null
          user_id?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string
          id?: string
          object_path?: string | null
          operation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      styles: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          prompt_template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          prompt_template: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          prompt_template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          price_id: string | null
          quantity: number | null
          status: string
          trial_end: string | null
          trial_start: string | null
          workspace_id: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status: string
          trial_end?: string | null
          trial_start?: string | null
          workspace_id?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          price_id?: string | null
          quantity?: number | null
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          category: string | null
          created_at: string
          description: string
          email: string
          id: string
          name: string
          status: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          status?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          status?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transcription_tasks: {
        Row: {
          content: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          last_checked_at: string | null
          note_id: string
          processed_at: string | null
          recording_id: string | null
          retries: number | null
          status: string
          task_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          note_id: string
          processed_at?: string | null
          recording_id?: string | null
          retries?: number | null
          status?: string
          task_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          note_id?: string
          processed_at?: string | null
          recording_id?: string | null
          retries?: number | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcription_tasks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcription_tasks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_without_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcription_tasks_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          audio_url: string
          content: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          is_system_audio: boolean | null
          processed_at: string | null
          status: string
        }
        Insert: {
          audio_url: string
          content: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_system_audio?: boolean | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          audio_url?: string
          content?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_system_audio?: boolean | null
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      workspace_users: {
        Row: {
          created_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      notes_without_projects: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number | null
          error_message: string | null
          full_prompt: string | null
          id: string | null
          original_transcript: string | null
          processed_content: string | null
          processing_progress: number | null
          recording_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: true
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_transcriptions: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string | null
          duration_ms: number | null
          id: string | null
          is_system_audio: boolean | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string | null
          is_system_audio?: boolean | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string | null
          is_system_audio?: boolean | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_transcription_chunks: {
        Args: { note_id_param: string }
        Returns: number
      }
      generate_audio_url: {
        Args: { file_path: string }
        Returns: string
      }
      get_note_total_chunks: {
        Args: { note_id_param: string }
        Returns: number
      }
      move_note_to_folder: {
        Args: { p_note_id: string; p_folder_id: string }
        Returns: undefined
      }
      move_note_to_project: {
        Args: { p_note_id: string; p_project_id: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
