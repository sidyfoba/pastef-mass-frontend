import { createTheme } from "@mui/material/styles";

// PASTEF-inspired palette (green + red + optional yellow accent)
// Based on common logo usage: green + red. :contentReference[oaicite:1]{index=1}
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1B5E20", // deep green
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#B71C1C", // deep red
      contrastText: "#FFFFFF",
    },
    // optional accent (Senegal vibe)
    warning: {
      main: "#FBC02D", // warm yellow
      contrastText: "#1A1A1A",
    },
    background: {
      default: "#F6F7F9",
      paper: "#FFFFFF",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ["Roboto", "system-ui", "Segoe UI", "Arial"].join(","),
    h4: { fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 18 },
      },
    },
  },
});
