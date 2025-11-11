import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useCity } from "../../providers/use-city";

/**
 * Landing hero for city search.
 */
const LandingPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { cityQuery, setCityQuery, fetchCityAirQuality, isFetching } =
    useCity();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const isHeadingInView = useInView(headingRef, { once: true });
  const isSubmitVisible = cityQuery.trim().length > 0;

  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCityQuery(event.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCity = cityQuery.trim();
    if (!trimmedCity) {
      setErrorMessage("Please enter a city name.");
      return;
    }

    const result = await fetchCityAirQuality(trimmedCity);
    if (result.success) {
      setErrorMessage(null);
      navigate("/mist");
      return;
    }

    setErrorMessage(result.error);
  };

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: "#56c853",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Typography
          ref={headingRef}
          component="h1"
          variant="h4"
          align="center"
          color="#ffffff"
          sx={{
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          {Array.from("Learn more about your city!").map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              initial={{ opacity: 0 }}
              animate={isHeadingInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              {letter}
            </motion.span>
          ))}
        </Typography>
        <TextField
          aria-label="City search input"
          placeholder="Search for a city"
          value={cityQuery}
          onChange={handleCityChange}
          fullWidth
          variant="outlined"
          inputProps={{
            tabIndex: 0,
          }}
          error={Boolean(errorMessage)}
          helperText={errorMessage ?? " "}
          FormHelperTextProps={{
            sx: { textAlign: "center", color: "#fef2f2" },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 9999,
              backgroundColor: "#ffffff",
              fontSize: "1.125rem",
              px: 2,
            },
            "& .MuiOutlinedInput-input": {
              py: 1.25,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d1d5db",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#93c5fd",
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "#2563eb",
              },
          }}
        />
        {errorMessage && (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              borderRadius: 3,
              bgcolor: "rgba(239, 68, 68, 0.85)",
              color: "#ffffff",
            }}
          >
            {errorMessage}
          </Alert>
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: isSubmitVisible ? 1 : 0,
            y: isSubmitVisible ? 0 : 8,
          }}
          transition={{ duration: 0.3 }}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            pointerEvents: isSubmitVisible ? "auto" : "none",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            aria-label="Submit city search"
            tabIndex={isSubmitVisible ? 0 : -1}
            disabled={!isSubmitVisible || isFetching}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 9999,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              bgcolor: "#1c8c3a",
              "&:hover": {
                bgcolor: "#0b521e",
              },
            }}
          >
            {isFetching ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LandingPage;
