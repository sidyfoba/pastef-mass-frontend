import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
import LockIcon from "@mui/icons-material/Lock";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import bgImage from "../assets/bg-login.jpeg";

/**
 * Very small phone normalizer.
 * - If user types "77xxxxxxx" we convert to "+22177xxxxxxx" (Senegal default).
 * - If user types "+221..." we keep it.
 */
function normalizePhone(raw: string) {
  const v = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (!v) return "";
  if (v.startsWith("+")) return v;
  if (/^\d{9}$/.test(v)) return `+221${v}`;
  if (/^221\d{9}$/.test(v)) return `+${v}`;
  return v;
}

type LoginMode = "otp" | "password";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("otp");

  const [phoneInput, setPhoneInput] = useState("");
  const phone = useMemo(() => normalizePhone(phoneInput), [phoneInput]);

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isPhoneLikelyValid = useMemo(
    () => /^\+\d{11,15}$/.test(phone),
    [phone]
  );

  async function requestOtp() {
    setError(null);
    setInfo(null);

    if (!isPhoneLikelyValid) {
      setError(
        "Numéro invalide. Exemple: +221771234567 ou 771234567 (sera converti)."
      );
      return;
    }

    try {
      setLoading(true);
      await http.post("/auth/request-otp", { phone });

      setInfo("Code envoyé par SMS. Vérifiez vos messages.");
      navigate("/verify", { state: { phone } });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible d’envoyer le code. Réessayez.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPassword() {
    setError(null);
    setInfo(null);

    if (!isPhoneLikelyValid) {
      setError(
        "Numéro invalide. Exemple: +221771234567 ou 771234567 (sera converti)."
      );
      return;
    }
    if (!password || password.trim().length < 4) {
      setError("Mot de passe requis (minimum 4 caractères).");
      return;
    }

    try {
      setLoading(true);
      const { data } = await http.post("/auth/login-password", {
        phone,
        password,
      });

      // TokenResponse(token) => { token: "..." }
      const token = data?.token;
      if (!token) {
        setError("Connexion réussie mais token manquant.");
        return;
      }

      localStorage.setItem("token", token);
      setInfo("Connexion réussie.");

      navigate("/admin", { replace: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (e?.response?.status === 401
          ? "Téléphone ou mot de passe incorrect."
          : null) ||
        "Impossible de se connecter. Réessayez.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const primaryAction = mode === "otp" ? requestOtp : loginWithPassword;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0b0b0b",
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ overflow: "hidden", borderRadius: 3 }}>
          {/* ===== HERO IMAGE ===== */}
          <Box
            sx={{
              position: "relative",
              height: { xs: 170, sm: 230 },
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
                  "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.85))",
              }}
            />
            <Stack
              spacing={0.4}
              sx={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                justifyContent: "center",
                px: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                fontWeight={900}
                color="white"
                sx={{
                  textTransform: "uppercase",
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                  letterSpacing: 0.4,
                }}
              >
                Massification
              </Typography>
              <Typography
                color="rgba(255,255,255,0.9)"
                sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
              >
                {mode === "otp"
                  ? "Connectez-vous avec votre numéro. Un code sera envoyé par SMS."
                  : "Connectez-vous avec votre numéro et votre mot de passe."}
              </Typography>
            </Stack>
          </Box>

          {/* ===== FORM BODY ===== */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Divider />

              {/* Mode switch */}
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => {
                  if (!v) return;
                  setMode(v);
                  setError(null);
                  setInfo(null);
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="otp">
                  <SmsIcon fontSize="small" style={{ marginRight: 8 }} />
                  SMS
                </ToggleButton>
                <ToggleButton value="password">
                  <LockIcon fontSize="small" style={{ marginRight: 8 }} />
                  Mot de passe
                </ToggleButton>
              </ToggleButtonGroup>

              {error && <Alert severity="error">{error}</Alert>}
              {info && <Alert severity="success">{info}</Alert>}

              <TextField
                label="Numéro de téléphone"
                placeholder="Ex: +221771234567 ou 771234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                fullWidth
                helperText={
                  phone
                    ? `Format utilisé: ${phone}`
                    : "Entrez votre numéro (Sénégal: 9 chiffres accepté)."
                }
              />

              {mode === "password" && (
                <TextField
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  fullWidth
                />
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={mode === "otp" ? <SmsIcon /> : <LockIcon />}
                disabled={loading}
                onClick={primaryAction}
                fullWidth
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                {loading
                  ? "Veuillez patienter..."
                  : mode === "otp"
                  ? "Envoyer le code par SMS"
                  : "Se connecter"}
              </Button>

              {/* Optional helper for password mode */}
              {mode === "password" && (
                <Typography variant="body2" color="text.secondary">
                  Si vous n’avez pas encore de mot de passe, connectez-vous via
                  SMS puis définissez-en un.
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                En continuant, vous acceptez que nous utilisions votre numéro
                uniquement pour l’accès à l’application et la vérification.
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
