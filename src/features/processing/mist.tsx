import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Fab, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch-4";
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
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          bgcolor: "#FFD400",
          zIndex: 20,
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 2, sm: 50 },
            py: { xs: 1.5, sm: 2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            aria-label="Go back"
            onClick={handleNavigatePrevious}
            sx={{
              position: "absolute",
              left: { xs: 12, sm: 18, md: 26 },
              top: "50%",
              transform: "translateY(-50%)",
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 36, color: "#000000" }} />
          </Box>

          <Timeline currentStep="discover" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 3 }}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <Box
              color="success"
              aria-label="Show results"
              onClick={handleNavigateNext}
              sx={{
                position: "absolute",
                right: { xs: 12, sm: 16, md: 24 },
                top: "50%",
                transform: "translateY(-50%)",
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: 32, color: "inherit" }} />
            </Box>
          </motion.div>
        </Box>
      </Box>
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
