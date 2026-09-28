import { logger } from "./logger";

export interface LiveWeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  weatherCode: number;
  timestamp: string;
  source: string;
  simulated: boolean;
}

export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  timeoutMs = 4000
): Promise<LiveWeatherData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      logger.warn(
        { status: response.status, latitude, longitude },
        "Weather API non-200 response"
      );
      return null;
    }

    const data = (await response.json()) as any;
    const current = data?.current || {};

    return {
      temperature: current.temperature_2m ?? 28.5,
      humidity: current.relative_humidity_2m ?? 72,
      precipitation: current.precipitation ?? 0,
      rain: current.rain ?? 0,
      windSpeed: current.wind_speed_10m ?? 12,
      weatherCode: current.weather_code ?? 0,
      timestamp: current.time ?? new Date().toISOString(),
      source: "Open-Meteo Live API",
      simulated: false,
    };
  } catch (err: any) {
    logger.warn({ err: err?.message, latitude, longitude }, "Weather API fetch failed; falling back to cached model");
    return null;
  } finally {
    clearTimeout(timer);
  }
}
