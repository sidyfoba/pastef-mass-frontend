import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import http from "../api/http";
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
    phone: z.string().min(6, "Téléphone obligatoire"),
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

export default function PublicSignup() {
  const [saving, setSaving] = useState(false);
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

  const { register, handleSubmit, setValue, watch, reset, formState } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        commune: "",
        prenom: "",
        nom: "",
        dateNaissance: "",
        phone: "",
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

  async function onSubmit(values: FormValues) {
    try {
      setSaving(true);
      await http.post("/public/profile", values);
      showSnack("success", "Merci ! Vos informations ont été enregistrées.");
      reset();
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

  return (
    <Box
      sx={{ minHeight: "100vh", background: "#0b0b0b", py: { xs: 2, sm: 4 } }}
    >
      <Container maxWidth="md">
        <Paper elevation={8} sx={{ overflow: "hidden", borderRadius: 3 }}>
          <Box
            sx={{
              position: "relative",
              height: { xs: 180, sm: 260 },
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
                INSCRIPTION PUBLIQUE
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
                Remplissez le formulaire
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack
              spacing={2}
              component="form"
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
                <TextField
                  label="Prénom"
                  {...register("prenom")}
                  error={!!formState.errors.prenom}
                  helperText={formState.errors.prenom?.message}
                  fullWidth
                />
                <TextField
                  label="Nom"
                  {...register("nom")}
                  error={!!formState.errors.nom}
                  helperText={formState.errors.nom?.message}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Téléphone"
                  placeholder="ex: 77xxxxxxx ou 22177xxxxxxx"
                  {...register("phone")}
                  error={!!formState.errors.phone}
                  helperText={formState.errors.phone?.message}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Date de naissance"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateNaissance")}
                  error={!!formState.errors.dateNaissance}
                  helperText={formState.errors.dateNaissance?.message}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Carte d’identité"
                  {...register("carteIdentite")}
                  error={!!formState.errors.carteIdentite}
                  helperText={formState.errors.carteIdentite?.message}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Date d’expiration"
                  InputLabelProps={{ shrink: true }}
                  {...register("dateExpiration")}
                  error={!!formState.errors.dateExpiration}
                  helperText={formState.errors.dateExpiration?.message}
                  fullWidth
                />
              </Stack>

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
                        ? "Déjà membre : Oui"
                        : "Déjà membre : Non"
                    }
                  />
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

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                fullWidth
                sx={{ py: 1.2, fontWeight: 800 }}
              >
                {saving ? "Enregistrement..." : "Envoyer"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>

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
