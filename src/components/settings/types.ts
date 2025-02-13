
export interface UserPreferences {
  user_id: string;
  default_microphone: string | null;
  preferred_language: string;
  default_style: string;
  custom_words: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export interface Subscription {
  status: string;
  price_id: string | null;
}
