import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getTheme } from "theme/theme";
import { RouterProvider } from "react-router-dom";
import { CssBaseline, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { RootState } from "store/rootReducer";
import router from "routes/router";

// Theme wrapper component that uses Redux state
const AppWithTheme = () => {
	const themeMode = useSelector((state: RootState) => state.theme.mode);
	const theme = useMemo(() => getTheme(themeMode), [themeMode]);

	// Design tokens in styles/app.css switch on the `.dark` class
	useEffect(() => {
		document.documentElement.classList.toggle("dark", themeMode === "dark");
		document.documentElement.style.colorScheme = themeMode;
	}, [themeMode]);

	return (
		// enableCssLayer puts MUI styles in `@layer mui`, below Tailwind utilities
		<StyledEngineProvider enableCssLayer>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<RouterProvider router={router} />
			</ThemeProvider>
		</StyledEngineProvider>
	);
};

export default AppWithTheme;
