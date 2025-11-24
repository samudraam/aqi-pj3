import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Fab, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch-3";
import Timeline from "../../components/timeline";
import { AnimatePresence, motion } from "motion/react";

/**
 * AQI visualization screen with WebGL frosted glass camera effect.
 */
const MistPage = () => {
  const { airQualityDetails } = useCity();
  const navigate = useNavigate();
  const [showSecondText, setShowSecondText] = useState(false);
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
    navigate("/examine");
  }, [navigate]);

  const handleNavigatePrevious = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSecondText(true);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

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
      <Timeline currentStep="discover" />
      <ProcessingSketch />
      <Box
        sx={{
          position: "inherit",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
        }}
      >
        <AnimatePresence mode="wait">
          {!showSecondText ? (
            <motion.div
              key="first-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <Typography
                sx={{
                  pt: 5,
                  textAlign: "center",
                  fontFamily: "Inter",
                  color: "#000000",
                  fontSize: { xs: "2rem", sm: "2rem", md: "3rem" },
                  fontWeight: 500,
                  lineHeight: 1,
                  zIndex: 10,
                }}
              >
                There seems to be
                <br />
                something in the air...
              </Typography>
              <Typography
                sx={{
                  pt: 2,
                  textAlign: "center",
                  fontFamily: "Inter",
                  color: "#000000",
                  fontSize: { xs: "1rem", sm: "1rem", md: "1.5rem" },
                  fontWeight: 400,
                  lineHeight: 1.5,
                  zIndex: 10,
                }}
              >
                Can you disperse these particles?
              </Typography>
            </motion.div>
          ) : (
            <motion.div
              key="second-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <Typography
                sx={{
                  pt: 5,
                  textAlign: "center",
                  fontFamily: "Inter",
                  color: "#000000",
                  fontSize: { xs: "2rem", sm: "2rem", md: "3rem" },
                  fontWeight: 500,
                  lineHeight: 1,
                  zIndex: 10,
                }}
              >
                It doesn't seem to go away...
              </Typography>
              <Typography
                sx={{
                  pt: 2,
                  textAlign: "center",
                  fontFamily: "Inter",
                  color: "#000000",
                  fontSize: { xs: "1rem", sm: "1rem", md: "1.5rem" },
                  fontWeight: 400,
                  lineHeight: 1.5,
                  zIndex: 10,
                }}
              >
                What’s in this mist anyways? 
                <br />
                Click the arrow to find out!
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

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
          backgroundColor: "#FFD400",
          "&:hover": { backgroundColor: "#FFE254" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, delay: 3 }}
      >
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
            backgroundColor: "#FFD400",
            "&:hover": { backgroundColor: "#FFE254" },
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: 36, color: "#000000" }} />
        </Fab>
      </motion.div>
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
