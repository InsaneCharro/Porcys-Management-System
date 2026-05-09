import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Maternidad() {

  const [camadas, setCamadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    axios.get("http://127.0.0.1:8000/api/camadas")
      .then(res => {
        setCamadas(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

  }, []);

  if (loading) {
    return <h2>Cargando maternidad...</h2>;
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#121212",
        minHeight: "100vh",
        color: "white"
      }}
    >

      <h1 style={{ marginBottom: "20px" }}>
        🐷 Maternidad
      </h1>

      {camadas.length === 0 ? (
        <div
          style={{
            background: "#1e1e1e",
            padding: "20px",
            borderRadius: "10px"
          }}
        >
          No hay camadas registradas
        </div>
      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px"
          }}
        >

          {camadas.map(camada => (

            <Link
              to={`/maternidad/${camada.id}`}
              key={camada.id}
              style={{
                textDecoration: "none",
                color: "white"
              }}
            >

              <div
                style={{
                  background: "#1e1e1e",
                  padding: "20px",
                  borderRadius: "12px",
                  borderLeft: "6px solid hotpink",
                  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                  transition: "0.2s",
                  cursor: "pointer"
                }}
              >

                <h2>
                  🐖 Camada #{camada.id}
                </h2>

                <p>
                  <strong>Madre:</strong>{" "}
                  {camada.madre?.identificador_unico || "N/A"}
                </p>

                <p>
                  <strong>Fecha:</strong>{" "}
                  {camada.fecha_parto}
                </p>

                <hr style={{ margin: "15px 0", opacity: 0.2 }} />

                <p>
                  🐷 <strong>Total:</strong>{" "}
                  {camada.total_crias}
                </p>

                <p>
                  🟦 <strong>Machos:</strong>{" "}
                  {camada.machos}
                </p>

                <p>
                  🟪 <strong>Hembras:</strong>{" "}
                  {camada.hembras}
                </p>

                <p>
                  ✅ <strong>Vivos:</strong>{" "}
                  {camada.vivos}
                </p>

                <p>
                  ☠️ <strong>Muertos:</strong>{" "}
                  {camada.muertos}
                </p>

                <p>
                  ⚖️ <strong>Peso promedio:</strong>{" "}
                  {camada.peso_promedio_nacimiento ?? 0} kg
                </p>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "8px",
                    borderRadius: "6px",
                    background:
                      camada.estado === "activa"
                        ? "#003300"
                        : "#333300"
                  }}
                >
                  Estado: {camada.estado}
                </div>

              </div>

            </Link>

          ))}

        </div>

      )}

    </div>
  );
}