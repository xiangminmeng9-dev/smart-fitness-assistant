import httpx
import json
import random
from datetime import date
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.models.user import UserProfile
from app.services.schedule_generator import (
    get_today_muscle_groups, get_cycle_progress, calculate_daily_targets,
    get_week_intensity,
)


# ---------------------------------------------------------------------------
# Exercise database per muscle group (Chinese)
# ---------------------------------------------------------------------------
EXERCISE_DB: Dict[str, List[Dict[str, Any]]] = {
    "胸": [
        {"name": "杠铃卧推", "sets": 4, "reps": "8-12", "rest_seconds": 90, "weight_suggestion": "根据自身能力选择", "calories_burned": 80, "notes": "肩胛骨收紧，双脚踩实地面"},
        {"name": "上斜哑铃卧推", "sets": 4, "reps": "10-12", "rest_seconds": 75, "weight_suggestion": "中等重量", "calories_burned": 70, "notes": "上斜角度30-45度，感受上胸发力"},
        {"name": "哑铃飞鸟", "sets": 3, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "轻至中等重量", "calories_burned": 50, "notes": "手臂微弯，感受胸肌拉伸"},
        {"name": "绳索夹胸", "sets": 3, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 45, "notes": "顶峰收缩停留1秒"},
        {"name": "俯卧撑", "sets": 3, "reps": "15-20", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 40, "notes": "核心收紧，身体保持一条直线"},
    ],
    "背": [
        {"name": "引体向上", "sets": 4, "reps": "6-10", "rest_seconds": 90, "weight_suggestion": "自重或负重", "calories_burned": 85, "notes": "全程控制，避免借力摆动"},
        {"name": "杠铃划船", "sets": 4, "reps": "8-12", "rest_seconds": 90, "weight_suggestion": "中等偏重", "calories_burned": 80, "notes": "背部挺直，肘部贴近身体"},
        {"name": "坐姿划船", "sets": 3, "reps": "10-12", "rest_seconds": 75, "weight_suggestion": "中等重量", "calories_burned": 60, "notes": "挺胸收背，感受背阔肌收缩"},
        {"name": "高位下拉", "sets": 3, "reps": "10-12", "rest_seconds": 75, "weight_suggestion": "中等重量", "calories_burned": 55, "notes": "下拉至锁骨位置，控制离心"},
        {"name": "单臂哑铃划船", "sets": 3, "reps": "10-12", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 50, "notes": "保持躯干稳定，感受背部发力"},
    ],
    "肩": [
        {"name": "哑铃推举", "sets": 4, "reps": "8-12", "rest_seconds": 90, "weight_suggestion": "中等重量", "calories_burned": 70, "notes": "核心收紧，不要过度后仰"},
        {"name": "侧平举", "sets": 4, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "轻重量", "calories_burned": 45, "notes": "小指略高于拇指，控制速度"},
        {"name": "面拉", "sets": 3, "reps": "15-20", "rest_seconds": 60, "weight_suggestion": "轻至中等", "calories_burned": 35, "notes": "外旋手臂，感受后束发力"},
        {"name": "前平举", "sets": 3, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "轻重量", "calories_burned": 35, "notes": "交替进行，举至与肩同高"},
        {"name": "阿诺德推举", "sets": 3, "reps": "10-12", "rest_seconds": 75, "weight_suggestion": "中等重量", "calories_burned": 60, "notes": "旋转推举，全面刺激三角肌"},
    ],
    "腿": [
        {"name": "杠铃深蹲", "sets": 4, "reps": "8-10", "rest_seconds": 120, "weight_suggestion": "根据能力递增", "calories_burned": 120, "notes": "膝盖与脚尖方向一致，蹲至大腿平行"},
        {"name": "罗马尼亚硬拉", "sets": 4, "reps": "8-12", "rest_seconds": 90, "weight_suggestion": "中等偏重", "calories_burned": 100, "notes": "感受腘绳肌拉伸，背部保持平直"},
        {"name": "腿举", "sets": 3, "reps": "10-12", "rest_seconds": 90, "weight_suggestion": "中等偏重", "calories_burned": 80, "notes": "不要完全锁死膝关节"},
        {"name": "保加利亚分腿蹲", "sets": 3, "reps": "10-12/侧", "rest_seconds": 75, "weight_suggestion": "中等重量", "calories_burned": 70, "notes": "后脚放在凳上，前膝不超过脚尖"},
        {"name": "腿弯举", "sets": 3, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 45, "notes": "控制离心阶段，感受腘绳肌"},
    ],
    "手臂": [
        {"name": "杠铃弯举", "sets": 4, "reps": "10-12", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 45, "notes": "大臂固定，避免借力"},
        {"name": "锤式弯举", "sets": 3, "reps": "10-12", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 40, "notes": "中立握法，锻炼肱肌"},
        {"name": "绳索三头下压", "sets": 4, "reps": "12-15", "rest_seconds": 60, "weight_suggestion": "中等重量", "calories_burned": 40, "notes": "大臂贴紧身体，只动前臂"},
        {"name": "法式推举", "sets": 3, "reps": "10-12", "rest_seconds": 60, "weight_suggestion": "轻至中等", "calories_burned": 35, "notes": "肘部固定，缓慢下放"},
        {"name": "集中弯举", "sets": 3, "reps": "12-15", "rest_seconds": 45, "weight_suggestion": "轻重量", "calories_burned": 30, "notes": "顶峰收缩停留2秒"},
    ],
    "腹部": [
        {"name": "卷腹", "sets": 3, "reps": "15-20", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 35, "notes": "下背贴地，用腹肌发力"},
        {"name": "平板支撑", "sets": 3, "reps": "30-60秒", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 30, "notes": "身体成一条直线，不要塌腰"},
        {"name": "俄罗斯转体", "sets": 3, "reps": "20次(左右各10)", "rest_seconds": 45, "weight_suggestion": "轻重量或自重", "calories_burned": 35, "notes": "双脚离地，转动躯干"},
        {"name": "悬垂举腿", "sets": 3, "reps": "10-15", "rest_seconds": 60, "weight_suggestion": "自重", "calories_burned": 40, "notes": "控制速度，避免摆动"},
        {"name": "死虫式", "sets": 3, "reps": "12次/侧", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 25, "notes": "下背始终贴地，对侧手脚交替"},
    ],
    "有氧": [
        {"name": "跑步机慢跑", "sets": 1, "reps": "25-30分钟", "rest_seconds": 0, "weight_suggestion": "配速6-8km/h", "calories_burned": 250, "notes": "保持心率在最大心率60-70%"},
        {"name": "椭圆机", "sets": 1, "reps": "20-25分钟", "rest_seconds": 0, "weight_suggestion": "中等阻力", "calories_burned": 200, "notes": "全身协调运动，膝关节友好"},
        {"name": "划船机", "sets": 1, "reps": "15-20分钟", "rest_seconds": 0, "weight_suggestion": "中等阻力", "calories_burned": 220, "notes": "先蹬腿再拉手，注意节奏"},
        {"name": "跳绳", "sets": 3, "reps": "3分钟/组", "rest_seconds": 60, "weight_suggestion": "自重", "calories_burned": 180, "notes": "前脚掌着地，手腕发力"},
        {"name": "动感单车", "sets": 1, "reps": "20-30分钟", "rest_seconds": 0, "weight_suggestion": "中等阻力", "calories_burned": 230, "notes": "调整座椅高度，保持踏频80-100"},
    ],
}

