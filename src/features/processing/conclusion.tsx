import { Box, Typography, Button, Fab } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Timeline from "../../components/timeline";

/**
 * Conclusion page that displays the reality of air quality impact.
 * Shows statistics and facts about air pollution, with options to restart or share.
 */
const ConclusionPage = () => {
  const navigate = useNavigate();

  const handleRestart = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleNavigatePrevious = useCallback(() => {
    navigate("/particles-debug");
  }, [navigate]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator
        .share({
          title: "Air Quality Experience",
          text: "Check out this air quality experience!",
          url: window.location.href,
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  }, []);

  const bulletPoints = [
    "PM2.5 reduces global life expectancy by 2 years on average",
    "Air pollution kills 7 million people annually",
    "It's the 4th leading risk factor for death worldwide",
    "But air quality is improvable—many cities have gotten cleaner",
  ];

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        bgcolor: "#DC143C",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        px: { xs: 2, sm: 4 },
        py: 4,
        position: "relative",
      }}
    >
      <Timeline currentStep="end" />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          maxWidth: 800,
          width: "100%",
          gap: 4,
          mt: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 400,
              color: "#ffffff",
              mb: 4,
            }}
          >
            So what? Here's the reality
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 600,
              color: "#ffffff",
              mb: 6,
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              lineHeight: 1.2,
            }}
          >
            These aren't just numbers. You breathe in a mixture of particles
            20,000 times a day
          </Typography>
        </motion.div>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            width: "100%",
            mb: 4,
          }}
        >
          {bulletPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 400,
                  color: "#ffffff",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <span style={{ marginRight: "8px" }}>→</span>
                {point}
              </Typography>
            </motion.div>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            width: "100%",
            justifyContent: "center",
            flexWrap: "wrap",
            mt: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button
              variant="outlined"
              onClick={handleRestart}
              sx={{
                borderColor: "#FFD700",
                borderWidth: 2,
                color: "#ffffff",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": {
                  borderColor: "#FFD700",
                  borderWidth: 2,
                  backgroundColor: "rgba(255, 215, 0, 0.1)",
                },
              }}
              aria-label="Restart the experience"
            >
              Restart the experience
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Button
              variant="contained"
              onClick={handleShare}
              sx={{
                backgroundColor: "#FFD700",
                color: "#000000",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#FFE44D",
                },
              }}
              aria-label="Share with others"
            >
              Share with others
            </Button>
          </motion.div>
        </Box>
      </Box>

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
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 36, color: "#000000" }} />
      </Fab>
    </Box>
  );
};

export default ConclusionPage;
