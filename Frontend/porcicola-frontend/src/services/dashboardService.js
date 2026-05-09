import axios from "axios";

export const getAlertas = () => {
  return axios.get("http://127.0.0.1:8000/api/dashboard/alertas");
};