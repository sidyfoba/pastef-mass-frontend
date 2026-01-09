import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const http = axios.create({
  baseURL,
  withCredentials: false, // set true only if you use cookies
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
