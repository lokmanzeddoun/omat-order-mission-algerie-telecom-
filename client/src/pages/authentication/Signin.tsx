import { useState, ChangeEvent, FormEvent } from "react";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import IconifyIcon from "components/base/IconifyIcon";

interface User {
	[key: string]: string;
}

const Signin = () => {
	const [user, setUser] = useState<User>({ username: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log(user);
	};

	return (
		<>
			<Typography align="center" variant="h4">
				Se Connecter
			</Typography>
			<Typography mt={1.5} align="center" variant="body2">
				Connextion à OMAT
			</Typography>

			<Stack
				component="form"
				mt={3}
				onSubmit={handleSubmit}
				direction="column"
				gap={2}
			>
				<TextField
					id="username"
					name="username"
					type="username"
					value={user.username}
					onChange={handleInputChange}
					variant="filled"
					placeholder="Votre nom d'utilisateur"
					autoComplete="username"
					fullWidth
					autoFocus
					required
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<IconifyIcon icon="icon-park-outline:edit-name" />
							</InputAdornment>
						),
					}}
				/>
				<TextField
					id="password"
					name="password"
					type={showPassword ? "text" : "password"}
					value={user.password}
					onChange={handleInputChange}
					variant="filled"
					placeholder="Votre mot de pass"
					autoComplete="current-password"
					fullWidth
					required
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<IconifyIcon icon="hugeicons:lock-key" />
							</InputAdornment>
						),
						endAdornment: (
							<InputAdornment
								position="end"
								sx={{
									opacity: user.password ? 1 : 0,
									pointerEvents: user.password ? "auto" : "none",
								}}
							>
								<IconButton
									aria-label="toggle password visibility"
									onClick={() => setShowPassword(!showPassword)}
									sx={{ border: "none", bgcolor: "transparent !important" }}
									edge="end"
								>
									<IconifyIcon
										icon={
											showPassword ? "fluent-mdl2:view" : "fluent-mdl2:hide-3"
										}
										color="neutral.light"
									/>
								</IconButton>
							</InputAdornment>
						),
					}}
				/>

				<Stack mt={-2} alignItems="center" justifyContent="space-between">
					<FormControlLabel
						control={
							<Checkbox
								id="checkbox"
								name="checkbox"
								size="small"
								color="primary"
							/>
						}
						label="Se souvenir de moi"
						sx={{ ml: -1 }}
					/>
					<Link href="#!" fontSize="body2.fontSize">
						Mot de pass oublié?
					</Link>
				</Stack>

				<Button type="submit" variant="contained" size="medium" fullWidth>
					Se connecter
				</Button>
			</Stack>
		</>
	);
};

export default Signin;
