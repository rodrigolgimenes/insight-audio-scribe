export interface ContentTables {
  notes: {
    Row: {
      id: string;
      user_id: string;
      recording_id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      recording_id: string;
      title: string;
      content: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      recording_id?: string;
      title?: string;
      content?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "notes_recording_id_fkey";
        columns: ["recording_id"];
        isOneToOne: false;
        referencedRelation: "recordings";
        referencedColumns: ["id"];
      }
    ];
  };
  recordings: {
    Row: {
      id: string;
      user_id: string;
      title: string;
      duration: number | null;
      file_path: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      title: string;
      duration?: number | null;
      file_path: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      title?: string;
      duration?: number | null;
      file_path?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  styles: {
    Row: {
      id: string;
      name: string;
      description: string | null;
      prompt_template: string;
      category: string | null;
      user_id: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      description?: string | null;
      prompt_template: string;
      category?: string | null;
      user_id: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      description?: string | null;
      prompt_template?: string;
      category?: string | null;
      user_id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
}