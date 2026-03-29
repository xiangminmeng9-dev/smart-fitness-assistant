export interface UserProfile {
  id?: number;
  user_id?: number;
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  fitness_goal?: '减脂' | '增肌';
  fitness_frequency?: number;
  target_weight?: number;
  training_cycle_weeks?: number;
  cycle_start_date?: string;
  selected_muscle_groups?: string[];
  location_lat?: number;
  location_lng?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileCreate {
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  fitness_goal?: '减脂' | '增肌';
  fitness_frequency?: number;
  target_weight?: number;
  training_cycle_weeks?: number;
  cycle_start_date?: string;
  selected_muscle_groups?: string[];
  location_lat?: number;
  location_lng?: number;
}

export interface UserProfileUpdate {
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  fitness_goal?: '减脂' | '增肌';
  fitness_frequency?: number;
  target_weight?: number;
  training_cycle_weeks?: number;
  cycle_start_date?: string;
  selected_muscle_groups?: string[];
  location_lat?: number;
  location_lng?: number;
}

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

// Form validation errors
export interface ProfileFormErrors {
  age?: string;
  height?: string;
  weight?: string;
  fitness_goal?: string;
  fitness_frequency?: string;
  location?: string;
}