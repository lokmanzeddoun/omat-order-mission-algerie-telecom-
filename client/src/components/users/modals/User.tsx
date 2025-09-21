import React, { FormEvent, useEffect, useState } from 'react';
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
import Splash from 'components/loader/Splash';
import NameIcon from 'assets/icons/ic--twotone-perm-identity.svg?react';
import PrenomIcon from 'assets/icons/material-symbols--for-you-outline.svg?react';
import MatriculeIcon from 'assets/icons/teenyicons--id-solid.svg?react';
import RoleIcon from 'assets/icons/eos-icons--role-binding.svg?react';
import CategoryIcon from 'assets/icons/bx--category.svg?react';
import MailIcon from 'assets/icons/hugeicons--mail-at-sign-02.svg?react';
import ServiceIcon from 'assets/icons/material-symbols--home-repair-service-outline.svg?react';
import FunctionIcon from 'assets/icons/ri--function-add-fill.svg?react';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  isEdit?: boolean;
  initialData?: RowData; // Initial data for edit mode
  viewOnly?: boolean;
}

const roles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
const categories = ['CADRE', 'CADRE_SUPERIEUR', 'EXECUTION_MAITRISE'];
import { Role } from 'constants/role';
import { Category } from 'constants/category';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';
import { getAllStructures } from 'components/structures/structure.thunk';
import { getAllUsers } from '../users.thunk';
const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
  viewOnly = false,
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
  const { structures, loading } = useSelector((state: RootState) => state.structures);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getAllStructures());
    if (isEdit && initialData) {
      // If editing, use the serviceId directly from the server data
      // The serviceId already contains the structure code
      setFormData({
        ...initialData,
        serviceId: initialData.serviceId || null,
      });
    }
  }, [isEdit, initialData, dispatch]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    console.log(formData);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (viewOnly) {
      onClose();
      return;
    }

    // Submit the form data for both create and edit operations
    onSubmit(formData);

    setFormData(initialFormData); // Reset form after submission
    dispatch(getAllUsers());
    onClose();
    // // Form validation can be added here if needed
  };
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Editer Utilisateur' : 'Ajouter Nouvel Utilisateur'}</DialogTitle>
        <DialogContent>
          <Splash /> {/* Loading spinner */}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {viewOnly ? 'Détails Utilisateur' : isEdit ? 'Editer Utilisateur' : 'Ajouter Nouvel Utilisateur'}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="user-form"
          mt={3}
          onSubmit={handleSubmit}
          direction="column"
          gap={2}
        >
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
                  <IconifyIcon icon={MatriculeIcon} />
                </InputAdornment>
              ),
              readOnly: viewOnly || isEdit, // Disable when editing or viewing
            }}
            value={formData.matricule ? formData.matricule : ''}
            onChange={handleChange}
            disabled={isEdit || viewOnly} // Also disable the field when editing
          />
          <TextField
            name="nom"
            fullWidth
            variant="filled"
            placeholder="Entrez Le nom"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={NameIcon} />
                </InputAdornment>
              ),
              readOnly: viewOnly,
            }}
            value={formData.nom}
            onChange={handleChange}
          />
          <TextField
            name="prenom"
            fullWidth
            placeholder="Entrez Le prenom"
            variant="filled"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={PrenomIcon} />
                </InputAdornment>
              ),
              readOnly: viewOnly,
            }}
            value={formData.prenom}
            onChange={handleChange}
          />
          <TextField
            name="email"
            type="normal"
            fullWidth
            variant="filled"
            required
            placeholder="Entrez Utilisateur Email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={MailIcon} />
                </InputAdornment>
              ),
              readOnly: viewOnly,
            }}
            value={formData.email}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              name="role"
              variant="filled"
              disabled={isEdit || viewOnly} // Disable if editing or view only
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon icon={RoleIcon} />
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
              disabled={isEdit || viewOnly} // Disable if editing or view only
              fullWidth
              margin="none"
              variant="filled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon icon={CategoryIcon} />
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
                  <IconifyIcon icon={FunctionIcon} />
                </InputAdornment>
              ),
              readOnly: viewOnly,
            }}
            required
            value={formData.grade}
            onChange={handleChange}
          />
          <Autocomplete
            options={structures}
            getOptionLabel={(option) => option.name} // Maps the options to labels
            value={structures.find((s) => s.code === formData.serviceId) || null} // Find and set the current service
            onChange={(_event, newValue) => {
              setFormData({
                ...formData,
                serviceId: newValue?.code || null, // Allow null for optional service
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="serviceId"
                fullWidth
                variant="filled"
                placeholder="Entrez Le Service"
                required={!isEdit} // Only required when creating new user, not when editing
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconifyIcon icon={ServiceIcon} />
                    </InputAdornment>
                  ),
                  readOnly: viewOnly,
                }}
              />
            )}
            disabled={viewOnly}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        {!viewOnly && (
          <Button type="submit" color="primary" form="user-form">
            {isEdit ? 'Mettre à Jour' : 'Soumettre'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
