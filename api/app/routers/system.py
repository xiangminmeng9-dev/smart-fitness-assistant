from fastapi import APIRouter, Query
import httpx
from datetime import datetime, date
from typing import Optional

router = APIRouter()

# WMO Weather Code mapping
WMO_WEATHER = {
    0: ("晴", "☀️"),
    1: ("大部晴朗", "🌤️"), 2: ("多云", "⛅"), 3: ("阴天", "☁️"),
    45: ("雾", "🌫️"), 48: ("雾凇", "🌫️"),
    51: ("小毛毛雨", "🌦️"), 53: ("毛毛雨", "🌦️"), 55: ("大毛毛雨", "🌧️"),
    61: ("小雨", "🌧️"), 63: ("中雨", "🌧️"), 65: ("大雨", "🌧️"),
    71: ("小雪", "❄️"), 73: ("中雪", "❄️"), 75: ("大雪", "❄️"),
    77: ("雪粒", "❄️"),
    80: ("小阵雨", "🌦️"), 81: ("阵雨", "🌧️"), 82: ("大阵雨", "🌧️"),
    85: ("小阵雪", "🌨️"), 86: ("大阵雪", "🌨️"),
    95: ("雷暴", "⛈️"), 96: ("雷暴伴冰雹", "⛈️"), 99: ("强雷暴伴冰雹", "⛈️"),
}

# Motivational quotes pool (30+ for variety)
MOTIVATIONAL_QUOTES = [
    "坚持就是胜利，每一次训练都在塑造更好的自己。",
    "没有捷径，只有日复一日的坚持。今天的汗水是明天的勋章。",
    "你的身体能做到的，远比你想象的多。",
    "不要等到有动力才行动，行动本身就是最好的动力。",
    "每一次突破极限，都是在重新定义自己。",
    "健身不是惩罚身体，而是庆祝身体的能力。",
    "今天不想练？正是这种时候最需要坚持。",
    "进步不是线性的，但只要不停下脚步，你就在前进。",
    "每一次汗水都是向目标迈进一步！",
    "健身不是任务，而是给自己的礼物。",
    "今天比昨天更强，明天比今天更棒！",
    "身体的变化需要时间，坚持就是胜利！",
    "不要因为进步慢而放弃，放弃才是真正的失败。",
    "你的身体能承受的远比你想象的要多！",
    "健身是唯一付出就一定有回报的投资。",
    "每一次坚持都在塑造更好的自己！",
    "不要和别人比，和昨天的自己比！",
    "健身路上，你从不孤单！",
    "自律给你自由，汗水不会辜负你。",
    "把每一次训练当作一次自我对话。",
    "强壮不是目的，而是一种生活态度。",
    "你流的每一滴汗，都在为未来的自己铺路。",
    "没有什么比战胜昨天的自己更令人满足。",
    "训练的痛苦是暂时的，放弃的遗憾是永久的。",
    "身体是你最忠实的伙伴，善待它，它会回报你。",
    "每一个清晨的坚持，都是对自己最好的投资。",
    "不要低估日积月累的力量。",
    "最好的时间是现在，最好的状态是开始。",
    "你不需要完美，你只需要开始。",
    "改变从第一步开始，坚持让改变成为习惯。",
]


@router.get("/weather")
async def get_weather(
    lat: Optional[float] = Query(None, description="纬度"),
    lng: Optional[float] = Query(None, description="经度"),
    target_date: Optional[str] = Query(None, description="目标日期 YYYY-MM-DD"),
):
    """
    获取真实天气信息，支持当天和未来预测。
    使用 Open-Meteo API（免费，无需 API Key）。
    """
    return await get_weather_data(lat, lng, target_date)


