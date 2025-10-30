import { Box, Stack, Typography, Chip, Tab, Tabs, IconButton, Menu, MenuItem, Badge } from '@mui/material';
import NoData from 'components/users/NoData';
import Splash from 'components/loader/Splash';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { useEffect, useMemo, useState } from 'react';
import { fetchAllDecompte, acceptDecompte, rejectDecompte } from 'components/orders/decompte.thunk';
import moment from 'moment';
import SmartTable, { SmartTableColumn } from 'components/common/SmartTable';
import MenuIcon from 'assets/icons/iconamoon--menu-kebab-horizontal-fill.svg?react';
import RenderDecompteDownload from 'components/orders/RenderDecompteDownload';
import AcceptDecompteDialog from 'components/orders/AcceptDecompteDialog';
import RejectDecompteDialog from 'components/orders/RejectDecompteDialog';
import ViewCommentsDialog from 'components/orders/ViewCommentsDialog';

const DecomptesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);
  const { decomptes, loading } = useSelector((s: RootState) => s.decompte);
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [selectedDecompte, setSelectedDecompte] = useState<any>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchAllDecompte(token, statusFilter));
  }, [dispatch, token, selectedYear, statusFilter]);

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

  const columns: SmartTableColumn[] = [
    { field: 'n_decompte', headerName: 'N Décompte', minWidth: 120, valueGetter: (p: any) => p?.row?.n_decompte ?? '' },
    {
      field: 'date_decompte',
      headerName: 'Date Décompte',
      minWidth: 160,
      flex: 1,
      renderCell: () => <Chip label={null} size="small" color="default" />, // not in payload
    },
    { field: 'n_mission', headerName: 'N Mission', minWidth: 140, valueGetter: (p: any) => p?.row?.mission?.n_mission ?? '' },
    {
      field: 'date_mission',
      headerName: 'Date Mission',
      minWidth: 160,
      flex: 1,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('YYYY/MM/DD') : <Chip label={null} size="small" color="default" />;
      },
    },
    { field: 'matricule', headerName: 'Matricule', minWidth: 140, valueGetter: (p: any) => p?.row?.mission?.user?.matricule ?? '' },
    {
      field: 'nom_prenom',
      headerName: 'Nom Prénom',
      minWidth: 180,
      valueGetter: (p: any) => {
        const u = p?.row?.mission?.user;
        return u ? `${u.nom ?? ''} ${u.prenom ?? ''}`.trim() : '';
      },

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
  { field: 'destination', headerName: 'Destination', minWidth: 160, valueGetter: (p: any) => p?.row?.mission?.destination ?? '' },
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
  { field: 'motif', headerName: 'Motif de Déplacement', minWidth: 260, valueGetter: (p: any) => p?.row?.mission?.motif ?? '' },
    {
      field: 'heure_sortie',
      headerName: 'Heure Sortie',
      minWidth: 130,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('HH:mm') : <Chip label={null} size="small" color="default" />;
      },
    },
    {
      field: 'heure_retour',
      headerName: 'Heure Retour',
      minWidth: 130,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_retour;
        return v ? moment(v).format('HH:mm') : <Chip label={null} size="small" color="default" />;
      },
    },
    { field: 'repas_pec', headerName: 'Nbr Repas PEC', type: 'number', minWidth: 150 },
    { field: 'hebergement_pec', headerName: 'Nbr Hébergement PEC', type: 'number', minWidth: 190 },
    { field: 'repas_sans_pec', headerName: 'Nbr Repas non PEC', type: 'number', minWidth: 190 },
    { field: 'hebergement_sans_pec', headerName: 'Nbr Hébergement non PEC', type: 'number', minWidth: 230 },
    {
      field: 'montant',
      headerName: 'Montant (DA)',
      type: 'number',
      minWidth: 150,
      renderCell: (p: any) => {
        const val = p?.value;
        return val != null ? `${val.toFixed(2)} DA` : <Chip label={null} size="small" color="default" />;
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      minWidth: 140,
      renderCell: (p: any) => {
        const status = p?.value;
        const messagesCount = p?.row?.messages?.length || 0;
        const statusMap: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
          PENDING: { label: 'En attente', color: 'warning' },
          ACCEPTED: { label: 'Accepté', color: 'success' },
          REGECTED: { label: 'Rejeté', color: 'error' },
        };
        const config = statusMap[status] || { label: status, color: 'default' };
        return (
          <Badge badgeContent={messagesCount} color="info" max={9}>
            <Chip label={config.label} size="small" color={config.color} />
          </Badge>
        );
      },
    },
    // Download button column like Orders (empty header)
    {
      field: 'download',
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      minWidth: 140,
      headerSearchable: false,
      renderCell: (params: any) => <RenderDecompteDownload params={params as any} />,
    },
    // Kebab actions column (empty header)
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      minWidth: 80,
      headerSearchable: false,
      renderCell: (params: any) => <DecompteActionMenu row={params.row} />,
    },
  ];

  // Actions (example: download) - already visible via column button but added for context menu / extensibility
  // Inline action menu component for kebab menu per row
  const DecompteActionMenu = ({ row }: { row: any }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleDownload = () => {
      const id = row?.n_decompte ?? row?.mission?.n_mission;
      if (id) window.open(`/api/decompte/${id}/download`, '_blank', 'noopener');
      handleClose();
    };

    const handleAccept = () => {
      setSelectedDecompte(row);
      setAcceptDialogOpen(true);
      handleClose();
    };

    const handleReject = () => {
      setSelectedDecompte(row);
      setRejectDialogOpen(true);
      handleClose();
    };

    const handleViewComments = () => {
      setSelectedDecompte(row);
      setCommentsDialogOpen(true);
      handleClose();
    };

    const isPending = row?.status === 'PENDING';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const hasComments = row?.messages && row.messages.length > 0;

    return (
      <Box>
        <IconButton onClick={handleOpen} size="small">
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          sx={{ '& .MuiList-root': { width: 160 } }}
        >
          <MenuItem onClick={handleDownload}>Télécharger</MenuItem>
          {hasComments && (
            <MenuItem onClick={handleViewComments}>
              Voir Commentaires ({row.messages.length})
            </MenuItem>
          )}
          {isPending && isAdmin && (
            <>
              <MenuItem onClick={handleAccept} sx={{ color: 'success.main' }}>
                Accepter
              </MenuItem>
              <MenuItem onClick={handleReject} sx={{ color: 'error.main' }}>
                Rejeter
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
    );
  };

  const handleAcceptConfirm = async (message?: string) => {
    if (selectedDecompte?.n_decompte) {
      await dispatch(acceptDecompte(selectedDecompte.n_decompte, token, message));
      setSelectedDecompte(null);
    }
  };

  const handleRejectConfirm = async (message: string) => {
    if (selectedDecompte?.n_decompte) {
      await dispatch(rejectDecompte(selectedDecompte.n_decompte, token, message));
      setSelectedDecompte(null);
    }
  };

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

      <Box sx={{ mb: 2, mr: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_e, v) => setStatusFilter(v)}
          aria-label="status filter tabs"
        >
          <Tab label="En attente" value="pending" />
          <Tab label="Acceptés" value="accepted" />
          <Tab label="Rejetés" value="rejected" />
        </Tabs>
      </Box>
      {filteredRows.length === 0 ? (
        <NoData />
      ) : (
        <Box
          sx={{
            // Decompte-specific header spacing adjustments to avoid overlap
            '& .MuiDataGrid-columnHeaders': { minHeight: 56 },
            '& .MuiDataGrid-columnHeader': { py: 1 },
            '& .MuiDataGrid-columnHeaderTitleContainer': { gap: 1 },
            '& .MuiDataGrid-columnHeadersInner': { px: 1 },
            '& .MuiDataGrid-columnHeader .MuiSvgIcon-root': { mr: 0.5 },
          }}
        >
          <SmartTable
            columns={columns}
            rows={filteredRows}
            getRowId={(row: any) => row.n_decompte ?? row?.mission?.n_mission}
            loading={loading}
            noRowsOverlay={NoData as any}
            enableHeaderSearch
            dateFields={['date_mission', 'date_sortie', 'date_retour']}
          />
        </Box>
      )}

      {/* Accept Dialog */}
      <AcceptDecompteDialog
        open={acceptDialogOpen}
        onClose={() => {
          setAcceptDialogOpen(false);
          setSelectedDecompte(null);
        }}
        onConfirm={handleAcceptConfirm}
        decompte={selectedDecompte}
      />

      {/* Reject Dialog */}
      <RejectDecompteDialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setSelectedDecompte(null);
        }}
        onConfirm={handleRejectConfirm}
        decompte={selectedDecompte}
      />

      {/* Comments Dialog */}
      <ViewCommentsDialog
        open={commentsDialogOpen}
        onClose={() => {
          setCommentsDialogOpen(false);
          setSelectedDecompte(null);
        }}
        decompte={selectedDecompte}
      />
    </Stack>
  );
};

export default DecomptesPage;
