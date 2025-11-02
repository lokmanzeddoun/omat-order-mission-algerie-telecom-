import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Container,
  Chip,
  alpha,
} from '@mui/material';
import {
  TableChart as TableChartIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  DirectionsCar as DirectionsCarIcon,
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
    </Container>
  );
}
