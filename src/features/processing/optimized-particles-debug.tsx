import { useRef, useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ProcessingSketch2 from "./processing-sketch-3";
import ParticlesSketch3 from "./particles-sketch-3";
import { useCity } from "../../providers/use-city";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import Timeline from "../../components/timeline";
import { useNavigate } from "react-router-dom";
import { AqiSlider } from "../../components/aqi-slider";

// Particle type labels, descriptions, and images
const POLLUTANT_INFO = {
  o3: {
    label: "Ozone (O₃)",
    imageUrl: "/thumbnail_new_O3.png",
    description:
      "Ozone is a reactive gas that forms when nitrogen oxides and volatile organic compounds react in sunlight. Ground-level ozone can cause respiratory problems and aggravate asthma. High levels are often associated with sunny, stagnant weather conditions.",
  },
  pm2_5: {
    label: "PM2.5",
    imageUrl: "/thumbnail_new_PM2.5.png",
    description:
      "Fine particulate matter with diameter less than 2.5 micrometers. These tiny particles can penetrate deep into the lungs and even enter the bloodstream, causing cardiovascular and respiratory issues. Sources include vehicle exhaust, industrial emissions, and wildfires.",
  },
  pm10: {
    label: "PM10",
    imageUrl: "/thumbnail_new_PM10.png",
    description:
      "Particulate matter with diameter less than 10 micrometers. These larger particles can irritate the eyes, nose, and throat. Common sources include dust from roads, construction sites, and agricultural activities.",
  },
  co: {
    label: "Carbon Monoxide (CO)",
    imageUrl: "/thumbnail_new_CO2.png",
    description:
      "A colorless, odorless gas produced by incomplete combustion of carbon-based fuels. High levels primarily come from vehicle emissions. Carbon monoxide reduces the blood's ability to carry oxygen, which can be particularly dangerous for people with heart conditions.",
  },
  no2: {
    label: "Nitrogen Dioxide (NO₂)",
    imageUrl: "/thumbnail_new_NO2.png",
    description:
      "A reddish-brown gas produced by burning fossil fuels, especially in vehicles and power plants. Nitrogen dioxide can irritate airways and worsen respiratory conditions like asthma. It also contributes to the formation of ground-level ozone and fine particles.",
  },
} as const;

/**
 * Debug page component that displays the processing sketch.
 * Optimized to keep both sketches mounted for smoother transitions.
 */
export const OptimizedDebugParticlesOnly = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState(
    airQualityDetails?.cityName || cityQuery || ""
  );
  const [showParticlesSketch, setShowParticlesSketch] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "in" | "out" | null
  >(null);
  const [expandedParticles, setExpandedParticles] = useState<
    Record<string, boolean>
  >({});
  const navigate = useNavigate();
  const currentTimelineStep = showParticlesSketch ? "Microview" : "Macroview";

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
  const handleZoomClick = useCallback(() => {
    if (isTransitioning || showParticlesSketch) {
      return;
    }

    setTransitionDirection("in");
    setIsTransitioning(true);
    // Wait for transition animation to complete before switching components
    setTimeout(() => {
      setShowParticlesSketch(true);
      setIsTransitioning(false);
      setTransitionDirection(null);
    }, 600); // Match transition duration
  }, [isTransitioning, showParticlesSketch]);

  /**
   * Handles zoom out button click to return to processing sketch
   */
  const handleZoomOutClick = useCallback(() => {
    if (isTransitioning || !showParticlesSketch) {
      return;
    }

    setTransitionDirection("out");
    setIsTransitioning(true);
    setTimeout(() => {
      setShowParticlesSketch(false);
      setIsTransitioning(false);
      setTransitionDirection(null);
    }, 600);
  }, [isTransitioning, showParticlesSketch]);

  /**
   * Handles navigation to previous page
   * In particles view: zooms out to processing view
   * In processing view: navigates to examine page
   */
  const handleNavigatePrevious = useCallback(() => {
    if (showParticlesSketch) {
      // In particles view, zoom out to processing view
      handleZoomOutClick();
    } else {
      // In processing view, navigate to previous page
      navigate("/examine");
    }
  }, [navigate, showParticlesSketch, handleZoomOutClick]);

  /**
   * Handles navigation to next page
   * In processing view: zooms in to particles view
   * In particles view: navigates to conclusion page
   */
  const handleNavigateNext = useCallback(() => {
    if (!showParticlesSketch) {
      // In processing view, zoom in to particles view
      handleZoomClick();
    } else {
      // In particles view, navigate to conclusion page
      navigate("/conclusion");
    }
  }, [navigate, showParticlesSketch, handleZoomClick]);

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
  const isZoomingIn = isTransitioning && transitionDirection === "in";
  const isZoomingOut = isTransitioning && transitionDirection === "out";
  const zoomButtonStyles = {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    width: "56px",
    height: "56px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 1001,
    transition: "transform 0.2s ease, background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      transform: "scale(1.1)",
    },
  } as const;

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
      {/* Timeline Component */}
      <Timeline currentStep={currentTimelineStep} />

      {/* Navigation Buttons - Top Left and Right */}
      <Fab
        color="success"
        aria-label="Go back"
        onClick={handleNavigatePrevious}
        sx={{
          position: "fixed",
          top: 24,
          left: 24,
          width: 72,
          height: 72,
          backgroundColor: "#FFD400",
          "&:hover": { backgroundColor: "#FFE254" },
          zIndex: 1002,
        }}
      >
        <ArrowBack sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>
      <Fab
        color="success"
        aria-label="Show results"
        onClick={handleNavigateNext}
        sx={{
          position: "fixed",
          top: 24,
          right: 24,
          width: 72,
          height: 72,
          backgroundColor: "#FFD400",
          "&:hover": { backgroundColor: "#FFE254" },
          zIndex: 1002,
        }}
      >
        <ArrowForward sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>

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
            animation: `${
              transitionDirection === "out" ? "zoomOutBlur" : "zoomInBlur"
            } 0.6s ease-out forwards`,
          }}
        />
      )}

      {/* 
        DOUBLE BUFFERING STRATEGY:
        Both sketches are mounted simultaneously. 
        We use styles to toggle visibility/interactivity.
      */}

      {/* Sketch 1: Processing (Blurry/Mist) View */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          // Visible when showParticlesSketch is false OR during transitions
          visibility:
            showParticlesSketch && !isTransitioning ? "hidden" : "visible",
          opacity: showParticlesSketch && !isTransitioning ? 0 : 1,
          zIndex: showParticlesSketch ? 1 : 2, // Lower z-index when inactive
          pointerEvents: showParticlesSketch ? "none" : "auto",

          // Apply transition effects
          transform: isZoomingIn ? "scale(2)" : "scale(1)",
          filter: isZoomingIn ? "blur(20px)" : "blur(0px)",
          transition: isTransitioning
            ? "transform 0.6s ease-out, filter 0.6s ease-out, opacity 0.6s ease-out"
            : "none",
        }}
      >
        <ProcessingSketch2 />
      </div>

      {/* Sketch 2: Particles (Clear/Microscope) View */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          // Visible when showParticlesSketch is true OR during transitions
          visibility:
            !showParticlesSketch && !isTransitioning ? "hidden" : "visible",
          opacity: !showParticlesSketch && !isTransitioning ? 0 : 1,
          zIndex: showParticlesSketch ? 2 : 1, // Higher z-index when active
          pointerEvents: showParticlesSketch ? "auto" : "none",

          // Apply transition effects
          animation: isZoomingOut
            ? "none"
            : showParticlesSketch && !isTransitioning
            ? "none"
            : undefined, // Only animate if needed
          transform: isZoomingOut ? "scale(0.15)" : "scale(1)",
          filter: isZoomingOut ? "blur(12px)" : "blur(0px)",
          transition: isTransitioning
            ? "transform 0.6s ease-out, filter 0.6s ease-out, opacity 0.6s ease-out"
            : "none",
        }}
      >
        <ParticlesSketch3 showControls={false} />
      </div>

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

              <Box
                sx={{
                  marginBottom: "1rem",
                }}
              >
                <AqiSlider aqi={aqi} />
              </Box>
            </>
          )}
        </Collapse>
      </Paper>

      {/* Zoom Controls - Bottom Right */}
      {!showParticlesSketch ? (
        <IconButton
          onClick={handleZoomClick}
          disabled={isTransitioning}
          sx={zoomButtonStyles}
          aria-label="Zoom to particles view"
        >
          <ZoomInIcon sx={{ color: "#1976d2", fontSize: "28px" }} />
        </IconButton>
      ) : (
        <IconButton
          onClick={handleZoomOutClick}
          disabled={isTransitioning}
          sx={zoomButtonStyles}
          aria-label="Zoom out to visibility view"
        >
          <ZoomOutIcon sx={{ color: "#1976d2", fontSize: "28px" }} />
        </IconButton>
      )}

      {/* CSS Animations for zoom blur and fade effects */}
      <style>
        {`
          @keyframes zoomInBlur {
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

          @keyframes zoomOutBlur {
            0% {
              background: radial-gradient(circle at center, transparent 50%, rgba(0, 0, 0, 0.7) 100%);
              opacity: 0;
            }
            50% {
              background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%);
              opacity: 1;
            }
            100% {
              background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
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
