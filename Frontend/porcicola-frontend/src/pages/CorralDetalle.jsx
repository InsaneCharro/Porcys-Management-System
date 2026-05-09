import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function CorralDetalle() {

  const { id } = useParams();

  const [corral, setCorral] = useState(null);
  const [corrales, setCorrales] = useState([]);

  useEffect(() => {

    // 🔹 cargar corral actual
    axios.get(`http://127.0.0.1:8000/api/corrales/${id}`)
      .then(res => setCorral(res.data))
      .catch(err => console.error(err));

    // 🔹 cargar todos los corrales
    axios.get("http://127.0.0.1:8000/api/corrales")
      .then(res => setCorrales(res.data))
      .catch(err => console.error(err));

  }, [id]);

  // 🔹 mover animal
  const moverAnimal = async (animalId, corralId) => {
    try {

      const res = await fetch(
  `http://127.0.0.1:8000/api/animales/${animalId}/mover-corral`,
  {
    method: "POST", // 🔴 ESTO ES CLAVE
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json" // 🔴 IMPORTANTE
    },
    body: JSON.stringify({
      corral_id: corralId
    })
  }
);

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert("✅ Animal movido");

      // 🔄 recargar corral actual
      const updated = await axios.get(`http://127.0.0.1:8000/api/corrales/${id}`);
      setCorral(updated.data);

    } catch (err) {
      alert(err.message);
    }
  };

  // 🔒 protección inicial
  if (!corral) {
    return <p style={{ color: "white" }}>Cargando...</p>;
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>🐖 {corral.nombre}</h1>

      <p>
        Ocupación: {corral.lechones_count || 0}/{corral.capacidad}
      </p>

      <div style={{ marginTop: "20px" }}>

        {/* 🔒 protección de lechones */}
        {corral.lechones?.length === 0 ? (

          <p>Este corral está vacío</p>

        ) : (

          corral.lechones?.map(a => (
            <div
              key={a.id}
              style={{
                background: "#1e1e1e",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px"
              }}
            >
              🐖 {a.identificador_unico || `#${a.id}`}

              {/* 🔽 mover */}
              <div style={{ marginTop: "5px" }}>
                <select onChange={e => {
  const value = e.target.value;

  if (!value) return; // 🚫 evita enviar vacío

  moverAnimal(a.id, value);
}}>
                  <option value="">Mover a...</option>

                  {corrales
                    .filter(c => c.id !== corral.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
              </div>

            </div>
          ))

        )}

      </div>
    </div>
  );
}