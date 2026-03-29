"""
Smart fitness schedule generator with periodization and BMR calculation.
Generates varied weekly training plans across the full cycle.
"""
from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from itertools import combinations
import hashlib


# Rest day patterns per frequency (0=Mon ... 6=Sun)
# Designed to spread rest days evenly and place them after heavy training days
REST_DAY_PATTERNS = {
    1: [1, 2, 3, 4, 5, 6],       # Train Mon only
    2: [1, 2, 4, 5, 6],           # Train Mon, Wed
    3: [1, 3, 5],                  # Train Mon, Wed, Fri → rest Tue, Thu, Sat+Sun
    4: [2, 5, 6],                  # Train Mon, Tue, Thu, Fri → rest Wed, Sat, Sun
    5: [2, 6],                     # Train Mon, Tue, Thu, Fri, Sat → rest Wed, Sun
    6: [6],                        # Train Mon-Sat → rest Sun
    7: [],                         # No rest
}

# Periodization intensity by week position in cycle (percentage through cycle)
def get_week_intensity(week_num: int, total_weeks: int) -> str:
    """Return intensity level based on position in cycle (periodization)."""
    if total_weeks <= 1:
        return "medium"
    pct = week_num / total_weeks
    # Every 4th week is a deload week
    if week_num % 4 == 0:
        return "deload"
    if pct < 0.3:
        return "light"
    if pct < 0.7:
        return "medium"
    return "heavy"


def generate_all_combinations(muscle_groups: List[str], frequency: int) -> List[List[str]]:
    """Generate training day combinations with dynamic group size based on groups/frequency ratio."""
    if not muscle_groups:
        return []
    num_groups = len(muscle_groups)
    # Dynamic: how many groups per training day
    import math
    groups_per_day = max(1, min(3, math.ceil(num_groups / max(1, frequency))))
    all_combos = []
    # Generate combos of the target size, plus +/- 1 for variety
    sizes = set()
    sizes.add(groups_per_day)
    if groups_per_day > 1:
        sizes.add(groups_per_day - 1)
    if groups_per_day < min(3, num_groups):
        sizes.add(groups_per_day + 1)
    for size in sorted(sizes):
        if size < 1 or size > num_groups:
            continue
        for combo in combinations(muscle_groups, size):
            all_combos.append(list(combo))
    return all_combos


def generate_week_schedule(
    muscle_groups: List[str],
    frequency: int,
    week_seed: int,
) -> Dict[int, List[str]]:
    """
    Generate one week's training schedule with variety based on week_seed.
    Different seeds produce different muscle group arrangements.
    Returns: {weekday_index: [muscle_groups]} for training days only.
    """
    frequency = max(1, min(7, frequency))
    rest_days = set(REST_DAY_PATTERNS.get(frequency, []))
    training_days = [d for d in range(7) if d not in rest_days][:frequency]

    if not muscle_groups:
        return {}

    all_combos = generate_all_combinations(muscle_groups, frequency)
    if not all_combos:
        return {}

    # Use seed to deterministically shuffle combos for this week
    seed_str = f"{week_seed}"
    seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)

    # Sort combos by a hash-based key for deterministic shuffling
    shuffled = sorted(all_combos, key=lambda c: int(hashlib.md5(f"{seed_hash}{''.join(c)}".encode()).hexdigest(), 16))

    schedule = {}
    used_groups_this_week = set()

    # First pass: try to cover all muscle groups
    for i, day in enumerate(training_days):
        # Pick combo that introduces the most new muscle groups
        best_combo = None
        best_new_count = -1
        for combo in shuffled:
            new_count = sum(1 for g in combo if g not in used_groups_this_week)
            combo_key = tuple(combo)
            if new_count > best_new_count:
                best_new_count = new_count
                best_combo = combo
        if best_combo:
            schedule[day] = best_combo
            used_groups_this_week.update(best_combo)
            shuffled = [c for c in shuffled if tuple(c) != tuple(best_combo)]
            if not shuffled:
                shuffled = sorted(all_combos, key=lambda c: int(hashlib.md5(f"{seed_hash + i}{''.join(c)}".encode()).hexdigest(), 16))

    return schedule


