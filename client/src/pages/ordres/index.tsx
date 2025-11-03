import {
  Box,
  Typography,
  Chip,
  Container,
  Paper,
  Grid,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon,
  CheckCircle as ValidateIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';
import {
  fetchUserOrders,
  deleteOrder,
  updateMission,
  archiveMission,
} from 'components/orders/orderthunk';
import SmartTable, { SmartTableColumn } from 'components/common/SmartTable';
import moment from 'moment';
import NoData from 'components/users/NoData';
import Splash from 'components/loader/Splash';
import RenderCellDownload from 'components/orders/RenderCellDownload';
import ActionMenu from 'components/orders/ActionMenu';
import EditMissionModal from 'components/orders/EditMissionModal';
import ConfirmDeletionModal from 'components/orders/DeleteMissionModal';
import ArchiveMissionDialog from 'components/orders/ArchiveMissionDialog';
import ValidateMissionDialog from 'components/orders/ValidateMissionDialog';
import { IMission } from 'components/orders/orderReducer';
import { IDecompte } from 'components/orders/ValidateMissionDialog';
import { addDecompte } from 'components/orders/decompte.thunk';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { saveAs } from 'file-saver';

const OrderDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((s: RootState) => s.orders);
  const { token } = useSelector((state: RootState) => state.auth);
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);

  const [selectedOrder, setSelectedOrder] = useState<IMission | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isValidateModalOpen, setValidateModalOpen] = useState(false);
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchUserOrders(token));
  }, [dispatch, token, selectedYear]);

  const totalMissions = orders?.length || 0;
  const pendingMissions = orders?.filter((m: any) => m.status === 'PENDING')?.length || 0;
  const approvedMissions = orders?.filter((m: any) => m.status === 'APPROVED')?.length || 0;
  const inProgressMissions = orders?.filter((m: any) => m.status === 'INPROGRESS')?.length || 0;

  const transportMapping: { [key: string]: string } = {
    SERVICE_CAR: 'Véhicule de service',
    TRANSPORT_ENTREPRISE:
      "Autre moyens de transport dont les dépenses sont prises en charge par l'entreprise",
    TRANSPORT_EMPLOYEE: 'Moyens de transport dont les dépenses sont prises en charge par le travailleur',
    PERSONAL_CAR: "Utilisation exceptionnelle du véhicule personnel",
  };

  const columns: SmartTableColumn[] = [
    {
      field: 'motif',
      headerName: 'Motif',
      minWidth: 220,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'date_sortie',
      headerName: 'Date De Sortie',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (params: any) => {
        const value = params?.row?.date_sortie;
        return value ? moment(value).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'heure_sortie',
      headerName: 'Heure De Sortie',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (params: any) => {
        const ds = params?.row?.date_sortie;
        return ds ? moment(ds).format('HH:mm') : '-';
      },
    },
    {
      field: 'date_retour',
      headerName: 'Date De Retour',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (params: any) => {
        const value = params?.row?.date_retour;
        return value ? moment(value).format('YYYY/MM/DD') : '-';
      },
    },
    {
      field: 'heure_retour',
      headerName: 'Heure De Retour',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (params: any) => {
        const dr = params?.row?.date_retour;
        return dr ? moment(dr).format('HH:mm') : '-';
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        const statusTranslations: { [key: string]: string } = {
          PENDING: 'En attente',
          COMPLETED: 'Terminé',
          INPROGRESS: 'En cours',
        };
        const translatedLabel = statusTranslations[params?.value] || 'Inconnu';
        const color =
          params?.value === 'PENDING'
            ? 'primary'
            : params?.value === 'COMPLETED'
              ? 'success'
              : params?.value === 'INPROGRESS'
                ? 'warning'
                : 'info';
        return <Chip label={translatedLabel} size="small" color={color} />;
      },
    },
    {
      field: 'destination',
      headerName: 'Destination',
      minWidth: 180,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'transport',
      headerName: 'Transport',
      minWidth: 320,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        const raw = params?.value ?? '';
        const translatedLabel = transportMapping[raw] || raw;
        return <Chip label={translatedLabel} size="small" color="default" />;
      },
    },
    {
      field: 'timeLeft',
      headerName: 'Temp de Mission',
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      headerSearchable: false,
      renderCell: (params: any) => {
        const { date_sortie, date_retour } = params?.row || {};
        if (!date_sortie || !date_retour) return '-';
        const startDate = moment(date_sortie);
        const endDate = moment(date_retour);
        const duration = moment.duration(endDate.diff(startDate));
        const hoursLeft = Math.floor(duration.asHours());
        const daysLeft = Math.floor(duration.asDays());
        return <span>{daysLeft > 0 ? `${daysLeft} jour(s)` : `${hoursLeft} heure(s)`}</span>;
      },
    },
    {
      field: 'download',
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      minWidth: 140,
      headerSearchable: false,
      renderCell: (params: any) => <RenderCellDownload params={params} />,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      minWidth: 80,
      headerSearchable: false,
      renderCell: (params: any) => (
        <ActionMenu
          order={params.row}
          onEdit={() => handleEdit(params.row)}
          onDelete={() => handleDelete(params.row)}
          onValidate={() => handleValidate(params.row)}
          onArchive={() => handleArchive(params.row)}
        />
      ),
    },
  ];

  const handleEdit = useCallback((order: IMission) => {
    setSelectedOrder(order);
    setViewOnly(false);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((order: IMission) => {
    setSelectedOrder(order);
    setDeleteModalOpen(true);
  }, []);

  const handleValidate = useCallback((order: IMission) => {
    setSelectedOrder(order);
    setValidateModalOpen(true);
  }, []);

  const handleArchive = useCallback((order: IMission) => {
    setSelectedOrder(order);
    setArchiveModalOpen(true);
  }, []);

  const handleViewDetails = useCallback((row: IMission) => {
    setSelectedOrder(row);
    setViewOnly(true);
    setEditModalOpen(true);
  }, []);

  const handleDownloadMission = useCallback(async (order: IMission) => {
    if (!order?.n_mission) {
      dispatch(setAlert({ msg: 'Mission invalide pour le téléchargement', type: AlertTypes.ERROR }));
      return;
    }

    if (!token) {
      dispatch(setAlert({ msg: 'Session expirée. Veuillez vous reconnecter.', type: AlertTypes.ERROR }));
      return;
    }

    try {
      const response = await http.get<Blob>(`/missions/${order.n_mission}/download`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      const rawFileName = contentDisposition?.split('filename=')[1] ?? '';
      const sanitizedFileName = rawFileName.replace(/['"]/g, '').trim() || `ordre-mission-${order.n_mission}.pdf`;

      saveAs(response.data, sanitizedFileName);
      dispatch(setAlert({ msg: 'Ordre de mission téléchargé', type: AlertTypes.SUCCESS }));
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Erreur lors du téléchargement';
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
    }
  }, [dispatch, token]);

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    await dispatch(deleteOrder(selectedOrder.n_mission ?? null));
    await dispatch(fetchUserOrders(token));
    setDeleteModalOpen(false);
  };

  const confirmArchive = async () => {
    if (!selectedOrder) return;
    await dispatch(archiveMission(selectedOrder.n_mission ?? null));
    setArchiveModalOpen(false);
  };

  const handleEditSubmit = async (data: IMission) => {
    await dispatch(updateMission(data));
    await dispatch(fetchUserOrders(token));
    setEditModalOpen(false);
  };

  const handleValidateSubmit = async (data: IDecompte) => {
    if (!selectedOrder) return;
    await dispatch(addDecompte(data, selectedOrder, token));
    await dispatch(fetchUserOrders(token));
    setValidateModalOpen(false);
  };

  const contextMenuItems = useMemo(() => [
    {
      key: 'view',
      label: 'Voir Détails',
      icon: <ViewIcon />,
      onClick: (row: IMission) => {
        handleViewDetails(row);
      },
    },
    {
      key: 'validate',
      label: 'Valider',
      icon: <ValidateIcon sx={{ color: 'success.main' }} />,
      color: 'success.main',
      onClick: (row: IMission) => {
        if ((row?.status ?? '') === 'COMPLETED') {
          dispatch(setAlert({ msg: 'Cette mission est déjà validée.', type: AlertTypes.INFO }));
          return;
        }
        handleValidate(row);
      },
    },
    {
      key: 'download',
      label: 'Télécharger',
      icon: <DownloadIcon sx={{ color: 'primary.main' }} />,
      onClick: (row: IMission) => {
        handleDownloadMission(row);
      },
    },
    {
      key: 'edit',
      label: 'Modifier',
      icon: <EditIcon />,
      onClick: (row: IMission) => {
        handleEdit(row);
      },
    },
    {
      key: 'archive',
      label: 'Archiver',
      icon: <ArchiveIcon sx={{ color: 'warning.main' }} />,
      color: 'warning.main',
      onClick: (row: IMission) => {
        if ((row?.status ?? '') !== 'COMPLETED') {
          dispatch(setAlert({ msg: 'Seules les missions terminées peuvent être archivées.', type: AlertTypes.INFO }));
          return;
        }
        handleArchive(row);
      },
    },
    {
      key: 'cancel',
      label: 'Annuler',
      icon: <CancelIcon sx={{ color: 'error.main' }} />,
      color: 'error.main',
      onClick: (row: IMission) => {
        if ((row?.status ?? '') === 'COMPLETED') {
          dispatch(setAlert({ msg: 'Impossible d’annuler une mission déjà validée.', type: AlertTypes.INFO }));
          return;
        }
        handleDelete(row);
      },
    },
  ], [dispatch, handleArchive, handleDelete, handleDownloadMission, handleEdit, handleValidate, handleViewDetails]);

  if (loading) return <Splash />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Ordres de Mission
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer et suivre les ordres de mission
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => dispatch(fetchUserOrders(token))}
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
              <AssignmentIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Total Missions
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalMissions}
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
              <AssignmentIcon sx={{ fontSize: 24, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                En Attente
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="warning.main">
              {pendingMissions}
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
              <AssignmentIcon sx={{ fontSize: 24, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Approuvées
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="success.main">
              {approvedMissions}
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
              <AssignmentIcon sx={{ fontSize: 24, color: 'text.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                En Cours
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" sx={{ color: 'text.main' }}>
              {inProgressMissions}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Card */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {orders.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <NoData />
          </Box>
        ) : (
          <SmartTable
            columns={columns}
            rows={orders}
            getRowId={(row: any) => row.n_mission}
            loading={loading}
            noRowsOverlay={NoData as any}
            enableHeaderSearch
            dateFields={['date_sortie', 'date_retour']}
            onViewDetails={handleViewDetails as any}
            contextMenuItems={contextMenuItems as any}
          />
        )}
      </Paper>

      {/* Edit/View Modal */}
      {selectedOrder && (
        <EditMissionModal
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          missionData={selectedOrder}
          onSubmit={handleEditSubmit}
          viewOnly={viewOnly}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedOrder && (
        <ConfirmDeletionModal
          open={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          itemName={{
            motif: selectedOrder.motif,
            destination: selectedOrder.destination,
          }}
          onConfirm={confirmDelete}
          title={`Annuler la mission N°${selectedOrder.n_mission}`}
          message={`Êtes-vous sûr de vouloir annuler "${selectedOrder.motif}" ?${selectedOrder.destination ? ` Destination : ${selectedOrder.destination}.` : ''}`}
          confirmText="Confirmer l'annulation"
          confirmColor="error"
        />
      )}

      {/* Validate Mission Dialog */}
      {selectedOrder && (
        <ValidateMissionDialog
          open={isValidateModalOpen}
          onClose={() => setValidateModalOpen(false)}
          mission={selectedOrder}
          onSubmit={handleValidateSubmit}
        />
      )}

      {/* Archive Mission Dialog */}
      {selectedOrder && (
        <ArchiveMissionDialog
          open={isArchiveModalOpen}
          onClose={() => setArchiveModalOpen(false)}
          onConfirm={confirmArchive}
          mission={selectedOrder}
        />
      )}
    </Container>
  );
};

export default OrderDashboard;
