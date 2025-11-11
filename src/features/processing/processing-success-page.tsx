import { Box, Typography } from "@mui/material";

/**
 * Success page displayed after clearing the mist.
 */
const ProcessingSuccessPage = () => (
  <Box
    component="main"
    role="main"
    sx={{
      minHeight: "100vh",
      minWidth: "100vw",
      bgcolor: "#56c853",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
    }}
  >
    <Typography
      variant="h4"
      align="center"
      sx={{
        fontWeight: 600,
        color: "#ffffff",
        maxWidth: 420,
      }}
    >
      Good job! Now, what was in that mist anyway...
    </Typography>
  </Box>
);

export default ProcessingSuccessPage;
