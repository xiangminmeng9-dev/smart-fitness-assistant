// TypeScript interfaces matching backend models

export interface User {
  id: number
  username: string
  wechat_openid?: string
  created_at: string
}

export interface UserProfile {
  id: number
  user_id: number
  age: number
  gender: string
  height: number
  weight: number
  fitness_goal: '减脂' | '增肌'
  fitness_frequency: number
  target_weight: number
  training_cycle_days: number
  cycle_start_date: string
  selected_muscle_groups: string[]
  location_lat?: number
  location_lng?: number
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  calories: number
  notes?: string
  completed?: boolean
}

export interface WorkoutGroup {
  muscle_group: string
  exercises: Exercise[]
}

export interface MealOption {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  description: string
}

export interface MealPlan {
  breakfast: {
    self_cook: MealOption
    takeout: MealOption
    eat_out: MealOption
  }
  lunch: {
    self_cook: MealOption
    takeout: MealOption
    eat_out: MealOption
  }
  dinner: {
    self_cook: MealOption
    takeout: MealOption
    eat_out: MealOption
  }
}

export interface CalorieSummary {
  total_intake: number
  total_exercise: number
  bmr: number
  net_calories: number
}

export interface FitnessPlan {
  id: number
  user_id: number
  plan_date: string
  plan_data: {
    workout_groups: WorkoutGroup[]
    meal_plan: MealPlan
    calorie_summary: CalorieSummary
    recommendations: string[]
  }
  completed: boolean
  created_at: string
}

export interface UserModelConfig {
  id: number
  user_id: number
  provider_type: 'claude' | 'kimi' | 'glm' | 'minimax' | 'deepseek' | 'custom'
  base_url: string
  api_key: string
  model_name: string
}

export interface WeatherData {
  temperature: number
  description: string
  icon: string
  city: string
}

export interface MotivationData {
  quote: string
  author?: string
}

export interface TipItem {
  id: number
  category: string
  title: string
  content: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface ProfileStats {
  total_plans: number
  completed_plans: number
  completion_rate: number
}
