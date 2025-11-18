import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ProcessingSketch2 from "./processing-sketch-2";
import ParticlesSketch3 from "./particles-sketch-3";
import { useCity } from "../../providers/use-city";

/**
 * Debug page component that displays the processing sketch.
 */
export const DebugParticlesOnly = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(
    airQualityDetails?.cityName || cityQuery || ""
  );
  const [showParticlesSketch, setShowParticlesSketch] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  /**
   * Handles zoom button click to transition to particles sketch
   */
  const handleZoomClick = () => {
    setIsTransitioning(true);
    // Wait for transition animation to complete before switching components
    setTimeout(() => {
      setShowParticlesSketch(true);
      setIsTransitioning(false);
    }, 600); // Match transition duration
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
      {/* Transition overlay for zoom blur effect */}
      {isTransitioning && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 2000,
            pointerEvents: "none",
            animation: "zoomBlur 0.6s ease-out forwards",
          }}
        />
      )}

      {/* Conditionally render sketches */}
      {!showParticlesSketch ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transform: isTransitioning ? "scale(1.5)" : "scale(1)",
            filter: isTransitioning ? "blur(20px)" : "blur(0px)",
            opacity: isTransitioning ? 0 : 1,
            transition:
              "transform 0.6s ease-out, filter 0.6s ease-out, opacity 0.6s ease-out",
          }}
        >
          <ProcessingSketch2 />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            animation: "fadeIn 0.4s ease-in",
          }}
        >
          <ParticlesSketch3 showControls={false} />
        </div>
      )}

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
              Air quality and visibility are closely related. When the Air
              Quality Index (AQI) is high, it indicates elevated levels of
              particulate matter (PM2.5 and PM10) and other pollutants in the
              atmosphere. These particles when paired with the right atmospheric
              conditions can scatter and absorb light, reducing visibility. High
              particle concentration can cause hazy air conditions, making
              distant objects appear less clear. Fine particulate matter,
              particularly PM2.5, is a major contributor to visible pollution
              due to its small size and unique chemical properties that allow it
              to scatter light more effectively.
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* Zoom Button - Bottom Right */}
      {!showParticlesSketch && (
        <IconButton
          onClick={handleZoomClick}
          disabled={isTransitioning}
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "56px",
            height: "56px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1001,
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
              transform: "scale(1.1)",
            },
            transition: "transform 0.2s ease, background-color 0.2s ease",
          }}
          aria-label="Zoom to particles view"
        >
          <ZoomInIcon sx={{ color: "#1976d2", fontSize: "28px" }} />
        </IconButton>
      )}

      {/* CSS Animations for zoom blur and fade effects */}
      <style>
        {`
          @keyframes zoomBlur {
            0% {
              background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
              opacity: 0;
            }
            50% {
              background: radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.5) 100%);
              opacity: 1;
            }
            100% {
              background: radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
              opacity: 0;
            }
          }
          
          @keyframes fadeIn {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};
