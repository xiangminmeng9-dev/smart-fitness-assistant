import httpx
import json
import random
from datetime import date
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.models.user import UserProfile, UserModelConfig
from app.services.ai_providers import get_ai_provider
from app.services.schedule_generator import (
    get_today_muscle_groups, get_cycle_progress, calculate_daily_targets,
    get_week_intensity, calculate_weight_change_feasibility,
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
        {"name": "卷腹", "sets": 3, "reps": "15-20", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 35, "notes": "下背贴地，用腹肌发力", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "平板支撑", "sets": 3, "reps": "30-60秒", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 30, "notes": "身体成一条直线，不要塌腰", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "俄罗斯转体", "sets": 3, "reps": "20次(左右各10)", "rest_seconds": 45, "weight_suggestion": "轻重量或自重", "calories_burned": 35, "notes": "双脚离地，转动躯干", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "悬垂举腿", "sets": 3, "reps": "10-15", "rest_seconds": 60, "weight_suggestion": "自重", "calories_burned": 40, "notes": "控制速度，避免摆动", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "死虫式", "sets": 3, "reps": "12次/侧", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 25, "notes": "下背始终贴地，对侧手脚交替", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
    ],
    "核心": [
        {"name": "死虫式", "sets": 3, "reps": "10次/侧", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 30, "notes": "下背贴紧地面，对侧手脚缓慢伸展", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "鸟狗式", "sets": 3, "reps": "10次/侧", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 25, "notes": "保持脊柱中立，手脚同时伸展", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "平板支撑变式", "sets": 3, "reps": "45-60秒", "rest_seconds": 45, "weight_suggestion": "自重", "calories_burned": 35, "notes": "交替抬腿或侧向平板", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "健腹轮", "sets": 3, "reps": "8-12", "rest_seconds": 60, "weight_suggestion": "健腹轮", "calories_burned": 50, "notes": "跪姿开始，控制离心阶段，避免塌腰", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
        {"name": "农夫行走", "sets": 3, "reps": "30米/组", "rest_seconds": 60, "weight_suggestion": "哑铃或壶铃(每侧体重15-25%)", "calories_burned": 60, "notes": "核心收紧，保持直立姿势行走", "demo_url": "https://www.bilibili.com/video/BV1Jt411c7AC"},
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
# Dynamic meal generation based on context
# ---------------------------------------------------------------------------

def generate_dynamic_meal_plan(
    targets: dict,
    is_training_day: bool,
    intensity: str,
    day_in_cycle: int,
    fitness_goal: str,
    weather_info: Optional[dict] = None,
) -> List[dict]:
    """
    根据训练状态、天气、周期进度动态生成饮食计划。
    不再使用固定模板，而是根据实际情况组合。
    """
    daily_cal = targets["daily_calorie_target"]
    protein_target = targets["protein_g"]
    is_rest_day = not is_training_day

    # 根据天气调整建议
    weather_factor = 1.0
    weather_note = ""
    if weather_info:
        temp = weather_info.get("temperature", 20)
        condition = weather_info.get("condition", "晴")
        if temp > 30:
            weather_factor = 1.1  # 热天需要更多水分和电解质
            weather_note = "天气炎热，注意补充水分和电解质，可增加水果摄入"
        elif temp < 10:
            weather_factor = 1.05  # 冷天需要略多热量
            weather_note = "天气寒冷，可适当增加温热食物，注意保暖"
        elif "雨" in condition:
            weather_note = "雨天户外运动受限，可选择室内训练或调整饮食"

    # 训练日/休息日热量分配不同
    if is_training_day:
        # 训练日：早餐和训练后餐更重要
        meal_ratios = [0.25, 0.35, 0.30, 0.10]  # 早、午、晚、加餐
        carb_ratio = 0.45  # 训练日碳水更高
    else:
        # 休息日：晚餐可以略少
        meal_ratios = [0.28, 0.35, 0.27, 0.10]
        carb_ratio = 0.35  # 休息日碳水略低

    # 根据周期进度调整
    if intensity == "heavy":
        protein_boost = 1.1  # 大强度周增加蛋白质
    elif intensity == "deload":
        protein_boost = 0.95  # 减负周略减
    else:
        protein_boost = 1.0

    # ---------------------------------------------------------------------------
    # 餐饮场景专属菜品数据库
    # ---------------------------------------------------------------------------

    SELF_COOK_DISHES = {
        "早餐": [
            ("燕麦蛋白碗", "鸡蛋", "燕麦", ["蓝莓", "香蕉"], 13, 66, 11),
            ("鸡胸全麦三明治", "鸡胸肉", "全麦面包", ["生菜", "番茄"], 31, 41, 3.6),
            ("蛋白蔬菜煎饼", "鸡蛋", "红薯", ["菠菜", "胡萝卜"], 13, 20, 11),
            ("希腊酸奶坚果碗", "希腊酸奶", "燕麦", ["草莓", "蓝莓"], 10, 66, 0.7),
            ("糙米鸡胸粥", "鸡胸肉", "糙米饭", ["芹菜", "番茄"], 31, 23, 3.6),
            ("牛油果鸡蛋吐司", "鸡蛋", "全麦面包", ["牛油果", "番茄"], 13, 41, 11),
        ],
        "午餐": [
            ("鸡胸糙米套餐", "鸡胸肉", "糙米饭", ["西兰花", "胡萝卜"], 31, 23, 3.6),
            ("清蒸鱼配藜麦", "鱼肉", "藜麦", ["菠菜", "番茄"], 20, 21, 5),
            ("虾仁炒蛋白", "虾仁", "糙米饭", ["西兰花", "黄瓜"], 24, 23, 0.6),
            ("卤牛肉配红薯", "牛肉", "红薯", ["生菜", "胡萝卜"], 26, 20, 15),
            ("豆腐蔬菜配紫薯", "豆腐", "紫薯", ["菠菜", "芹菜"], 8, 17, 4.8),
            ("鸡胸藜麦沙拉", "鸡胸肉", "藜麦", ["生菜", "黄瓜", "番茄"], 31, 21, 3.6),
        ],
        "晚餐": [
            ("三文鱼配糙米", "三文鱼", "糙米饭", ["西兰花", "菠菜"], 25, 23, 13),
            ("鸡胸肉配红薯", "鸡胸肉", "红薯", ["生菜", "番茄"], 31, 20, 3.6),
            ("瘦猪肉炒蔬菜", "瘦猪肉", "糙米饭", ["芹菜", "胡萝卜"], 21, 23, 9),
            ("虾仁藜麦轻食", "虾仁", "藜麦", ["黄瓜", "生菜"], 24, 21, 0.6),
            ("鸡蛋蔬菜配玉米", "鸡蛋", "玉米", ["菠菜", "番茄"], 13, 19, 11),
            ("豆腐菌菇配糙米", "豆腐", "糙米饭", ["西兰花", "胡萝卜"], 8, 23, 4.8),
        ],
        "加餐": [
            ("蛋白燕麦杯", "希腊酸奶", "燕麦", ["蓝莓"], 10, 66, 0.7),
            ("鸡胸肉干配全麦面包", "鸡胸肉", "全麦面包", [], 31, 41, 3.6),
            ("鸡蛋配玉米", "鸡蛋", "玉米", [], 13, 19, 11),
            ("蛋白奶昔配香蕉", "希腊酸奶", "燕麦", ["香蕉"], 10, 66, 0.7),
        ],
    }

    TAKEOUT_DISHES = {
        "早餐": [
            ("轻食蛋白碗", "沙野轻食"),
            ("健康早餐便当", "超级碗"),
            ("全麦三明治套餐", "Wagas"),
            ("豆浆鸡蛋灌饼", "附近早餐店"),
            ("燕麦酸奶杯", "喜茶/奈雪"),
        ],
        "午餐": [
            ("轻食鸡胸碗", "沙野轻食"),
            ("糙米健身便当", "超级碗"),
            ("低脂三文鱼沙拉", "Wagas"),
            ("黑椒牛肉盖饭", "食其家"),
            ("虾仁轻食碗", "沙野轻食"),
            ("照烧鸡胸饭", "吉野家"),
        ],
        "晚餐": [
            ("鸡胸轻食沙拉", "沙野轻食"),
            ("日式定食", "食其家"),
            ("三文鱼poke bowl", "超级碗"),
            ("少油牛肉饭", "吉野家"),
            ("麻辣烫(清汤少油)", "张亮麻辣烫"),
        ],
        "加餐": [
            ("蛋白棒+美式", "便利蜂/全家"),
            ("希腊酸奶杯", "喜茶/奈雪"),
            ("坚果能量球", "O!Super"),
        ],
    }

    EAT_OUT_DISHES = {
        "早餐": [
            ("广式早茶套餐", "粤式茶楼"),
            ("酒店自助早餐", "酒店餐厅"),
            ("咖啡全日早午餐", "咖啡馆"),
        ],
        "午餐": [
            ("铁板黑椒牛柳饭", "茶餐厅"),
            ("清蒸鲈鱼套餐", "粤菜馆"),
            ("日式烤鸡定食", "日料店"),
            ("牛排轻食套餐", "西餐厅"),
            ("酸菜鱼配米饭", "川菜馆"),
        ],
        "晚餐": [
            ("白切鸡套餐", "粤菜馆"),
            ("烤三文鱼配蔬菜", "西餐厅"),
            ("水煮牛肉(少油)", "川菜馆"),
            ("寿司刺身拼盘", "日料店"),
            ("蒜蓉蒸虾配时蔬", "海鲜餐厅"),
        ],
        "加餐": [
            ("水果捞", "甜品店"),
            ("鲜榨蔬果汁", "果汁吧"),
        ],
    }

    # 使用日期作为随机种子，确保同一天生成相同但每天不同
    seed = day_in_cycle * 31 + (1 if is_training_day else 0) * 100 + (1 if fitness_goal == "增肌" else 0) * 200
    rng = random.Random(seed)

    meal_types = [
        ("早餐", "07:30", meal_ratios[0]),
        ("午餐", "12:00", meal_ratios[1]),
        ("晚餐", "18:30", meal_ratios[2]),
        ("加餐", "15:30", meal_ratios[3]),
    ]

    meal_plan = []
    total_cal = 0

    for meal_name, meal_time, ratio in meal_types:
        meal_cal = round(daily_cal * ratio)
        meal_protein = round(protein_target * ratio * protein_boost)

        # --- 自己做：从家庭烹饪菜品库选择 ---
        sc_pool = SELF_COOK_DISHES.get(meal_name, SELF_COOK_DISHES["午餐"])
        sc_dish = rng.choice(sc_pool)
        sc_name, sc_protein, sc_carb, sc_vegs, sc_p_g, sc_c_g, sc_f_g = sc_dish

        protein_portion = round(meal_protein / sc_p_g * 100) if sc_p_g > 0 else 100
        carb_portion = round(meal_cal * 0.3 / 4)

        self_cook_cal = meal_cal
        self_cook = {
            "name": sc_name,
            "calories": self_cook_cal,
            "protein_g": meal_protein,
            "carbs_g": round(self_cook_cal * carb_ratio / 4),
            "fat_g": round(self_cook_cal * 0.25 / 9),
            "ingredients": [
                f"{sc_protein} {protein_portion}g",
                f"{sc_carb} {carb_portion}g",
            ] + [f"{v} 100g" for v in sc_vegs],
            "recipe_brief": f"{sc_protein}煎/煮至熟，配{sc_carb}和{'、'.join(sc_vegs) if sc_vegs else '蔬菜'}",
            "portion_tip": f"蛋白质约{protein_portion}g，主食约{carb_portion}g生重",
        }

        # --- 点外卖：从外卖菜品库选择 ---
        to_pool = TAKEOUT_DISHES.get(meal_name, TAKEOUT_DISHES["午餐"])
        to_dish = rng.choice(to_pool)
        to_name, to_store = to_dish

        takeout_cal = round(meal_cal * 1.15)
        takeout = {
            "name": to_name,
            "calories": takeout_cal,
            "protein_g": round(meal_protein * 0.9),
            "carbs_g": round(takeout_cal * carb_ratio / 4),
            "fat_g": round(takeout_cal * 0.3 / 9),
            "platform": "美团/饿了么",
            "store_suggestion": to_store,
            "portion_tip": "外卖份量通常偏大，建议只吃2/3或与他人分享",
        }

        # --- 店里吃：从餐厅菜品库选择 ---
        eo_pool = EAT_OUT_DISHES.get(meal_name, EAT_OUT_DISHES["午餐"])
        eo_dish = rng.choice(eo_pool)
        eo_name, eo_rest_type = eo_dish

        eat_out_cal = round(meal_cal * 1.1)
        eat_out = {
            "name": eo_name,
            "calories": eat_out_cal,
            "protein_g": round(meal_protein * 0.95),
            "carbs_g": round(eat_out_cal * carb_ratio / 4),
            "fat_g": round(eat_out_cal * 0.28 / 9),
            "restaurant_type": eo_rest_type,
            "portion_tip": "先吃蔬菜再吃肉，最后吃主食",
        }

        meal_plan.append({
            "meal_type": meal_name,
            "time": meal_time,
            "self_cook": self_cook,
            "takeout": takeout,
            "eat_out": eat_out,
        })
        total_cal += (self_cook_cal + takeout_cal + eat_out_cal) // 3

    return meal_plan, total_cal, weather_note


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
    weather_info: Optional[dict] = None,
) -> Dict[str, Any]:
    """Generate a deterministic mock fitness plan when AI is unavailable."""
    targets = context["targets"]
    day_in_cycle = context.get("day_in_cycle", 0)
    cycle_info = context.get("cycle_info", {})
    intensity = cycle_info.get("intensity", "medium")
    feasibility = targets.get("feasibility", {})

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

    # --- Dynamic meal plan ---
    meal_plan, total_intake, weather_note = generate_dynamic_meal_plan(
        targets=targets,
        is_training_day=not is_rest_day,
        intensity=intensity,
        day_in_cycle=day_in_cycle,
        fitness_goal=profile.fitness_goal or "减脂",
        weather_info=weather_info,
    )

    # --- Calorie summary ---
    muscle_str = "、".join(muscle_groups) if muscle_groups else "休息日"
    calorie_summary = {
        "bmr": targets["bmr"],
        "tdee": targets["tdee"],
        "exercise_burned": total_exercise_calories,
        "total_intake": total_intake,
        "net_calories": total_intake - total_exercise_calories - targets["bmr"],
        "daily_target": targets["daily_calorie_target"],
    }

    # --- Recommendations based on feasibility ---
    goal = profile.fitness_goal or "减脂"
    recs = []

    # 添加目标可行性分析
    if feasibility:
        if feasibility.get("feasibility") == "unrealistic":
            recs.append(f"⚠️ 目标提醒：{feasibility.get('health_note', '')}")
            recs.append(f"建议周期：{feasibility.get('suggested_cycle_days', 28)}天，或调整目标体重")
        elif feasibility.get("feasibility") == "challenging":
            recs.append(f"💪 目标较激进：{feasibility.get('health_note', '')}")

    recs.append(f"今日训练强度为{intensity}，请合理控制重量和组数。")
    recs.append(f"每日蛋白质目标{targets['protein_g']}g，注意均匀分配到每餐。")

    if goal == "减脂":
        recs.append(f"每日热量缺口约{abs(targets.get('daily_adjustment', 0))}kcal，坚持即可达成目标。")
        recs.append("训练后30分钟内补充蛋白质有助于恢复。")
    else:
        recs.append(f"每日热量盈余约{abs(targets.get('daily_adjustment', 0))}kcal，配合训练促进肌肉生长。")
        recs.append("训练后补充蛋白质和碳水，促进肌肉合成。")

    if weather_note:
        recs.append(f"🌤️ {weather_note}")

    if is_rest_day:
        recs = [
            "休息日注意补充水分，建议饮水2-3升。",
            "可以进行轻度活动如散步、瑜伽，促进恢复。",
            "保证充足睡眠(7-9小时)，这是恢复的关键。",
        ]

    # --- Progress tracking ---
    progress_info = {
        "current_day": cycle_info.get("current_day", 1),
        "total_days": cycle_info.get("total_days", 28),
        "progress_pct": cycle_info.get("progress_pct", 0),
        "predicted_weight_change": feasibility.get("weekly_change_needed", 0) * (cycle_info.get("current_week", 1) if feasibility.get("feasibility") != "unrealistic" else 0),
    }

    return {
        "motivation_quote": quote,
        "weather_impact": weather_note or "请根据实际天气调整训练安排",
        "training_split": f"今日训练: {muscle_str}" if not is_rest_day else "今日休息",
        "split_day": muscle_str,
        "is_rest_day": is_rest_day,
        "warmup": warmup,
        "workout_groups": workout_groups,
        "cooldown": cooldown,
        "meal_plan": meal_plan,
        "calorie_summary": calorie_summary,
        "recommendations": recs,
        "progress_info": progress_info,
        "feasibility": feasibility,
    }


async def generate_fitness_plan(
    profile: UserProfile, plan_date: date, muscle_groups: Optional[List[str]] = None,
    model_config: Optional[UserModelConfig] = None,
    weather_info: Optional[dict] = None,
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

    # Calculate targets with training day awareness
    targets = calculate_daily_targets(
        weight, height, age, gender, target_weight, cycle_days, frequency, goal,
        is_training_day=not is_rest_day
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

    # Determine provider details
    provider_type = model_config.provider_type if model_config else settings.AI_PROVIDER
    base_url = model_config.base_url if model_config and model_config.base_url else None
    api_key = model_config.api_key if model_config and model_config.api_key else settings.CLAUDE_API_KEY
    model_name = model_config.model_name if model_config and model_config.model_name else None

    # Try to resolve defaults if not set
    if not base_url or not model_name:
        from app.routers.model_config import PROVIDERS
        provider_info = next((p for p in PROVIDERS if p.type == provider_type), PROVIDERS[0])
        base_url = base_url or provider_info.default_base_url
        model_name = model_name or provider_info.default_model

    if not api_key:
        return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context, weather_info)

    try:
        muscle_str = "、".join(muscle_groups) if muscle_groups else "休息日"
        weekday_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday_name = weekday_names[plan_date.weekday()]
        is_weekend = plan_date.weekday() >= 5

        # Get feasibility info for AI prompt
        feasibility = targets.get("feasibility", {})

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

目标可行性分析：
- 每周需变化：{feasibility.get('weekly_change_needed', 0)} kg
- 可行性评估：{feasibility.get('feasibility', 'unknown')}
- 健康建议：{feasibility.get('health_note', '')}
- 预计可达体重：{feasibility.get('predicted_weight', target_weight)} kg

训练周期：
- 进度：第{cycle_info['current_day']}天 / 共{cycle_info['total_days']}天
- 本周强度：{cycle_info.get('intensity', 'medium')}
- 计划日期：{plan_date.isoformat()} ({weekday_name})
- 周期第{day_in_cycle + 1}天

今日安排：{"休息日 - 不安排训练，只需饮食计划" if is_rest_day else f"训练肌群：{muscle_str}"}

重要要求：
1. {"今天是休息日，不需要训练计划，workout_groups为空数组" if is_rest_day else f"今日只针对以下肌群生成训练动作：{muscle_str}"}
2. 每个动作包含 "exercise_completed": false 字段
3. 每个动作必须包含 "demo_url" 字段，提供B站或YouTube的动作教学视频链接
4. 热量计算必须包含基础代谢：净热量 = 摄入 - 运动消耗 - 基础代谢
5. {"周末可以适当安排一顿放纵餐或社交聚餐" if is_weekend else "工作日饮食以便捷高效为主"}
6. 饮食计划要有变化，不要每天一样！今天是周期第{day_in_cycle + 1}天，请生成与其他天不同的菜品
7. 根据训练强度({cycle_info.get('intensity', 'medium')})调整训练量和饮食
8. 根据目标可行性分析给出个性化建议

饮食要求（每餐提供三种方案，菜品必须不同，卡路里必须不同）：
1. 自己做：选择适合家庭烹饪的菜品，列出食材和简要做法。例如"鸡胸糙米套餐"、"燕麦蛋白碗"
2. 点外卖：选择可外卖配送的菜品，使用真实外卖菜品名。例如"轻食鸡胸碗"(沙野轻食)、"黑椒牛肉盖饭"(食其家)
3. 店里吃：选择餐厅菜品，使用真实餐厅菜品名。例如"清蒸鲈鱼套餐"(粤菜馆)、"寿司刺身拼盘"(日料店)
4. 三种方案的菜品名称必须完全不同，不能仅改前缀或后缀
5. 外卖卡路里比自己做高约15%，店里吃比自己做高约10%
6. 每种方案必须包含 "portion_tip" 字段，给出具体的份量建议（如"主食约1拳头大小"）

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
          "demo_url": "https://www.bilibili.com/video/xxx",
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
      "self_cook": {{
        "name": "菜名",
        "calories": 450,
        "protein_g": 30,
        "carbs_g": 40,
        "fat_g": 15,
        "ingredients": ["食材"],
        "recipe_brief": "做法",
        "portion_tip": "主食约1拳头大小，蛋白质约1掌心大小"
      }},
      "takeout": {{
        "name": "菜名",
        "calories": 520,
        "protein_g": 28,
        "carbs_g": 50,
        "fat_g": 18,
        "platform": "平台",
        "store_suggestion": "店铺",
        "portion_tip": "外卖份量通常偏大，建议只吃2/3"
      }},
      "eat_out": {{
        "name": "菜名",
        "calories": 495,
        "protein_g": 26,
        "carbs_g": 48,
        "fat_g": 16,
        "restaurant_type": "餐厅类型",
        "portion_tip": "先吃蔬菜再吃肉，最后吃主食"
      }}
    }}
  ],
  "calorie_summary": {{
    "bmr": {targets['bmr']},
    "tdee": {targets['tdee']},
    "exercise_burned": 总运动消耗,
    "total_intake": 总摄入,
    "net_calories": 净热量(摄入-运动-BMR),
    "daily_target": {targets['daily_calorie_target']}
  }},
  "recommendations": ["建议1", "建议2"],
  "progress_info": {{
    "current_day": {cycle_info['current_day']},
    "total_days": {cycle_info['total_days']},
    "progress_pct": {cycle_info['progress_pct']},
    "predicted_weight_change": 预计体重变化
  }},
  "feasibility": {{
    "feasibility": "{feasibility.get('feasibility', 'unknown')}",
    "health_note": "{feasibility.get('health_note', '')}",
    "predicted_weight": {feasibility.get('predicted_weight', target_weight)}
  }}
}}"""

        provider = get_ai_provider(provider_type, base_url, api_key)
        response_text = await provider.generate(prompt, model_name, max_tokens=8000)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            print(f"Error parsing AI response JSON. Raw response: {response_text[:200]}")
            return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context, weather_info)
    except Exception as e:
        print(f"Error calling AI Provider API: {e}")
        return generate_mock_plan(profile, plan_date, muscle_groups, is_rest_day, context, weather_info)
