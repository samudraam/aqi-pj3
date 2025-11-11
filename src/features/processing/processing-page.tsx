import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch";

/**
 * AQI visualization screen with WebGL frosted glass camera effect.
 */
const ProcessingPage = () => {
  const { airQualityDetails } = useCity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!airQualityDetails) {
      navigate("/", { replace: true });
    }
  }, [airQualityDetails, navigate]);

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
    >
      <ProcessingSketch />
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

export default ProcessingPage;
