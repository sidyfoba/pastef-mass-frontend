import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
