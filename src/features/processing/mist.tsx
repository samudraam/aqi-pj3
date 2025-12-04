import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch-4";
import { AnimatePresence, motion } from "motion/react";
import ProcessingHeader from "../../components/processing-header";

/**
 * AQI visualization screen with WebGL frosted glass camera effect.
 */
const MistPage = () => {
  const { airQualityDetails } = useCity();
  const navigate = useNavigate();
  const [showSecondText, setShowSecondText] = useState(false);

  useEffect(() => {
    if (!airQualityDetails) {
      navigate("/", { replace: true });
    }
  }, [airQualityDetails, navigate]);

  // const handleRevealCta = useCallback(() => {
  //   setCtaVisible(true);
  // }, []);

  // const handleNavigateNext = useCallback(() => {
  //   navigate("/examine");
  // }, [navigate]);

  // const handleNavigatePrevious = useCallback(() => {
  //   navigate("/");
  // }, [navigate]);

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
        display: "flex",
        flexDirection: "column",
        gap: 2,
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
        <ProcessingHeader currentStep={0} prevRoute="/" nextRoute="/examine" />
      </Box>
      <Box
        sx={{
          position: "relative",
          flex: 1,
        }}
      >
        <ProcessingSketch />
        <Box
          sx={{
            position: "absolute",
            top: 100,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            px: 2,
          }}
        >
          <AnimatePresence mode="wait">
            {!showSecondText ? (
              <motion.div
                key="first-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 2 }}
              >
                <Typography
                  sx={{
                    textAlign: "center",
                    fontFamily: "Raleway",
                    color: "#000000",
                    fontSize: { xs: "2rem", sm: "2rem", md: "3rem" },
                    fontWeight: 500,
                    lineHeight: 1,
                    zIndex: 10,
                  }}
                >
                  See particles in the air?
                </Typography>
                <Typography
                  sx={{
                    pt: 2,
                    textAlign: "center",
                    fontFamily: "Raleway",
                    color: "#000000",
                    fontSize: { xs: "1.25rem", sm: "1.25rem", md: "1.25rem" },
                    fontWeight: 500,
                    lineHeight: 1.5,
                    zIndex: 10,
                  }}
                >
                  Move your cursor to disperse them.
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
                    textAlign: "center",
                    fontFamily: "Raleway",
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
                    fontFamily: "Raleway",
                    color: "#000000",
                    fontSize: { xs: "1.25rem", sm: "1.25rem", md: "1.25rem" },
                    fontWeight: 500,
                    lineHeight: 1.5,
                    zIndex: 10,
                  }}
                >
                  What’s in this mist anyways? Click the arrow to find out!
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
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
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 200,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Raleway",
            color: "#000000",
            fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
            fontWeight: 600,
            marginLeft: 2,
            marginBottom: 2,
            opacity: 1,
          }}
        >
          Blur and particles calculated from Visibility and AQI in {airQualityDetails?.cityName || ""}, {airQualityDetails?.country || ""}.
        </Typography>
      </Box>
    </Box>
  );
};

export default MistPage;
