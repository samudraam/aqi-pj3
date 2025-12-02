import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  type SxProps,
  type TextFieldProps,
  type Theme,
} from "@mui/material";

export interface CitySuggestion {
  name: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (city: CitySuggestion) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  minLength?: number;
  limit?: number;
  sx?: SxProps<Theme>;
  textFieldProps?: TextFieldProps;
}

const formatCityLabel = (city: CitySuggestion) =>
  [city.name, city.state, city.country].filter(Boolean).join(", ");

/**
 * Autocomplete dropdown backed by the API Ninjas Cities API.
 */
const CityAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search cities",
  label,
  disabled = false,
  minLength = 3,
  limit = 8,
  sx,
  textFieldProps,
}: CityAutocompleteProps) => {
  const [options, setOptions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_CITIES_NINJA_KEY;
  const lastQueryRef = useRef<string>("");

  const canQuery = useMemo(
    () => typeof apiKey === "string" && apiKey.trim().length > 0,
    [apiKey]
  );

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      setOptions([]);
      // Clear only our own helper text; preserve consumer-provided helper text.
      setErrorMessage(null);
      return;
    }

    if (!canQuery) {
      setOptions([]);
      setErrorMessage("Cities API key missing. Set VITE_CITIES_NINJA_KEY.");
      return;
    }

    const controller = new AbortController();
    const debounceHandle = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        lastQueryRef.current = trimmed;
        const searchParams = new URLSearchParams({ name: trimmed });
        const response = await fetch(
          `https://api.api-ninjas.com/v1/city?${searchParams.toString()}`,
          {
            headers: { "X-Api-Key": apiKey },
            signal: controller.signal,
          }
        );

        const responseText = await response.text();
        if (!response.ok) {
          const errorDetail = (() => {
            try {
              const parsed = JSON.parse(responseText) as {
                error?: string;
                message?: string;
              };
              return parsed.error ?? parsed.message;
            } catch {
              return responseText || null;
            }
          })();

          if (response.status === 400) {
            setOptions([]);
            setErrorMessage(
              errorDetail ??
                "City search request was rejected. Try a different spelling."
            );
            return;
          }
          if (response.status === 401 || response.status === 403) {
            setOptions([]);
            setErrorMessage(
              "Cities API key invalid or missing. Check VITE_CITIES_NINJA_KEY."
            );
            return;
          }
          if (response.status === 429) {
            setOptions([]);
            setErrorMessage("City search rate limit hit. Try again soon.");
            return;
          }
          setOptions([]);
          setErrorMessage(
            errorDetail ?? "Unable to load city suggestions right now."
          );
          return;
        }

        const payload = JSON.parse(responseText) as Array<
          Record<string, unknown>
        >;
        const parsed = payload
          .map((item) => ({
            name: typeof item.name === "string" ? item.name : "",
            state: typeof item.state === "string" ? item.state : undefined,
            country:
              typeof item.country === "string" ? item.country : "Unknown",
            latitude:
              typeof item.latitude === "number" ? item.latitude : undefined,
            longitude:
              typeof item.longitude === "number" ? item.longitude : undefined,
          }))
          .filter(
            (city) =>
              city.name.length > 0 &&
              city.country.length > 0 &&
              city.name.toLowerCase().includes(trimmed.toLowerCase())
          )
          .slice(0, limit ?? undefined);

        // Avoid overwriting results if the user typed a new query mid-request.
        if (lastQueryRef.current === trimmed) {
          setOptions(parsed);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.warn("Error fetching city suggestions:", error);
        setOptions([]);
        setErrorMessage("Unable to load city suggestions right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(debounceHandle);
      controller.abort();
    };
  }, [apiKey, canQuery, limit, minLength, value]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      loading={loading}
      inputValue={value}
      filterOptions={(optionList) => optionList}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : formatCityLabel(option)
      }
      onInputChange={(_, newValue) => {
        onChange(newValue);
      }}
      onChange={(_, newValue) => {
        if (typeof newValue === "string") {
          onChange(newValue);
          return;
        }
        if (newValue) {
          const labelText = formatCityLabel(newValue);
          onChange(labelText);
          onSelect?.(newValue);
        }
      }}
      disabled={disabled}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps}
          label={label}
          placeholder={placeholder}
          error={Boolean(errorMessage) || textFieldProps?.error}
          helperText={errorMessage ?? textFieldProps?.helperText}
          inputProps={{
            ...params.inputProps,
            ...textFieldProps?.inputProps,
          }}
          InputProps={{
            ...params.InputProps,
            ...textFieldProps?.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default CityAutocomplete;
