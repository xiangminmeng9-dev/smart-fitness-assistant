import type { WeatherInfo } from '../../types/plan';

export interface HeaderSectionProps {
  weather: WeatherInfo | null;
  selectedDate: string;
  isToday: boolean;
  locationName: string;
  onChangeDate: (offset: number) => void;
  onGoToday: () => void;
  isWeatherLoading: boolean;
}

export interface WorkoutGroupCardProps {
  group: {
    muscle_group: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest_seconds: number;
      weight_suggestion?: string;
      calories_burned: number;
      notes?: string;
      exercise_completed?: boolean;
    }>;
  };
  planId: number;
  groupIndex: number;
  onToggleExercise: (planId: number, groupIndex: number, exerciseIndex: number, completed: boolean) => void;
}

export interface MealSectionProps {
  meals: Array<{
    meal_type: string;
    time: string;
    self_cook?: {
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      ingredients?: string[];
      recipe_brief?: string;
    };
    takeout?: {
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      platform?: string;
      store_suggestion?: string;
    };
    eat_out?: {
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      restaurant_type?: string;
    };
  }>;
  source: 'self_cook' | 'takeout' | 'eat_out';
  onSourceChange: (source: 'self_cook' | 'takeout' | 'eat_out') => void;
}

export interface CalorieSummaryProps {
  summary: {
    bmr: number;
    exercise_burned: number;
    total_intake: number;
    net_calories: number;
  };
}

export interface CycleProgressProps {
  cycleStart: string;
  cycleDays: number;
  selectedDate: string;
}

export interface ProfileOverviewProps {
  profile: {
    age?: number;
    height?: number;
    weight?: number;
    fitness_goal?: '减脂' | '增肌';
    fitness_frequency?: number;
  };
}
