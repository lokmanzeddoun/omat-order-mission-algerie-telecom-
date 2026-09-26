import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Stack,
	Chip,
	Typography,
	Box,
	Divider,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import dayjs from 'helpers/date';
import { IMission } from './orderReducer';
import { calculateMealsAndAccommodation } from 'helpers/utils';

export interface IDecompte {
	heure_sortie: string;
	date_retour: string;
	heure_retour: string;
	hebergement_sans_pec?: number;
	repas_sans_pec?: number;
	repas_pec?: number;
	hebergement_pec?: number;
	distance_km?: number;
	transport_cost?: number;
}

interface ValidateMissionDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: IDecompte) => void;
	mission: IMission | null;
}

const normalizeDateValue = (value: unknown): string => {
	if (value == null) return '';
	const raw = String(value).trim();
	if (!raw) return '';
	const parsed = dayjs(raw, 'YYYY-MM-DD', true);
	if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
	const fallback = dayjs(raw);
	return fallback.isValid() ? fallback.format('YYYY-MM-DD') : '';
};

const normalizeTimeValue = (value: unknown): string => {
	if (value == null) return '';
	const raw = String(value).trim();
	if (!raw) return '';
	const [hours = '', minutes = '', seconds = ''] = raw.split(':');
	if (!hours) return '';
	const paddedHours = hours.padStart(2, '0');
	const paddedMinutes = (minutes || '00').padStart(2, '0');
	return seconds
		? `${paddedHours}:${paddedMinutes}:${seconds.padStart(2, '0')}`
		: `${paddedHours}:${paddedMinutes}`;
};

const buildDecompteFormData = (mission: IMission): IDecompte => ({
	heure_sortie: normalizeTimeValue(
		mission?.date_sortie ? dayjs(mission.date_sortie).format('HH:mm') : ''
	),
	date_retour: normalizeDateValue(mission?.date_retour),
	heure_retour: normalizeTimeValue(
		mission?.date_retour ? dayjs(mission.date_retour).format('HH:mm') : ''
	),
	hebergement_sans_pec: undefined,
	repas_sans_pec: undefined,
	repas_pec: undefined,
	hebergement_pec: undefined,
	distance_km: undefined,
	transport_cost: undefined,
});

