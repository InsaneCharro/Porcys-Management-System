import axios from "axios";

const API = "http://127.0.0.1:8000/api/gestaciones";
const SERVICIOS_API = "http://127.0.0.1:8000/api/servicios-reproductivos";

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

export const getServiciosReproductivos = () =>
  axios.get(SERVICIOS_API);

export const crearServicioReproductivo = (data) =>
  axios.post(SERVICIOS_API, data);

export const actualizarResultadoServicio = (id, data) =>
  axios.put(`${SERVICIOS_API}/${id}/resultado`, data);

export const getHistorialReproductivo = (hembraId) =>
  axios.get(`${SERVICIOS_API}/historial/${hembraId}`);

export const getIndicadoresReproductivos = () =>
  axios.get(`${SERVICIOS_API}/indicadores/resumen`);
