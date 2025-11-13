import { useEffect, useRef } from "react";
import { useCity } from "../../providers/use-city";

/**
 * Placeholder for cost-based visualization.
 * This sketch will visualize the economic impact and costs associated with air quality.
 */
const CostSketch = () => {
  const sketchRef = useRef<HTMLDivElement | null>(null);
  const { airQualityDetails } = useCity();

  useEffect(() => {
    // TODO: Implement p5.js sketch for cost visualization
    // This will show economic impacts, health costs, or other
    // cost-related data based on the airQualityDetails
  }, [airQualityDetails]);

  return (
    <div
      ref={sketchRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2d1b3d",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: "1.5rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Cost Mode</h2>
        <p style={{ fontSize: "1rem", opacity: 0.7 }}>
          Visualization Coming Soon
        </p>
        {airQualityDetails && (
          <div style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.5 }}>
            <p>City: {airQualityDetails.cityName}</p>
            <p>AQI: {airQualityDetails.aqi ?? "N/A"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostSketch;
