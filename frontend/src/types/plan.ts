export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  weight_suggestion?: string;
  calories_burned: number;
  notes?: string;
  exercise_completed?: boolean;
}

export interface WorkoutGroup {
  muscle_group: string;
  exercises: WorkoutExercise[];
}

export interface MealOption {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients?: string[];
  recipe_brief?: string;
  platform?: string;
  store_suggestion?: string;
  restaurant_type?: string;
}

export interface MealPlan {
  meal_type: string;
  time: string;
  self_cook: MealOption;
  takeout: MealOption;
  eat_out: MealOption;
}

export interface DailyPlanData {
  motivation_quote: string;
  weather_impact: string;
  training_split: string;
  split_day: string;
  warmup: string[];
  workout_groups: WorkoutGroup[];
  cooldown: string[];
  meal_plan: MealPlan[];
  total_calories_burned: number;
  total_calories_intake: number;
  recommendations: string[];
}

export interface FitnessPlan {
  id: number;
  user_id: number;
  plan_date: string;
  plan_data: DailyPlanData;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  location: string;
  icon: string;
}

export interface MotivationInfo {
  quote: string;
  timestamp: string;
}
