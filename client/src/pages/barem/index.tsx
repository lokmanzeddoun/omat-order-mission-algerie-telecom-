import { useState } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
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
    flex: 1,
    minWidth: 100,
    hideable: false,
    renderCell: (params) => <>#{params.value}</>,
  },
  {
    field: 'libelle',
    headerName: 'Libellé',
    flex: 2,
    minWidth: 200,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'repas_nord',
    headerName: 'Repas Nord (dz)',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => <>{params.value?.toLocaleString()} DZ</>,
  },
  {
    field: 'hebergement_nord',
    headerName: 'Hébergement Nord (dz)',
    flex: 1,
    minWidth: 180,
    hideable: false,
    renderCell: (params) => <>{params.value?.toLocaleString()} DZ</>,
  },
  {
    field: 'repas_sud',
    headerName: 'Repas Sud (dz)',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => <>{params.value?.toLocaleString()} DZ</>,
  },
  {
    field: 'hebergement_sud',
    headerName: 'Hébergement Sud (dz)',
    flex: 1,
    minWidth: 180,
    hideable: false,
    renderCell: (params) => <>{params.value?.toLocaleString()} DZ</>,
  },
  {
    field: 'montant_km',
    headerName: 'Montant/km (dz)',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => <>{params.value?.toLocaleString()} DZ</>,
  },
];

export default function BaremTable() {
  const [rows] = useState<BaremData[]>(baremJson);

  return (
    <Stack sx={{ overflow: 'auto', justifyContent: 'space-between', flexDirection: 'column' }}>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            fontSize: {
              xs: 'body2.fontSize',
              md: 'h6.fontSize',
              xl: 'h3.fontSize',
            },
            fontWeight: 600,
          }}
        >
          Barème des Frais de Mission
        </Typography>
      </Box>
      <Card
        sx={{
          flexGrow: { md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          overflow: 'hidden',
          m: 2,
          borderRadius: 6.5,
          '&.MuiPaper-root': {
            p: 1,
            border: 1,
            borderColor: 'neutral.light',
            bgcolor: { xs: 'transparent', sm: 'white' },
            boxShadow: (theme) => `inset 0px -1px ${theme.palette.neutral.light}`,
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
          enableHeaderSearch={false}  // Disable search for read-only table
          contextMenuItems={[]}       // No context menu for read-only table
        />
      </Card>
    </Stack>
  );
}
