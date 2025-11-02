import { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  Container,
  Paper,
  Grid,
  Chip,
  alpha,
  Divider,
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  DirectionsCar as DirectionsCarIcon,
  NorthEast as NorthIcon,
  SouthEast as SouthIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import SmartTable from 'components/common/SmartTable';
import NoData from 'components/users/NoData';
import baremJson from 'data/barem.json';

// Define the interface for barem data
interface BaremData {
  id: string;
  libelle: string;
  repas_nord: number;
  hebergement_nord: number;
  repas_sud: number;
  hebergement_sud: number;
  montant_km: number;
}

// Columns for the DataGrid with enhanced styling
const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'Catégorie',
    flex: 0.8,
    minWidth: 100,
    hideable: false,
    renderCell: (params) => (
      <Chip
        label={`#${params.value}`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    ),
  },
  {
    field: 'libelle',
    headerName: 'Libellé',
    flex: 1.5,
    minWidth: 200,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight={500} color="text.primary">
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'repas_nord',
    headerName: 'Repas Nord',
    flex: 1,
    minWidth: 130,
    hideable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <RestaurantIcon sx={{ fontSize: 16, color: 'text.primary' }} />
        <Typography variant="body2" sx={{ color: 'text.primary' }} fontWeight={500}>
          {params.value?.toLocaleString()} DZD
        </Typography>
      </Box>
    ),
  },
  {
    field: 'hebergement_nord',
    headerName: 'Hébergement Nord',
    flex: 1,
    minWidth: 160,
    hideable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <HotelIcon sx={{ fontSize: 16, color: 'text.primary' }} />
        <Typography variant="body2" sx={{ color: 'text.primary' }} fontWeight={500}>
          {params.value?.toLocaleString()} DZD
        </Typography>
      </Box>
    ),
  },
  {
    field: 'repas_sud',
    headerName: 'Repas Sud',
    flex: 1,
    minWidth: 130,
    hideable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <RestaurantIcon sx={{ fontSize: 16, color: 'warning.main' }} />
        <Typography variant="body2" sx={{ color: 'warning.main' }} fontWeight={500}>
          {params.value?.toLocaleString()} DZD
        </Typography>
      </Box>
    ),
  },
  {
    field: 'hebergement_sud',
    headerName: 'Hébergement Sud',
    flex: 1,
    minWidth: 160,
    hideable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <HotelIcon sx={{ fontSize: 16, color: 'warning.main' }} />
        <Typography variant="body2" sx={{ color: 'warning.main' }} fontWeight={500}>
          {params.value?.toLocaleString()} DZD
        </Typography>
      </Box>
    ),
  },
  {
    field: 'montant_km',
    headerName: 'Montant/km',
    flex: 1,
    minWidth: 130,
    hideable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <DirectionsCarIcon sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="body2" sx={{ color: 'success.main' }} fontWeight={500}>
          {params.value?.toLocaleString()} DZD
        </Typography>
      </Box>
    ),
  },
];

export default function BaremTable() {
  const [rows] = useState<BaremData[]>(baremJson);

  // Calculate statistics
  const totalCategories = rows.length;
  const avgRepasNord = Math.round(
    rows.reduce((sum, row) => sum + row.repas_nord, 0) / totalCategories
  );
  const avgHebergementNord = Math.round(
    rows.reduce((sum, row) => sum + row.hebergement_nord, 0) / totalCategories
  );
  const avgMontantKm = Math.round(
    rows.reduce((sum, row) => sum + row.montant_km, 0) / totalCategories
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <TableChartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Barème des Frais de Mission
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consultez les tarifs applicables pour les frais de repas, d'hébergement et de transport
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TableChartIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Catégories
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalCategories}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <RestaurantIcon sx={{ fontSize: 24, color: 'text.primary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Moy. Repas Nord
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="text.primary">
              {avgRepasNord.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              DZD
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HotelIcon sx={{ fontSize: 24, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Moy. Hébergement Nord
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="warning.main">
              {avgHebergementNord.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              DZD
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.success.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DirectionsCarIcon sx={{ fontSize: 24, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Moy. Transport/km
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="success.main">
              {avgMontantKm.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              DZD
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'text.primary',
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.02),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <NorthIcon sx={{ color: 'text.primary' }} />
              <Typography variant="h6" fontWeight="600" color="text.primary">
                Région Nord
              </Typography>
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestaurantIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Repas
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Tarifs différenciés par catégorie
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Hébergement
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Tarifs différenciés par catégorie
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'warning.main',
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.02),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <SouthIcon sx={{ color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="600" color="warning.main">
                Région Sud
              </Typography>
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestaurantIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Repas
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Tarifs différenciés par catégorie
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Hébergement
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Tarifs différenciés par catégorie
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Card */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <SmartTable<BaremData>
          columns={columns}
          rows={rows}
          rowCount={rows.length}
          getRowId={(row) => row.id}
          loading={false}
          noRowsOverlay={NoData as any}
          enableHeaderSearch={false}
          contextMenuItems={[]}
        />
      </Card>

      {/* Footer Note */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Les tarifs affichés sont applicables conformément aux réglementations en
          vigueur d'Algérie Télécom. Les montants sont exprimés en Dinars Algériens (DZD).
        </Typography>
      </Paper>
    </Container>
  );
}
