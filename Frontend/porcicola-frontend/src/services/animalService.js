import axios from "axios";

const API = "http://127.0.0.1:8000/api/animales";

export const getAnimales = () => axios.get(API);
export const crearAnimal = (data) => axios.post(API, data);

export const actualizarAnimal = (id, data) =>
  axios.put(`http://127.0.0.1:8000/api/animales/${id}`, data);

export const eliminarAnimal = (id) =>
  axios.delete(`http://127.0.0.1:8000/api/animales/${id}`);