import { useState, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useCity } from "../../providers/use-city";
import ProcessingSketch from "./processing-sketch";
import CostSketch from "./cost-sketch";

type VisualizationMode = "visibility" | "particles" | "cost";

interface ModeConfig {
  id: VisualizationMode;
  label: string;
  component: React.ComponentType;
}

const VISUALIZATION_MODES: ModeConfig[] = [
  { id: "visibility", label: "Visibility Mode", component: ProcessingSketch },
  { id: "cost", label: "Cost Mode", component: CostSketch },
];

/**
 * Multi-sketch page that allows switching between different visualizations
 * and searching for cities to update the air quality data.
 */
const MultiSketchPage = () => {
  const [selectedMode, setSelectedMode] =
    useState<VisualizationMode>("visibility");
  const [localCityInput, setLocalCityInput] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { fetchCityAirQuality, airQualityDetails, isFetching } = useCity();

  const isMenuOpen = Boolean(anchorEl);
  const currentModeConfig =
    VISUALIZATION_MODES.find((mode) => mode.id === selectedMode) ||
    VISUALIZATION_MODES[0];
  const SketchComponent = currentModeConfig.component;

  /**
   * Opens the mode selection dropdown menu
   */
  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Closes the mode selection dropdown menu
   */
  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  /**
   * Handles mode selection from the dropdown
   */
  const handleModeSelect = useCallback(
    (mode: VisualizationMode) => {
      setSelectedMode(mode);
      handleCloseMenu();
    },
    [handleCloseMenu]
  );

  /**
   * Handles city input changes
   */
  const handleCityInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLocalCityInput(event.target.value);
    },
    []
  );

  /**
   * Handles city search submission (Enter key)
   */
  const handleCitySearch = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        const trimmedCity = localCityInput.trim();
        if (trimmedCity) {
          await fetchCityAirQuality(trimmedCity);
        }
      }
    },
    [localCityInput, fetchCityAirQuality]
  );

  return (
    <Box
      component="main"
      role="main"
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sketch Visualization */}
      <SketchComponent />

      {/* Search Input - Top Center */}
      <Box
        sx={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          width: "90%",
          maxWidth: 480,
        }}
      >
        <TextField
          placeholder="City, State"
          value={localCityInput}
          onChange={handleCityInputChange}
          onKeyDown={handleCitySearch}
          disabled={isFetching}
          fullWidth
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ color: "#666" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              fontSize: "1.125rem",
              backdropFilter: "blur(10px)",
            },
            "& .MuiOutlinedInput-input": {
              py: 1.5,
              px: 2,
              textAlign: "center",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.5)",
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "rgba(255, 255, 255, 0.7)",
              },
          }}
        />
      </Box>

      {/* Mode Selector Dropdown - Top Left */}
      <Box
        sx={{
          position: "fixed",
          top: 24,
          left: 24,
          zIndex: 100,
        }}
      >
        <Box
          onClick={handleOpenMenu}
          role="button"
          tabIndex={0}
          aria-label="Select visualization mode"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleOpenMenu(e as unknown as React.MouseEvent<HTMLElement>);
            }
          }}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            padding: "12px 20px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 180,
            userSelect: "none",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 1)",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333",
              flex: 1,
            }}
          >
            {currentModeConfig.label}
          </Typography>
          <ArrowDropDownIcon sx={{ color: "#666" }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              minWidth: 180,
              mt: 1,
            },
          }}
        >
          <MenuItem
            disabled
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#999",
              "&.Mui-disabled": {
                opacity: 1,
              },
            }}
          >
            Select Mode
          </MenuItem>
          {VISUALIZATION_MODES.map((mode) => (
            <MenuItem
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              selected={selectedMode === mode.id}
              sx={{
                fontSize: "1rem",
                py: 1.5,
                "&.Mui-selected": {
                  backgroundColor: "rgba(86, 200, 83, 0.15)",
                  "&:hover": {
                    backgroundColor: "rgba(86, 200, 83, 0.25)",
                  },
                },
              }}
            >
              {mode.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* City Info Display - Optional */}
      {airQualityDetails && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography sx={{ fontSize: "0.875rem", opacity: 0.7 }}>
            {airQualityDetails.cityName}
            {airQualityDetails.state && `, ${airQualityDetails.state}`}
          </Typography>
          <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
            AQI: {airQualityDetails.aqi ?? "N/A"} - {airQualityDetails.aqiLabel}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MultiSketchPage;
