import React from "react"
import ReactDOM from "react-dom/client"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import App from "./App.jsx"

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4fffdb", contrastText: "#0d0d1a" },
    secondary: { main: "#a78bfa" },
    background: { default: "#0d0d1a", paper: "#151525" },
    text: { primary: "#eef0f8", secondary: "#a5a7bd" },
    divider: "rgba(255,255,255,0.12)",
  },
  typography: {
    fontFamily: '"DM Sans", Arial, sans-serif',
    h1: { fontFamily: "Syne, Arial, sans-serif", fontWeight: 800, letterSpacing: "-0.045em" },
    h2: { fontFamily: "Syne, Arial, sans-serif", fontWeight: 750, letterSpacing: "-0.035em" },
    h3: { fontFamily: "Syne, Arial, sans-serif", fontWeight: 700, letterSpacing: "-0.025em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44, borderRadius: 11 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
