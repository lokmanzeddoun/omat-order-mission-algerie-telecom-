import { Alert, AlertTitle } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "store";
import { RootState } from "store/rootReducer";
import { removeAlert } from "./alert.reducer";
const AppAlert = () => {
	const alerts = useSelector((state: RootState) => state.alerts);
	const dispatch = useDispatch<AppDispatch>();
	return (
		alerts !== null &&
		alerts.length > 0 &&
		alerts.map((alert: IAlert, index: number) => {
			return (
				<div className="container">
					<Alert
						variant="filled"
						severity={alert.type}
						key={index}
						sx={{
							position: "absolute",
							top: 10,
							right: 20,
						}}
						onClose={() => {
							dispatch(removeAlert(alert));
						}}
					>
						<AlertTitle>{alert.msg}</AlertTitle>
						{alert.desc}
					</Alert>
				</div>
			);
		})
	);
};

export default AppAlert;
