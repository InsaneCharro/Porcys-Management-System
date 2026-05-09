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
      const res = await axios.get(
        "http://127.0.0.1:8000/api/alertas"
      );

      setAlertas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const criticas = alertas.filter(
    a => a.tipo === "critica"
  ).length;

  const importantes = alertas.filter(
    a => a.tipo === "importante"
  ).length;

  const informativas = alertas.filter(
    a => a.tipo === "informativa"
  ).length;

  const getColor = (tipo) => {
    switch (tipo) {
      case "critica":
        return "#f44336";

      case "importante":
        return "#ff9800";

      case "informativa":
        return "#2196f3";

      default:
        return "#4CAF50";
    }
  };

  const getBackground = (tipo) => {
    switch (tipo) {
      case "critica":
        return "#330000";

      case "importante":
        return "#332200";

      case "informativa":
        return "#001f33";

      default:
        return "#1e1e1e";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          color: "white",
          background: "#121212",
          minHeight: "100vh"
        }}
      >
        <h2>Cargando alertas...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        background: "#121212",
        minHeight: "100vh",
        color: "white"
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "42px",
            marginBottom: "10px"
          }}
        >
          🚨 Centro de Alertas
        </h1>

        <p style={{ color: "#aaa" }}>
          Monitoreo inteligente de operación porcícola
        </p>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "35px"
        }}
      >
        <div
          style={{
            background: "#1e1e1e",
            padding: "25px",
            borderRadius: "16px",
            borderLeft: "6px solid #f44336"
          }}
        >
          <h3>🔴 Críticas</h3>
          <h1>{criticas}</h1>
        </div>

        <div
          style={{
            background: "#1e1e1e",
            padding: "25px",
            borderRadius: "16px",
            borderLeft: "6px solid #ff9800"
          }}
        >
          <h3>🟠 Importantes</h3>
          <h1>{importantes}</h1>
        </div>

        <div
          style={{
            background: "#1e1e1e",
            padding: "25px",
            borderRadius: "16px",
            borderLeft: "6px solid #2196f3"
          }}
        >
          <h3>🔵 Informativas</h3>
          <h1>{informativas}</h1>
        </div>
      </div>

      {/* ALERTAS */}
      {alertas.length === 0 ? (
        <div
          style={{
            background: "#1e1e1e",
            padding: "30px",
            borderRadius: "16px",
            textAlign: "center"
          }}
        >
          <h2>✅ No hay alertas activas</h2>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px"
          }}
        >
          {alertas.map((alerta, index) => (
            <div
              key={index}
              style={{
                background: getBackground(alerta.tipo),
                borderLeft: `6px solid ${getColor(alerta.tipo)}`,
                padding: "25px",
                borderRadius: "16px",
                boxShadow:
                  "0 0 12px rgba(0,0,0,0.35)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px"
                }}
              >
                <div>
                  <h2
                    style={{
                      marginBottom: "10px"
                    }}
                  >
                    {alerta.icono} {alerta.titulo}
                  </h2>

                  <p
                    style={{
                      fontSize: "18px",
                      color: "#ddd"
                    }}
                  >
                    {alerta.mensaje}
                  </p>
                </div>

                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "#111",
                    color: "#ccc",
                    fontSize: "14px"
                  }}
                >
                  {new Date(
                    alerta.fecha
                  ).toLocaleDateString("es-MX")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}