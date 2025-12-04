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
          transform: "translate(-50%, -50%) !important",
          width: { xs: "80%", sm: "70%", md: "55%" },
          height: { xs: "80%", sm: "70%", md: "85%" },
          bgcolor: "background.paper",
          overflowY: "auto",
          boxShadow: 24,
          p: 2,
          borderRadius: 5,
          outline: "none",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            left: 20,
            top: 20,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon sx={{ fontSize: 30, color: "#000000" }} />
        </IconButton>

        <Typography
          id="about-modal-title"
          variant="h5"
          component="h2"
          align="center"
          sx={{
            mt: 6,
            mb: 5,
            fontFamily: "Raleway",
            fontSize: { xs: "1.5rem", sm: "1.5rem", md: "1.8rem" },
            fontWeight: 600,
          }}
        >
          About Pollutant Playground
        </Typography>
        <Box sx={{ width: "80%", mx: "auto" }}>
          <Typography
            id="about-modal-subtitle"
            variant="body1"
            component="h2"
            align="left"
            sx={{
              mb: 4,
              fontFamily: "Raleway",
              fontSize: { xs: "1rem", sm: "1rem", md: "1.8rem" },
              fontWeight: 400,
            }}
          >
            In 2025, over 150 million people in the United States breathe
            unhealthy air.
          </Typography>

          <Typography
            id="about-modal-description"
            align="left"
            sx={{
              fontFamily: "Raleway",
              fontWeight: 500,
              fontSize: { xs: "0.875rem", sm: "0.85rem", md: "1rem" },
              lineHeight: 2,
            }}
          >
            The{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>
              <a
                href="https://www.lung.org/media/press-releases/state-of-the-air-2025"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#000000" }}
              >
                American Lung Association
              </a>
            </span>
            {' '}found that 46% of Americans live in areas that received an “F” grade
            for either ozone or particle pollution.
            <br />
            <br />
            The air pollutants that Pollutant Playground explores, while
            colorful in our visualizations, impact{" "}
            <span style={{ fontWeight: 800 }}>everyone’s health</span>. Air
            quality affects everyone, but most people don't understand what
            they're breathing. We break down the AQI into its parts—making
            pollution visible, understandable, and actionable.
            <br />
            <br />
            This experience reveals the invisible particles that make up air
            quality. Explore what you're breathing, where it comes from, and
            what it means for your health.
          </Typography>

          <Typography
              id="about-modal-description"
            align="center"
            sx={{
              fontFamily: "Raleway",
              marginTop: 5,
              marginBottom: 5,
              fontWeight: 700,
              fontSize: { xs: "0.875rem", sm: "0.875rem", md: "1rem" },
              lineHeight: 2,
              color: "#626262",
            }}
          >Programmed by Ramya Samudrala, Designed by Natalie and Christine.</Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default AboutModal;
