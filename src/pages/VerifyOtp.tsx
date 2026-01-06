import { useEffect, useMemo, useState } from "react";
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
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ReplayIcon from "@mui/icons-material/Replay";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";

type LocationState = { phone?: string };

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};
  const [phone, setPhone] = useState(state.phone ?? "");

  const [code, setCode] = useState("");
  const codeDigits = useMemo(() => onlyDigits(code).slice(0, 6), [code]);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isCodeValid = useMemo(() => /^\d{6}$/.test(codeDigits), [codeDigits]);
  const isPhoneLikelyValid = useMemo(
    () => /^\+\d{11,15}$/.test(phone),
    [phone]
  );

  // If user directly opens /verify without state, send them back to login
  useEffect(() => {
    if (!state.phone) return;
    // keep
  }, [state.phone]);

  function goBackToLogin() {
    navigate("/", { replace: true });
  }

  async function verifyOtp() {
    setError(null);
    setInfo(null);

    if (!isPhoneLikelyValid) {
      setError("Numéro invalide. Retournez à la page de connexion.");
      return;
    }
    if (!isCodeValid) {
      setError("Code invalide. Entrez les 6 chiffres reçus sur WhatsApp.");
      return;
    }

    try {
      setLoadingVerify(true);

      // Expected backend:
      // POST /auth/verify-otp  { phone: "+221...", code: "123456" }
      // Response: { token: "jwt..." } (or { accessToken: "..." })
      const res = await http.post("/auth/verify-otp", {
        phone,
        code: codeDigits,
      });

      const token =
        res?.data?.token || res?.data?.accessToken || res?.data?.jwt || null;

      if (!token) {
        setError(
          "Connexion réussie, mais aucun token n’a été retourné par l’API."
        );
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("phone", phone);

      setInfo("Connexion réussie. Redirection...");
      navigate("/profile", { replace: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Code incorrect ou expiré. Réessayez.";
      setError(msg);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function resendOtp() {
    setError(null);
    setInfo(null);

    if (!isPhoneLikelyValid) {
      setError("Numéro invalide. Retournez à la page de connexion.");
      return;
    }

    try {
      setLoadingResend(true);

      // Same endpoint as Login page
      await http.post("/auth/request-otp", { phone });

      setInfo("Nouveau code envoyé sur WhatsApp.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Impossible de renvoyer le code. Réessayez.";
      setError(msg);
    } finally {
      setLoadingResend(false);
    }
  }

  // If someone comes here without phone, show a helpful UI
  const missingPhone = !phone;

  return (
    <Box
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.2}>
            <Stack spacing={0.5}>
              <Typography variant="h4" color="primary">
                Vérification OTP
              </Typography>
              <Typography color="text.secondary">
                Entrez le code à 6 chiffres reçu sur WhatsApp.
              </Typography>
            </Stack>

            <Divider />

            {missingPhone ? (
              <Alert severity="warning">
                Aucun numéro détecté. Retournez à la page de connexion.
              </Alert>
            ) : (
              <Alert icon={<WhatsAppIcon />} severity="info">
                Code envoyé à: <b>{phone}</b>
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            <Stack spacing={1.5}>
              {/* Allow showing phone so user can confirm; disable editing to keep flow clean */}
              <TextField
                label="Numéro"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!missingPhone ? true : false}
                helperText={
                  missingPhone
                    ? "Entrez votre numéro au format +221xxxxxxxxx"
                    : "Si le numéro est incorrect, retournez en arrière."
                }
              />

              <TextField
                label="Code OTP"
                placeholder="123456"
                value={codeDigits}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                helperText="6 chiffres"
                onKeyDown={(e) => {
                  if (e.key === "Enter") verifyOtp();
                }}
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<LockOpenIcon />}
                disabled={loadingVerify || missingPhone}
                onClick={verifyOtp}
                sx={{ py: 1.2 }}
              >
                {loadingVerify ? "Vérification..." : "Valider et se connecter"}
              </Button>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ReplayIcon />}
                  disabled={loadingResend || missingPhone}
                  onClick={resendOtp}
                  fullWidth
                >
                  {loadingResend ? "Renvoi..." : "Renvoyer le code"}
                </Button>

                <Button
                  variant="text"
                  color="inherit"
                  onClick={goBackToLogin}
                  fullWidth
                >
                  Retour
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Si le code a expiré, cliquez sur “Renvoyer le code”.
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
