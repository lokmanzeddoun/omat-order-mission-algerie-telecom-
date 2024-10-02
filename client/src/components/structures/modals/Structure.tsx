import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
} from '@mui/material';
import { RowData } from '..';
import IconifyIcon from 'components/base/IconifyIcon';
import ServiceIcon from 'assets/icons/mdi--account-service-outline.svg?react';
import MatriculeIcon from 'assets/icons/teenyicons--id-solid.svg?react';
interface StructureModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  isEdit?: boolean;
  initialData?: RowData; // Initial data for edit mode
}

const StructureModal: React.FC<StructureModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData,
}) => {
  const initialFormData: RowData = initialData || {
    code: '',
    name: '',
  };
  const [formData, setFormData] = useState<RowData>(initialFormData);

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
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData(initialFormData); // Reset form after submission
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editer Service' : 'Ajouter Nouvel Service'}</DialogTitle>
      <DialogContent>
        <Stack component="form" mt={3} onSubmit={handleSubmit} direction="column" gap={2}>
          {' '}
          <TextField
            name="code"
            fullWidth
            variant="filled"
            autoFocus
            required
            placeholder="Entrez Le Code"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={MatriculeIcon} />
                </InputAdornment>
              ),
            }}
            value={formData.code}
            onChange={handleChange}
          />
          <TextField
            name="name"
            fullWidth
            variant="filled"
            placeholder="Entrez Le nom De Service"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={ServiceIcon} />
                </InputAdornment>
              ),
            }}
            value={formData.name}
            onChange={handleChange}
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

export default StructureModal;