# ---------------------------------------------------------------------------
# Meal templates with variety
# ---------------------------------------------------------------------------
MEAL_TEMPLATES = [
    # Template 0
    {
        "breakfast": {
            "self_cook": {"name": "鸡蛋燕麦粥+水果", "protein_g": 22, "carbs_g": 45, "fat_g": 10, "ingredients": ["燕麦50g", "鸡蛋2个", "牛奶200ml", "蓝莓50g"], "recipe_brief": "燕麦加牛奶煮3分钟，煎蛋，配蓝莓"},
            "takeout": {"name": "全麦三明治+美式咖啡", "protein_g": 20, "carbs_g": 40, "fat_g": 12, "platform": "美团/饿了么", "store_suggestion": "Manner/瑞幸"},
            "eat_out": {"name": "皮蛋瘦肉粥+茶叶蛋", "protein_g": 18, "carbs_g": 42, "fat_g": 8, "restaurant_type": "早餐店/粥铺"},
        },
        "lunch": {
            "self_cook": {"name": "鸡胸肉糙米饭+西兰花", "protein_g": 40, "carbs_g": 55, "fat_g": 8, "ingredients": ["鸡胸肉150g", "糙米100g", "西兰花150g", "橄榄油5ml"], "recipe_brief": "鸡胸肉煎熟切片，糙米蒸熟，西兰花焯水"},
            "takeout": {"name": "沙拉鸡胸肉饭", "protein_g": 35, "carbs_g": 60, "fat_g": 12, "platform": "美团/饿了么", "store_suggestion": "沙野轻食/超级碗"},
            "eat_out": {"name": "黄焖鸡米饭(少油)", "protein_g": 30, "carbs_g": 65, "fat_g": 15, "restaurant_type": "快餐店"},
        },
        "dinner": {
            "self_cook": {"name": "清蒸鱼+蔬菜沙拉", "protein_g": 35, "carbs_g": 20, "fat_g": 10, "ingredients": ["鲈鱼200g", "生菜100g", "番茄100g", "黄瓜100g"], "recipe_brief": "鲈鱼清蒸8分钟，蔬菜切好拌橄榄油醋汁"},
            "takeout": {"name": "日式三文鱼定食", "protein_g": 32, "carbs_g": 45, "fat_g": 14, "platform": "美团/饿了么", "store_suggestion": "吉野家/食其家"},
            "eat_out": {"name": "清蒸鱼套餐", "protein_g": 30, "carbs_g": 40, "fat_g": 12, "restaurant_type": "粤菜馆/蒸菜馆"},
        },
        "snack": {
            "self_cook": {"name": "希腊酸奶+坚果", "protein_g": 15, "carbs_g": 12, "fat_g": 8, "ingredients": ["希腊酸奶150g", "混合坚果15g"], "recipe_brief": "酸奶倒入碗中，撒上坚果即可"},
            "takeout": {"name": "蛋白棒+无糖豆浆", "protein_g": 20, "carbs_g": 15, "fat_g": 6, "platform": "便利店", "store_suggestion": "全家/711"},
            "eat_out": {"name": "鲜榨果汁+全麦面包", "protein_g": 8, "carbs_g": 30, "fat_g": 4, "restaurant_type": "果汁店/面包房"},
        },
    },
    # Template 1
    {
        "breakfast": {
            "self_cook": {"name": "全麦吐司+牛油果+水煮蛋", "protein_g": 20, "carbs_g": 35, "fat_g": 16, "ingredients": ["全麦吐司2片", "牛油果半个", "鸡蛋2个"], "recipe_brief": "吐司烤3分钟，牛油果切片铺上，配水煮蛋"},
            "takeout": {"name": "杂粮煎饼+豆浆", "protein_g": 15, "carbs_g": 48, "fat_g": 10, "platform": "美团/饿了么", "store_suggestion": "附近早餐店"},
            "eat_out": {"name": "小笼包+豆腐脑", "protein_g": 18, "carbs_g": 40, "fat_g": 12, "restaurant_type": "早餐店/包子铺"},
        },
        "lunch": {
            "self_cook": {"name": "牛肉炒芹菜+紫米饭", "protein_g": 38, "carbs_g": 50, "fat_g": 12, "ingredients": ["牛肉150g", "芹菜200g", "紫米100g", "姜蒜适量"], "recipe_brief": "牛肉切片腌制，大火快炒芹菜和牛肉，紫米提前蒸好"},
            "takeout": {"name": "牛肉饭+蔬菜", "protein_g": 32, "carbs_g": 58, "fat_g": 14, "platform": "美团/饿了么", "store_suggestion": "吉野家/食其家"},
            "eat_out": {"name": "兰州拉面(牛肉面)", "protein_g": 28, "carbs_g": 65, "fat_g": 10, "restaurant_type": "面馆"},
        },
        "dinner": {
            "self_cook": {"name": "虾仁豆腐煲+凉拌黄瓜", "protein_g": 35, "carbs_g": 15, "fat_g": 10, "ingredients": ["虾仁150g", "豆腐200g", "黄瓜150g", "蒜末适量"], "recipe_brief": "虾仁焯水，豆腐切块煮汤，黄瓜拍碎拌蒜"},
            "takeout": {"name": "麻辣烫(多菜少粉)", "protein_g": 25, "carbs_g": 35, "fat_g": 15, "platform": "美团/饿了么", "store_suggestion": "杨国福/张亮"},
            "eat_out": {"name": "蒸汽海鲜", "protein_g": 35, "carbs_g": 20, "fat_g": 8, "restaurant_type": "海鲜餐厅"},
        },
        "snack": {
            "self_cook": {"name": "香蕉蛋白奶昔", "protein_g": 25, "carbs_g": 28, "fat_g": 4, "ingredients": ["香蕉1根", "蛋白粉1勺", "牛奶200ml"], "recipe_brief": "所有材料放入搅拌机打匀"},
            "takeout": {"name": "低脂酸奶+水果杯", "protein_g": 10, "carbs_g": 25, "fat_g": 3, "platform": "便利店", "store_suggestion": "全家/罗森"},
            "eat_out": {"name": "鲜果茶(少糖)+蛋白棒", "protein_g": 18, "carbs_g": 20, "fat_g": 5, "restaurant_type": "茶饮店"},
        },
    },
    # Template 2
    {
        "breakfast": {
            "self_cook": {"name": "蔬菜鸡蛋饼+牛奶", "protein_g": 22, "carbs_g": 30, "fat_g": 12, "ingredients": ["鸡蛋2个", "面粉30g", "胡萝卜丝", "菠菜", "牛奶250ml"], "recipe_brief": "蛋液混合面粉和蔬菜丝，平底锅煎至两面金黄"},
            "takeout": {"name": "肉夹馍+八宝粥", "protein_g": 18, "carbs_g": 50, "fat_g": 14, "platform": "美团/饿了么", "store_suggestion": "西少爷/袁记"},
            "eat_out": {"name": "生煎包+豆浆", "protein_g": 16, "carbs_g": 45, "fat_g": 15, "restaurant_type": "早餐店/生煎铺"},
        },
        "lunch": {
            "self_cook": {"name": "三文鱼藜麦沙拉", "protein_g": 38, "carbs_g": 40, "fat_g": 18, "ingredients": ["三文鱼150g", "藜麦80g", "混合生菜", "牛油果半个", "柠檬汁"], "recipe_brief": "三文鱼煎至五分熟，藜麦煮熟放凉，混合蔬菜拌匀"},
            "takeout": {"name": "鸡肉卷+玉米浓汤", "protein_g": 28, "carbs_g": 55, "fat_g": 16, "platform": "美团/饿了么", "store_suggestion": "赛百味/肯德基"},
            "eat_out": {"name": "日式定食(烤鱼套餐)", "protein_g": 32, "carbs_g": 50, "fat_g": 12, "restaurant_type": "日料店"},
        },
        "dinner": {
            "self_cook": {"name": "番茄牛腩+荞麦面", "protein_g": 35, "carbs_g": 48, "fat_g": 12, "ingredients": ["牛腩200g", "番茄2个", "荞麦面100g", "洋葱半个"], "recipe_brief": "牛腩炖番茄40分钟，荞麦面煮熟浇汁"},
            "takeout": {"name": "冒菜(多肉多菜)", "protein_g": 28, "carbs_g": 30, "fat_g": 18, "platform": "美团/饿了么", "store_suggestion": "三顾冒菜"},
            "eat_out": {"name": "潮汕牛肉火锅(清汤)", "protein_g": 40, "carbs_g": 25, "fat_g": 15, "restaurant_type": "火锅店"},
        },
        "snack": {
            "self_cook": {"name": "红薯+水煮蛋", "protein_g": 12, "carbs_g": 35, "fat_g": 5, "ingredients": ["红薯1个(200g)", "鸡蛋1个"], "recipe_brief": "红薯蒸15分钟，鸡蛋水煮8分钟"},
            "takeout": {"name": "全麦面包+美式咖啡", "protein_g": 8, "carbs_g": 30, "fat_g": 4, "platform": "便利店/咖啡店", "store_suggestion": "星巴克/瑞幸"},
            "eat_out": {"name": "水果沙拉+酸奶", "protein_g": 10, "carbs_g": 28, "fat_g": 6, "restaurant_type": "轻食店"},
        },
    },
]

