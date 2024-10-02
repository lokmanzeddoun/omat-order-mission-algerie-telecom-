import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import NoData from 'components/users/NoData';
import baremJson from 'data/barem.json';

// Columns for the DataGrid
const columns = [
  { field: 'id', headerName: 'Catégorie', width: 150 },
  { field: 'libelle', headerName: 'Libellé', width: 200 },
  { field: 'repas_nord', headerName: 'Repas Nord (dz)', width: 150 },
  { field: 'hebergement_nord', headerName: 'Hébergement Nord (dz)', width: 200 },
  { field: 'repas_sud', headerName: 'Repas Sud (dz)', width: 150 },
  { field: 'hebergement_sud', headerName: 'Hébergement Sud (dz)', width: 200 },
  { field: 'montant_km', headerName: 'Montant/km (dz)', width: 150 },
];

export default function DataGridWithJson() {
  const [rows, setRows] = useState(baremJson);

  // Fetch data.json from the public folder and set it to state


  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        getRowId={(row) => row.id}
        rows={rows}
        rowCount={rows.length}
        columns={columns}
        slots={{
          noRowsOverlay: () => <NoData />,
          pagination: () => null, // Hide the default pagination component
        }}
        disableColumnMenu
        disableRowSelectionOnClick
        disableDensitySelector
        disableColumnSelector
        sx={{
          px: { xs: 0, md: 3 },
          '& .MuiDataGrid-main': {
            minHeight: 300,
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: 300,
            p: 0,
          },
          '& .MuiDataGrid-columnHeader': {
            fontSize: { xs: 13, lg: 16 },
          },
          '& .MuiDataGrid-cell': {
            fontSize: { xs: 13, lg: 16 },
          },
          '& .MuiTypography-root': {
            fontSize: { xs: 13, lg: 16 },
          },
        }}
      />
    </div>
  );
}
