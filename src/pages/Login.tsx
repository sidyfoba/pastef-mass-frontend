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
} from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
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

export default function Login() {
  const navigate = useNavigate();

  const [phoneInput, setPhoneInput] = useState("");
  const phone = useMemo(() => normalizePhone(phoneInput), [phoneInput]);

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
                Connectez-vous avec votre numéro. Un code sera envoyé par SMS.
              </Typography>
            </Stack>
          </Box>

          {/* ===== FORM BODY ===== */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Divider />

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

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SmsIcon />}
                disabled={loading}
                onClick={requestOtp}
                fullWidth
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                {loading ? "Envoi en cours..." : "Envoyer le code par SMS"}
              </Button>

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