WARMUP_OPTIONS = [
    ["开合跳 30秒", "手臂环绕 各方向10次", "高抬腿 30秒", "动态拉伸 2分钟"],
    ["慢跑 3分钟", "肩部环绕 各10次", "臀桥 15次", "弓步走 10步/侧"],
    ["跳绳 2分钟", "猫牛式 10次", "侧弓步 10次/侧", "手腕脚踝环绕"],
]

COOLDOWN_OPTIONS = [
    ["全身拉伸 5分钟", "泡沫轴放松 3分钟", "深呼吸放松 1分钟"],
    ["静态拉伸 5分钟", "筋膜球放松 3分钟", "冥想放松 2分钟"],
    ["瑜伽拉伸 5分钟", "按摩放松目标肌群 3分钟", "腹式呼吸 1分钟"],
]

MOTIVATION_QUOTES = [
    "坚持就是胜利，每一次训练都在塑造更好的自己。",
    "没有捷径，只有日复一日的坚持。今天的汗水是明天的勋章。",
    "你的身体能做到的，远比你想象的多。",
    "不要等到有动力才行动，行动本身就是最好的动力。",
    "每一次突破极限，都是在重新定义自己。",
    "健身不是惩罚身体，而是庆祝身体的能力。",
    "今天不想练？正是这种时候最需要坚持。",
    "进步不是线性的，但只要不停下脚步，你就在前进。",
]

