import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "store";
import { restoreSession } from 'components/auth/auth.thunk';
import AppWithTheme from "./AppWithTheme";

// Attempt to restore session from httpOnly refresh cookie on startup
store.dispatch<any>(restoreSession());

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<AppWithTheme />
		</Provider>
	</StrictMode>
);
