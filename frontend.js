import axios from "axios";

const API_BASE = "https://ai-powered-automated-electronics.onrender.com";

export const api = axios.create({
  baseURL: API_BASE,
});

export const generateEnclosure = async (payload) => {
  const res = await api.post("/api/generate", payload);
  return res.data;
};