import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  Paper,
  Grid,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FolderOpen as FolderOpenIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Visibility as VisibilityIcon,
  Unarchive as UnarchiveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import http from 'helpers/http';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';

type Mission = {
  n_mission: number;
  destination?: string | null;
  motif?: string | null;
  updatedAt: string;
};

type Decompte = {
  n_decompte: number;
  montant: number;
  updatedAt: string;
  mission?: { n_mission: number };
};

type User = {
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  category: string;
  grade: string;
  structure?: { name: string } | null;
  updatedAt: string;
};

type Structure = {
  code: string;
  name: string;
  updatedAt?: string;
  users?: any[];
};

const ArchivePage = () => {
  const [tab, setTab] = useState<'missions' | 'decomptes' | 'users' | 'structures'>('missions');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [decomptes, setDecomptes] = useState<Decompte[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [itemToUnarchive, setItemToUnarchive] = useState<any>(null);
  const { token } = useSelector((s: RootState) => s.auth);
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);

  const loadArchiveData = () => {
    const headers = { Authorization: `Bearer ${token}` };
    const params = selectedYear ? { year: selectedYear } : {};
    http
      .get<Mission[]>('/archive/missions', { headers, params })
      .then((r) => setMissions(r.data || []))
      .catch(() => setMissions([]));
    http
      .get<Decompte[]>('/archive/decomptes', { headers, params })
      .then((r) => setDecomptes(r.data || []))
      .catch(() => setDecomptes([]));
    http
      .get<User[]>('/archive/users', { headers })
      .then((r) => setUsers(r.data || []))
      .catch(() => setUsers([]));
    http
      .get<Structure[]>('/archive/structures', { headers })
      .then((r) => setStructures(r.data || []))
      .catch(() => setStructures([]));
  };

  useEffect(() => {
    loadArchiveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedYear]);

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleUnarchive = (item: any) => {
    setItemToUnarchive(item);
    setUnarchiveModalOpen(true);
  };

  const confirmUnarchive = async () => {
    if (!itemToUnarchive) return;
    
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (tab === 'missions') {
        await http.patch(`/archive/missions/${itemToUnarchive.n_mission}/restore`, {}, { headers });
      } else if (tab === 'decomptes') {
        await http.patch(`/archive/decomptes/${itemToUnarchive.n_decompte}/restore`, {}, { headers });
      } else if (tab === 'users') {
        await http.patch(`/archive/users/${itemToUnarchive.matricule}/restore`, {}, { headers });
      } else if (tab === 'structures') {
        await http.patch(`/archive/structures/${itemToUnarchive.code}/restore`, {}, { headers });
      }
      loadArchiveData();
      setUnarchiveModalOpen(false);
      setItemToUnarchive(null);
    } catch (error) {
      console.error('Error unarchiving item:', error);
    }
  };

  const filteredMissions = missions.filter(
    (m) =>
      m.n_mission.toString().includes(searchQuery) ||
      m.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.motif?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecomptes = decomptes.filter(
    (d) =>
      d.n_decompte.toString().includes(searchQuery) ||
      d.mission?.n_mission.toString().includes(searchQuery) ||
      d.montant.toString().includes(searchQuery)
  );

  const filteredUsers = users.filter(
    (u) =>
      u.matricule.toString().includes(searchQuery) ||
      u.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.structure?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStructures = structures.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <FolderOpenIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="600">
            Archive
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Consultez l'historique des missions et décomptes archivés
          {selectedYear && ` pour l'exercice ${selectedYear}`}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          placeholder={
            tab === 'missions'
              ? 'Rechercher par numéro, destination ou motif...'
              : tab === 'decomptes'
                ? 'Rechercher par numéro de décompte ou mission...'
                : tab === 'users'
                  ? 'Rechercher par matricule, nom, email...'
                  : 'Rechercher par code ou nom de structure...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
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
          <Tab
            value="missions"
            icon={<AssignmentIcon />}
            iconPosition="start"
            label={`Missions (${filteredMissions.length})`}
          />
          <Tab
            value="decomptes"
            icon={<ReceiptIcon />}
            iconPosition="start"
            label={`Décomptes (${filteredDecomptes.length})`}
          />
          <Tab
            value="users"
            icon={<PeopleIcon />}
            iconPosition="start"
            label={`Utilisateurs (${filteredUsers.length})`}
          />
          <Tab
            value="structures"
            icon={<AccountTreeIcon />}
            iconPosition="start"
            label={`Structures (${filteredStructures.length})`}
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {tab === 'missions' ? (
        <Box>
          {filteredMissions.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <FolderOpenIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune mission archivée'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les missions archivées apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredMissions.map((m) => (
                <Card
                  key={m.n_mission}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Mission
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="text.primary">
                              #{m.n_mission}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                          {m.destination && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight="500" color="text.primary">
                                {m.destination}
                              </Typography>
                            </Box>
                          )}
                          {m.motif && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {m.motif}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(m.updatedAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2.5}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(m)}
                              sx={{ color: 'primary.main' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Désarchiver">
                            <IconButton
                              size="small"
                              onClick={() => handleUnarchive(m)}
                              sx={{ color: 'success.main' }}
                            >
                              <UnarchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : tab === 'decomptes' ? (
        <Box>
          {filteredDecomptes.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <ReceiptIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun décompte archivé'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les décomptes archivés apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredDecomptes.map((d) => (
                <Card
                  key={d.n_decompte}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ReceiptIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Décompte
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="text.primary">
                              #{d.n_decompte}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {d.mission?.n_mission && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Mission associée
                            </Typography>
                            <Chip
                              label={`#${d.mission.n_mission}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Montant
                            </Typography>
                            <Typography variant="body1" fontWeight="600" color="success.main">
                              {formatCurrency(d.montant)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(d.updatedAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2.5}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(d)}
                              sx={{ color: 'primary.main' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Désarchiver">
                            <IconButton
                              size="small"
                              onClick={() => handleUnarchive(d)}
                              sx={{ color: 'success.main' }}
                            >
                              <UnarchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : tab === 'users' ? (
        <Box>
          {filteredUsers.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <PeopleIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun utilisateur archivé'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les utilisateurs archivés apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredUsers.map((u) => (
                <Card
                  key={u.matricule}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                            Matricule
                          </Typography>
                          <Typography variant="h6" fontWeight="600" color="text.primary">
                            #{u.matricule}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="body1" fontWeight="600" color="text.primary">
                            {u.nom} {u.prenom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Stack direction="row" spacing={1}>
                          <Chip label={u.role} size="small" color="primary" variant="outlined" />
                          <Chip label={u.category} size="small" color="secondary" variant="outlined" />
                        </Stack>
                        {u.structure?.name && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {u.structure.name}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(u.updatedAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(u)}
                              sx={{ color: 'primary.main' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Désarchiver">
                            <IconButton
                              size="small"
                              onClick={() => handleUnarchive(u)}
                              sx={{ color: 'success.main' }}
                            >
                              <UnarchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Box>
          {filteredStructures.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <AccountTreeIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune structure archivée'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les structures archivées apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredStructures.map((s) => (
                <Card
                  key={s.code}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountTreeIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Code
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="text.primary">
                              #{s.code}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                            Nom de la structure
                          </Typography>
                          <Typography variant="body1" fontWeight="600" color="text.primary">
                            {s.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        {s.users && s.users.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Utilisateurs
                            </Typography>
                            <Chip label={s.users.length} size="small" color="info" />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        {s.updatedAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(s.updatedAt)}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(s)}
                              sx={{ color: 'primary.main' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Désarchiver">
                            <IconButton
                              size="small"
                              onClick={() => handleUnarchive(s)}
                              sx={{ color: 'success.main' }}
                            >
                              <UnarchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Container>

      {/* Unarchive Confirmation Modal */}
      <Dialog
        open={unarchiveModalOpen}
        onClose={() => setUnarchiveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UnarchiveIcon color="success" />
          Confirmer la désarchivage
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir désarchiver cet élément ? Il sera restauré et redeviendra visible dans la liste principale.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUnarchiveModalOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button onClick={confirmUnarchive} variant="contained" color="success" startIcon={<UnarchiveIcon />}>
            Désarchiver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon color="primary" />
            Détails de l'élément archivé
          </Box>
          <IconButton onClick={() => setDetailModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {selectedItem && tab === 'missions' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  N° Mission
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  #{(selectedItem as Mission).n_mission}
                </Typography>
              </Box>
              <Divider />
              {(selectedItem as Mission).destination && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Destination
                  </Typography>
                  <Typography variant="body1">{(selectedItem as Mission).destination}</Typography>
                </Box>
              )}
              {(selectedItem as Mission).motif && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Motif
                  </Typography>
                  <Typography variant="body1">{(selectedItem as Mission).motif}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date d'archivage
                </Typography>
                <Typography variant="body1">{formatDate((selectedItem as Mission).updatedAt)}</Typography>
              </Box>
            </Stack>
          )}
          {selectedItem && tab === 'decomptes' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  N° Décompte
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  #{(selectedItem as Decompte).n_decompte}
                </Typography>
              </Box>
              <Divider />
              {(selectedItem as Decompte).mission?.n_mission && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Mission associée
                  </Typography>
                  <Chip label={`#${(selectedItem as Decompte).mission?.n_mission}`} color="primary" />
                </Box>
              )}
              {(selectedItem as Decompte).montant !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Montant
                  </Typography>
                  <Typography variant="h6" color="success.main" fontWeight="600">
                    {formatCurrency((selectedItem as Decompte).montant)}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date d'archivage
                </Typography>
                <Typography variant="body1">{formatDate((selectedItem as Decompte).updatedAt)}</Typography>
              </Box>
            </Stack>
          )}
          {selectedItem && tab === 'users' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Matricule
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  #{(selectedItem as User).matricule}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Nom complet
                </Typography>
                <Typography variant="body1">
                  {(selectedItem as User).nom} {(selectedItem as User).prenom}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Email
                </Typography>
                <Typography variant="body1">{(selectedItem as User).email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Rôle et Catégorie
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={(selectedItem as User).role} size="small" color="primary" />
                  <Chip label={(selectedItem as User).category} size="small" color="secondary" />
                </Stack>
              </Box>
              {(selectedItem as User).structure?.name && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Structure
                  </Typography>
                  <Typography variant="body1">{(selectedItem as User).structure?.name}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date d'archivage
                </Typography>
                <Typography variant="body1">{formatDate((selectedItem as User).updatedAt)}</Typography>
              </Box>
            </Stack>
          )}
          {selectedItem && tab === 'structures' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Code
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  #{(selectedItem as Structure).code}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Nom de la structure
                </Typography>
                <Typography variant="body1">{(selectedItem as Structure).name}</Typography>
              </Box>
              {(selectedItem as Structure).users && (selectedItem as Structure).users && (selectedItem as Structure).users!.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Nombre d'utilisateurs
                  </Typography>
                  <Chip label={(selectedItem as Structure).users?.length} color="info" />
                </Box>
              )}
              {(selectedItem as Structure).updatedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Date d'archivage
                  </Typography>
                  <Typography variant="body1">{formatDate((selectedItem as Structure).updatedAt!)}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)} color="inherit">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ArchivePage;
