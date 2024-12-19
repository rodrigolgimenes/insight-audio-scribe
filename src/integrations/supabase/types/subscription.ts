export interface SubscriptionTables {
  subscriptions: {
    Row: {
      id: string;
      workspace_id: string | null;
      status: string;
      price_id: string | null;
      quantity: number | null;
      cancel_at_period_end: boolean | null;
      cancel_at: string | null;
      canceled_at: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      created_at: string;
      ended_at: string | null;
      trial_start: string | null;
      trial_end: string | null;
    };
    Insert: {
      id?: string;
      workspace_id?: string | null;
      status: string;
      price_id?: string | null;
      quantity?: number | null;
      cancel_at_period_end?: boolean | null;
      cancel_at?: string | null;
      canceled_at?: string | null;
      current_period_start?: string | null;
      current_period_end?: string | null;
      created_at?: string;
      ended_at?: string | null;
      trial_start?: string | null;
      trial_end?: string | null;
    };
    Update: {
      id?: string;
      workspace_id?: string | null;
      status?: string;
      price_id?: string | null;
      quantity?: number | null;
      cancel_at_period_end?: boolean | null;
      cancel_at?: string | null;
      canceled_at?: string | null;
      current_period_start?: string | null;
      current_period_end?: string | null;
      created_at?: string;
      ended_at?: string | null;
      trial_start?: string | null;
      trial_end?: string | null;
    };
    Relationships: [
      {
        foreignKeyName: "subscriptions_workspace_id_fkey";
        columns: ["workspace_id"];
        isOneToOne: false;
        referencedRelation: "workspaces";
        referencedColumns: ["id"];
      }
    ];
  };
  workspaces: {
    Row: {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      slug: string;
      logo_url?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      slug?: string;
      logo_url?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  workspace_users: {
    Row: {
      workspace_id: string;
      user_id: string;
      role: string;
      created_at: string;
    };
    Insert: {
      workspace_id: string;
      user_id: string;
      role: string;
      created_at?: string;
    };
    Update: {
      workspace_id?: string;
      user_id?: string;
      role?: string;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "workspace_users_workspace_id_fkey";
        columns: ["workspace_id"];
        isOneToOne: false;
        referencedRelation: "workspaces";
        referencedColumns: ["id"];
      }
    ];
  };
}