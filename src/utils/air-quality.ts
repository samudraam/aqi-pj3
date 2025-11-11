/**
 * Numeric keys returned by OpenWeatherMap air pollution API.
 */
export const pollutantKeys = [
  "co",
  "no",
  "no2",
  "o3",
  "so2",
  "pm2_5",
  "pm10",
  "nh3",
] as const;

export type PollutantKey = (typeof pollutantKeys)[number];

export type AirQualityComponents = Record<PollutantKey, number>;

/**
 * Maps a numeric AQI value to a qualitative label.
 */
export const aqiToLabel = (aqi: number | null): string => {
  if (!aqi || aqi < 1) {
    return "Unknown";
  }
  if (aqi === 1) {
    return "Good";
  }
  if (aqi === 2) {
    return "Fair";
  }
  if (aqi === 3) {
    return "Moderate";
  }
  if (aqi === 4) {
    return "Poor";
  }
  return "Very Poor";
};

/**
 * Normalizes the AQI value into a 0..1 range for animation intensity.
 */
export const aqiToStrength = (aqi: number | null): number => {
  if (!aqi || aqi < 1) {
    return 0;
  }
  return mapRange(aqi, 1, 5, 0.15, 1);
};

/**
 * Maps a value from one range into another and clamps the result.
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  if (Number.isNaN(value)) {
    return outMin;
  }
  const clampedValue = Math.min(Math.max(value, inMin), inMax);
  const normalized = (clampedValue - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
};

/**
 * Produces a fully populated pollutant map with zero defaults.
 */
export const buildComponentMap = (
  source: Partial<Record<PollutantKey, number>>,
): AirQualityComponents =>
  pollutantKeys.reduce<AirQualityComponents>((accumulator, key) => {
    const value = source[key];
    accumulator[key] = typeof value === "number" ? value : 0;
    return accumulator;
  }, {} as AirQualityComponents);

