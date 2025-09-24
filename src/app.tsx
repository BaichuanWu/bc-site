import RootRoutes from 'Src/renderer/router';
import { createTheme, ThemeProvider } from "bc-lumen/src";

const App = () => {
  const theme = createTheme({  colorSchemes: {
    dark: true,
  },})
  return (
    <ThemeProvider theme={theme}>
      <RootRoutes />
    </ThemeProvider>
  );
}

export default App;

