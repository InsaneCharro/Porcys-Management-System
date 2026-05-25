import axios from "axios";

const API = "http://127.0.0.1:8000/api/pesos";

export const registrarPeso = (data) => {
  return axios.post(API, data);
};

export const getPesosPendientes = (params = {}) => {
  return axios.get(`${API}/pendientes`, { params });
};