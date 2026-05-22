import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function DetalleCamada() {
  const { id } = useParams();

  const [camada, setCamada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/camadas/${id}`)
      .then((res) => {
        setCamada(res.data);
      })
      .catch((err) => {
        console.error(err.response?.data || err);
        alert("Error cargando detalle de camada.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const estadoVisual = (estado) => {
    const normalizado = String(estado || "").toLowerCase();

    if (normalizado.includes("muert") || normalizado.includes("baja")) {
      return {
        bg: "#fee2e2",
        color: "#991b1b",
        border: "#fecaca",
      };
    }

    if (normalizado.includes("vendid") || normalizado.includes("destet")) {
      return {
        bg: "#ffedd5",
        color: "#9a3412",
        border: "#fed7aa",
      };
    }

    return {
      bg: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    };
  };

  const sexoVisual = (sexo) => {
    return sexo === "macho"
      ? {
          border: "#2563eb",
          bg: "#dbeafe",
          color: "#1d4ed8",
        }
      : {
          border: "#ec4899",
          bg: "#fce7f3",
          color: "#be185d",
        };
  };

  const styles = {
    page: {
      padding: "24px 32px",
      background: "#f8fafc",
      minHeight: "100vh",
      color: "#0f172a",
    },
    back: {
      display: "inline-block",
      color: "#be185d",
      textDecoration: "none",
      fontWeight: 900,
      marginBottom: "18px",
      padding: "9px 12px",
      borderRadius: "12px",
      background: "#fce7f3",
      border: "1px solid #fbcfe8",
    },
    headerCard: {
      background: "#ffffff",
      padding: "24px",
      borderRadius: "20px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0",
      borderLeft: "6px solid #ec4899",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      color: "#0f172a",
    },
    title: {
      margin: "0 0 18px",
      fontSize: "36px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      color: "#0f172a",
    },
    text: {
      margin: "10px 0",
      color: "#475569",
      fontSize: "16px",
    },
    strong: {
      color: "#0f172a",
      fontWeight: 900,
    },
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "14px",
      marginTop: "22px",
    },
    kpi: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      padding: "16px",
      borderRadius: "16px",
      textAlign: "center",
      color: "#0f172a",
    },
    kpiLabel: {
      margin: "0 0 8px",
      color: "#475569",
      fontWeight: 900,
      fontSize: "14px",
    },
    kpiValue: {
      margin: 0,
      color: "#0f172a",
      fontSize: "26px",
      fontWeight: 900,
    },
    sectionTitle: {
      margin: "0 0 18px",
      color: "#0f172a",
      fontSize: "28px",
      fontWeight: 900,
      letterSpacing: "-0.03em",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: "18px",
    },
    lechonCard: (visual) => ({
      background: "#ffffff",
      padding: "18px",
      borderRadius: "18px",
      border: "1px solid #e2e8f0",
      borderLeft: `6px solid ${visual.border}`,
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      transition: "0.2s",
      cursor: "pointer",
      color: "#0f172a",
      minHeight: "100%",
    }),
    lechonTitle: {
      margin: "0 0 12px",
      color: "#0f172a",
      fontSize: "21px",
      fontWeight: 900,
    },
    badge: (visual) => ({
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      background: visual.bg,
      color: visual.color,
      border: `1px solid ${visual.border}`,
      fontWeight: 900,
      fontSize: "13px",
      textTransform: "capitalize",
    }),
    empty: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      padding: "22px",
      color: "#64748b",
      fontWeight: 800,
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={{ color: "#0f172a" }}>Cargando camada...</h2>
        <p style={{ color: "#64748b" }}>Consultando maternidad.</p>
      </div>
    );
  }

  if (!camada) {
    return (
      <div style={styles.page}>
        <Link to="/maternidad" style={styles.back}>
          ← Volver a maternidad
        </Link>

        <div style={styles.empty}>No se encontró la camada.</div>
      </div>
    );
  }

  const lechones = camada.lechones || [];

  return (
    <div style={styles.page}>
      <Link to="/maternidad" style={styles.back}>
        ← Volver a maternidad
      </Link>

      <div style={styles.headerCard}>
        <h1 style={styles.title}>🐷 Camada #{camada.id}</h1>

        <p style={styles.text}>
          <strong style={styles.strong}>Madre:</strong>{" "}
          {camada.madre?.identificador_unico || "N/A"}
        </p>

        <p style={styles.text}>
          <strong style={styles.strong}>Fecha de parto:</strong>{" "}
          {camada.fecha_parto || "N/A"}
        </p>

        <div style={styles.kpiGrid}>
          <div style={styles.kpi}>
            <p style={styles.kpiLabel}>🐖 Total</p>
            <p style={styles.kpiValue}>{camada.total_crias ?? 0}</p>
          </div>

          <div style={styles.kpi}>
            <p style={styles.kpiLabel}>✅ Vivos</p>
            <p style={styles.kpiValue}>{camada.vivos ?? 0}</p>
          </div>

          <div style={styles.kpi}>
            <p style={styles.kpiLabel}>☠️ Muertos</p>
            <p style={styles.kpiValue}>{camada.muertos ?? 0}</p>
          </div>

          <div style={styles.kpi}>
            <p style={styles.kpiLabel}>⚖️ Peso promedio</p>
            <p style={styles.kpiValue}>
              {camada.peso_promedio_nacimiento ?? 0} kg
            </p>
          </div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>🐖 Lechones</h2>

      {lechones.length === 0 ? (
        <div style={styles.empty}>
          Esta camada no tiene lechones registrados.
        </div>
      ) : (
        <div style={styles.grid}>
          {lechones.map((lechon) => {
            const visualSexo = sexoVisual(lechon.sexo);
            const visualEstado = estadoVisual(lechon.estado);

            return (
              <Link
                key={lechon.id}
                to={`/animales/${lechon.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={styles.lechonCard(visualSexo)}>
                  <h3 style={styles.lechonTitle}>
                    {lechon.identificador_unico || `Lechón #${lechon.id}`}
                  </h3>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Sexo:</strong>{" "}
                    <span style={styles.badge(visualSexo)}>
                      {lechon.sexo || "N/A"}
                    </span>
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Peso:</strong>{" "}
                    {lechon.peso ?? 0} kg
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Estado:</strong>{" "}
                    <span style={styles.badge(visualEstado)}>
                      {lechon.estado || "N/A"}
                    </span>
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Etapa:</strong>{" "}
                    {lechon.etapa_actual || "N/A"}
                  </p>

                  <div
                    style={{
                      marginTop: "14px",
                      fontSize: "13px",
                      color: "#2563eb",
                      fontWeight: 900,
                    }}
                  >
                    Click para ver detalle →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}