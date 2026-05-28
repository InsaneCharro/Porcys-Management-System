import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

function headersAdmin(usuarioActual) {
  return {
    headers: {
      "X-Porcys-Role": usuarioActual?.role || "",
    },
  };
}

export async function obtenerUsuarios(usuarioActual) {
  const response = await axios.get(`${API_URL}/usuarios`, headersAdmin(usuarioActual));
  return response.data;
}

export async function crearUsuario(datos, usuarioActual) {
  const response = await axios.post(`${API_URL}/usuarios`, datos, headersAdmin(usuarioActual));
  return response.data;
}

export async function actualizarUsuario(id, datos, usuarioActual) {
  const response = await axios.put(`${API_URL}/usuarios/${id}`, datos, headersAdmin(usuarioActual));
  return response.data;
}

export async function desactivarUsuario(id, usuarioActual) {
  const response = await axios.delete(`${API_URL}/usuarios/${id}`, headersAdmin(usuarioActual));
  return response.data;
}