
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
      // Project embeddings table with updated field_type column
      project_embeddings: {
        Row: {
          id: string
          project_id: string | null
          embedding: Json | null
          content_hash: string
          content: string | null
          created_at: string
          updated_at: string
          field_type: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          embedding?: Json | null
          content_hash: string
          content?: string | null
          created_at?: string
          updated_at?: string
          field_type?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          embedding?: Json | null
          content_hash?: string
          content?: string | null
          created_at?: string
          updated_at?: string
          field_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_embeddings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      
      // Notes projects junction table with updated classification fields
      notes_projects: {
        Row: {
          note_id: string
          project_id: string
          created_at: string
          similarity_score: number | null
          classified_at: string | null
          classification_reason: string | null
        }
        Insert: {
          note_id: string
          project_id: string
          created_at?: string
          similarity_score?: number | null
          classified_at?: string | null
          classification_reason?: string | null
        }
        Update: {
          note_id?: string
          project_id?: string
          created_at?: string
          similarity_score?: number | null
          classified_at?: string | null
          classification_reason?: string | null
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
          }
        ]
      }
    }
  }
}

// Additional type exports for project and note related types
export type ProjectEmbedding = Database['public']['Tables']['project_embeddings']['Row']
export type ProjectEmbeddingInsert = Database['public']['Tables']['project_embeddings']['Insert']
export type ProjectEmbeddingUpdate = Database['public']['Tables']['project_embeddings']['Update']

export type NoteProject = Database['public']['Tables']['notes_projects']['Row']
export type NoteProjectInsert = Database['public']['Tables']['notes_projects']['Insert']
export type NoteProjectUpdate = Database['public']['Tables']['notes_projects']['Update']
