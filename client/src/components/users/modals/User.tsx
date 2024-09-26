import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  Box,
  Autocomplete,
} from '@mui/material';
import { RowData } from '..';
import IconifyIcon from 'components/base/IconifyIcon';
interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  isEdit?: boolean;
  initialData?: RowData; // Initial data for edit mode
}

const roles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
const categories = ['CADRE', 'CADRE_SUPERIEUR', 'EXECUTION_MAITRISE'];
import { Role } from 'constants/role';
import { Category } from 'constants/category';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
}) => {
  const initialFormData: RowData = initialData || {
    id: 0,
    matricule: 0,
    nom: '',
    prenom: '',
    email: '',
    role: Role.user,
    grade: '',
    category: Category.cadre,
    serviceId: null,
  };
  const [formData, setFormData] = useState<RowData>(initialFormData);
  const { structures } = useSelector((state: RootState) => state.structures);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData(initialData);
    }
  }, [isEdit, initialData]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    console.log(formData);
  };

  const handleSubmit = () => {
    if (isEdit) {
      // Only gather the changed fields for an update
      const updatedData: Partial<RowData> = {};

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== initialFormData[key as keyof RowData]) {
          updatedData[key as keyof RowData] = formData[key as keyof RowData];
        }
      });
      updatedData.matricule = formData.matricule;
      // If there's something to update, submit the updated data
      if (Object.keys(updatedData).length > 0) {
        onSubmit(updatedData as RowData); // Send only the updated fields
      }
    } else {
      // For create, submit the entire formData
      onSubmit(formData);
    }

    setFormData(initialFormData); // Reset form after submission
    onClose();
    // // Form validation can be added here if needed
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editer Utilisateur' : 'Ajouter Nouvel Utilisateur'}</DialogTitle>
      <DialogContent>
        <Stack component="form" mt={3} onSubmit={handleSubmit} direction="column" gap={2}>
          {' '}
          <TextField
            name="matricule"
            type="number"
            fullWidth
            variant="filled"
            autoFocus
            required
            placeholder="Entrez Le Matricule"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="teenyicons:id-solid" />
                </InputAdornment>
              ),
            }}
            value={formData.matricule}
            onChange={handleChange}
          />
          <TextField
            name="nom"
            fullWidth
            variant="filled"
            placeholder="Entrez Le nom"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="ic:twotone-perm-identity" />
                </InputAdornment>
              ),
            }}
            value={formData.nom}
            onChange={handleChange}
          />
          <TextField
            name="prenom"
            fullWidth
            placeholder="Entrez Le prenom"
            variant="filled"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="icon-park-solid:edit-name" />
                </InputAdornment>
              ),
            }}
            value={formData.prenom}
            onChange={handleChange}
          />
          <TextField
            name="email"
            type="normal"
            fullWidth
            variant="filled"
            placeholder="Entrez Utilisateur Email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="hugeicons:mail-at-sign-02" />
                </InputAdornment>
              ),
            }}
            value={formData.email}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              name="role"
              variant="filled"
              disabled={isEdit} // Disable if editing
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon icon="eos-icons:role-binding" />
                  </InputAdornment>
                ),
              }}
              select
              value={formData.role}
              onChange={handleChange}
              sx={{ width: 230 }}
            >
              <MenuItem value="" disabled>
                <em>Choisir Un Role</em> {/* Placeholder text */}
              </MenuItem>
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="category"
              disabled={isEdit} // Disable if editing
              fullWidth
              margin="none"
              variant="filled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon icon="bxs:category" />
                  </InputAdornment>
                ),
              }}
              select // Make this a select dropdown
              value={formData.category}
              onChange={handleChange}
              sx={{ width: 230 }}
            >
              <MenuItem value="" disabled>
                <em>Chostructuresisir Un Categorie</em> {/* Placeholder text */}
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            name="grade"
            variant="filled"
            placeholder="Entrez La Fonction (Grade)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon="ri:function-add-fill" />
                </InputAdornment>
              ),
            }}
            value={formData.grade}
            onChange={handleChange}
          />
          <Autocomplete
            options={structures}
            getOptionLabel={(option) => option.name} // Maps the options to labels
            onChange={(event, newValue) => {
              setFormData({
                ...formData,
                serviceId: newValue?.code || '', // Assuming `code` represents the `serviceId`
              });
              console.log(formData)
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="serviceId"
                fullWidth
                variant="filled"
                placeholder="Entrez Le Service"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconifyIcon icon="material-symbols:home-repair-service" />
                    </InputAdornment>
                  ),
                }}
                value={formData.serviceId}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={handleSubmit} color="primary">
          {isEdit ? 'Mettre à Jour' : 'Soumettre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
