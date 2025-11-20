import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useCity } from "../../providers/use-city";
import grass from "../../assets/grass2.png";
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
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 6, sm: 8 },
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #6CB2CE 0%, #FFFFFF 72%)",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          width: "100%",
          maxWidth: { xs: 520, sm: 640, md: 720 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: { xs: 10, sm: 4, md: 35},
          gap: { xs: 3, sm: 4 },
          zIndex: 12,
        }}
      >
        <Typography
          ref={headingRef}
          component="h1"
          color="#000000"
          sx={{
            fontFamily: 'Antipol-Bold',
            fontSize: { xs: "2.25rem", sm: "3rem", md: "4.5rem" },
            letterSpacing: { xs: 0.5, sm: 1 },
          }}
        >
          {Array.from("What's in your air?").map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              initial={{ opacity: 0 }}
              animate={isHeadingInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </Typography>

        <Box
          sx={{
            width: "80%",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: 9999,
            boxShadow: "0px 16px 40px rgba(41, 89, 120, 0.18)",
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1, sm: 1.25 },
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <InputBase
            value={cityQuery}
            onChange={handleCityChange}
            placeholder="Enter your city to begin"
            autoFocus
            fullWidth
            inputProps={{
              "aria-label": "City search input",
            }}
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem", md: "1.25rem" },
              fontWeight: 500,
              color: "#1C1C1E",
              "& input::placeholder": {
                color: "#8E8E93",
                opacity: 1,
              },
            }}
          />
          <IconButton
            type="submit"
            aria-label="Submit city search"
            disabled={!isSubmitVisible || isFetching}
            sx={{
              border: "2px solid rgba(108, 178, 206, 0.5)",
              borderRadius: "50%",
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              color: "#4A7EA8",
              backgroundColor: "#ffffff",
              transition: "transform 0.2s ease, background 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(108, 178, 206, 0.12)",
                transform: "translateX(2px)",
              },
              "&:disabled": {
                opacity: 0.4,
                transform: "none",
                backgroundColor: "#ffffff",
              },
            }}
          >
            {isFetching ? (
              <CircularProgress size={22} sx={{ color: "#4A7EA8" }} />
            ) : (
              <ArrowForwardIcon
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                }}
              />
            )}
          </IconButton>
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: 420 },
              borderRadius: 3,
              bgcolor: "rgba(239, 68, 68, 0.9)",
              color: "#ffffff",
            }}
          >
            {errorMessage}
          </Alert>
        )}
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
          zIndex: 5,
        }}
      />
    </Box>
  );
};

export default LandingPage;
