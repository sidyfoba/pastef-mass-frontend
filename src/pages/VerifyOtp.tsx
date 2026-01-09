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

// ✅ Same background image as Login page
import bgImage from "../assets/bg-login.jpeg";

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

  useEffect(() => {
    // If someone navigates directly here, state.phone may be missing
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

  const missingPhone = !phone;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,

        // ✅ Background image + overlay (same as Login)
        backgroundImage: `linear-gradient(
            rgba(0, 0, 0, 0.55),
            rgba(0, 0, 0, 0.55)
          ), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },

            // ✅ Same "glass" look
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          <Stack spacing={2.2}>
            <Stack spacing={0.5}>
              <Typography variant="h4" color="primary" fontWeight={800}>
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
              <TextField
                label="Numéro"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!missingPhone}
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
                sx={{ py: 1.2, fontWeight: 700 }}
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
