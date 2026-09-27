import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { Direction } from "radix-ui";
import { RootState } from "store/rootReducer";
import router from "routes/router";

// Applies the light/dark theme (design tokens in styles/app.css switch on the `.dark` class)
// and gives Radix primitives the reading direction, so menus, tabs and keyboard
// navigation follow right-to-left in Arabic (i18n.ts sets <html dir> itself).
const AppWithTheme = () => {
	const themeMode = useSelector((state: RootState) => state.theme.mode);
	const { i18n } = useTranslation();

	useEffect(() => {
		document.documentElement.classList.toggle("dark", themeMode === "dark");
		document.documentElement.style.colorScheme = themeMode;
	}, [themeMode]);

	return (
		<Direction.Provider dir={i18n.dir()}>
			<RouterProvider router={router} />
		</Direction.Provider>
	);
};

export default AppWithTheme;