async def get_weather_data(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    target_date: Optional[str] = None,
) -> dict:
    """
    获取天气数据的内部函数，可被其他模块调用。
    """
    latitude = lat if lat is not None else 39.9042
    longitude = lng if lng is not None else 116.4074

    try:
        today = date.today()
        query_date = date.fromisoformat(target_date) if target_date else today
        days_ahead = (query_date - today).days

        async with httpx.AsyncClient() as client:
            if days_ahead <= 0:
                # Current weather
                resp = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "current": "temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m",
                        "timezone": "auto",
                    },
                    timeout=10.0,
                )
                resp.raise_for_status()
                data = resp.json()
                current = data["current"]
                code = current["weathercode"]
                condition, icon = WMO_WEATHER.get(code, ("未知", "🌈"))

                return {
                    "temperature": round(current["temperature_2m"]),
                    "condition": condition,
                    "humidity": current["relative_humidity_2m"],
                    "wind_speed": round(current["wind_speed_10m"]),
                    "location": f"{latitude:.2f}, {longitude:.2f}",
                    "icon": icon,
                    "is_forecast": False,
                }
            else:
                # Forecast
                resp = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
                        "timezone": "auto",
                        "forecast_days": min(days_ahead + 1, 16),
                    },
                    timeout=10.0,
                )
                resp.raise_for_status()
                data = resp.json()
                daily = data["daily"]

                # Find the target date in the forecast
                target_str = query_date.isoformat()
                idx = -1
                for i, d in enumerate(daily["time"]):
                    if d == target_str:
                        idx = i
                        break

                if idx < 0:
                    return _mock_weather(latitude, longitude, is_forecast=True)

                code = daily["weathercode"][idx]
                condition, icon = WMO_WEATHER.get(code, ("未知", "🌈"))
                temp_max = round(daily["temperature_2m_max"][idx])
                temp_min = round(daily["temperature_2m_min"][idx])
                precip = daily.get("precipitation_probability_max", [None])[idx]

                return {
                    "temperature": round((temp_max + temp_min) / 2),
                    "temp_max": temp_max,
                    "temp_min": temp_min,
                    "condition": condition,
                    "precipitation_probability": precip,
                    "wind_speed": round(daily.get("wind_speed_10m_max", [0])[idx]),
                    "location": f"{latitude:.2f}, {longitude:.2f}",
                    "icon": icon,
                    "is_forecast": True,
                }
    except Exception:
        return _mock_weather(latitude, longitude, is_forecast=bool(target_date))


def _mock_weather(lat: float, lng: float, is_forecast: bool = False) -> dict:
    return {
        "temperature": 22,
        "condition": "晴",
        "humidity": 65,
        "wind_speed": 10,
        "location": f"{lat:.2f}, {lng:.2f}",
        "icon": "☀️",
        "is_forecast": is_forecast,
    }


@router.get("/motivation")
async def get_motivation(
    target_date: Optional[str] = Query(None, description="目标日期 YYYY-MM-DD"),
):
    """
    获取每日鼓励语，同一天返回相同的话，不同天返回不同的话。
    """
    d = date.fromisoformat(target_date) if target_date else date.today()
    # Use date ordinal as deterministic index
    idx = d.toordinal() % len(MOTIVATIONAL_QUOTES)
    return {"quote": MOTIVATIONAL_QUOTES[idx], "date": d.isoformat()}


@router.get("/tips")
async def get_fitness_tips():
    """获取健身小贴士"""
    tips = [
        "💧 健身前后要及时补充水分",
        "🏃 有氧运动前要进行5-10分钟的热身",
        "🏋️ 力量训练后要做拉伸，帮助肌肉恢复",
        "🥗 健身后30分钟内补充蛋白质有助于肌肉生长",
        "😴 保证每天7-8小时睡眠，身体需要时间修复",
        "📊 每周记录体重和围度变化，不要只关注体重",
        "🔄 每4-6周调整一次训练计划，避免平台期",
        "🎯 设定具体、可测量的健身目标",
        "👟 选择合适的运动鞋，保护关节",
        "🧘 加入瑜伽或冥想，改善身心连接",
    ]
    import random
    return {"tips": random.sample(tips, 3)}
