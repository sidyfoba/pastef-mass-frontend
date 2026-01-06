import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Paper,
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
import http from "../api/http";
import type { MeResponse, UserProfile } from "../types/UserProfile";

const schema = z
  .object({
    commune: z.string().min(2, "Commune obligatoire"),
    prenom: z.string().min(2, "Prénom obligatoire"),
    nom: z.string().min(2, "Nom obligatoire"),
    dateNaissance: z.string().min(10, "Date de naissance obligatoire"), // YYYY-MM-DD
    phone: z.string().min(8, "Téléphone obligatoire"),
    carteIdentite: z.string().min(3, "Carte d’identité obligatoire"),
    dateExpiration: z.string().min(10, "Date d’expiration obligatoire"),
    carteElecteur: z.boolean(),
    nonVote: z.boolean(),
    nonInscrit: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Logical constraints
    if (data.nonInscrit && data.nonVote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Non inscrit et Non vote ne peuvent pas être vrais en même temps.",
        path: ["nonVote"],
      });
    }
    if (data.nonInscrit && data.carteElecteur) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Si Non inscrit = Oui, Carte d’électeur doit être Non.",
        path: ["carteElecteur"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const storedPhone = useMemo(() => localStorage.getItem("phone") || "", []);
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
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
    },
    mode: "onBlur",
  });

  const nonInscrit = watch("nonInscrit");
  const nonVote = watch("nonVote");

  // Enforce UI rules immediately
  useEffect(() => {
    if (nonInscrit) {
      // If not registered, they can't have voter card and "non vote" doesn't apply
      setValue("carteElecteur", false, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("nonVote", false, { shouldValidate: true, shouldDirty: true });
    }
  }, [nonInscrit, setValue]);

  useEffect(() => {
    if (nonVote) {
      // If "didn't vote", then they must be registered => not nonInscrit
      setValue("nonInscrit", false, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [nonVote, setValue]);

  async function loadMe() {
    setError(null);
    setInfo(null);

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setLoading(true);

      // Preferred: GET /me returns { phone, profile? }
      // If your backend is different, adjust here.
      let res;
      try {
        res = await http.get<MeResponse>("/me");
      } catch {
        // fallback if you decide to expose profile directly
        res = await http.get<any>("/me/profile");
      }

      const phoneFromApi =
        (res.data as any)?.phone ||
        (res.data as any)?.user?.phone ||
        storedPhone;

      const p = ((res.data as any)?.profile ??
        res.data) as Partial<UserProfile>;

      const merged: FormValues = {
        commune: p.commune ?? "",
        prenom: p.prenom ?? "",
        nom: p.nom ?? "",
        dateNaissance: p.dateNaissance ?? "",
        phone: phoneFromApi ?? storedPhone,
        carteIdentite: p.carteIdentite ?? "",
        dateExpiration: p.dateExpiration ?? "",
        carteElecteur: p.carteElecteur ?? false,
        nonVote: p.nonVote ?? false,
        nonInscrit: p.nonInscrit ?? false,
      };

      localStorage.setItem("phone", merged.phone);
      reset(merged);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible de charger votre profil.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    setError(null);
    setInfo(null);

    try {
      setSaving(true);

      // Keep phone as read-only identity; backend should verify it matches JWT user.
      const payload: UserProfile = {
        commune: values.commune.trim(),
        prenom: values.prenom.trim(),
        nom: values.nom.trim(),
        dateNaissance: values.dateNaissance,
        phone: values.phone,
        carteIdentite: values.carteIdentite.trim(),
        dateExpiration: values.dateExpiration,
        carteElecteur: values.carteElecteur,
        nonVote: values.nonVote,
        nonInscrit: values.nonInscrit,
      };

      await http.put("/me/profile", payload);

      setInfo("Profil enregistré avec succès.");
      reset(values); // mark clean
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible d’enregistrer. Réessayez.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    // keep phone if you want, or remove it too:
    // localStorage.removeItem("phone");
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Chargement du profil...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
            >
              <Stack spacing={0.5}>
                <Typography variant="h4" color="primary">
                  Mon Profil
                </Typography>
                <Typography color="text.secondary">
                  Remplissez ou mettez à jour vos informations.
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<LogoutIcon />}
                onClick={logout}
              >
                Déconnexion
              </Button>
            </Stack>

            <Divider />

            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            <Stack
              component="form"
              spacing={2}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Row 1 */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Commune"
                  {...register("commune")}
                  error={!!errors.commune}
                  helperText={errors.commune?.message}
                />
                <TextField
                  label="Numéro de téléphone"
                  {...register("phone")}
                  disabled
                  helperText="Utilisé pour la connexion (lecture seule)"
                />
              </Stack>

              {/* Row 2 */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Prénom"
                  {...register("prenom")}
                  error={!!errors.prenom}
                  helperText={errors.prenom?.message}
                />
                <TextField
                  label="Nom"
                  {...register("nom")}
                  error={!!errors.nom}
                  helperText={errors.nom?.message}
                />
              </Stack>

              {/* Row 3 */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Date de naissance"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateNaissance")}
                  error={!!errors.dateNaissance}
                  helperText={errors.dateNaissance?.message}
                />
                <TextField
                  label="Carte d’identité"
                  {...register("carteIdentite")}
                  error={!!errors.carteIdentite}
                  helperText={errors.carteIdentite?.message}
                />
              </Stack>

              {/* Row 4 */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Date d’expiration"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateExpiration")}
                  error={!!errors.dateExpiration}
                  helperText={errors.dateExpiration?.message}
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
                      color="primary"
                    />
                  }
                  label="Carte d’électeur : Oui/Non"
                />
              </Stack>

              {/* Status switches */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={800} color="primary">
                    Statut
                  </Typography>

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
                        color="secondary"
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
                        color="secondary"
                      />
                    }
                    label="Non inscrit (not registered)"
                  />

                  {(errors.nonVote || errors.carteElecteur) && (
                    <Alert severity="warning">
                      {errors.nonVote?.message || errors.carteElecteur?.message}
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    Règles: si “Non inscrit” = Oui, alors “Carte d’électeur” =
                    Non et “Non vote” = Non.
                  </Typography>
                </Stack>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{ py: 1.2 }}
                  fullWidth
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={!isDirty || saving}
                  onClick={() => loadMe()}
                  fullWidth
                >
                  Annuler les changements
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
