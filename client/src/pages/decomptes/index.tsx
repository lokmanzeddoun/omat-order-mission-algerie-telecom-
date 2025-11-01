import {
  Box,
  Typography,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Container,
  Paper,
  Grid,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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
  const [selectedDecompte, setSelectedDecompte] = useState<any>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchAllDecompte(token));
  }, [dispatch, token, selectedYear]);

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
    {
      field: 'n_decompte',
      headerName: 'N Décompte',
      minWidth: 130,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
    },
    {
      field: 'date_decompte',
      headerName: 'Date Décompte',
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.createdAt;
        return v ? moment(v).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'n_mission',
      headerName: 'N Mission',
      minWidth: 130,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      valueGetter: (p: any) => p?.row?.mission?.n_mission ?? '-'
    },
    {
      field: 'date_mission',
      headerName: 'Date Mission',
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'matricule',
      headerName: 'Matricule',
      minWidth: 130,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      valueGetter: (p: any) => p?.row?.mission?.user?.matricule ?? '-'
    },
    {
      field: 'nom_prenom',
      headerName: 'Nom Prénom',
      minWidth: 200,
      valueGetter: (p: any) => {
        const u = p?.row?.mission?.user;
        if (!u) return '-';
        return `${u.nom ?? ''} ${u.prenom ?? ''}`.trim() || '-';
      },
    },
    {
      field: 'date_sortie',
      headerName: 'Date Sortie',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'date_retour',
      headerName: 'Date Retour',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_retour;
        return v ? moment(v).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'destination',
      headerName: 'Destination',
      minWidth: 180,
      valueGetter: (p: any) => p?.row?.mission?.destination ?? '-'
    },
    {
      field: 'transport',
      headerName: 'Moyen Transport',
      minWidth: 260,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.transport;
        const label = v ? transportMapping[v] || v : '-';
        return <Chip label={label} size="small" color={label !== '-' ? 'default' : 'default'} />;
      },
    },
    {
      field: 'motif',
      headerName: 'Motif de Déplacement',
      minWidth: 280,
      valueGetter: (p: any) => p?.row?.mission?.motif ?? '-'
    },
    {
      field: 'heure_sortie',
      headerName: 'Heure Sortie',
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_sortie;
        return v ? moment(v).format('HH:mm') : '-';
      },
    },
    {
      field: 'heure_retour',
      headerName: 'Heure Retour',
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const v = p?.row?.mission?.date_retour;
        return v ? moment(v).format('HH:mm') : '-';
      },
    },
    {
      field: 'repas_pec',
      headerName: 'Nbr Repas PEC',
      type: 'number',
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
    },
    {
      field: 'hebergement_pec',
      headerName: 'Nbr Hébergement PEC',
      type: 'number',
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
    },
    {
      field: 'repas_sans_pec',
      headerName: 'Nbr Repas non PEC',
      type: 'number',
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
    },
    {
      field: 'hebergement_sans_pec',
      headerName: 'Nbr Hébergement non PEC',
      type: 'number',
      minWidth: 240,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
    },
    {
      field: 'montant',
      headerName: 'Montant (DA)',
      type: 'number',
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (p: any) => {
        const val = p?.value;
        return val != null ? `${val.toFixed(2)} DA` : '-';
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
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

  const totalDecomptes = allRows.length;
  const pendingDecomptes = allRows.filter((d) => d.status === 'PENDING').length;
  const acceptedDecomptes = allRows.filter((d) => d.status === 'ACCEPTED').length;
  const rejectedDecomptes = allRows.filter((d) => d.status === 'REGECTED').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Gestion des Décomptes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer et valider les décomptes de missions
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => dispatch(fetchAllDecompte(token))}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <RefreshIcon color="primary" />
            </IconButton>
          </Tooltip>
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
              <ReceiptIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Total Décomptes
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalDecomptes}
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
              <ReceiptIcon sx={{ fontSize: 24, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                En Attente
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="warning.main">
              {pendingDecomptes}
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
              <ReceiptIcon sx={{ fontSize: 24, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Acceptés
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="success.main">
              {acceptedDecomptes}
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
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ReceiptIcon sx={{ fontSize: 24, color: 'error.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Rejetés
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="error.main">
              {rejectedDecomptes}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => {
            setTab(v);
          }}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 64,
            },
          }}
        >
          <Tab label={`Tous les Décomptes (${totalDecomptes})`} />
          <Tab label={`Mes Décomptes (${filteredRows.length})`} />
        </Tabs>
      </Paper>

      {/* Table Card */}
      <Paper
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
      {filteredRows.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <NoData />
        </Box>
      ) : (
        <SmartTable
          columns={columns}
          rows={filteredRows}
          getRowId={(row: any) => row.n_decompte ?? row?.mission?.n_mission}
          loading={loading}
          noRowsOverlay={NoData as any}
          enableHeaderSearch
          dateFields={['date_mission', 'date_sortie', 'date_retour']}
        />
      )}
      </Paper>

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
    </Container>
  );
};

export default DecomptesPage;
