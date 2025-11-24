import React from "react";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="about-modal-title"
      aria-describedby="about-modal-description"
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, type: "tween" }}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) !important", // Override default transform because framer-motion handles it
          width: { xs: "90%", sm: "80%", md: "70%" },
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          outline: "none",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            left: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography
          id="about-modal-title"
          variant="h5"
          component="h2"
          align="center"
          sx={{
            mb: 4,
            fontFamily: "Inter",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          About Pollutant Playground
        </Typography>

        <Typography
          id="about-modal-subtitle"
          variant="body1"
          component="h2"
          align="left"
          sx={{ mb: 4, fontFamily: "Inter", fontSize: { xs: "1rem", sm: "1rem", md: "1.8rem" }, fontWeight: 400 }}
        >
          In 2025, over 150 million people in the United States breathe
          unhealthy air.
        </Typography>

        <Typography
          id="about-modal-description"
          align="left"
          sx={{
            fontFamily: "Inter",
            fontSize: "1rem",
            lineHeight: 2,
          }}
        >
          The <span style={{ textDecoration: "underline" }}><a href="https://www.lung.org/media/press-releases/state-of-the-air-2025" target="_blank" rel="noopener noreferrer">American Lung Association </a></span> 
          found that 46% of Americans live in areas that received an “F” grade for either ozone or particle
          pollution.
          <br />
          <br />
          The air pollutants that Pollutant Playground explores,
          while colorful in our visualizations, impact <span style={{ fontWeight: 600 }}>everyone’s health</span>. Air
          quality affects everyone, but most people don't understand what
          they're breathing. We break down the AQI into its parts—making
          pollution visible, understandable, and actionable. 
          
          <br />
          <br />
          This experience reveals the invisible particles that make up air quality. Explore what
          you're breathing, where it comes from, and what it means for your
          health.
        </Typography>
      </Box>
    </Modal>
  );
};

export default AboutModal;
