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

export async function aplicarMedicamento(data) {
  const payload = {
    ...data,
    dosis: String(data.dosis ?? ""),
  };

  const res = await fetch(`${API}/medicamentos/aplicar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await leerRespuesta(res);

  if (!res.ok) {
    throw new Error(
      json.error ||
        json.message ||
        json.errors?.dosis?.[0] ||
        json.errors?.animal_id?.[0] ||
        json.errors?.medicamento_id?.[0] ||
        "Error al aplicar medicamento"
    );
  }

  return json;
}

export async function obtenerMedicamentos() {
  const res = await fetch(`${API}/medicamentos`, {
    headers: {
      "Accept": "application/json",
    },
  });

  const json = await leerRespuesta(res);

  if (!res.ok) {
    throw new Error(json.error || json.message || "Error al obtener medicamentos");
  }

  return json;
}

export async function obtenerCartillaSanitariaAnimal(animalId) {
  const res = await fetch(`${API}/sanidad/cartilla/${animalId}`, {
    headers: {
      "Accept": "application/json",
    },
  });

  const json = await leerRespuesta(res);

  if (!res.ok) {
    throw new Error(json.error || json.message || "Error al obtener cartilla sanitaria");
  }

  return json;
}