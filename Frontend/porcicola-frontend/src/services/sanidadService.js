const API = "http://127.0.0.1:8000/api";

export async function aplicarMedicamento(data) {

    const res = await fetch(`${API}/medicamentos/aplicar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(
            json.error || "Error al aplicar medicamento"
        );
    }

    return json;
}

export async function obtenerMedicamentos() {

    const res = await fetch(`${API}/medicamentos`);

    return await res.json();
}