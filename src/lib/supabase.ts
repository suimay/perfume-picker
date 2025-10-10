import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Perfume = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  description: string | null;
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  scent_tags: string[];
  season: string[];
  time_of_day: string[];
  weather_match: string[];
  longevity: number;
  sillage: number;
  color_hex: string;
  purchase_url: string | null;
  created_at: string;
};

export type UserBookmark = {
  id: string;
  user_id: string;
  perfume_id: string;
  created_at: string;
};

export type UserPreference = {
  id: string;
  user_id: string;
  liked_notes: string[];
  disliked_notes: string[];
  updated_at: string;
};
