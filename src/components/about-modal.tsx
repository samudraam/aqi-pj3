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
          width: { xs: "90%", sm: 400 },
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
            right: 8,
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
            mb: 2,
            fontFamily: "Antipol-Bold",
            fontSize: "1.5rem",
          }}
        >
          About
        </Typography>

        <Typography
          id="about-modal-description"
          align="center"
          sx={{
            fontFamily: "Inter",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          An interactive learning experience about air quality and the ways it
          affects us created for Conditional Design @ WashU by Natalie,
          Christine, and Ramya.
        </Typography>
      </Box>
    </Modal>
  );
};

export default AboutModal;
