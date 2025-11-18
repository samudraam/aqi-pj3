import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ProcessingSketch2 from "./processing-sketch-2";
import { useCity } from "../../providers/use-city";

/**
 * Debug page component that displays the processing sketch with a magnifier overlay.
 * Allows users to inspect the canvas content with a magnifying glass effect.
 */
export const DebugParticlesOnly = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(
    airQualityDetails?.cityName || cityQuery || ""
  );

  /**
   * Updates input value when airQualityDetails changes
   */
  useEffect(() => {
    if (airQualityDetails?.cityName) {
      setInputValue(airQualityDetails.cityName);
    }
  }, [airQualityDetails]);

  /**
   * Handles city input change
   */
  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  /**
   * Handles city form submission
   */
  const handleCitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      await fetchCityAirQuality(inputValue.trim());
    }
  };

  const particleCount = airQualityDetails?.targetCount || 150;
  const aqi = airQualityDetails?.aqi;
  const aqiLabel = airQualityDetails?.aqiLabel || "Unknown";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <ProcessingSketch2 />

      {/* Info Card */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          width: "320px",
          maxWidth: "calc(100vw - 4rem)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          padding: "1.5rem",
          zIndex: 1000,
          transition: "height 0.3s ease",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            marginBottom: "1rem",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Air Quality Info
        </Typography>

        {/* City Input */}
        <form onSubmit={handleCitySubmit}>
          <TextField
            fullWidth
            label="City"
            value={inputValue}
            onChange={handleCityChange}
            disabled={isFetching}
            size="small"
            sx={{
              marginBottom: "1rem",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
              },
            }}
            placeholder="Enter city name"
          />
        </form>

        {/* Particle Count */}
        <Box
          sx={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            borderRadius: "8px",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#666", marginBottom: "0.25rem" }}
          >
            Particle Count
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
            {particleCount}
          </Typography>
        </Box>

        {/* AQI Value */}
        <Box
          sx={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            borderRadius: "8px",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#666", marginBottom: "0.25rem" }}
          >
            Air Quality Index
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
            {aqi !== null && aqi !== undefined ? `${aqi}/5` : "N/A"} -{" "}
            {aqiLabel}
          </Typography>
        </Box>

        {/* Expandable Section */}
        <Button
          fullWidth
          onClick={() => setIsExpanded(!isExpanded)}
          endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            marginBottom: isExpanded ? "1rem" : 0,
            textTransform: "none",
            color: "#1976d2",
            justifyContent: "space-between",
            padding: "0.5rem",
          }}
        >
          Understand more about air quality and visibility
        </Button>

        <Collapse in={isExpanded}>
          <Box
            sx={{
              padding: "1rem",
              backgroundColor: "rgba(25, 118, 210, 0.05)",
              borderRadius: "8px",
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#555",
                lineHeight: 1.6,
              }}
            >
              Air quality and visibility are closely related, though not always
              directly proportional. When the Air Quality Index (AQI) is high,
              it indicates elevated levels of particulate matter (PM2.5 and
              PM10) and other pollutants in the atmosphere. These particles
              scatter and absorb light, reducing visibility. The more particles
              present, the hazier the air becomes, making distant objects appear
              less clear. Fine particulate matter particularly PM2.5 is a major
              contributor visible pollution.
            </Typography>
          </Box>
        </Collapse>
      </Paper>
    </div>
  );
};
