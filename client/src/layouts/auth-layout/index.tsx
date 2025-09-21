import { PropsWithChildren } from "react";
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { useNavigate } from 'react-router-dom';
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import AppAlert from "components/alert";
import LogoImg from "assets/Logo.png";
import Image from "components/base/Image";
const AuthLayout = ({ children }: PropsWithChildren) => {
	const navigate = useNavigate();
	const { loading } = useSelector((s: RootState) => s.auth);

	const handleLogoClick = (e: any) => {
		e.preventDefault();
		if (loading) return; // ignore clicks while restoring session
		navigate('/');
	};

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
			<AppAlert />
			<ButtonBase disableRipple sx={{ position: "absolute", top: 28, left: 24 }} onClick={handleLogoClick}>
				<Image src={LogoImg} alt="logo" height={60} width={60} sx={{ mr: 1 }} />
				<Typography variant="h3" color="text.primary" letterSpacing={1}>
					OMAT
				</Typography>
			</ButtonBase>
			<Paper sx={{ px: 2, py: 3, width: 1, maxWidth: 380 }}>{children}</Paper>
		</Stack>
	);
};

export default AuthLayout;
