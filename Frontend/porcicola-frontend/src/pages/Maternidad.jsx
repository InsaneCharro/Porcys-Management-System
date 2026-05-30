import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Maternidad() {
  const [camadas, setCamadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/camadas")
      .then((res) => {
        setCamadas(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      padding: "24px 32px",
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      margin: "0 0 6px",
      color: "#0f172a",
    },
    subtitle: {
      margin: "0 0 22px",
      color: "#475569",
      fontSize: "15px",
    },
    empty: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      color: "#475569",
      fontWeight: 700,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "18px",
    },
    card: {
      background: "#ffffff",
      padding: "20px",
      borderRadius: "20px",
      border: "1px solid #e2e8f0",
      borderLeft: "6px solid #ec4899",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      transition: "0.2s",
      cursor: "pointer",
      color: "#0f172a",
      minHeight: "100%",
    },
    cardTitle: {
      margin: "0 0 16px",
      color: "#0f172a",
      fontSize: "24px",
      fontWeight: 900,
    },
    text: {
      margin: "9px 0",
      color: "#475569",
      fontSize: "15px",
    },
    strong: {
      color: "#0f172a",
      fontWeight: 900,
    },
    divider: {
      margin: "16px 0",
      border: "none",
      borderTop: "1px solid #e2e8f0",
    },
    estado: (estado) => ({
      marginTop: "16px",
      padding: "10px 12px",
      borderRadius: "12px",
      background: estado === "activa" ? "#dcfce7" : "#fef9c3",
      color: estado === "activa" ? "#166534" : "#854d0e",
      border: estado === "activa" ? "1px solid #bbf7d0" : "1px solid #fde68a",
      fontWeight: 900,
    }),
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={{ color: "#0f172a" }}>Cargando maternidad...</h2>
        <p style={{ color: "#64748b" }}>Consultando camadas registradas.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🐷 Maternidad</h1>
      <p style={styles.subtitle}>
        Control de camadas, nacimientos, vivos, muertos y peso promedio al nacimiento.
      </p>

      {camadas.length === 0 ? (
        <div style={styles.empty}>No hay camadas registradas.</div>
      ) : (
        <div style={styles.grid}>
          {camadas.map((camada) => (
            <Link
              to={`/maternidad/${camada.id}`}
              key={camada.id}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  🐖 Camada {camada.madre?.identificador_unico || `#${camada.id}`}
                </h2>

                <p style={styles.text}>
                  <strong style={styles.strong}>Madre:</strong>{" "}
                  {camada.madre?.identificador_unico || "N/A"}
                </p>

                <p style={styles.text}>
                  <strong style={styles.strong}>Corral / localización:</strong>{" "}
                  {camada.madre?.corral?.nombre ||
                    camada.madre?.corral_actual?.nombre ||
                    camada.madre?.corral_nombre ||
                    camada.corral?.nombre ||
                    camada.corral_nombre ||
                    "Sin corral registrado"}
                </p>

                <p style={styles.text}>
                  <strong style={styles.strong}>Fecha:</strong>{" "}
                  {camada.fecha_parto || "N/A"}
                </p>

                <hr style={styles.divider} />

                <p style={styles.text}>
                  🐷 <strong style={styles.strong}>Total:</strong>{" "}
                  {camada.total_crias ?? 0}
                </p>

                <p style={styles.text}>
                  🟦 <strong style={styles.strong}>Machos:</strong>{" "}
                  {camada.machos ?? 0}
                </p>

                <p style={styles.text}>
                  🟪 <strong style={styles.strong}>Hembras:</strong>{" "}
                  {camada.hembras ?? 0}
                </p>

                <p style={styles.text}>
                  ✅ <strong style={styles.strong}>Vivos:</strong>{" "}
                  {camada.vivos ?? 0}
                </p>

                <p style={styles.text}>
                  ☠️ <strong style={styles.strong}>Muertos:</strong>{" "}
                  {camada.muertos ?? 0}
                </p>

                <p style={styles.text}>
                  ⚖️ <strong style={styles.strong}>Peso promedio:</strong>{" "}
                  {camada.peso_promedio_nacimiento ?? 0} kg
                </p>

                <div style={styles.estado(camada.estado)}>
                  Estado: {camada.estado || "N/A"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}