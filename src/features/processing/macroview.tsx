import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Box, Typography, Paper, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ProcessingSketch2 from "./processing-sketch-4";
import { useCity } from "../../providers/use-city";
import { AqiSlider } from "../../components/aqi-slider";
import CityAutocomplete from "../../components/city-autocomplete";
import ProcessingHeader from "../../components/processing-header";
/**
 * Macro view component displaying the processing sketch (blurry/mist view)
 * with city selection and air quality information.
 */
export const MacroView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
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
   * Handles city form submission
   */
  const handleCitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      await fetchCityAirQuality(inputValue.trim());
    }
  };

  /**
   * Normalize target particle count to a positive integer
   */
  const resolvedTargetCount = (() => {
    const parsed = Number(airQualityDetails?.targetCount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 150;
    }
    return Math.max(1, Math.round(parsed));
  })();

  const particleCount = resolvedTargetCount;
  const aqi = airQualityDetails?.aqi;
  const visibility = airQualityDetails?.visibility;

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
      <Box
        sx={{
          position: "relative",
          zIndex: 210,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ProcessingHeader
          currentStep={2}
          prevRoute="/aqi"
          nextRoute="/microview"
        />
      </Box>

      {/* Processing Sketch (Macro View) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ProcessingSketch2 />
      </div>

      {/* Info Card - City Selection and Air Quality Info */}
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
          padding: isInfoCollapsed ? "0.75rem 1rem" : "1.5rem",
          zIndex: 1000,
          transition: "height 0.3s ease",
          maxHeight: "calc(100vh - 4rem)",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: isInfoCollapsed ? 0 : "1rem",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#333",
              flex: 1,
              minWidth: 0,
            }}
          >
            Air Quality Info
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsInfoCollapsed((prev) => !prev)}
            aria-label={isInfoCollapsed ? "Expand info" : "Collapse info"}
            sx={{ color: "#1976d2" }}
          >
            {isInfoCollapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={!isInfoCollapsed} timeout="auto" unmountOnExit>
          {/* City Autocomplete Input */}
          <form onSubmit={handleCitySubmit}>
            <CityAutocomplete
              value={inputValue}
              onChange={(nextValue) => setInputValue(nextValue)}
              placeholder="Enter city name"
              disabled={isFetching}
              minLength={3}
              sx={{
                width: "100%",
                marginBottom: "1rem",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
              textFieldProps={{
                size: "small",
                label: "City",
                variant: "outlined",
                inputProps: { "aria-label": "City search input" },
              }}
            />
          </form>

          <Box
            sx={{
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", color: "#1976d2" }}
            >
              Enter a city and compare the air quality with other cities
            </Typography>
          </Box>

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
              {particleCount}{" "}
              <span
                style={{ fontSize: "1rem", fontWeight: 500, marginLeft: 3 }}
              >
                / 300
              </span>
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
              {aqi !== null && aqi !== undefined ? `${aqi}` : "N/A"}{" "}
              <span
                style={{ fontSize: "1rem", fontWeight: 500, marginLeft: 3 }}
              >
                / 5{" "}
              </span>
            </Typography>
          </Box>

          {/* AQI Slider */}
          <Box
            sx={{
              marginBottom: "1rem",
            }}
          >
            <AqiSlider aqi={aqi} />
          </Box>
          {/* Visibility */}
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
              Visibility (how far you can see)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
              {visibility} meters
            </Typography>
          </Box>
        </Collapse>
      </Paper>
    </div>
  );
};
