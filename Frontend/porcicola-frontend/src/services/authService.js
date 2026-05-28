import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export async function login(credenciales) {
  const response = await axios.post(`${API_URL}/auth/login`, credenciales);
  return response.data.user;
}

export async function logout() {
  try {
    await axios.post(`${API_URL}/auth/logout`);
  } catch (error) {
    console.warn("No se pudo notificar logout al backend:", error);
  }
}

export function guardarUsuario(usuario) {
  localStorage.setItem("porcys_user", JSON.stringify(usuario));
}

export function obtenerUsuarioGuardado() {
  const usuario = localStorage.getItem("porcys_user");

  if (!usuario) {
    return null;
  }

  try {
    return JSON.parse(usuario);
  } catch (error) {
    localStorage.removeItem("porcys_user");
    return null;
  }
}

export function limpiarUsuarioGuardado() {
  localStorage.removeItem("porcys_user");
}