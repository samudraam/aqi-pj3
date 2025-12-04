import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useCallback } from "react";
import ProcessingHeader from "../../components/processing-header";
import grass from "../../assets/grass2.png";
import { useNavigate } from "react-router-dom";
import CustomCursor from "../../components/customCursor";
/**
 * Conclusion page that displays the reality of air quality impact.
 * Shows statistics and facts about air pollution, with options to restart or share.
 */
const ConclusionPage = () => {
  const navigate = useNavigate();

  const handleRestart = useCallback(() => {
    navigate("/");
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
    <>
      <CustomCursor />
      <Box
        sx={{
          position: "relative",
          zIndex: 210,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ProcessingHeader
          currentStep={4}
          prevRoute="/microview"
          nextRoute="/"
        />
      </Box>
      <Box
        component="main"
        role="main"
        sx={{
          minHeight: "100vh",
          minWidth: "100vw",
          background: "linear-gradient(180deg, #6CB2CE 0%, #FFFFFF 72%)",
          backgroundOpacity: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          px: { xs: 2, sm: 4 },
          py: 4,
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.80)",
            zIndex: 20,
            borderRadius: 2,
            padding: { xs: 2, sm: 3, md: 4 },
            flex: 1,
            width: { xs: "95%", sm: "85%", md: "75%", lg: "70%" },
            maxWidth: "1200px",
            gap: { xs: 2, sm: 3, md: 4 },
            mt: { xs: 2, sm: 3, md: 4 },
            boxSizing: "border-box",
            overflow: "hidden",
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
                fontFamily: "Raleway",
                color: "#000000",
                mb: { xs: 1, sm: 2 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                wordWrap: "break-word",
                overflowWrap: "break-word",
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
                color: "#000000",
                fontFamily: "Raleway",
                mr: { xs: 0, sm: 2, md: 6 },
                ml: { xs: 0, sm: 2, md: 6 },
                px: { xs: 1, sm: 2 },
                fontSize: {
                  xs: "1.5rem",
                  sm: "2rem",
                  md: "2.5rem",
                  lg: "3rem",
                },
                lineHeight: 1.2,
                wordWrap: "break-word",
                overflowWrap: "break-word",
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
              gap: 1,
              width: "100%",
              maxWidth: { xs: "100%", sm: "90%", md: "80%", lg: "70%" },
              fontFamily: "Raleway",
              mx: "auto",
              px: { xs: 1, sm: 2 },
              mb: 2,
              boxSizing: "border-box",
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
                    fontFamily: "Raleway",
                    color: "#000000",
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    gap: 1,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    width: "100%",
                  }}
                >
                  <span style={{ marginRight: "8px", flexShrink: 0 }}>→</span>
                  <span style={{ flex: 1 }}>{point}</span>
                </Typography>
              </motion.div>
            ))}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "Raleway", color: "#000000", fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" }, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", textAlign: "center", gap: 1, wordWrap: "break-word", overflowWrap: "break-word", width: "100%" }}>
            How often does your friends or family think about air? <br /> The right to clean air is universal.             </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: { xs: 2, sm: 3 },
              width: "100%",
              justifyContent: "center",
              flexWrap: "wrap",
              mt: { xs: 2, sm: 3, md: 4 },
              px: { xs: 1, sm: 2 },
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Button
                variant="outlined"
                sx={{
                  borderColor: "#0D6485",
                  borderWidth: 2,
                  color: "#000000",
                  backgroundColor: "#FFFFFF",
                  px: { xs: 2, sm: 3, md: 4 },
                  py: { xs: 1, sm: 1.25, md: 1.5 },
                  fontSize: { xs: "0.875rem", sm: "0.9375rem", md: "1rem" },
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#0982B1",
                    borderWidth: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
                aria-label="Restart the experience"
                onClick={handleRestart}
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
                  backgroundColor: "#5AD1FF",
                  color: "#000000",
                  px: { xs: 2, sm: 3, md: 4 },
                  py: { xs: 1, sm: 1.25, md: 1.5 },
                  fontSize: { xs: "0.875rem", sm: "0.9375rem", md: "1rem" },
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "#88DEFF",
                  },
                }}
                aria-label="Share with others"
              >
                Share with others
              </Button>
            </motion.div>
          </Box>
        </Box>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: { xs: "32vh", sm: "38vh", md: "60vh" },
            backgroundImage: `url(${grass})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            zIndex: 10,
          }}
        />
      </Box>
    </>
  );
};

export default ConclusionPage;
