import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ParticlesSketch3 from "./particles-sketch-3";
import { useCity } from "../../providers/use-city";
import CityAutocomplete from "../../components/city-autocomplete";
import ProcessingHeader from "../../components/processing-header";
import { PieChart, Pie, Cell } from "recharts";

// Particle type labels, descriptions, and images
const POLLUTANT_INFO = {
  o3: {
    label: "Ozone (O₃)",
    imageUrl: `${import.meta.env.BASE_URL}thumbnail_new_O3.png`,
    description:
      "Ozone is a reactive gas that forms when nitrogen oxides and volatile organic compounds react in sunlight. Ground-level ozone can cause respiratory problems and aggravate asthma. High levels are often associated with sunny, stagnant weather conditions.",
  },
  pm2_5: {
    label: "PM2.5",
    imageUrl: `${import.meta.env.BASE_URL}thumbnail_new_PM2.5.png`,
    description:
      "Fine particulate matter with diameter less than 2.5 micrometers. These tiny particles can penetrate deep into the lungs and even enter the bloodstream, causing cardiovascular and respiratory issues. Sources include vehicle exhaust, industrial emissions, and wildfires.",
  },
  pm10: {
    label: "PM10",
    imageUrl: `${import.meta.env.BASE_URL}thumbnail_new_PM10.png`,
    description:
      "Particulate matter with diameter less than 10 micrometers. These larger particles can irritate the eyes, nose, and throat. Common sources include dust from roads, construction sites, and agricultural activities.",
  },
  co: {
    label: "Carbon Monoxide (CO)",
    imageUrl: `${import.meta.env.BASE_URL}thumbnail_new_CO2.png`,
    description:
      "A colorless, odorless gas produced by incomplete combustion of carbon-based fuels. High levels primarily come from vehicle emissions. Carbon monoxide reduces the blood's ability to carry oxygen, which can be particularly dangerous for people with heart conditions.",
  },
  no2: {
    label: "Nitrogen Dioxide (NO₂)",
    imageUrl: `${import.meta.env.BASE_URL}thumbnail_new_NO2.png`,
    description:
      "A reddish-brown gas produced by burning fossil fuels, especially in vehicles and power plants. Nitrogen dioxide can irritate airways and worsen respiratory conditions like asthma. It also contributes to the formation of ground-level ozone and fine particles.",
  },
} as const;

const POLLUTANT_COLORS: Record<keyof typeof POLLUTANT_INFO, string> = {
  o3: "#2D7ED8",
  pm2_5: "#4FC3F7",
  pm10: "#FFCA28",
  co: "#27AE60",
  no2: "#6C4A2D",
};

/**
 * Micro view component displaying the particles sketch (clear/microscope view)
 * with particle information card and city selection capability.
 */
