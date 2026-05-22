import { useEffect, useState } from "react";
import axios from "axios";

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAlertas();

    const intervalo = setInterval(() => {
      cargarAlertas();
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const cargarAlertas = async () => {
    try {
      const [resGeneral, resMortalidad] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/alertas"),
        axios.get("http://127.0.0.1:8000/api/mortalidad-bajas/alertas"),
      ]);

      const alertasSistema = resGeneral.data || [];

      const alertasMortalidad = (resMortalidad.data || []).map((alerta) => ({
        tipo:
          alerta.nivel === "alto"
            ? "critica"
            : alerta.nivel === "medio"
            ? "importante"
            : "informativa",

        titulo:
          alerta.tipo === "alta_mortalidad"
            ? "Alta mortalidad detectada"
            : "Patrón sanitario detectado",

        mensaje: alerta.mensaje,

        icono: alerta.tipo === "alta_mortalidad" ? "☠️" : "🦠",

        fecha: new Date().toISOString(),
      }));

      setAlertas([...alertasMortalidad, ...alertasSistema]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const criticas = alertas.filter((a) => a.tipo === "critica").length;
  const importantes = alertas.filter((a) => a.tipo === "importante").length;
  const informativas = alertas.filter((a) => a.tipo === "informativa").length;

  const getVisual = (tipo) => {
    switch (tipo) {
      case "critica":
        return {
          color: "#dc2626",
          bg: "#fee2e2",
          border: "#dc2626",
          dot: "🔴",
        };
      case "importante":
        return {
          color: "#f97316",
          bg: "#ffedd5",
          border: "#f97316",
          dot: "🟠",
        };
      case "informativa":
        return {
          color: "#2563eb",
          bg: "#dbeafe",
          border: "#2563eb",
          dot: "🔵",
        };
      default:
        return {
          color: "#16a34a",
          bg: "#dcfce7",
          border: "#16a34a",
          dot: "🟢",
        };
    }
  };

  const styles = {
    page: {
      padding: "24px 32px",
      background: "#f8fafc",
      minHeight: "100vh",
      color: "#0f172a",
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      margin: "0 0 6px",
      color: "#0f172a",
    },
    subtitle: {
      color: "#475569",
      margin: "0 0 24px",
      fontSize: "15px",
    },
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginBottom: "28px",
    },
    kpi: (visual) => ({
      background: "#ffffff",
      padding: "22px",
      borderRadius: "20px",
      border: "1px solid #e2e8f0",
      borderLeft: `6px solid ${visual.border}`,
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
    }),
    kpiTitle: {
      margin: "0 0 10px",
      color: "#0f172a",
      fontWeight: 900,
      fontSize: "19px",
    },
    kpiNumber: {
      margin: 0,
      color: "#0f172a",
      fontSize: "36px",
      fontWeight: 900,
    },
    empty: {
      background: "#ffffff",
      padding: "28px",
      borderRadius: "20px",
      textAlign: "center",
      border: "1px solid #e2e8f0",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      color: "#0f172a",
    },
    alertList: {
      display: "grid",
      gap: "16px",
    },
    alertCard: (visual) => ({
      background: "#ffffff",
      borderLeft: `6px solid ${visual.border}`,
      borderTop: "1px solid #e2e8f0",
      borderRight: "1px solid #e2e8f0",
      borderBottom: "1px solid #e2e8f0",
      padding: "22px",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      color: "#0f172a",
    }),
    alertTitle: {
      margin: "0 0 10px",
      color: "#0f172a",
      fontWeight: 900,
      fontSize: "22px",
    },
    alertText: {
      fontSize: "17px",
      color: "#475569",
      margin: 0,
      lineHeight: 1.55,
    },
    dateBadge: (visual) => ({
      padding: "9px 13px",
      borderRadius: "12px",
      background: visual.bg,
      color: visual.color,
      fontSize: "14px",
      fontWeight: 900,
      border: `1px solid ${visual.border}`,
      whiteSpace: "nowrap",
    }),
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={{ color: "#0f172a" }}>Cargando alertas...</h2>
        <p style={{ color: "#64748b" }}>Consultando centro de alertas.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🚨 Centro de Alertas</h1>
      <p style={styles.subtitle}>Monitoreo inteligente de operación porcícola.</p>

      <div style={styles.kpiGrid}>
        <div style={styles.kpi(getVisual("critica"))}>
          <h3 style={styles.kpiTitle}>🔴 Críticas</h3>
          <h1 style={styles.kpiNumber}>{criticas}</h1>
        </div>

        <div style={styles.kpi(getVisual("importante"))}>
          <h3 style={styles.kpiTitle}>🟠 Importantes</h3>
          <h1 style={styles.kpiNumber}>{importantes}</h1>
        </div>

        <div style={styles.kpi(getVisual("informativa"))}>
          <h3 style={styles.kpiTitle}>🔵 Informativas</h3>
          <h1 style={styles.kpiNumber}>{informativas}</h1>
        </div>
      </div>

      {alertas.length === 0 ? (
        <div style={styles.empty}>
          <h2 style={{ margin: 0, color: "#0f172a" }}>✅ No hay alertas activas</h2>
        </div>
      ) : (
        <div style={styles.alertList}>
          {alertas.map((alerta, index) => {
            const visual = getVisual(alerta.tipo);

            return (
              <div key={index} style={styles.alertCard(visual)}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div style={{ flex: "1 1 260px" }}>
                    <h2 style={styles.alertTitle}>
                      {alerta.icono} {alerta.titulo}
                    </h2>

                    <p style={styles.alertText}>{alerta.mensaje}</p>
                  </div>

                  <div style={styles.dateBadge(visual)}>
                    {new Date(alerta.fecha).toLocaleDateString("es-MX")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}