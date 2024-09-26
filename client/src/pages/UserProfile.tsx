import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid2 as Grid,
  Paper,
  Avatar,
  Box,
} from '@mui/material';
import Avatar7 from 'assets/avatar7.png';
import { Role } from 'constants/role';
import { Category } from 'constants/category';

const UserProfile: React.FC<{ user: IUser }> = ({ user }) => {
  const [formData, setFormData] = useState<IUser>(user);
  const [isEditing, setIsEditing] = useState<boolean>(false); // State to toggle edit mode

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'matricule' ? Number(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can handle form submission, e.g., send data to an API
    console.log('Updated User Profile:', formData);
    setIsEditing(false); // Exit editing mode after submission
  };

  return (
    <Container component={Paper} elevation={3} style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          src={Avatar7}
          alt={`${formData.prenom} ${formData.nom}`}
          sx={{ width: 100, height: 100, marginRight: 2 }}
        >
          {formData.prenom.charAt(0)}
          {formData.nom.charAt(0)}
        </Avatar>
        <Typography variant="h6">
          {formData.prenom} {formData.nom}
        </Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Matricule"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
              type="number"
              required
              disabled={!isEditing} // Disable if not in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={!isEditing} // Disable if not in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={!isEditing} // Disable if not in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              disabled={!isEditing} // Disable if not in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              required
              disabled={!isEditing} // Disable if not in edit mode
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              select
              SelectProps={{
                native: true,
              }}
              required
              disabled={!isEditing} // Disable if not in edit mode
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              select
              SelectProps={{
                native: true,
              }}
              required
              disabled={!isEditing} // Disable if not in edit mode
            >
              {Object.values(Category).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            {isEditing ? (
              <Button variant="contained" color="primary" type="submit">
                Update Profile
              </Button>
            ) : (
              <Button variant="contained" color="secondary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default UserProfile;
