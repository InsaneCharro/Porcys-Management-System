import axios from "axios";

const API = "http://127.0.0.1:8000/api/gestaciones";

export const getGestaciones = () => axios.get(API);

export const crearGestacion = (data) =>
  axios.post(API, data);

export const confirmarGestacion = (id) =>
  axios.put(`${API}/${id}/confirmar`);

export const marcarFallida = (id) =>
  axios.put(`${API}/${id}/fallida`);

export const registrarParto = (id, data) =>
  axios.post(`${API}/${id}/parto`, data);

export const getAlertasGestacion = () =>
  axios.get(`${API}/alertas-inteligentes`);

export const getAnimales = () =>
  axios.get("http://127.0.0.1:8000/api/animales");