import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { theme } from "theme/theme.ts";
import router from "routes/router";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { store } from "store";
// import { PersistGate } from "redux-persist/integration/react";
import { restoreSession } from 'components/auth/auth.thunk';

// Attempt to restore session from httpOnly refresh cookie on startup
store.dispatch<any>(restoreSession());

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			{/* <PersistGate loading={null} persistor={persistor}> */}
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<RouterProvider router={router} />
			</ThemeProvider>
			{/* </PersistGate> */}
		</Provider>
	</StrictMode>
);
