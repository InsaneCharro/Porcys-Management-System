const API = "http://127.0.0.1:8000/api";

async function leerRespuesta(res) {
  const texto = await res.text();

  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return {
      error: texto || "Respuesta no válida del servidor",
    };
  }
}

export async function obtenerResumenPredicciones() {
  const res = await fetch(`${API}/predicciones/resumen`, {
    headers: {
      Accept: "application/json",
    },
  });

  const json = await leerRespuesta(res);

  if (!res.ok) {
    throw new Error(
      json.error ||
        json.detalle ||
        json.message ||
        "Error al obtener predicciones operativas"
    );
  }

  return json;
}