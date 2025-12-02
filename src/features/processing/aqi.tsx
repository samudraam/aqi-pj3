import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Fab, Typography, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCity } from "../../providers/use-city";
import Timeline from "../../components/timeline";
import { AqiSlider } from "../../components/aqi-slider";

/**
 * Factors that affect AQI
 */
const AQI_FACTORS = [
  { id: "wind", label: "Wind" },
  { id: "temperature", label: "Temperature" },
  { id: "humidity", label: "Humidity" },
  { id: "precipitation", label: "Precipitation" },
  { id: "industry", label: "Industry" },
] as const;

type FactorId = (typeof AQI_FACTORS)[number]["id"];

/**
 * AQI educational page explaining the Air Quality Index scale and factors
 */
const AqiPage = () => {
  const { airQualityDetails } = useCity();
  const navigate = useNavigate();
  const [selectedFactor, setSelectedFactor] = useState<FactorId>("wind");

  useEffect(() => {
    if (!airQualityDetails) {
      navigate("/", { replace: true });
    }
  }, [airQualityDetails, navigate]);

  /**
   * Handles navigation to the previous page
   */
  const handleNavigatePrevious = useCallback(() => {
    navigate("/examine");
  }, [navigate]);

  /**
   * Handles navigation to the next page
   */
  const handleNavigateNext = useCallback(() => {
    navigate("/particles-debug");
  }, [navigate]);

  /**
   * Handles factor button click
   */
  const handleFactorClick = useCallback((factorId: FactorId) => {
    setSelectedFactor(factorId);
  }, []);

  // Convert AQI to 1-5 scale (it's already in that format from the API)
  const aqiValue = airQualityDetails?.aqi ?? null;

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "linear-gradient(to bottom, #E6F3FF 0%, #87CEEB 100%)",
        position: "relative",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Timeline currentStep="aqi" />

      {/* Navigation Buttons */}
      <Fab
        color="success"
        aria-label="Go back"
        onClick={handleNavigatePrevious}
        sx={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 72,
          height: 72,
          backgroundColor: "#FFD400",
          "&:hover": { backgroundColor: "#FFE254" },
          zIndex: 1101,
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>

      <Fab
        color="success"
        aria-label="Go forward"
        onClick={handleNavigateNext}
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 72,
          height: 72,
          backgroundColor: "#FFD400",
          "&:hover": { backgroundColor: "#FFE254" },
          zIndex: 1101,
        }}
      >
        <ArrowForwardIcon sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingX: { xs: 3, sm: 4, md: 6 },
          paddingY: { xs: 8, sm: 10, md: 12 },
          gap: { xs: 3, sm: 4, md: 5 },
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Main Title */}
        <Typography
          component="h1"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
            fontWeight: 400,
            color: "#000000",
            textAlign: "left",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "Inter, sans-serif",
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
              fontWeight: 600,
              fontStyle: "italic",
              color: "#000000",
            }}
          >
            Air Quality Index {" "}
          </Typography>
          (AQI) measures how clean or polluted the air is.
        </Typography>

        {/* Supporting Text */}
        <Typography
          component="p"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
            fontWeight: 400,
            color: "#000000",
            textAlign: "left",
            lineHeight: 1.5,
            maxWidth: "900px",
          }}
        >
          The concentration of the 5 major pollutants are rated on a scale from
          1-5.
        </Typography>

        {/* AQI Scale Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginTop: { xs: 2, sm: 3 },
          }}
        >
          {/* Scale Labels */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingX: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Inter, sans-serif",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 500,
                color: "#000000",
              }}
            >
              Lower = Cleaner Air
            </Typography>
            <Typography
              sx={{
                fontFamily: "Inter, sans-serif",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 500,
                color: "#000000",
              }}
            >
              Higher = Poorer Air
            </Typography>
          </Box>

          {/* AQI Slider Component */}
          <AqiSlider aqi={aqiValue} width="100%" />

          {/* Numerical Ratings */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingX: 1,
              marginTop: 1,
            }}
          >
            {[
              { level: 1 },
              { level: 2 },
              { level: 3 },
              { level: 4 },
              { level: 5 },
            ].map(({ level }) => (
              <Typography
                key={level}
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                  fontWeight: 500,
                  color: "#000000",
                  textAlign: "center",
                  flex: 1,
                }}
              >
                {level}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Factors Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginTop: { xs: 3, sm: 4, md: 5 },
          }}
        >
          <Typography
            component="h2"
            sx={{
              fontFamily: "Inter, sans-serif",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontWeight: 600,
              color: "#000000",
              textAlign: "center",
            }}
          >
            Factors that affect AQI
          </Typography>

          {/* Factor Buttons */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1.5, sm: 2 },
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {AQI_FACTORS.map((factor) => {
              const isSelected = selectedFactor === factor.id;
              return (
                <Button
                  key={factor.id}
                  onClick={() => handleFactorClick(factor.id)}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                    fontWeight: 500,
                    color: "#000000",
                    backgroundColor: isSelected ? "#FFD400" : "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                    borderRadius: "24px",
                    paddingX: { xs: 2.5, sm: 3, md: 4 },
                    paddingY: { xs: 1, sm: 1.25, md: 1.5 },
                    textTransform: "none",
                    minWidth: { xs: "100px", sm: "120px", md: "140px" },
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: isSelected ? "#FFE254" : "#F5F5F5",
                      borderColor: "rgba(0, 0, 0, 0.3)",
                    },
                  }}
                  aria-label={`Select ${factor.label} factor`}
                  aria-pressed={isSelected}
                >
                  {factor.label}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Screen Reader Announcement */}
      <Box
        component="span"
        aria-live="polite"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(1px, 1px, 1px, 1px)",
          whiteSpace: "nowrap",
        }}
      >
        AQI educational page showing air quality index scale and factors
      </Box>
    </Box>
  );
};

export default AqiPage;
