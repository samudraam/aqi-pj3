import { memo, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';

const PROCESSING_STEPS = [
  { id: "discover", label: "Discover" },
  { id: "aqi", label: "AQI" },
  { id: "macro", label: "Macro View" },
  { id: "micro", label: "Micro View" },
  { id: "end", label: "End" },
] as const;

const ACTIVE_STROKE = "#4D4C4E";
const INACTIVE_STROKE = "#E7EFF4";
const ARROW_COLOR = "#1E1E1E";
const ARROW_DISABLED = "#9CA3AF";

type ProcessingHeaderProps = {
  currentStep: number;
  nextRoute?: string;
  prevRoute?: string;
};

type ArrowButtonProps = {
  direction: "left" | "right";
  isDisabled: boolean;
  label: string;
  onActivate: () => void;
};

type StepIndicatorProps = {
  isActive: boolean;
  isCurrent: boolean;
  label: string;
};

/**
 * Navigation arrows that move between processing sections.
 */
const ArrowButton = memo(
  ({ direction, isDisabled, label, onActivate }: ArrowButtonProps) => {
    const handleClick = () => {
      if (isDisabled) {
        return;
      }
      onActivate();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    };

    return (
      <Box
        component="button"
        type="button"
        aria-label={label}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        sx={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          border: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.3 : 1,
          transition: "opacity 200ms ease",
          "&:hover": {
            opacity: isDisabled ? 0.3 : 0.7,
          },
          "&:focus-visible": {
            outline: "2px solid #0f172a",
            outlineOffset: "4px",
          },
        }}
      >
        {direction === "left" ? (
          <WestIcon
            sx={{
              fontSize: 28,
              color: isDisabled ? ARROW_DISABLED : ARROW_COLOR,
            }}
          />
        ) : (
          <EastIcon
            sx={{
              fontSize: 28,
              color: isDisabled ? ARROW_DISABLED : ARROW_COLOR,
            }}
          />
        )}
      </Box>
    );
  }
);
ArrowButton.displayName = "ProcessingHeaderArrowButton";

/**
 * Individual progress indicator that mirrors the provided design.
 */
const StepIndicator = memo(
  ({ isActive, isCurrent, label }: StepIndicatorProps) => {
    const strokeColor = isActive ? ACTIVE_STROKE : INACTIVE_STROKE;

    return (
      <Box
        role="listitem"
        aria-current={isCurrent ? "step" : undefined}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          textAlign: "center",
        }}
      >
        <svg
          width="89"
          height="12"
          viewBox="0 0 89 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="6"
            y1="6"
            x2="83"
            y2="6"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontFamily: "Inter",
            color: isActive ? "#1F1F1F" : "#4B4B4F",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  }
);
StepIndicator.displayName = "ProcessingHeaderStepIndicator";

/**
 * Top-level navigation header for the processing flow.
 */
const ProcessingHeaderComponent = ({
  currentStep,
  nextRoute,
  prevRoute,
}: ProcessingHeaderProps) => {
  const navigate = useNavigate();

  const clampedStep = useMemo(() => {
    if (currentStep < 0) {
      return 0;
    }
    if (currentStep >= PROCESSING_STEPS.length) {
      return PROCESSING_STEPS.length - 1;
    }
    return currentStep;
  }, [currentStep]);

  const handleNavigate = (target?: string) => {
    if (!target) {
      return;
    }
    navigate(target);
  };

  const handleNextClick = () => {
    handleNavigate(nextRoute);
  };

  const handlePreviousClick = () => {
    handleNavigate(prevRoute);
  };

  return (
    <Box
      component="section"
      role="navigation"
      aria-label="Processing steps navigation"
      sx={{
        width: "100%",
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
        px: { xs: 2.5, md: 4 },
        py: { xs: 2.5, md: 4 },
        bgcolor: "#5AD1FF",
        //boxShadow: "0px 15px 35px rgba(0,0,0,0.35)",
      }}
    >
      <Box sx={{ width: 48, display: "flex", justifyContent: "flex-start" }}>
        <ArrowButton
          direction="left"
          isDisabled={!prevRoute}
          label="Go to previous section"
          onActivate={handlePreviousClick}
        />
      </Box>
      <Box
        role="list"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          columnGap: { xs: 3, md: 5 },
          rowGap: 1.5,
          flexWrap: { xs: "wrap", sm: "nowrap" },
          flex: 1,
        }}
      >
        {PROCESSING_STEPS.map((step, index) => (
          <StepIndicator
            key={step.id}
            label={step.label}
            isActive={index <= clampedStep}
            isCurrent={index === clampedStep}
          />
        ))}
      </Box>
      <Box sx={{ width: 48, display: "flex", justifyContent: "flex-end" }}>
        <ArrowButton
          direction="right"
          isDisabled={!nextRoute}
          label="Go to next section"
          onActivate={handleNextClick}
        />
      </Box>
    </Box>
  );
};

const ProcessingHeader = memo(ProcessingHeaderComponent);
ProcessingHeader.displayName = "ProcessingHeader";

export default ProcessingHeader;