const ValidateMissionDialog: React.FC<ValidateMissionDialogProps> = ({
	open,
	onClose,
	onSubmit,
	mission,
}) => {
	const [formData, setFormData] = useState<IDecompte>(() =>
		mission ? buildDecompteFormData(mission) : ({} as IDecompte)
	);
	const [hebergement, setHebergement] = useState(0);
	const [repas, setRepas] = useState(0);
	const [errors, setErrors] = useState({
		date_retour: false,
		heure_sortie: false,
		heure_retour: false,
		hebergement: false,
		repas: false,
		distance_km: false,
	});

	const missionDepartureDate = useMemo(
		() => (mission ? normalizeDateValue(mission?.date_sortie) : ''),
		[mission]
	);

	useEffect(() => {
		if (!mission) return;

		const updatedFormData = buildDecompteFormData(mission);
		setFormData(updatedFormData);
		setErrors({
			date_retour: false,
			heure_sortie: false,
			heure_retour: false,
			hebergement: false,
			repas: false,
			distance_km: false,
		});

		if (
			missionDepartureDate &&
			updatedFormData.date_retour &&
			updatedFormData.heure_sortie &&
			updatedFormData.heure_retour
		) {
			const result = calculateMealsAndAccommodation(
				missionDepartureDate,
				normalizeTimeValue(updatedFormData.heure_sortie),
				normalizeDateValue(updatedFormData.date_retour),
				normalizeTimeValue(updatedFormData.heure_retour)
			);
			setHebergement(result.accommodations);
			setRepas(result.meals);
		} else {
			setHebergement(0);
			setRepas(0);
		}
	}, [mission, missionDepartureDate, open]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		const numericFields = new Set([
			'hebergement_sans_pec',
			'repas_sans_pec',
			'repas_pec',
			'hebergement_pec',
			'distance_km',
			'transport_cost',
		]);

		const updatedFormData = {
			...formData,
			[name]: numericFields.has(name)
				? value === ''
					? undefined
					: Number(value)
				: value,
		} as IDecompte;

		setFormData(updatedFormData);
		setErrors((prev) => ({
			...prev,
			[name]: false,
		}));

		if (['heure_sortie', 'heure_retour', 'date_retour'].includes(name)) {
			if (
				missionDepartureDate &&
				updatedFormData.heure_sortie &&
				updatedFormData.date_retour &&
				updatedFormData.heure_retour
			) {
				const result = calculateMealsAndAccommodation(
					missionDepartureDate,
					normalizeTimeValue(updatedFormData.heure_sortie),
					normalizeDateValue(updatedFormData.date_retour),
					normalizeTimeValue(updatedFormData.heure_retour)
				);
				setHebergement(result.accommodations);
				setRepas(result.meals);
			} else {
				setHebergement(0);
				setRepas(0);
			}
		}
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const retourMoment = dayjs(formData.date_retour, 'YYYY-MM-DD', true);
		const sortieMoment = missionDepartureDate
			? dayjs(missionDepartureDate, 'YYYY-MM-DD', true)
			: null;

		const newErrors = {
			date_retour:
				!formData.date_retour ||
				!retourMoment.isValid() ||
				(sortieMoment?.isValid() ? retourMoment.isBefore(sortieMoment) : false),
			heure_sortie: !formData.heure_sortie,
			heure_retour: !formData.heure_retour,
			hebergement:
				(formData.hebergement_sans_pec || 0) + (formData.hebergement_pec || 0) !== hebergement,
			repas: (formData.repas_sans_pec || 0) + (formData.repas_pec || 0) !== repas,
			distance_km:
				formData.distance_km === undefined ||
				formData.distance_km === null ||
				(typeof formData.distance_km === 'number' && formData.distance_km < 0),
		};

		if (Object.values(newErrors).some(Boolean)) {
			setErrors(newErrors);
			return;
		}

		onSubmit(formData);
		onClose();
		setErrors({
			date_retour: false,
			heure_sortie: false,
			heure_retour: false,
			hebergement: false,
			repas: false,
			distance_km: false,
		});
		if (mission) {
			setFormData(buildDecompteFormData(mission));
		}
	};

	if (!mission) return null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<CheckCircleIcon color="success" />
				Valider la Mission et Créer le Décompte
			</DialogTitle>
			<DialogContent>
				{/* Mission Info */}
				<Box sx={{ mb: 3, mt: 1 }}>
					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						Information de la Mission
					</Typography>
					<Stack spacing={1}>
						<Typography variant="body2">
							<strong>Mission N°:</strong> {mission.n_mission}
						</Typography>
						{mission.motif && (
							<Typography variant="body2">
								<strong>Motif:</strong> {mission.motif}
							</Typography>
						)}
						{mission.destination && (
							<Typography variant="body2">
								<strong>Destination:</strong> {mission.destination}
							</Typography>
						)}
					</Stack>
				</Box>

				<Divider sx={{ mb: 3 }} />

				{/* Decompte Form */}
				<Stack component="form" id="validate-mission-form" onSubmit={handleSubmit} gap={2}>
					<Typography variant="subtitle2" color="text.secondary">
						Détails du Décompte
					</Typography>

					<TextField
						name="date_retour"
						label="Date de Retour"
						type="date"
						fullWidth
						variant="outlined"
						InputLabelProps={{ shrink: true }}
						value={formData.date_retour}
						onChange={handleChange}
						error={errors.date_retour}
						helperText={errors.date_retour ? 'Date de retour est obligatoire et doit être après la date de sortie' : ''}
					/>

					<Stack direction="row" gap={2}>
						<TextField
							name="heure_sortie"
							label="Heure de Départ"
							type="time"
							fullWidth
							variant="outlined"
							InputLabelProps={{ shrink: true }}
							value={formData.heure_sortie}
							onChange={handleChange}
							error={errors.heure_sortie}
							helperText={errors.heure_sortie ? 'Heure de sortie est obligatoire' : ''}
						/>

						<TextField
							name="heure_retour"
							label="Heure de Retour"
							type="time"
							fullWidth
							variant="outlined"
							InputLabelProps={{ shrink: true }}
							value={formData.heure_retour}
							onChange={handleChange}
							error={errors.heure_retour}
							helperText={errors.heure_retour ? 'Heure de retour est obligatoire' : ''}
						/>
					</Stack>

					<Stack direction="row" gap={2}>
						<TextField
							name="hebergement_sans_pec"
							label="Hébergement sans PEC"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.hebergement_sans_pec ?? ''}
							onChange={handleChange}
							error={errors.hebergement}
							helperText={
								errors.hebergement ? `Total hébergement doit être ${hebergement}` : ''
							}
							inputProps={{ min: 0 }}
						/>

						<TextField
							name="hebergement_pec"
							label="Hébergement avec PEC"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.hebergement_pec ?? ''}
							onChange={handleChange}
							error={errors.hebergement}
							inputProps={{ min: 0 }}
						/>
					</Stack>

					<Stack direction="row" gap={2}>
						<TextField
							name="repas_sans_pec"
							label="Repas sans PEC"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.repas_sans_pec ?? ''}
							onChange={handleChange}
							error={errors.repas}
							helperText={errors.repas ? `Total repas doit être ${repas}` : ''}
							inputProps={{ min: 0 }}
						/>

						<TextField
							name="repas_pec"
							label="Repas avec PEC"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.repas_pec ?? ''}
							onChange={handleChange}
							error={errors.repas}
							inputProps={{ min: 0 }}
						/>
					</Stack>

					<Stack direction="row" gap={2}>
						<TextField
							name="distance_km"
							label="Distance parcourue (KM)"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.distance_km ?? ''}
							onChange={handleChange}
							required
							error={errors.distance_km}
							helperText={
								errors.distance_km ? 'La distance parcourue est obligatoire' : ''
							}
							inputProps={{ min: 0 }}
						/>
						<TextField
							name="transport_cost"
							label="Frais de transport engagés (DA)"
							type="number"
							fullWidth
							variant="outlined"
							value={formData.transport_cost ?? ''}
							onChange={handleChange}
							inputProps={{ min: 0 }}
						/>
					</Stack>

					<Stack direction="row" spacing={2} mt={1} alignItems="center" justifyContent="center">
						<Chip
							label={`Repas calculés: ${repas}`}
							color="primary"
							variant="outlined"
							sx={{ width: '180px' }}
						/>
						<Chip
							label={`Hébergements calculés: ${hebergement}`}
							color="secondary"
							variant="outlined"
							sx={{ width: '230px' }}
						/>
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} color="inherit">
					Annuler
				</Button>
				<Button type="submit" form="validate-mission-form" variant="contained" color="primary">
					Valider et Créer le Décompte
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ValidateMissionDialog;

