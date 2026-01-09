import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import http from "../api/http";

type AdminStats = {
  totalUsers: number;

  ageUnder18: number;
  age18to25: number;
  age25to35: number;
  age35to50: number;
  age50plus: number;

  carteElecteurFalse: number;
  nonVoteFalse: number;
  nonInscritFalse: number;
  isMemberFalse: number;
};

type AdminUserRow = {
  userId: string;
  phone: string;

  commune: string | null;
  prenom: string | null;
  nom: string | null;
  dateNaissance: string | null; // YYYY-MM-DD

  carteElecteur: boolean | null;
  nonVote: boolean | null;
  nonInscrit: boolean | null;
  isMember: boolean | null;

  createdAt?: string | null; // optional if you have it
};

type PagedUsers = {
  items: AdminUserRow[];
  total: number;
  page: number;
  size: number;
};

function ynChip(
  value: boolean | null | undefined,
  trueLabel = "Oui",
  falseLabel = "Non"
) {
  if (value === null || value === undefined) {
    return <Chip size="small" label="—" variant="outlined" />;
  }
  return value ? (
    <Chip size="small" label={trueLabel} color="success" />
  ) : (
    <Chip size="small" label={falseLabel} color="warning" />
  );
}

function fullName(u: AdminUserRow) {
  const p = (u.prenom ?? "").trim();
  const n = (u.nom ?? "").trim();
  const s = `${p} ${n}`.trim();
  return s || "—";
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [users, setUsers] = useState<PagedUsers>({
    items: [],
    total: 0,
    page: 0,
    size: 10,
  });

  const totalPages = useMemo(() => {
    if (!users.total) return 1;
    return Math.max(1, Math.ceil(users.total / users.size));
  }, [users.total, users.size]);

  async function loadStats() {
    const res = await http.get<AdminStats>("/admin/stats");
    setStats(res.data);
  }

  async function loadUsers(p = page, s = rowsPerPage) {
    setLoadingUsers(true);
    try {
      const res = await http.get<PagedUsers>("/admin/users", {
        params: { page: p, size: s },
      });
      setUsers(res.data);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadUsers(0, rowsPerPage)]);
      setPage(0);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible de charger les données admin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangePage(_: unknown, newPage: number) {
    setPage(newPage);
    await loadUsers(newPage, rowsPerPage);
  }

  async function handleChangeRowsPerPage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const newSize = parseInt(event.target.value, 10);
    setRowsPerPage(newSize);
    setPage(0);
    await loadUsers(0, newSize);
  }
  async function downloadExcel() {
    const res = await http.get("/admin/export/users.xlsx", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "massification_users.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Box
        sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Chargement Admin...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", background: "#0b0b0b", py: { xs: 2, sm: 4 } }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.95)",
          }}
        >
          <Stack spacing={2.2}>
            {/* Header */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
            >
              <Stack spacing={0.3}>
                <Typography variant="h5" fontWeight={900} color="primary">
                  Admin • Massification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Statistiques + liste paginée des utilisateurs
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAll}
              >
                Rafraîchir
              </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Divider />

            {/* Stats */}
            <Typography fontWeight={900} sx={{ mt: 0.5 }}>
              Statistiques
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Total utilisateurs
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {stats?.totalUsers ?? 0}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ flex: 2 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Répartition par âge
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap" }}
                  >
                    <Chip label={`<18: ${stats?.ageUnder18 ?? 0}`} />
                    <Chip label={`18–25: ${stats?.age18to25 ?? 0}`} />
                    <Chip label={`25–35: ${stats?.age25to35 ?? 0}`} />
                    <Chip label={`35–50: ${stats?.age35to50 ?? 0}`} />
                    <Chip label={`50+: ${stats?.age50plus ?? 0}`} />
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ flex: 2 }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    Compteurs (valeur = false)
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap" }}
                  >
                    <Chip
                      label={`Carte électeur = Non: ${
                        stats?.carteElecteurFalse ?? 0
                      }`}
                    />
                    <Chip
                      label={`Non vote = Non: ${stats?.nonVoteFalse ?? 0}`}
                    />
                    <Chip
                      label={`Non inscrit = Non: ${
                        stats?.nonInscritFalse ?? 0
                      }`}
                    />
                    <Chip
                      label={`Membre PASTEF = Non: ${
                        stats?.isMemberFalse ?? 0
                      }`}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            <Divider />

            {/* Users table */}
            <Stack spacing={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Button variant="contained" onClick={downloadExcel}>
                  Exporter Excel
                </Button>

                <Typography fontWeight={900}>Utilisateurs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Page {page + 1}/{totalPages} • Total: {users.total}
                </Typography>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Commune</TableCell>
                      <TableCell>Date naissance</TableCell>
                      <TableCell align="center">Carte électeur</TableCell>
                      <TableCell align="center">Non vote</TableCell>
                      <TableCell align="center">Non inscrit</TableCell>
                      <TableCell align="center">Membre</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <CircularProgress size={18} />
                            <Typography color="text.secondary">
                              Chargement...
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : users.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Typography color="text.secondary">
                            Aucun utilisateur.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.items.map((u) => (
                        <TableRow key={u.userId} hover>
                          <TableCell>{fullName(u)}</TableCell>
                          <TableCell>{u.phone}</TableCell>
                          <TableCell>{u.commune ?? "—"}</TableCell>
                          <TableCell>{u.dateNaissance ?? "—"}</TableCell>
                          <TableCell align="center">
                            {ynChip(u.carteElecteur)}
                          </TableCell>
                          <TableCell align="center">
                            {ynChip(u.nonVote)}
                          </TableCell>
                          <TableCell align="center">
                            {ynChip(u.nonInscrit)}
                          </TableCell>
                          <TableCell align="center">
                            {ynChip(u.isMember)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={users.total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </TableContainer>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
