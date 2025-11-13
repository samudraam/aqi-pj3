import { Box, Typography, Fab } from "@mui/material";
import { motion } from "motion/react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Success page displayed after clearing the mist.
 */
const MorePage = () => {
  const navigate = useNavigate();
  const handleNavigateNext = useCallback(() => {
    navigate("/multi-sketch");
  }, [navigate]);

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        bgcolor: "#56c853",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 400,
            color: "#ffffff",
            maxWidth: 420,
          }}
        >
          Now that you know more, let’s explore the ways air quality affects
          your life{" "}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        <Fab
          color="success"
          aria-label="Show results"
          onClick={handleNavigateNext}
          sx={{
            width: 72,
            height: 72,
            backgroundColor: "#1c8c3a",
            "&:hover": { backgroundColor: "#0b521e" },
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: 36 }} />
        </Fab>
      </motion.div>
    </Box>
  );
};

export default MorePage;
