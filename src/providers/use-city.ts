import { useContext } from "react";
import { CityContext } from "./city-context";
import type { CityContextValue } from "./city-context";

/**
 * Hook to access city context.
 */
export const useCity = (): CityContextValue => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
};

