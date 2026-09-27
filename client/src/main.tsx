import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "store";
import { restoreSession } from 'components/auth/auth.thunk';
import { authFailed, loginSuccess } from 'components/auth/auth.reducers';
import { onSession } from 'helpers/http';
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

// Older versions kept the access token and the user in localStorage; remove
// them so an XSS cannot read a session left behind (ADR 0002).
try {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	const persisted = localStorage.getItem('persist:root');
	if (persisted) {
		const state = JSON.parse(persisted);
		delete state.auth;
		localStorage.setItem('persist:root', JSON.stringify(state));
	}
} catch {
	/* storage unavailable */
}

// Keep the store in step with token refreshes done by the HTTP layer.
onSession({
	refreshed: (data) => store.dispatch(loginSuccess(data)),
	ended: () => store.dispatch(authFailed()),
});

// Attempt to restore session from httpOnly refresh cookie on startup
store.dispatch<any>(restoreSession());

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<AppWithTheme />
		</Provider>
	</StrictMode>
);
