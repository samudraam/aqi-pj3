import { Box } from "@mui/material";
import { motion } from "framer-motion";

interface TimelineStep {
  id: string;
  label: string;
  path: string;
  cx: number;
  cy: number;
}

const RADIUS = 18.5474;

const timelineSteps: TimelineStep[] = [
  { id: "discover", label: "Discover", path: "/mist", cx: 21.0474, cy: 20.0474 },
  { id: "aqi", label: "AQI", path: "/aqi", cx: 157.379, cy: 20.0474 },
  { id: "macro", label: "Macro View", path: "/mist/success", cx: 294.801, cy: 20.0474 },
  { id: "micro", label: "Micro View", path: "/examine", cx: 434.862, cy: 20.0474 },
  { id: "end", label: "End", path: "/more", cx: 574.67, cy: 20.0474 },
];

interface TimelineProps {
  currentStep: string;
}

const Timeline = ({ currentStep }: TimelineProps) => {
  const currentIndex = Math.max(
    0,
    timelineSteps.findIndex((s) => s.id === currentStep)
  );

  return (
    <Box
      component="nav"
      aria-label="Experience timeline"
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        py: 1.5,
        px: { xs: 2, sm: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "50%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg
          width="595"
          height="100"
          viewBox="0 0 595 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "auto" }}
        >
          {/* Lines between circles, shortened so they don't go under circles */}
          {timelineSteps.map((step, index) => {
            if (index === timelineSteps.length - 1) return null;
            const next = timelineSteps[index + 1];
            const isCompletedSegment = index < currentIndex;

            return (
              <line
                key={`line-${index}`}
                x1={step.cx + RADIUS}
                y1={step.cy}
                x2={next.cx - RADIUS}
                y2={next.cy}
                stroke={isCompletedSegment ? "black" : "black"}
                strokeWidth="3"
              />
            );
          })}

          {/* Circles + labels */}
          {timelineSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <g key={step.id}>
                <motion.circle
                  cx={step.cx}
                  cy={step.cy}
                  r={RADIUS}
                  stroke="black"
                  strokeWidth="3"
                  initial={false}
                  animate={{
                    fill: isCompleted ? "#000000" : "none", 
                    scale: isCurrent ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3, type: "tween" }}
                />
                <text
                  x={step.cx+3}
                  y={step.cy + 40}
                  textAnchor="middle"
                  fontFamily= "Inter"
                  fontWeight={500}
                  fontSize="11.5"
                  fill="#000000"
                >
                  {step.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Box>
  );
};

export default Timeline;
