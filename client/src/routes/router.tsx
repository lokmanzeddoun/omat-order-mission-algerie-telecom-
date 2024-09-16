/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import { Outlet, createBrowserRouter } from "react-router-dom";
import AuthLayout from "layouts/auth-layout";
import Splash from "components/loader/Splash";
import PageLoader from "components/loader/PageLoader";

const App = lazy(() => import("App"));
const Signin = lazy(() => import("pages/authentication/Signin"));

const router = createBrowserRouter(
	[
		{
			element: (
				<Suspense fallback={<Splash />}>
					<App />
				</Suspense>
			),
			children: [
				{
					path: "/",
					element: (
						<AuthLayout>
							<Suspense fallback={<PageLoader />}>
								<Outlet />
							</Suspense>
						</AuthLayout>
					),
					children: [
						{
							index: true,
							element: <Signin />,
						},
					],
				},
			],
		},
	],
	{
		basename: "/omat",
	}
);

export default router;
