import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { RootState } from "store/rootReducer";
import router from "routes/router";

// Applies the light/dark theme (design tokens in styles/app.css switch on the `.dark` class).
const AppWithTheme = () => {
	const themeMode = useSelector((state: RootState) => state.theme.mode);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", themeMode === "dark");
		document.documentElement.style.colorScheme = themeMode;
	}, [themeMode]);

	return <RouterProvider router={router} />;
};

export default AppWithTheme;
