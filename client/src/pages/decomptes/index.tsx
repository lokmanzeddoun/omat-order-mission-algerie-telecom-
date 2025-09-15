import { Box, Stack, Typography, Chip, Tab, Tabs } from '@mui/material';
import NoData from 'components/users/NoData';
import Splash from 'components/loader/Splash';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { useEffect, useMemo, useState } from 'react';
import { fetchAllDecompte } from 'components/orders/decompte.thunk';
import moment from 'moment';
import RenderDecompteDownload from 'components/orders/RenderDecompteDownload';
import AdvancedTable, { AdvancedTableColumn, AdvancedTableAction } from 'components/common/AdvancedTable';

const DecomptesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const { decomptes, loading } = useSelector((s: RootState) => s.decompte);
  const pageSize = 10; // unified with AdvancedTable
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (token) dispatch(fetchAllDecompte(token));
  }, [dispatch, token]);

  const allRows: any[] = useMemo(() => decomptes as any, [decomptes]);
  const filteredRows: any[] = useMemo(() => {
    if (tab === 1 && user?.matricule != null) {
      return (allRows as any[]).filter((r) => r?.mission?.user?.matricule === user.matricule);
    }
    return allRows;
  }, [tab, allRows, user?.matricule]);

  const transportMapping: { [key: string]: string } = {
    SERVICE_CAR: 'Véhicule de service',
    TRANSPORT_ENTREPRISE:
      "Autre moyens de transport dont les dépenses sont prises en charge par l’entreprise",
    TRANSPORT_EMPLOYEE: 'Moyens de transport dont les dépenses sont prises en charge par le travailleur',
    PERSONAL_CAR: "Utilisation exceptionnelle du véhicule personnel",
  };

  const columns: AdvancedTableColumn[] = [
    { field: 'n_decompte', headerName: 'N Décompte', minWidth: 120, valueGetter: (p: any) => p?.row?.n_decompte ?? '', headerSearchable: true },
    {
      field: 'date_decompte',
      headerName: 'Date Décompte',
      minWidth: 140,
      renderCell: () => <Chip label={null} size="small" color="default" />, // not in payload
    },
    { field: 'n_mission', headerName: 'Numéro Mission', minWidth: 140, valueGetter: (p: any) => p?.row?.mission?.n_mission ?? '', headerSearchable: true },
    {
      field: 'date_mission',
      headerName: 'Date Mission',
      minWidth: 140,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('YYYY/MM/DD') : <Chip label={null} size="small" color="default" />;
      },
    },
    { field: 'matricule', headerName: 'Matricule Missionnaire', minWidth: 180, valueGetter: (p: any) => p?.row?.mission?.user?.matricule ?? '', headerSearchable: true },
    {
      field: 'nom_prenom',
      headerName: 'Nom Prénom',
      minWidth: 180,
      valueGetter: (p: any) => {
        const u = p?.row?.mission?.user;
        return u ? `${u.nom ?? ''} ${u.prenom ?? ''}`.trim() : '';
      },
      headerSearchable: true,
    },
    {
      field: 'date_sortie',
      headerName: 'Date Sortie',
      minWidth: 140,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('YYYY/MM/DD') : <Chip label={null} size="small" color="default" />;
      },
    },
    {
      field: 'date_retour',
      headerName: 'Date Retour',
      minWidth: 140,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_retour;
        return v ? moment(v).format('YYYY/MM/DD') : <Chip label={null} size="small" color="default" />;
      },
    },
    { field: 'destination', headerName: 'Destination', minWidth: 160, valueGetter: (p: any) => p?.row?.mission?.destination ?? '', headerSearchable: true },
    {
      field: 'transport',
      headerName: 'Moyen Transport',
      minWidth: 240,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.transport;
        const label = v ? transportMapping[v] || v : null;
        return label ? <Chip label={label} size="small" color="default" /> : <Chip label={null} size="small" color="default" />;
      },
    },
    { field: 'motif', headerName: 'Motif de Déplacement', minWidth: 260, valueGetter: (p: any) => p?.row?.mission?.motif ?? '', headerSearchable: true },
    { field: 'heure_sortie', headerName: 'Heure Sortie', minWidth: 130, valueGetter: (p: any) => p?.row?.mission?.heure_sortie ?? '' },
    { field: 'heure_retour', headerName: 'Heure Retour', minWidth: 130, valueGetter: (p: any) => p?.row?.mission?.heure_retour ?? '' },
    { field: 'repas_pec', headerName: 'Nbr Repas PEC', type: 'number', minWidth: 150 },
    { field: 'hebergement_pec', headerName: 'Nbr Hébergement PEC', type: 'number', minWidth: 190 },
    { field: 'repas_sans_pec', headerName: 'Nbr Repas non PEC', type: 'number', minWidth: 190 },
    { field: 'hebergement_sans_pec', headerName: 'Nbr Hébergement non PEC', type: 'number', minWidth: 230 },
    {
      field: 'download',
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      minWidth: 140,
      renderCell: (params) => <RenderDecompteDownload params={params as any} />,
    },
  ];

  // Actions (example: download) - already visible via column button but added for context menu / extensibility
  const actions: AdvancedTableAction[] = [
    {
      id: 'download',
      label: 'Télécharger',
      icon: '📄',
      onClick: (row: any) => {
        // We rely on existing inline button; here we could programmatically trigger or navigate.
        // Placeholder: open the PDF endpoint in new tab if id exists.
        const id = row?.n_decompte ?? row?.mission?.n_mission;
        if (id) {
          window.open(`/api/decompte/${id}/download`, '_blank', 'noopener');
        }
      },
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
  ];

  if (loading) return <Splash />;

  return (
    <Stack direction="column" spacing={1} width={1}>
      <Stack direction="row" alignItems="center" justifyContent="center">
        <Typography variant="h4" minWidth={200}>Décomptes</Typography>
      </Stack>
      <Box sx={{ borderBottom: 1, borderColor: 'secondary.lighter', mb: 2, mr: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => { setTab(v); }} aria-label="decompte tabs">
          <Tab label="Tous Les Décomptes" />
          <Tab label="Mes Décomptes" />
        </Tabs>
      </Box>
      {filteredRows.length === 0 ? (
        <NoData />
      ) : (
        <AdvancedTable
          rows={filteredRows}
            columns={columns}
            actions={actions}
            getRowId={(row: any) => row.n_decompte ?? row?.mission?.n_mission}
            userRole={user?.role}
            enableHeaderSearch
            autoHeight
            pageSize={pageSize}
            onDoubleClickRow={() => {}}
          />
      )}
    </Stack>
  );
};

export default DecomptesPage;
