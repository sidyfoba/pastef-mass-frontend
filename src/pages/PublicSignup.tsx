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
  Collapse,
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

const FIXED_REGION = "DAKAR" as const;
const FIXED_DEPARTMENT = "KEUR MASSAR" as const;

const schema = z
  .object({
    commune: z.string().min(2, "Commune obligatoire"),

    // ✅ fixed and enforced
    region: z.literal(FIXED_REGION),
    department: z.literal(FIXED_DEPARTMENT),

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

    // ✅ optional pastef fields (only shown when isMember = true)
    pastefCardNumber: z
      .string()
      .trim()
      .max(50, "Max 50 caractères")
      .optional()
      .or(z.literal("")),
    pastefSection: z
      .string()
      .trim()
      .max(120, "Max 120 caractères")
      .optional()
      .or(z.literal("")),
    coordinatorPhone: z
      .string()
      .trim()
      .max(20, "Max 20 caractères")
      .optional()
      .or(z.literal("")),
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

    // ✅ optional rule: if isMember is true, at least 1 pastef field is recommended/required
    // If you want STRICT required, uncomment the block below.
    /*
    if (data.isMember) {
      const hasOne =
        (data.pastefCardNumber ?? "").trim().length > 0 ||
        (data.pastefSection ?? "").trim().length > 0 ||
        (data.coordinatorPhone ?? "").trim().length > 0;

      if (!hasOne) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Si vous êtes membre, renseignez au moins un champ PASTEF.",
          path: ["pastefCardNumber"],
        });
      }
    }
    */
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
        region: FIXED_REGION,
        department: FIXED_DEPARTMENT,
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
        pastefCardNumber: "",
        pastefSection: "",
        coordinatorPhone: "",
      },
    });

  const nonInscrit = watch("nonInscrit");
  const nonVote = watch("nonVote");
  const isMember = watch("isMember");

  useEffect(() => {
    // ✅ enforce fixed fields (in case of reset/hack)
    setValue("region", FIXED_REGION, { shouldDirty: false });
    setValue("department", FIXED_DEPARTMENT, { shouldDirty: false });
  }, [setValue]);

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

  useEffect(() => {
    // If user says not a member, clear PASTEF fields
    if (!isMember) {
      setValue("pastefCardNumber", "", { shouldDirty: true });
      setValue("pastefSection", "", { shouldDirty: true });
      setValue("coordinatorPhone", "", { shouldDirty: true });
    }
  }, [isMember, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      setSaving(true);

      // ✅ safety: force fixed values before sending
      const payload: FormValues = {
        ...values,
        region: FIXED_REGION,
        department: FIXED_DEPARTMENT,
      };

      await http.post("/public/profile", payload);
      showSnack("success", "Merci ! Vos informations ont été enregistrées.");
      reset({
        commune: "",
        region: FIXED_REGION,
        department: FIXED_DEPARTMENT,
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
        pastefCardNumber: "",
        pastefSection: "",
        coordinatorPhone: "",
      });
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

              {/* ✅ fixed region/department (not editable) */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Région"
                  value={FIXED_REGION}
                  disabled
                  fullWidth
                />
                <TextField
                  label="Département"
                  value={FIXED_DEPARTMENT}
                  disabled
                  fullWidth
                />
              </Stack>

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
                        checked={isMember}
                        onChange={(e) =>
                          setValue("isMember", e.target.checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        color="secondary"
                      />
                    }
                    label={isMember ? "Déjà membre : Oui" : "Déjà membre : Non"}
                  />

                  {/* ✅ show extra fields only if member */}
                  <Collapse in={isMember}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <TextField
                        label="Numéro carte PASTEF (optionnel)"
                        {...register("pastefCardNumber")}
                        error={!!formState.errors.pastefCardNumber}
                        helperText={
                          formState.errors.pastefCardNumber?.message as any
                        }
                        fullWidth
                      />
                      <TextField
                        label="Section PASTEF (optionnel)"
                        {...register("pastefSection")}
                        error={!!formState.errors.pastefSection}
                        helperText={
                          formState.errors.pastefSection?.message as any
                        }
                        fullWidth
                      />
                      <TextField
                        label="Téléphone coordinateur (optionnel)"
                        {...register("coordinatorPhone")}
                        error={!!formState.errors.coordinatorPhone}
                        helperText={
                          formState.errors.coordinatorPhone?.message as any
                        }
                        fullWidth
                      />
                    </Stack>
                  </Collapse>
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
