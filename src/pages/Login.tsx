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
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

/**
 * Very small phone normalizer.
 * - If user types "77xxxxxxx" we convert to "+22177xxxxxxx" (Senegal default).
 * - If user types "+221..." we keep it.
 * You can improve this later with libphonenumber-js.
 */
function normalizePhone(raw: string) {
  const v = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (!v) return "";
  if (v.startsWith("+")) return v;

  // Senegal common: 9 digits without country code (e.g. 77xxxxxxx)
  if (/^\d{9}$/.test(v)) return `+221${v}`;

  // If they typed 221XXXXXXXXX (no +)
  if (/^221\d{9}$/.test(v)) return `+${v}`;

  return v; // fallback (backend should validate)
}

export default function Login() {
  const navigate = useNavigate();

  const [phoneInput, setPhoneInput] = useState("");
  const phone = useMemo(() => normalizePhone(phoneInput), [phoneInput]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isPhoneLikelyValid = useMemo(() => {
    // Simple validation: + + 11-15 digits (E.164-ish)
    return /^\+\d{11,15}$/.test(phone);
  }, [phone]);

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
      // Backend endpoint you will implement:
      // POST http://localhost:8080/auth/request-otp  { phone: "+221..." }
      await http.post("/auth/request-otp", { phone });

      setInfo("Code envoyé sur WhatsApp. Vérifiez vos messages.");
      navigate("/verify", { state: { phone } });
    } catch (e: any) {
      // Handle typical Spring Boot error shapes
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
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.2}>
            {/* Header */}
            <Stack spacing={0.5}>
              <Typography variant="h4" color="primary">
                Massification
              </Typography>
              <Typography color="text.secondary">
                Connectez-vous avec votre numéro. Un code sera envoyé sur
                WhatsApp.
              </Typography>
            </Stack>

            <Divider />

            {/* Alerts */}
            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            {/* Form */}
            <Stack spacing={1.5}>
              <TextField
                label="Numéro de téléphone"
                placeholder="Ex: +221771234567 ou 771234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
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
                startIcon={<WhatsAppIcon />}
                disabled={loading}
                onClick={requestOtp}
                sx={{ py: 1.2 }}
              >
                {loading ? "Envoi en cours..." : "Envoyer le code WhatsApp"}
              </Button>

              <Typography variant="body2" color="text.secondary">
                En continuant, vous acceptez que nous utilisions votre numéro
                uniquement pour l’accès à l’application et la vérification.
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
