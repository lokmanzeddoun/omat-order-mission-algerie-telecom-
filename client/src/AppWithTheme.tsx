import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getTheme } from "theme/theme";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { RootState } from "store/rootReducer";
import router from "routes/router";

// Theme wrapper component that uses Redux state
const AppWithTheme = () => {
	const themeMode = useSelector((state: RootState) => state.theme.mode);
	const theme = useMemo(() => getTheme(themeMode), [themeMode]);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<RouterProvider router={router} />
		</ThemeProvider>
	);
};

export default AppWithTheme;
