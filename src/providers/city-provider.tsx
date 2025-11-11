import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  aqiToLabel,
  aqiToStrength,
  buildComponentMap,
  mapRange,
  type AirQualityComponents,
} from "../utils/air-quality";
import { CityContext } from "./city-context";
import type { CityContextValue } from "./city-context";

type FetchCityResult = { success: true } | { success: false; error: string };

export interface AirQualityDetails {
  cityName: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  aqiLabel: string;
  effectStrength: number;
  targetCount: number;
  components: AirQualityComponents;
}

interface CityProviderProps {
  children: ReactNode;
}

/**
 * Provides city search state and air quality data to the app.
 */
const CityProvider = ({ children }: CityProviderProps) => {
  const [cityQuery, setCityQuery] = useState<string>("");
  const [airQualityDetails, setAirQualityDetails] =
    useState<AirQualityDetails | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const fetchCityAirQuality = useCallback(
    async (cityName: string): Promise<FetchCityResult> => {
      const trimmedCity = cityName.trim();
      if (!trimmedCity) {
        return { success: false, error: "Please enter a city name." };
      }
      if (!apiKey) {
        return {
          success: false,
          error: "API key is missing. Please set VITE_OPENWEATHER_API_KEY.",
        };
      }

      setIsFetching(true);
      setAirQualityDetails(null);
      setCityQuery(trimmedCity);
      try {
        const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          trimmedCity
        )}&limit=1&appid=${encodeURIComponent(apiKey)}`;
        const geoResponse = await fetch(geoURL);
        if (!geoResponse.ok) {
          return {
            success: false,
            error: "Unable to validate city. Please try again.",
          };
        }

        const geoData = (await geoResponse.json()) as Array<
          Record<string, unknown>
        >;
        if (!Array.isArray(geoData) || geoData.length === 0) {
          return { success: false, error: "City not found." };
        }

        const { lat, lon, state, country, name } = geoData[0] as {
          lat?: number;
          lon?: number;
          state?: string;
          country?: string;
          name?: string;
        };

        if (typeof lat !== "number" || typeof lon !== "number") {
          return {
            success: false,
            error: "Location data incomplete for this city.",
          };
        }

        const airURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(
          apiKey
        )}`;
        const airResponse = await fetch(airURL);
        if (!airResponse.ok) {
          return {
            success: false,
            error: "Air quality data unavailable at the moment.",
          };
        }

        const airData = (await airResponse.json()) as {
          list?: Array<{
            main?: { aqi?: number };
            components?: Partial<AirQualityComponents>;
          }>;
        };

        const measurement = airData.list?.[0];
        const aqi =
          typeof measurement?.main?.aqi === "number"
            ? measurement.main.aqi
            : null;
        const aqiLabel = aqiToLabel(aqi);
        const effectStrength = aqiToStrength(aqi);
        const targetCount = Math.round(mapRange(aqi ?? 3, 1, 5, 80, 300));
        const components = buildComponentMap(measurement?.components ?? {});

        setAirQualityDetails({
          cityName: name ?? trimmedCity,
          state,
          country,
          latitude: lat,
          longitude: lon,
          aqi,
          aqiLabel,
          effectStrength,
          targetCount,
          components,
        });

        return { success: true };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: "Error fetching data. Please try again.",
        };
      } finally {
        setIsFetching(false);
      }
    },
    [apiKey]
  );

  const resetCity = useCallback(() => {
    setCityQuery("");
    setAirQualityDetails(null);
  }, []);

  const value = useMemo<CityContextValue>(
    () => ({
      cityQuery,
      setCityQuery,
      airQualityDetails,
      fetchCityAirQuality,
      resetCity,
      isFetching,
    }),
    [airQualityDetails, cityQuery, fetchCityAirQuality, isFetching, resetCity]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export default CityProvider;