export const MicroView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cityQuery, airQualityDetails, fetchCityAirQuality, isFetching } =
    useCity();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState(
    airQualityDetails?.cityName || cityQuery || ""
  );
  const [expandedParticles, setExpandedParticles] = useState<
    Record<string, boolean>
  >({});
  const [particleViewMode, setParticleViewMode] = useState<"list" | "pie">(
    "list"
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
   * Handles particle accordion expand/collapse
   */
  const handleParticleAccordionChange = (particleKey: string) => {
    setExpandedParticles((prev) => ({
      ...prev,
      [particleKey]: !prev[particleKey],
    }));
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

  /**
   * Calculate particle counts based on air quality components
   * This approximates what's displayed in the sketch
   */
  const getParticleCounts = () => {
    if (!airQualityDetails?.components) {
      return null;
    }

    const components = airQualityDetails.components;

    // Calculate total of relevant pollutants
    const relevantKeys: Array<keyof typeof POLLUTANT_INFO> = [
      "o3",
      "pm2_5",
      "pm10",
      "co",
      "no2",
    ];

    const sanitizeValue = (rawValue: unknown) => {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
      }
      return parsed;
    };

    const sanitizedComponents = relevantKeys.reduce((acc, key) => {
      acc[key] = sanitizeValue(components[key]);
      return acc;
    }, {} as Record<keyof typeof POLLUTANT_INFO, number>);

    const total = relevantKeys.reduce((sum, key) => {
      return sum + sanitizedComponents[key];
    }, 0);

    if (total <= 1e-9) {
      // Equal distribution if no data
      const equalCount = Math.floor(resolvedTargetCount / relevantKeys.length);
      return relevantKeys.reduce((acc, key) => {
        acc[key] = equalCount;
        return acc;
      }, {} as Record<string, number>);
    }

    // Proportional distribution
    const proportionalCounts = relevantKeys.reduce((acc, key) => {
      const value = sanitizedComponents[key];
      const fraction = value / total;
      const scaledCount = fraction * resolvedTargetCount;
      acc[key] = Number.isFinite(scaledCount) ? Math.floor(scaledCount) : 0;
      return acc;
    }, {} as Record<string, number>);

    return proportionalCounts;
  };

  const particleCounts = getParticleCounts();
  const infoTitle = airQualityDetails?.cityName || "Unknown City";

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
          currentStep={3}
          prevRoute="/macroview"
          nextRoute="/conclusion"
        />
      </Box>

      {/* Particles Sketch (Micro View) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ParticlesSketch3 showControls={false} />
      </div>

      {/* Info Card - Particle Information and City Selection */}
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

          {/* View Mode Toggle */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: "#e0e0e0",
              borderRadius: "8px",
              padding: "0.3rem",
            }}
          >
            <Button
              onClick={() => setParticleViewMode("list")}
              variant={particleViewMode === "list" ? "contained" : "text"}
              size="small"
              sx={{
                boxShadow: "none",
                backgroundColor:
                  particleViewMode === "list" ? "#FFD400" : "transparent",
                color: particleViewMode === "list" ? "#000" : "#555",
                "&:hover": {
                  backgroundColor:
                    particleViewMode === "list" ? "#FFE254" : "transparent",
                  boxShadow: "none",
                },
                textTransform: "none",
                fontWeight: 700,
              }}
              aria-pressed={particleViewMode === "list"}
            >
              List View
            </Button>
            <Button
              onClick={() => setParticleViewMode("pie")}
              variant={particleViewMode === "pie" ? "contained" : "text"}
              size="small"
              sx={{
                boxShadow: "none",
                backgroundColor:
                  particleViewMode === "pie" ? "#FFD400" : "transparent",
                color: particleViewMode === "pie" ? "#000" : "#555",
                "&:hover": {
                  backgroundColor:
                    particleViewMode === "pie" ? "#FFE254" : "transparent",
                  boxShadow: "none",
                },
                textTransform: "none",
                fontWeight: 700,
              }}
              aria-pressed={particleViewMode === "pie"}
            >
              Pie Chart View
            </Button>
          </Box>

          {/* List View */}
          {particleCounts && particleViewMode === "list" && (
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

          {/* Pie Chart View */}
          {particleViewMode === "pie" && (
            <>
              {particleCounts ? (
                <ParticleDistributionPie particleCounts={particleCounts} />
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#666",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  No particle data available for chart.
                </Typography>
              )}
            </>
          )}

          {/* No Data Message */}
          {!particleCounts && particleViewMode === "list" && (
            <Typography variant="body2" sx={{ color: "#666" }}>
              Particle data unavailable.
            </Typography>
          )}
        </Collapse>
      </Paper>
    </div>
  );
};

type ParticleDistributionPieProps = {
  particleCounts: Record<string, number>;
};

/**
 * Minimal pie chart showing particle distribution with no extra chrome
 */
const ParticleDistributionPie = ({
  particleCounts,
}: ParticleDistributionPieProps) => {
  const data = (
    Object.keys(POLLUTANT_INFO) as Array<keyof typeof POLLUTANT_INFO>
  ).map((key) => {
    const rawValue = Number(particleCounts[key]);
    const value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
    return {
      key,
      label: POLLUTANT_INFO[key].label,
      value,
      color: POLLUTANT_COLORS[key],
    };
  });

  const hasData = data.some((item) => item.value > 0);
  const totalCount = data.reduce((sum, item) => sum + item.value, 0);

  if (!hasData) {
    return (
      <Typography
        variant="body2"
        sx={{ color: "#666", textAlign: "center", marginTop: "0.5rem" }}
      >
        No particle data available to display in chart.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        marginTop: "0.5rem",
        marginBottom: "0.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "#666",
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Particle Distribution ({totalCount} total)
      </Typography>
      <PieChart width={100} height={100}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx={130}
          cy={110}
          outerRadius={90}
          innerRadius={0}
          labelLine={false}
          label={({ value }) => (value > 0 ? `${value}` : "")}
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.color}
              stroke="#ffffff"
              strokeWidth={1}
            />
          ))}
        </Pie>
      </PieChart>
    </Box>
  );
};
