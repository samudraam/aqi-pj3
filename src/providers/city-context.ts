import { createContext } from "react";
import type { AirQualityDetails } from "./city-provider";

type FetchCityResult = { success: true } | { success: false; error: string };

export interface CityContextValue {
  cityQuery: string;
  setCityQuery: (value: string) => void;
  airQualityDetails: AirQualityDetails | null;
  fetchCityAirQuality: (cityName: string) => Promise<FetchCityResult>;
  resetCity: () => void;
  isFetching: boolean;
}

export const CityContext = createContext<CityContextValue | undefined>(
  undefined
);


