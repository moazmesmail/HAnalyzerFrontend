import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f4b99"
    },
    secondary: {
      main: "#607d3b"
    },
    background: {
      default: "#f7f8fa"
    }
  },
  shape: {
    borderRadius: 6
  }
});
