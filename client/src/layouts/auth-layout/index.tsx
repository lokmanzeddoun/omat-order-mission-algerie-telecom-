import { PropsWithChildren } from "react";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<Stack
			component="main"
			alignItems="center"
			justifyContent="center"
			px={1}
			py={7}
			width={1}
			minHeight="100vh"
			position="relative"
		>
			<ButtonBase
				component={Link}
				href="/"
				disableRipple
				sx={{ position: "absolute", top: 24, left: 24 }}
			>
				{/* <Image src={LogoImg} alt="logo" height={80} width={80} sx={{ mr: 1 }} /> */}
				<Typography variant="h4" color="text.primary" letterSpacing={1}>
					OMAT
				</Typography>
			</ButtonBase>
			<Paper sx={{ px: 2, py: 3, width: 1, maxWidth: 380 }}>{children}</Paper>
		</Stack>
	);
};

export default AuthLayout;