REST_DAY_QUOTES = [
    "休息是训练的一部分，肌肉在恢复中成长。",
    "今天好好休息，为下一次训练蓄力。",
    "适当的休息让你走得更远，享受今天的恢复日吧。",
    "休息日也是进步日，身体正在悄悄变强。",
]


def generate_mock_plan(
    profile: "UserProfile",
    plan_date: date,
    muscle_groups: List[str],
    is_rest_day: bool,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """Generate a deterministic mock fitness plan when AI is unavailable."""
    targets = context["targets"]
    day_in_cycle = context.get("day_in_cycle", 0)
    cycle_info = context.get("cycle_info", {})
    intensity = cycle_info.get("intensity", "medium")

    # Seed random for deterministic but varied output per date
    seed = int(plan_date.toordinal()) + (profile.id if profile.id else 0)
    rng = random.Random(seed)

    weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    weekday_name = weekday_names[plan_date.weekday()]

    # --- Motivation ---
    if is_rest_day:
        quote = rng.choice(REST_DAY_QUOTES)
    else:
        quote = rng.choice(MOTIVATION_QUOTES)

    # --- Warmup & Cooldown ---
    warmup = rng.choice(WARMUP_OPTIONS) if not is_rest_day else ["轻度散步 10分钟", "全身拉伸 5分钟"]
    cooldown = rng.choice(COOLDOWN_OPTIONS) if not is_rest_day else ["放松拉伸 5分钟"]

    # --- Workout groups ---
    workout_groups = []
    total_exercise_calories = 0

    if not is_rest_day and muscle_groups:
        # Intensity multiplier for sets
        set_mult = {"deload": 0.7, "light": 0.8, "medium": 1.0, "heavy": 1.15}.get(intensity, 1.0)

        for mg in muscle_groups:
            exercises_pool = EXERCISE_DB.get(mg, EXERCISE_DB.get("有氧", []))
            # Pick 3-4 exercises, varied by seed
            pick_count = 3 if intensity == "deload" else 4
            picked = rng.sample(exercises_pool, min(pick_count, len(exercises_pool)))

            exercises = []
            for ex in picked:
                adjusted_sets = max(2, round(ex["sets"] * set_mult))
                cal = round(ex["calories_burned"] * set_mult)
                total_exercise_calories += cal
                exercises.append({
                    **ex,
                    "sets": adjusted_sets,
                    "calories_burned": cal,
                    "exercise_completed": False,
                })
            workout_groups.append({"muscle_group": mg, "exercises": exercises})

    # --- Meal plan ---
    template_idx = day_in_cycle % len(MEAL_TEMPLATES)
    template = MEAL_TEMPLATES[template_idx]
    daily_cal_target = targets.get("daily_calorie_target", 2000)

    meal_types = [
        ("早餐", "07:30", "breakfast", 0.25),
        ("午餐", "12:00", "lunch", 0.35),
        ("晚餐", "18:30", "dinner", 0.30),
        ("加餐", "15:30", "snack", 0.10),
    ]

    meal_plan = []
    total_intake = 0
    for label, time_str, key, ratio in meal_types:
        meal_cal = round(daily_cal_target * ratio)
        t = template[key]

        def _scale(option: dict, target_cal: int) -> dict:
            base_cal = option.get("protein_g", 20) * 4 + option.get("carbs_g", 30) * 4 + option.get("fat_g", 10) * 9
            factor = target_cal / base_cal if base_cal > 0 else 1.0
            scaled = {**option, "calories": target_cal}
            scaled["protein_g"] = round(option.get("protein_g", 20) * factor)
            scaled["carbs_g"] = round(option.get("carbs_g", 30) * factor)
            scaled["fat_g"] = round(option.get("fat_g", 10) * factor)
            return scaled

        meal_plan.append({
            "meal_type": label,
            "time": time_str,
            "self_cook": _scale(t["self_cook"], meal_cal),
            "takeout": _scale(t["takeout"], meal_cal),
            "eat_out": _scale(t["eat_out"], meal_cal),
        })
        total_intake += meal_cal

    # --- Calorie summary ---
    muscle_str = "、".join(muscle_groups) if muscle_groups else "休息日"
    calorie_summary = {
        "bmr": targets["bmr"],
        "exercise_burned": total_exercise_calories,
        "total_intake": total_intake,
        "net_calories": total_intake - total_exercise_calories - targets["bmr"],
    }

    # --- Recommendations ---
    goal = profile.fitness_goal or "减脂"
    recs = [
        f"今日训练强度为{intensity}，请合理控制重量和组数。",
        f"每日蛋白质目标{targets['protein_g']}g，注意均匀分配到每餐。",
    ]
    if goal == "减脂":
        recs.append("保持热量缺口，但不要低于基础代谢率。")
        recs.append("训练后30分钟内补充蛋白质有助于恢复。")
    else:
        recs.append("增肌期保持热量盈余，碳水是训练的燃料。")
        recs.append("训练后补充蛋白质和碳水，促进肌肉合成。")
    if is_rest_day:
        recs = [
            "休息日注意补充水分，建议饮水2-3升。",
            "可以进行轻度活动如散步、瑜伽，促进恢复。",
            "保证充足睡眠(7-9小时)，这是恢复的关键。",
        ]

    return {
        "motivation_quote": quote,
        "weather_impact": "请根据实际天气调整训练安排",
        "training_split": f"今日训练: {muscle_str}" if not is_rest_day else "今日休息",
        "split_day": muscle_str,
        "is_rest_day": is_rest_day,
        "warmup": warmup,
        "workout_groups": workout_groups,
        "cooldown": cooldown,
        "meal_plan": meal_plan,
        "calorie_summary": calorie_summary,
        "recommendations": recs,
    }


async def generate_fitness_plan(
    profile: UserProfile, plan_date: date, muscle_groups: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Generate a fitness plan using AI or fall back to mock data."""
    if not muscle_groups:
        muscle_groups = get_today_muscle_groups(
            selected_muscle_groups=profile.selected_muscle_groups,
            fitness_frequency=profile.fitness_frequency or 3,
            cycle_start_date=profile.cycle_start_date,
            training_cycle_days=profile.training_cycle_days or 28,
            plan_date=plan_date,
        )

    is_rest_day = muscle_groups is None
    if not muscle_groups:
        muscle_groups = []

    cycle_info = get_cycle_progress(
        profile.cycle_start_date, profile.training_cycle_days or 28, plan_date
    )

    weight = float(profile.weight) if profile.weight else 70
    height = float(profile.height) if profile.height else 170
    age = profile.age or 25
    gender = profile.gender or "male"
    target_weight = float(profile.target_weight) if profile.target_weight else weight
    cycle_days = profile.training_cycle_days or 28
    frequency = profile.fitness_frequency or 3
    goal = profile.fitness_goal or "减脂"

    targets = calculate_daily_targets(
        weight, height, age, gender, target_weight, cycle_days, frequency, goal
    )

    # Day in cycle for meal variety
    day_offset = 0
    if profile.cycle_start_date:
        day_offset = (plan_date - profile.cycle_start_date).days
    day_in_cycle = max(0, day_offset)

    context = {
        "muscle_groups": muscle_groups,
        "is_rest_day": is_rest_day,
        "cycle_info": cycle_info,
        "targets": targets,
        "day_in_cycle": day_in_cycle,
        "weekday": plan_date.weekday(),  # 0=Mon
    }

    if not settings.CLAUDE_API_KEY:
        return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context)

    try:
        muscle_str = "、".join(muscle_groups) if muscle_groups else "休息日"
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday_name = weekday_names[plan_date.weekday()]
        is_weekend = plan_date.weekday() >= 5

        prompt = f"""你是一位拥有10年经验的专业健身教练和营养师。请为以下用户生成专业的个性化健身计划。

用户信息：
- 性别：{"男" if gender == "male" else "女"}
- 年龄：{age}岁
- 身高：{height} cm
- 当前体重：{weight} kg
- 目标体重：{target_weight} kg
- 健身目标：{goal}
- 每周训练频率：{frequency} 次

身体数据：
- 基础代谢率(BMR)：{targets['bmr']} 千卡/天
- 日常总消耗(TDEE)：{targets['tdee']} 千卡/天
- 每日目标摄入：{targets['daily_calorie_target']} 千卡
- 蛋白质目标：{targets['protein_g']}g | 脂肪：{targets['fat_g']}g | 碳水：{targets['carbs_g']}g

训练周期：
- 进度：第{cycle_info['current_day']}天 / 共{cycle_info['total_days']}天
- 本周强度：{cycle_info.get('intensity', 'medium')}
- 计划日期：{plan_date.isoformat()} ({weekday_name})
- 周期第{day_in_cycle + 1}天

今日安排：{"休息日 - 不安排训练，只需饮食计划" if is_rest_day else f"训练肌群：{muscle_str}"}
- 位置坐标：{float(profile.location_lat) if profile.location_lat else None}, {float(profile.location_lng) if profile.location_lng else None}

重要要求：
1. {"今天是休息日，不需要训练计划，workout_groups为空数组" if is_rest_day else f"今日只针对以下肌群生成训练动作：{muscle_str}"}
2. 每个动作包含 "exercise_completed": false 字段
3. 热量计算必须包含基础代谢：净热量 = 摄入 - 运动消耗 - 基础代谢
4. {"周末可以适当安排一顿放纵餐或社交聚餐" if is_weekend else "工作日饮食以便捷高效为主"}
5. 饮食计划要有变化，不要每天一样！今天是周期第{day_in_cycle + 1}天，请生成与其他天不同的菜品
6. 根据训练强度({cycle_info.get('intensity', 'medium')})调整训练量和饮食

饮食要求（每餐提供三种方案）：
1. 自己做：列出食材和简要做法
2. 点外卖：推荐平台和店铺
3. 店里吃：推荐餐厅类型

请以JSON格式返回，严格符合以下结构：
{{
  "motivation_quote": "专业激励语",
  "weather_impact": "天气对训练的影响建议",
  "training_split": "今日训练: {muscle_str}",
  "split_day": "{muscle_str}",
  "is_rest_day": {"true" if is_rest_day else "false"},
  "warmup": ["热身动作1", "热身动作2"],
  "workout_groups": [
    {{
      "muscle_group": "目标肌群",
      "exercises": [
        {{
          "name": "动作名称",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "weight_suggestion": "重量建议",
          "calories_burned": 80,
          "notes": "动作要点",
          "exercise_completed": false
        }}
      ]
    }}
  ],
  "cooldown": ["放松动作1"],
  "meal_plan": [
    {{
      "meal_type": "早餐/午餐/晚餐/加餐",
      "time": "建议时间",
      "self_cook": {{"name": "菜名", "calories": 450, "protein_g": 30, "carbs_g": 40, "fat_g": 15, "ingredients": ["食材"], "recipe_brief": "做法"}},
      "takeout": {{"name": "菜名", "calories": 420, "protein_g": 28, "carbs_g": 45, "fat_g": 12, "platform": "平台", "store_suggestion": "店铺"}},
      "eat_out": {{"name": "菜名", "calories": 400, "protein_g": 25, "carbs_g": 42, "fat_g": 14, "restaurant_type": "餐厅类型"}}
    }}
  ],
  "calorie_summary": {{
    "bmr": {targets['bmr']},
    "exercise_burned": 总运动消耗,
    "total_intake": 总摄入,
    "net_calories": 净热量(摄入-运动-BMR)
  }},
  "recommendations": ["建议1", "建议2"]
}}"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.CLAUDE_BASE_URL}/v1/messages",
                headers={
                    "x-api-key": settings.CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.CLAUDE_MODEL,
                    "max_tokens": 8000,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            content = result.get("content", [{}])[0].get("text", "{}")
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context)
    except Exception as e:
        print(f"Error calling Claude API: {e}")
        return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context)
