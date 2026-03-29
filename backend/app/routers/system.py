from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime
from typing import Optional

from app.core.config import settings

router = APIRouter()

# Motivational quotes
MOTIVATIONAL_QUOTES = [
    "每一次汗水都是向目标迈进一步！💪",
    "健身不是任务，而是给自己的礼物。🎁",
    "今天比昨天更强，明天比今天更棒！🚀",
    "身体的变化需要时间，坚持就是胜利！🏆",
    "不要因为进步慢而放弃，放弃才是真正的失败。🌟",
    "你的身体能承受的远比你想象的要多！🔥",
    "健身是唯一付出就一定有回报的投资。💰",
    "每一次坚持都在塑造更好的自己！✨",
    "不要和别人比，和昨天的自己比！📈",
    "健身路上，你从不孤单！👥"
]

@router.get("/weather")
async def get_weather(
    lat: Optional[float] = Query(None, description="纬度"),
    lng: Optional[float] = Query(None, description="经度"),
):
    """
    获取天气信息，支持根据坐标查询
    """
    if not settings.WEATHER_API_KEY:
        return {
            "temperature": 22,
            "condition": "晴",
            "humidity": 65,
            "wind_speed": 10,
            "location": "当前位置",
            "icon": "☀️"
        }

    try:
        params = {
            "appid": settings.WEATHER_API_KEY,
            "units": "metric",
            "lang": "zh_cn"
        }
        if lat is not None and lng is not None:
            params["lat"] = lat
            params["lon"] = lng
        else:
            params["q"] = "Beijing"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

            return {
                "temperature": data["main"]["temp"],
                "condition": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"]["speed"],
                "location": data["name"],
                "icon": get_weather_icon(data["weather"][0]["icon"])
            }
    except Exception as e:
        # Fallback to mock data
        return {
            "temperature": 22,
            "condition": "Sunny",
            "humidity": 65,
            "wind_speed": 10,
            "location": "Beijing",
            "icon": "☀️",
            "note": f"API error: {str(e)}"
        }

@router.get("/motivation")
async def get_motivation():
    """
    获取随机鼓励语
    """
    import random
    quote = random.choice(MOTIVATIONAL_QUOTES)
    return {"quote": quote, "timestamp": datetime.now().isoformat()}

@router.get("/tips")
async def get_fitness_tips():
    """
    获取健身小贴士
    """
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
        "🧘 加入瑜伽或冥想，改善身心连接"
    ]
    import random
    return {"tips": random.sample(tips, 3)}

def get_weather_icon(icon_code: str) -> str:
    """
    将天气图标代码转换为emoji
    """
    icon_map = {
        "01d": "☀️", "01n": "🌙",
        "02d": "⛅", "02n": "☁️",
        "03d": "☁️", "03n": "☁️",
        "04d": "☁️", "04n": "☁️",
        "09d": "🌧️", "09n": "🌧️",
        "10d": "🌦️", "10n": "🌧️",
        "11d": "⛈️", "11n": "⛈️",
        "13d": "❄️", "13n": "❄️",
        "50d": "🌫️", "50n": "🌫️"
    }
    return icon_map.get(icon_code, "🌈")