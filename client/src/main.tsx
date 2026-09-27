import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "store";
import { restoreSession } from 'components/auth/auth.thunk';
import "./i18n";
import AppWithTheme from "./AppWithTheme";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
// Arabic subset only: downloaded when Arabic text is on screen.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "./styles/app.css";

// Attempt to restore session from httpOnly refresh cookie on startup
store.dispatch<any>(restoreSession());

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<AppWithTheme />
		</Provider>
	</StrictMode>
);
