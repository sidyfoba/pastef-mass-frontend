import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import http from "../api/http";
import type { MeResponse, UserProfile } from "../types/UserProfile";
import bgImage from "../assets/bg-login.jpeg";

const COMMUNES = [
  "Commune de Keur Massar Nord",
  "Commune de Keur Massar Sud",
  "Commune de Malika",
  "Commune de Jaxaay Parcelles",
  "Commune de Yeumbeul Nord",
  "Commune de Yeumbeul Sud",
];

const schema = z
  .object({
    commune: z.string().min(2, "Commune obligatoire"),
    prenom: z.string().min(2, "Prénom obligatoire"),
    nom: z.string().min(2, "Nom obligatoire"),
    dateNaissance: z.string().min(10, "Date de naissance obligatoire"),
    phone: z.string(),
    carteIdentite: z.string().min(3, "Carte d’identité obligatoire"),
    dateExpiration: z.string().min(10, "Date d’expiration obligatoire"),
    carteElecteur: z.boolean(),
    nonVote: z.boolean(),
    nonInscrit: z.boolean(),
    isMember: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.nonInscrit && data.nonVote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non inscrit et Non vote ne peuvent pas être vrais ensemble.",
        path: ["nonVote"],
      });
    }
    if (data.nonInscrit && data.carteElecteur) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non inscrit ⇒ Carte d’électeur = Non",
        path: ["carteElecteur"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const storedPhone = useMemo(() => localStorage.getItem("phone") || "", []);
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  // ✅ Snackbar state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  function showSnack(
    severity: "success" | "error" | "info" | "warning",
    msg: string
  ) {
    setSnackSeverity(severity);
    setSnackMsg(msg);
    setSnackOpen(true);
  }

  function closeSnack(_: any, reason?: string) {
    if (reason === "clickaway") return;
    setSnackOpen(false);
  }

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        commune: "",
        prenom: "",
        nom: "",
        dateNaissance: "",
        phone: storedPhone,
        carteIdentite: "",
        dateExpiration: "",
        carteElecteur: false,
        nonVote: false,
        nonInscrit: false,
        isMember: false,
      },
    });

  const nonInscrit = watch("nonInscrit");
  const nonVote = watch("nonVote");

  useEffect(() => {
    if (nonInscrit) {
      setValue("carteElecteur", false, { shouldDirty: true });
      setValue("nonVote", false, { shouldDirty: true });
    }
  }, [nonInscrit, setValue]);

  useEffect(() => {
    if (nonVote) {
      setValue("nonInscrit", false, { shouldDirty: true });
    }
  }, [nonVote, setValue]);

  async function loadMe() {
    if (!token) return navigate("/", { replace: true });

    try {
      setLoading(true);
      const res = await http.get<MeResponse>("/me");
      const p = (res.data as any).profile ?? res.data;

      reset({
        commune: p.commune ?? "",
        prenom: p.prenom ?? "",
        nom: p.nom ?? "",
        dateNaissance: p.dateNaissance ?? "",
        phone: p.phone ?? storedPhone,
        carteIdentite: p.carteIdentite ?? "",
        dateExpiration: p.dateExpiration ?? "",
        carteElecteur: p.carteElecteur ?? false,
        nonVote: p.nonVote ?? false,
        nonInscrit: p.nonInscrit ?? false,
        isMember: p.isMember ?? false,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible de charger votre profil.";
      showSnack("error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      setSaving(true);
      await http.put("/me/profile", values as unknown as UserProfile);
      showSnack("success", "Profil enregistré avec succès.");
      reset(values);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible d’enregistrer.";
      showSnack("error", msg);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", background: "#0b0b0b", py: { xs: 2, sm: 4 } }}
    >
      <Container maxWidth="md">
        <Paper elevation={8} sx={{ overflow: "hidden", borderRadius: 3 }}>
          {/* HERO IMAGE */}
          <Box
            sx={{
              position: "relative",
              height: { xs: 280, sm: 370 },
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.85))",
              }}
            />
            <Stack
              spacing={0.5}
              sx={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                justifyContent: "center",
                px: { xs: 2, sm: 4 },
              }}
            >
              <Typography
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                fontWeight={900}
                color="white"
                sx={{
                  textTransform: "uppercase",
                  fontSize: { xs: "1.05rem", sm: "1.5rem" },
                  lineHeight: 1.15,
                }}
              >
                TAMBALÉ CI SONKO YÉM CI SONKO
              </Typography>

              <Typography
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                color="#fcd116"
                fontWeight={800}
                fontSize={{ xs: "0.95rem", sm: "1.05rem" }}
              >
                1 million d’adhérents actifs
              </Typography>

              <Typography
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                color="rgba(255,255,255,0.9)"
                fontSize={{ xs: "0.85rem", sm: "0.95rem" }}
              >
                La grande armée civique de PASTEF
              </Typography>
            </Stack>
          </Box>

          {/* FORM */}
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Stack>
                <Typography fontWeight={900} variant="h6">
                  Informations personnelles
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remplissez ou mettez à jour vos informations.
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={logout}
              >
                Déconnexion
              </Button>
            </Stack>

            <Stack
              component="form"
              spacing={2}
              onSubmit={handleSubmit(onSubmit)}
            >
              <FormControl fullWidth>
                <InputLabel>Commune</InputLabel>
                <Select
                  value={watch("commune")}
                  label="Commune"
                  onChange={(e) =>
                    setValue("commune", e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {COMMUNES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Prénom" {...register("prenom")} fullWidth />
                <TextField label="Nom" {...register("nom")} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  type="date"
                  label="Date de naissance"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateNaissance")}
                  fullWidth
                />
                <TextField
                  label="Carte d’identité"
                  {...register("carteIdentite")}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  type="date"
                  label="Date d’expiration"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateExpiration")}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={watch("carteElecteur")}
                      onChange={(e) =>
                        setValue("carteElecteur", e.target.checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={nonInscrit}
                    />
                  }
                  label="Carte d’électeur"
                />
              </Stack>

              {/* Party member yes/no */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={800}>PASTEF</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={watch("isMember")}
                        onChange={(e) =>
                          setValue("isMember", e.target.checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        color="secondary"
                      />
                    }
                    label={
                      watch("isMember")
                        ? "Déjà membre du parti : Oui"
                        : "Déjà membre du parti : Non"
                    }
                  />
                  <Typography variant="body2" color="text.secondary">
                    Indiquez si vous êtes déjà adhérent(e) de PASTEF.
                  </Typography>
                </Stack>
              </Paper>

              <FormControlLabel
                control={
                  <Switch
                    checked={watch("nonVote")}
                    onChange={(e) =>
                      setValue("nonVote", e.target.checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={nonInscrit}
                  />
                }
                label="Non vote"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={watch("nonInscrit")}
                    onChange={(e) =>
                      setValue("nonInscrit", e.target.checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                }
                label="Non inscrit"
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  fullWidth
                  sx={{ py: 1.2, fontWeight: 800 }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={logout}
                  fullWidth
                  sx={{ py: 1.2 }}
                >
                  Déconnexion
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>

      {/* ✅ SNACKBAR NOTIFICATIONS */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snackSeverity} variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
