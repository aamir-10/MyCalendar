import axios from "axios";

const api = axios.create({
  baseURL: "https://mycalendar-backend.onrender.com", // ✅ your backend URL
});

export default api;
