import type { HeaderSectionProps } from './types';

export default function HeaderSection({
  weather,
  selectedDate,
  isToday,
  locationName,
  onChangeDate,
  onGoToday,
  isWeatherLoading
}: HeaderSectionProps) {
  const dateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isToday ? '今日健身计划' : '健身计划'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => onChangeDate(-1)}
              className="p-1 rounded hover:bg-gray-200 transition"
              aria-label="前一天"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-gray-600">{dateStr}</p>
            <button
              onClick={() => onChangeDate(1)}
              className="p-1 rounded hover:bg-gray-200 transition"
              aria-label="后一天"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {!isToday && (
              <button
                onClick={onGoToday}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
              >
                回到今天
              </button>
            )}
          </div>
          {locationName && (
            <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {locationName}
            </p>
          )}
        </div>

        {isWeatherLoading ? (
          <div className="flex items-center gap-3 bg-white rounded-xl shadow px-5 py-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500">加载天气...</p>
          </div>
        ) : weather ? (
          <div className="flex items-center gap-3 bg-white rounded-xl shadow px-5 py-3">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              {weather.is_forecast && weather.temp_max !== undefined && weather.temp_min !== undefined ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{weather.temp_max}° / {weather.temp_min}°</p>
                  <p className="text-sm text-gray-500">{weather.condition} · 预测</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900">{weather.temperature}°C</p>
                  <p className="text-sm text-gray-500">{weather.condition} · {weather.location}</p>
                </>
              )}
              {weather.precipitation_probability !== undefined && weather.precipitation_probability > 0 && (
                <p className="text-xs text-blue-500">降雨概率 {weather.precipitation_probability}%</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
