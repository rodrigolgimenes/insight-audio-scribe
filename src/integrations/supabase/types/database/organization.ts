
export interface OrganizationTables {
  projects: {
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
  notes_projects: {
    Row: {
      note_id: string
      project_id: string
      created_at: string
    }
    Insert: {
      note_id: string
      project_id: string
      created_at?: string
    }
    Update: {
      note_id?: string
      project_id?: string
      created_at?: string
    }
    Relationships: [
      {
        foreignKeyName: "notes_projects_project_id_fkey"
        columns: ["project_id"]
        isOneToOne: false
        referencedRelation: "projects"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "notes_projects_note_id_fkey"
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
