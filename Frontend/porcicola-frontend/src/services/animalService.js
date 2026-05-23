import axios from "axios";

const API = "http://127.0.0.1:8000/api/animales";

export const getAnimales = () => axios.get(API);
export const crearAnimal = (data) => axios.post(API, data);

export const actualizarAnimal = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const eliminarAnimal = (id) =>
  axios.delete(`${API}/${id}`);

export const getPedigreeAnimal = (id) =>
  axios.get(`${API}/${id}/pedigree`);