import { Box, Typography } from "@mui/material";

/**
 * AQI color segments matching the gradient from green to purple
 * Each segment represents one AQI level (1-5)
 */
const AQI_SEGMENTS = [
  {
    level: 1,
    label: "Good",
    colors: {
      start: "#ADFF2F", // Bright lime green
      end: "#9ACD32", // Yellowish-green/olive
    },
  },
  {
    level: 2,
    label: "Fair",
    colors: {
      start: "#DAA520", // Yellowish-brown/gold
      end: "#CD853F", // Warm orange/terracotta
    },
  },
  {
    level: 3,
    label: "Moderate",
    colors: {
      start: "#FF4500", // Bright orange-red
      end: "#FF0000", // Pure red
    },
  },
  {
    level: 4,
    label: "Poor",
    colors: {
      start: "#DC143C", // Deep red/crimson
      end: "#FF1493", // Dark magenta/fuchsia
    },
  },
  {
    level: 5,
    label: "Very Poor",
    colors: {
      start: "#8B008B", // Dark magenta
      end: "#4B0082", // Royal purple/indigo
    },
  },
] as const;

interface AqiSliderProps {
  /**
   * Current AQI value (1-5)
   */
  aqi: number | null | undefined;
  /**
   * Optional custom width for the slider
   */
  width?: string | number;
}

/**
 * AQI Slider Component
 * Displays a horizontal color gradient slider representing AQI levels (1-5)
 * with arrows underneath each segment and an indicator for the current AQI value
 */
export const AqiSlider = ({ aqi, width = "100%" }: AqiSliderProps) => {
  const maxWidth = typeof width === "number" ? `${width}px` : width;
  const currentAqi = aqi ?? null;
  const currentLevel =
    currentAqi && currentAqi >= 1 && currentAqi <= 5 ? currentAqi : null;
  const segmentPercent = 100 / AQI_SEGMENTS.length;

  /**
   * Calculates the position percentage for the current AQI indicator
   * Positioned at the center of each segment
   */
  const getIndicatorPosition = (): number => {
    if (!currentLevel) return 0;
    return (currentLevel - 1) * segmentPercent + segmentPercent / 2;
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {/* Color Gradient Slider */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "24px", sm: "28px", md: "32px" },
          borderRadius: "4px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Color Segments */}
        {AQI_SEGMENTS.map((segment, index) => (
          <Box
            key={segment.level}
            sx={{
              position: "absolute",
              left: `${index * segmentPercent}%`,
              width: `${segmentPercent}%`,
              height: "100%",
              background: `linear-gradient(to right, ${segment.colors.start}, ${segment.colors.end})`,
              borderRight:
                index < AQI_SEGMENTS.length - 1 ? "2px solid #000000" : "none",
            }}
          />
        ))}

        {/* Current AQI Indicator Arrow */}
        {currentLevel && (
          <Box
            sx={{
              position: "absolute",
              left: `${getIndicatorPosition()}%`,
              top: "-8px",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                width: 0,
                height: 0,
                borderLeft: { xs: "5px solid transparent", md: "6px solid transparent" },
                borderRight: { xs: "5px solid transparent", md: "6px solid transparent" },
                borderTop: { xs: "7px solid #000000", md: "8px solid #000000" },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Arrow Indicators Under Each Segment */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingX: "2px",
        }}
      >
        {AQI_SEGMENTS.map((segment) => {
          const isActive = currentLevel === segment.level;
          return (
            <Box
              key={segment.level}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                gap: "0.25rem",
              }}
            >
              {/* Arrow pointing up */}
              <Box
                sx={{
                  width: 0,
                  height: 0,
                  borderLeft: { xs: "3px solid transparent", md: "4px solid transparent" },
                  borderRight: { xs: "3px solid transparent", md: "4px solid transparent" },
                  borderBottom: {
                    xs: `5px solid ${
                      isActive ? "#000000" : "rgba(0, 0, 0, 0.3)"
                    }`,
                    md: `6px solid ${
                      isActive ? "#000000" : "rgba(0, 0, 0, 0.3)"
                    }`,
                  },
                  transition: "border-bottom-color 0.2s ease",
                }}
              />
              {/* Label */}
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: isActive ? 800 : 400,
                  color: isActive ? "#000000" : "rgba(0, 0, 0, 0.6)",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {segment.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
