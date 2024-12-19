export interface Style {
  id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  category: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}