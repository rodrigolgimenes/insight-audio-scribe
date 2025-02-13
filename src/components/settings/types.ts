
export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export interface Subscription {
  status: string;
  price_id: string | null;
}
