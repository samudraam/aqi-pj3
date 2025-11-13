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
import grass from "../../assets/grass.png";
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
        backgroundImage: `url(${grass})`,
        backgroundSize: { xs: "320%", sm: "105%" },
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          width: "100%",
          maxWidth: 900,
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
          color="#000000"
          sx={{
            fontWeight: 400,
            letterSpacing: 0.5,
            pb: { xs: 2, sm: 8 },
          }}
        >
          {Array.from("Learn about").map((letter, index) => (
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
        <Box
          sx={{
            width: "100%",
            maxWidth: 800,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderBottom: "4px solid rgb(0, 0, 0)",
            pb: 1.5,
          }}
        >
          <InputBase
            value={cityQuery}
            onChange={handleCityChange}
            placeholder="Your city"
            autoFocus
            fullWidth
            inputProps={{
              "aria-label": "City search input",
              style: {
                textTransform: "uppercase",
                textAlign: "center",
                fontWeight: 400,
                letterSpacing: 1,
                fontFamily: "'Alloy Ink', sans-serif",
              },
            }}
            sx={{
              flex: 1,
              fontSize: { xs: "5rem", sm: "6.75rem" },
              textAlign: "center",
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#000000",
              fontFamily: "'Alloy Ink', sans-serif",
              "& input::placeholder": {
                color: "rgba(0, 0, 0)",
                opacity: 1,
                fontFamily: "'Alloy Ink', sans-serif",
              },
            }}
          />
          <IconButton
            type="submit"
            aria-label="Submit city search"
            disabled={!isSubmitVisible || isFetching}
            sx={{
              border: "5px solid rgb(0, 0, 0)",
              width: 86,
              height: 86,
              color: "#000000",
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.08)" },
            }}
          >
            {isFetching ? (
              <CircularProgress size={24} sx={{ color: "#000000" }} />
            ) : (
              <ArrowForwardIcon sx={{ color: "#000000", fontSize: { xs: "2rem", sm: "3.75rem" }}} />
            )}
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "#000000", letterSpacing: 1, mt: -1 }}
        >
          Enter to complete
        </Typography>
        {errorMessage && (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 3,
              bgcolor: "rgba(239, 68, 68, 0.85)",
              color: "#ffffff",
              mt: 1,
            }}
          >
            {errorMessage}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default LandingPage;
