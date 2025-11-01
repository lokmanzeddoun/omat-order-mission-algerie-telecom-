import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Typography,
  Paper,
  Stack,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Container,
  Grid,
  Chip,
  Card,
  CardContent,
  alpha,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Comment as CommentIcon,
  PersonOutline as PersonIcon,
  LockReset as LockResetIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  FlagOutlined as FlagIcon,
} from '@mui/icons-material';
import http from 'helpers/http';
import PageLoader from 'components/loader/PageLoader';
import { setAlert } from 'components/alert/alert.reducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { AlertTypes } from 'constants/alert';

const AdminComments = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get('/comments/admin');
      setItems(res.data || []);
    } catch (err: any) {
      dispatch(setAlert({ msg: err?.response?.data?.message || err.message, type: AlertTypes.ERROR }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  // Define which comment types are for admins
  const ADMIN_TYPES = ['OTHER', 'SUPPORT', 'FORGET_PASSWORD'];

  // Helper to resolve user id and display name from different shapes
  const resolveUser = (it: any) => {
    // priority: nom/prenom, it.user.{id,nom,prenom,name}, it.userId, it.name
    const id = it.userId || (it.user && (it.user.id || it.user.userId)) || null;
    const nom = it.nom || (it.user && (it.user.nom || it.user.lastName)) || null;
    const prenom = it.prenom || (it.user && (it.user.prenom || it.user.firstName)) || null;
    const fullName = [nom, prenom].filter(Boolean).join(' ') || it.name || (it.user && it.user.name) || null;
    return { id, name: fullName };
  };

  // Fetch user names for items that don't include a name but have an id
  const fetchMissingUserNames = useCallback(
    async (itemsList: any[]) => {
      const ids = itemsList
        .map((it) => resolveUser(it).id)
        .filter(Boolean)
        .map(String)
        .filter((id) => !userNames[id]);
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length === 0) return;
      try {
        const results = await Promise.all(uniqueIds.map((id) => http.get(`/users/${id}`)));
        const map: Record<string, string> = {};
        results.forEach((r, idx) => {
          const id = uniqueIds[idx];
          const data = r.data || {};
          const name = (data.nom || data.lastName || data.name) && (data.prenom || data.firstName)
            ? `${data.nom || data.lastName || ''} ${data.prenom || data.firstName || ''}`.trim()
            : data.name || `${data.nom || data.lastName || ''}`.trim();
          if (name) map[id] = name;
        });
        if (Object.keys(map).length) setUserNames((s) => ({ ...s, ...map }));
      } catch (err: any) {
        // don't block UI, but report error
        dispatch(setAlert({ msg: err?.response?.data?.message || 'Failed to fetch user names', type: AlertTypes.ERROR }));
      }
    },
    [dispatch, userNames],
  );

  // whenever items change, fetch missing names
  useEffect(() => {
    if (items.length) fetchMissingUserNames(items);
  }, [items, fetchMissingUserNames]);

  // humanize strings and map SUPPORT -> COMMENTAIRE
  const humanize = (s?: string) => {
    if (!s) return '';
    if (s === 'SUPPORT') return 'COMMENTAIRE';
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleReset = async (userId: number) => {
    try {
      const res = await http.post(`/users/${userId}/reset-password`);
      const pwd = res.data?.tempPassword;
      dispatch(setAlert({ msg: `Password reset: ${pwd}`, type: AlertTypes.SUCCESS }));
      // reload list
      load();
    } catch (err: any) {
      dispatch(setAlert({ msg: err?.response?.data?.message || err.message, type: AlertTypes.ERROR }));
    }
  };

  const openDetails = (item: any) => {
    setSelected(item);
    setOpenDetail(true);
  };

  const closeDetails = () => {
    setSelected(null);
    setOpenDetail(false);
  };

  // Get status color
  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'closed') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'open') return 'primary';
    return 'default';
  };

  // Get type color
  const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' => {
    if (type === 'FORGET_PASSWORD') return 'error';
    if (type === 'SUPPORT' || type === 'COMMENTAIRE') return 'primary';
    return 'secondary';
  };

  // Filter items
  const adminItems = items.filter((it) => ADMIN_TYPES.includes(it.type));
  const filteredItems = adminItems.filter((it) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const u = resolveUser(it);
    const userName = u.name || (u.id ? userNames[String(u.id)] : null) || '';
    return (
      it.title?.toLowerCase().includes(q) ||
      it.type?.toLowerCase().includes(q) ||
      it.status?.toLowerCase().includes(q) ||
      userName.toLowerCase().includes(q) ||
      it.content?.toLowerCase().includes(q) ||
      it.description?.toLowerCase().includes(q)
    );
  });

  if (loading) return <PageLoader />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <CommentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Commentaires
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer et répondre aux commentaires soumis par les utilisateurs
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={load}
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
          placeholder="Rechercher par titre, type, statut, utilisateur..."
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

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total
            </Typography>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {adminItems.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Mot de passe oublié
            </Typography>
            <Typography variant="h4" fontWeight="600" color="error.main">
              {adminItems.filter((it) => it.type === 'FORGET_PASSWORD').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.04),
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Support
            </Typography>
            <Typography variant="h4" fontWeight="600" color="text.primary">
              {adminItems.filter((it) => it.type === 'SUPPORT').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.04),
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Autres
            </Typography>
            <Typography variant="h4" fontWeight="600" color="secondary.main">
              {adminItems.filter((it) => it.type === 'OTHER').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
          }}
        >
          <CommentIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
            {searchQuery ? 'Aucun résultat trouvé' : 'Aucun commentaire'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? 'Essayez de modifier votre recherche'
              : 'Les commentaires apparaîtront ici lorsque les utilisateurs en soumettront'}
          </Typography>
          {!searchQuery && (
            <Button sx={{ mt: 2 }} variant="contained" onClick={load} startIcon={<RefreshIcon />}>
              Actualiser
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredItems.map((it) => {
            const u = resolveUser(it);
            const userName = u.name || (u.id ? userNames[String(u.id)] : null) || u.id || 'Inconnu';

            return (
              <Card
                key={it.id}
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
                    {/* Title & Type */}
                    <Grid item xs={12} md={5}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <CategoryIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom>
                            {it.title || 'Sans titre'}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip
                              label={humanize(it.type)}
                              size="small"
                              color={getTypeColor(it.type)}
                              variant="outlined"
                            />
                            <Chip
                              label={humanize(it.status)}
                              size="small"
                              color={getStatusColor(it.status)}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    </Grid>

                    {/* User Info */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                            Utilisateur
                          </Typography>
                          <Typography variant="body2" fontWeight="500" color="text.primary">
                            {userName}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} md={3}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {it.type === 'FORGET_PASSWORD' ? (
                          <Tooltip title="Réinitialiser le mot de passe">
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              startIcon={<LockResetIcon />}
                              onClick={async () => {
                                if (!u.id) {
                                  dispatch(
                                    setAlert({
                                      msg: "Aucun ID utilisateur disponible pour la réinitialisation",
                                      type: AlertTypes.ERROR,
                                    })
                                  );
                                  return;
                                }
                                await handleReset(u.id);
                              }}
                              disabled={!u.id}
                            >
                              Réinitialiser
                            </Button>
                          </Tooltip>
                        ) : it.type === 'OTHER' ? (
                          <Tooltip title="Voir les détails">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<InfoIcon />}
                              onClick={() => openDetails(it)}
                            >
                              Détails
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Marquer comme traité">
                            <Button variant="outlined" size="small" startIcon={<FlagIcon />}>
                              Action
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Détails du commentaire</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ opacity: 0.8 }}>
                  Titre
                </Typography>
                <Typography variant="h6" fontWeight="600" color="text.primary">
                  {selected.title || 'Sans titre'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ opacity: 0.8 }}>
                  Type & Statut
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={humanize(selected.type)}
                    size="small"
                    color={getTypeColor(selected.type)}
                  />
                  <Chip
                    label={humanize(selected.status)}
                    size="small"
                    color={getStatusColor(selected.status)}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ opacity: 0.8 }}>
                  Contenu
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {selected.content || selected.description || 'Aucun détail supplémentaire.'}
                  </Typography>
                </Paper>
              </Box>

              {(selected.nom || selected.prenom) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block" sx={{ opacity: 0.8 }}>
                      Nom de l'utilisateur
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="action" />
                      <Typography variant="body1" fontWeight="500" color="text.primary">
                        {selected.nom || ''} {selected.prenom || ''}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminComments;
