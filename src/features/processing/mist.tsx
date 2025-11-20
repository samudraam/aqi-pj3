import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Fab, Paper, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch-3";

/**
 * AQI visualization screen with WebGL frosted glass camera effect.
 */
const MistPage = () => {
  const { airQualityDetails } = useCity();
  const navigate = useNavigate();
  //const [ctaVisible, setCtaVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!airQualityDetails) {
      navigate("/", { replace: true });
    }
  }, [airQualityDetails, navigate]);

  // const handleRevealCta = useCallback(() => {
  //   setCtaVisible(true);
  // }, []);

  const handleNavigateNext = useCallback(() => {
    navigate("/mist/success");
  }, [navigate]);

  const handleNavigatePrevious = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        bgcolor: "#000000",
        position: "relative",
        overflow: "hidden",
      }}
      // onMouseDown={handleRevealCta}
      // onTouchStart={handleRevealCta}
    >
      <ProcessingSketch />
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 600,
          height: 100,
          px: 3,
          py: 2,
          maxWidth: 400,
          backgroundColor: "rgba(101, 159, 65, 0.95)",
          zIndex: 10, 
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 400,
            fontSize: "1.5rem",
            color: "#fbfbfb",
            lineHeight: 1.5,
          }}
        >
          Push the particles and click next when you're ready!
        </Typography>
      </Paper>

      <Fab
        color="success"
        aria-label="Go back"
        onClick={handleNavigatePrevious}
        sx={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 72,
          height: 72,
          backgroundColor: "#659f41",
          "&:hover": { backgroundColor: "#56C853" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 36 }} />
      </Fab>

      <Fab
        color="success"
        aria-label="Show results"
        onClick={handleNavigateNext}
        sx={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 72,
          height: 72,
          backgroundColor: "#659f41",
          "&:hover": { backgroundColor: "#56C853" },
        }}
      >
        <ArrowForwardIcon sx={{ fontSize: 36 }} />
      </Fab>

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
        Processing AQI visualization…
      </Box>
    </Box>
  );
};

export default MistPage;
