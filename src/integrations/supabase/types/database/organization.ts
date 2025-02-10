
export interface OrganizationTables {
  folders: {
    Row: {
      id: string
      user_id: string
      name: string
      description: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      description?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      name?: string
      description?: string | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  notes_folders: {
    Row: {
      note_id: string
      folder_id: string
      created_at: string
    }
    Insert: {
      note_id: string
      folder_id: string
      created_at?: string
    }
    Update: {
      note_id?: string
      folder_id?: string
      created_at?: string
    }
    Relationships: [
      {
        foreignKeyName: "notes_folders_folder_id_fkey"
        columns: ["folder_id"]
        isOneToOne: false
        referencedRelation: "folders"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "notes_folders_note_id_fkey"
        columns: ["note_id"]
        isOneToOne: false
        referencedRelation: "notes"
        referencedColumns: ["id"]
      }
    ]
  }
  tags: {
    Row: {
      id: string
      user_id: string
      name: string
      color: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      color?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      name?: string
      color?: string | null
      created_at?: string
    }
    Relationships: []
  }
  notes_tags: {
    Row: {
      note_id: string
      tag_id: string
      created_at: string
    }
    Insert: {
      note_id: string
      tag_id: string
      created_at?: string
    }
    Update: {
      note_id?: string
      tag_id?: string
      created_at?: string
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
        foreignKeyName: "notes_tags_tag_id_fkey"
        columns: ["tag_id"]
        isOneToOne: false
        referencedRelation: "tags"
        referencedColumns: ["id"]
      }
    ]
  }
}