def get_today_muscle_groups(
    selected_muscle_groups: Optional[List[str]],
    fitness_frequency: int,
    cycle_start_date: Optional[date],
    training_cycle_days: int,
    plan_date: date,
) -> Optional[List[str]]:
    """
    Determine which muscle groups to train on a given date.
    Returns None if it's a rest day or no groups selected.
    """
    if not selected_muscle_groups or not cycle_start_date:
        return None

    frequency = max(1, min(7, fitness_frequency or 3))
    total_days = training_cycle_days or 28

    day_offset = (plan_date - cycle_start_date).days
    if day_offset < 0:
        return None

    day_in_cycle = day_offset % total_days
    week_in_cycle = day_in_cycle // 7
    weekday = day_in_cycle % 7

    # Generate this week's schedule with week number as seed for variety
    week_schedule = generate_week_schedule(selected_muscle_groups, frequency, week_in_cycle)
    return week_schedule.get(weekday)


def get_cycle_progress(
    cycle_start_date: Optional[date],
    training_cycle_days: int,
    plan_date: date,
) -> dict:
    """Return cycle progress info with periodization."""
    total_days = training_cycle_days or 28
    if not cycle_start_date:
        return {"current_day": 1, "total_days": total_days, "progress_pct": 0, "intensity": "medium"}

    days_elapsed = (plan_date - cycle_start_date).days
    current_day = min(days_elapsed + 1, total_days)
    current_week = (days_elapsed // 7) + 1
    total_weeks = max(1, total_days // 7)
    progress_pct = round((current_day / total_days) * 100)
    intensity = get_week_intensity(current_week, total_weeks)

    return {
        "current_day": current_day,
        "total_days": total_days,
        "current_week": current_week,
        "total_weeks": total_weeks,
        "progress_pct": progress_pct,
        "intensity": intensity,
    }


def get_full_week_preview(
    muscle_groups: List[str],
    frequency: int,
    week_num: int,
) -> List[dict]:
    """Return a 7-day preview for a given week number (for UI display)."""
    schedule = generate_week_schedule(muscle_groups, frequency, week_num)
    days = []
    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    for d in range(7):
        groups = schedule.get(d)
        days.append({
            "weekday": d,
            "name": day_names[d],
            "muscle_groups": groups,
            "is_rest": groups is None,
        })
    return days


# --- BMR / TDEE Calculation ---

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str = "male") -> float:
    """Mifflin-St Jeor equation for BMR."""
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age
    if gender == "female":
        bmr -= 161
    else:
        bmr += 5
    return round(bmr)


def calculate_tdee(bmr: float, frequency: int) -> float:
    """Estimate TDEE based on training frequency."""
    # Activity multipliers based on weekly training frequency
    if frequency <= 1:
        multiplier = 1.2
    elif frequency <= 3:
        multiplier = 1.375
    elif frequency <= 5:
        multiplier = 1.55
    else:
        multiplier = 1.725
    return round(bmr * multiplier)


def calculate_daily_targets(
    weight_kg: float, height_cm: float, age: int, gender: str,
    target_weight_kg: float, cycle_days: int, frequency: int,
    fitness_goal: str,
) -> dict:
    """Calculate daily calorie and macro targets."""
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, frequency)

    weight_diff = weight_kg - target_weight_kg
    # 1kg fat ≈ 7700 kcal
    daily_adjustment = round((weight_diff * 7700) / cycle_days) if cycle_days > 0 else 0

    if fitness_goal == "减脂":
        daily_calorie_target = tdee - abs(daily_adjustment)
        daily_calorie_target = max(daily_calorie_target, bmr)  # Never go below BMR
        protein_per_kg = 2.0
    else:
        daily_calorie_target = tdee + abs(daily_adjustment)
        protein_per_kg = 1.8

    protein_g = round(weight_kg * protein_per_kg)
    fat_g = round(daily_calorie_target * 0.25 / 9)
    carbs_g = round((daily_calorie_target - protein_g * 4 - fat_g * 9) / 4)

    return {
        "bmr": bmr,
        "tdee": tdee,
        "daily_calorie_target": round(daily_calorie_target),
        "daily_adjustment": daily_adjustment,
        "protein_g": protein_g,
        "fat_g": fat_g,
        "carbs_g": max(0, carbs_g),
    }
