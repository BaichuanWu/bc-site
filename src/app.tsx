import RootRoutes from 'Src/renderer/router';
import { createTheme, ThemeProvider } from "bc-lumen/src";
import {Provider} from 'react-redux'
import {store} from 'Src/renderer/store'
import {MessageProvider} from 'bc-lumen/src/components/message'

const App = () => {
  const theme = createTheme({  colorSchemes: {
    dark: true,
  },})
  return (
    <Provider store={store}>
      <MessageProvider maxSnack={3}>
    <ThemeProvider theme={theme}>
      <RootRoutes />
    </ThemeProvider>
    </MessageProvider>
    </Provider>
  );
}

export default App;

