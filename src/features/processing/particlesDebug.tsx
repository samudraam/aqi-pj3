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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ProcessingSketch2 from "./processing-sketch-3";
import ParticlesSketch3 from "./particles-sketch-3";
import { useCity } from "../../providers/use-city";

// Particle type labels, descriptions, and images
const POLLUTANT_INFO = {
  o3: {
    label: "Ozone (O₃)",
    imageUrl: "/particles_O3.png",
    description:
      "Ozone is a reactive gas that forms when nitrogen oxides and volatile organic compounds react in sunlight. Ground-level ozone can cause respiratory problems and aggravate asthma. High levels are often associated with sunny, stagnant weather conditions.",
  },
  pm2_5: {
    label: "PM2.5",
    imageUrl: "/particles_PM2.5.png",
    description:
      "Fine particulate matter with diameter less than 2.5 micrometers. These tiny particles can penetrate deep into the lungs and even enter the bloodstream, causing cardiovascular and respiratory issues. Sources include vehicle exhaust, industrial emissions, and wildfires.",
  },
  pm10: {
    label: "PM10",
    imageUrl: "/particles_PM10.png",
    description:
      "Particulate matter with diameter less than 10 micrometers. These larger particles can irritate the eyes, nose, and throat. Common sources include dust from roads, construction sites, and agricultural activities.",
  },
  co: {
    label: "Carbon Monoxide (CO)",
    imageUrl: "/particles-C02.png",
    description:
      "A colorless, odorless gas produced by incomplete combustion of carbon-based fuels. High levels primarily come from vehicle emissions. Carbon monoxide reduces the blood's ability to carry oxygen, which can be particularly dangerous for people with heart conditions.",
  },
  no2: {
    label: "Nitrogen Dioxide (NO₂)",
    imageUrl: "/particles-NO2.png",
    description:
      "A reddish-brown gas produced by burning fossil fuels, especially in vehicles and power plants. Nitrogen dioxide can irritate airways and worsen respiratory conditions like asthma. It also contributes to the formation of ground-level ozone and fine particles.",
  },
} as const;

/**
 * Debug page component that displays the processing sketch.
 */
export const DebugParticlesOnly = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState(
    airQualityDetails?.cityName || cityQuery || ""
  );
  const [showParticlesSketch, setShowParticlesSketch] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedParticles, setExpandedParticles] = useState<
    Record<string, boolean>
  >({});

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

  /**
   * Handles back button click to return to processing sketch
   */
  const handleBackClick = () => {
    // Immediate transition back without zoom blur effect
    setShowParticlesSketch(false);
  };

  /**
   * Handles particle accordion expand/collapse
   */
  const handleParticleAccordionChange = (particleKey: string) => {
    setExpandedParticles((prev) => ({
      ...prev,
      [particleKey]: !prev[particleKey],
    }));
  };

  /**
   * Calculate particle counts based on air quality components
   * This approximates what's displayed in the sketch
   */
  const getParticleCounts = () => {
    if (!airQualityDetails?.components) return null;

    const components = airQualityDetails.components;
    const targetCount = airQualityDetails.targetCount || 150;

    // Calculate total of relevant pollutants
    const relevantKeys: Array<keyof typeof POLLUTANT_INFO> = [
      "o3",
      "pm2_5",
      "pm10",
      "co",
      "no2",
    ];
    const total = relevantKeys.reduce((sum, key) => {
      return sum + Math.max(0, components[key] || 0);
    }, 0);

    if (total <= 1e-9) {
      // Equal distribution if no data
      const equalCount = Math.floor(targetCount / relevantKeys.length);
      return relevantKeys.reduce((acc, key) => {
        acc[key] = equalCount;
        return acc;
      }, {} as Record<string, number>);
    }

    // Proportional distribution
    return relevantKeys.reduce((acc, key) => {
      const value = Math.max(0, components[key] || 0);
      acc[key] = Math.floor((value / total) * targetCount);
      return acc;
    }, {} as Record<string, number>);
  };

  const particleCounts = getParticleCounts();
  const particleCount = airQualityDetails?.targetCount || 150;
  const aqi = airQualityDetails?.aqi;
  const aqiLabel = airQualityDetails?.aqiLabel || "Unknown";
  const infoTitle = showParticlesSketch
    ? airQualityDetails?.cityName || "Unknown City"
    : "Air Quality Info";

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

      {/* Info Card - Different content based on mode */}
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
            {infoTitle}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsInfoCollapsed((prev) => !prev)}
            aria-label={isInfoCollapsed ? "Expand info" : "Collapse info"}
            sx={{ color: "#1976d2" }}
          >
            {isInfoCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        <Collapse in={!isInfoCollapsed} timeout="auto" unmountOnExit>
          {/* Particles Mode */}
          {showParticlesSketch ? (
            <>
              {/* Back Button */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBackClick}
                disabled={isTransitioning}
                sx={{
                  marginBottom: "1.5rem",
                  textTransform: "none",
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  "&:hover": {
                    borderColor: "#1565c0",
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                Back to Visibility
              </Button>

              {/* Particle Counts */}
              {particleCounts && (
                <Box sx={{ marginBottom: "1rem" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      marginBottom: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    Particle Types (
                    {Object.values(particleCounts).reduce((a, b) => a + b, 0)}{" "}
                    total)
                  </Typography>

                  {(
                    Object.keys(POLLUTANT_INFO) as Array<
                      keyof typeof POLLUTANT_INFO
                    >
                  ).map((key) => {
                    const count = particleCounts[key] || 0;
                    const info = POLLUTANT_INFO[key];
                    const isExpanded = expandedParticles[key] || false;

                    return (
                      <Accordion
                        key={key}
                        expanded={isExpanded}
                        onChange={() => handleParticleAccordionChange(key)}
                        sx={{
                          marginBottom: "0.5rem",
                          boxShadow: "none",
                          border: "1px solid rgba(0, 0, 0, 0.12)",
                          "&:before": {
                            display: "none",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            backgroundColor: "rgba(0, 0, 0, 0.02)",
                            minHeight: "48px",
                            "&.Mui-expanded": {
                              minHeight: "48px",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%",
                              paddingRight: "0.5rem",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                              }}
                            >
                              <Box
                                component="img"
                                src={info.imageUrl}
                                alt={info.label}
                                sx={{
                                  width: "32px",
                                  height: "32px",
                                  objectFit: "contain",
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: "#333",
                                }}
                              >
                                {info.label}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                color: "#1976d2",
                                marginLeft: "1rem",
                              }}
                            >
                              {count}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            <Box
                              component="img"
                              src={info.imageUrl}
                              alt={info.label}
                              sx={{
                                width: "64px",
                                height: "64px",
                                objectFit: "contain",
                                alignSelf: "center",
                                marginBottom: "0.25rem",
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#555",
                                lineHeight: 1.6,
                                fontSize: "0.875rem",
                              }}
                            >
                              {info.description}
                            </Typography>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}
            </>
          ) : (
            <>
              {/* Processing Mode - Original Content */}
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
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
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
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
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
                    particulate matter (PM2.5 and PM10) and other pollutants in
                    the atmosphere. These particles when paired with the right
                    atmospheric conditions can scatter and absorb light,
                    reducing visibility. High particle concentration can cause
                    hazy air conditions, making distant objects appear less
                    clear. Fine particulate matter, particularly PM2.5, is a
                    major contributor to visible pollution due to its small size
                    and unique chemical properties that allow it to scatter
                    light more effectively.
                  </Typography>
                </Box>
              </Collapse>
            </>
          )}
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
