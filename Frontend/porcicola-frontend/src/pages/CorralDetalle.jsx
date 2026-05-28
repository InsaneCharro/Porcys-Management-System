import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export default function CorralDetalle() {
  const { id } = useParams();

  const [corral, setCorral] = useState(null);
  const [corrales, setCorrales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [destinos, setDestinos] = useState({});

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const tiposCorral = {
    maternidad: "🍼 Maternidad",
    gestacion: "🤰 Gestación",
    reproduccion: "🐗 Reproducción",
    engorda: "🍖 Engorda",
    destete: "🐖 Destete",
    enfermeria: "💊 Enfermería",
    cuarentena: "🧪 Cuarentena",
    sementales: "🐗 Sementales",
    general: "📦 General",
  };

  const cargarDatos = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const [corralRes, corralesRes] = await Promise.all([
        axios.get(`${API}/corrales/${id}`),
        axios.get(`${API}/corrales`),
      ]);

      setCorral(corralRes.data);
      setCorrales(corralesRes.data || []);
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Error cargando detalle del corral.");
    } finally {
      setLoading(false);
    }
  };

  const etiquetaTipoCorral = (tipo) => {
    return tiposCorral[tipo] || "📦 General";
  };

  const obtenerEstadoVisual = (estado) => {
    if (estado === "sobrecupo") {
      return {
        label: "Sobrecupo crítico",
        bg: "#fee2e2",
        border: "#b91c1c",
        text: "#7f1d1d",
      };
    }

    if (estado === "saturado") {
      return {
        label: "Saturado",
        bg: "#fee2e2",
        border: "#dc2626",
        text: "#991b1b",
      };
    }

    if (estado === "en_riesgo") {
      return {
        label: "En riesgo",
        bg: "#ffedd5",
        border: "#f97316",
        text: "#9a3412",
      };
    }

    if (estado === "ocupacion_media") {
      return {
        label: "Ocupación media",
        bg: "#fef9c3",
        border: "#eab308",
        text: "#854d0e",
      };
    }

    return {
      label: "Disponible",
      bg: "#dcfce7",
      border: "#16a34a",
      text: "#166534",
    };
  };

  const moverAnimal = async (animalId) => {
    const corralDestinoId = destinos[animalId];

    if (!corralDestinoId) {
      alert("Selecciona un corral destino.");
      return;
    }

    try {
      await axios.post(`${API}/animales/${animalId}/mover-corral`, {
        corral_id: Number(corralDestinoId),
      });

      try {
        await axios.post(`${API}/movimientos`, {
          animal_id: animalId,
          corral_origen_id: Number(id),
          corral_destino_id: Number(corralDestinoId),
        });
      } catch (errorHistorial) {
        console.warn(
          "El animal se movió, pero no se pudo guardar historial:",
          errorHistorial.response?.data || errorHistorial
        );
      }

      setMensaje("Animal movido correctamente.");
      setDestinos({ ...destinos, [animalId]: "" });

      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || "Error moviendo animal.");
    }
  };

  const retirarAnimal = async (animalId) => {
    if (!window.confirm("¿Retirar este animal del corral?")) {
      return;
    }

    try {
      await axios.post(`${API}/animales/${animalId}/retirar-corral`);

      setMensaje("Animal retirado del corral correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || "Error retirando animal.");
    }
  };

  const styles = {
    container: {
      padding: "24px 32px",
      background: "#f8fafc",
      minHeight: "100vh",
      color: "#0f172a",
    },
    card: {
      background: "#ffffff",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      border: "1px solid #e2e8f0",
      marginBottom: "18px",
    },
    input: {
      padding: "9px 10px",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      background: "#ffffff",
      color: "#0f172a",
      minWidth: "180px",
    },
    button: {
      padding: "9px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    dangerButton: {
      padding: "9px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#dc2626",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    subtleButton: {
      display: "inline-block",
      padding: "9px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      background: "#f8fafc",
      color: "#0f172a",
      fontWeight: 800,
      cursor: "pointer",
      textDecoration: "none",
      marginBottom: "16px",
    },
    th: {
      padding: "12px",
      background: "#e2e8f0",
      textAlign: "left",
      fontSize: "14px",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #e2e8f0",
      fontSize: "14px",
      verticalAlign: "middle",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2>Cargando detalle del corral...</h2>
      </div>
    );
  }

  if (!corral) {
    return (
      <div style={styles.container}>
        <h2>No se encontró el corral.</h2>
        <Link to="/corrales" style={styles.subtleButton}>
          Volver a Corrales
        </Link>
      </div>
    );
  }

  const visual = obtenerEstadoVisual(corral.estado_ocupacion);
  const porcentaje = Number(corral.porcentaje_ocupacion || 0);
  const animales = corral.animales || [];
  const animalesBloqueados = corral.animales_bloqueados_en_corral || [];

  return (
    <div style={styles.container}>
      <Link to="/corrales" style={styles.subtleButton}>
        ← Volver a Corrales
      </Link>

      <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "8px" }}>
        🏠 {corral.nombre}
      </h1>

      <p style={{ color: "#475569", marginTop: 0, marginBottom: "18px" }}>
        {etiquetaTipoCorral(corral.tipo_corral)}
      </p>

      {mensaje && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "18px",
            fontWeight: 800,
          }}
        >
          {mensaje}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Capacidad</h3>
          <p style={{ fontSize: "30px", fontWeight: 900 }}>
            {corral.capacidad}
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Ocupados</h3>
          <p style={{ fontSize: "30px", fontWeight: 900 }}>
            {corral.ocupados}
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Disponibles</h3>
          <p style={{ fontSize: "30px", fontWeight: 900 }}>
            {corral.disponibles}
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Estado</h3>
          <span
            style={{
              display: "inline-block",
              background: visual.bg,
              color: visual.text,
              border: `1px solid ${visual.border}`,
              padding: "8px 12px",
              borderRadius: "999px",
              fontWeight: 900,
            }}
          >
            {visual.label}
          </span>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Ocupación</h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 900,
            marginBottom: "8px",
          }}
        >
          <span>
            {corral.ocupados}/{corral.capacidad}
          </span>
          <span>{porcentaje}%</span>
        </div>

        <div
          style={{
            height: "14px",
            background: "#e2e8f0",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(porcentaje, 100)}%`,
              background: visual.border,
            }}
          />
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Animales activos en este corral</h2>

        {animales.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            Este corral no tiene animales activos asignados.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.th}>Animal</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Etapa</th>
                <th style={styles.th}>Clasificación</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Mover a</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {animales.map((animal) => (
                <tr key={animal.id}>
                  <td style={styles.td}>
                    <Link
                      to={`/animales/${animal.id}`}
                      style={{
                        fontWeight: 900,
                        color: "#2563eb",
                        textDecoration: "none",
                      }}
                    >
                      {animal.identificador_unico || `Animal #${animal.id}`}
                    </Link>
                  </td>

                  <td style={styles.td}>{animal.sexo || "N/A"}</td>
                  <td style={styles.td}>{animal.etapa_actual || "N/A"}</td>
                  <td style={styles.td}>{animal.clasificacion || "N/A"}</td>
                  <td style={styles.td}>{animal.estado || "N/A"}</td>

                  <td style={styles.td}>
                    <select
                      style={styles.input}
                      value={destinos[animal.id] || ""}
                      onChange={(e) =>
                        setDestinos({
                          ...destinos,
                          [animal.id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleccionar destino</option>

                      {corrales
                        .filter((c) => Number(c.id) !== Number(corral.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} — {etiquetaTipoCorral(c.tipo_corral)} (
                            {c.ocupados}/{c.capacidad})
                          </option>
                        ))}
                    </select>
                  </td>

                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        style={styles.button}
                        onClick={() => moverAnimal(animal.id)}
                      >
                        Mover
                      </button>

                      <button
                        style={styles.dangerButton}
                        onClick={() => retirarAnimal(animal.id)}
                      >
                        Retirar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {animalesBloqueados.length > 0 && (
        <div
          style={{
            ...styles.card,
            border: "1px solid #f97316",
            background: "#fff7ed",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#9a3412" }}>
            Animales bloqueados que aún aparecen asociados a este corral
          </h2>

          <p style={{ color: "#9a3412" }}>
            Estos animales no cuentan como ocupación activa, pero conviene revisar
            si quedaron como dato viejo.
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.th}>Animal</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Etapa</th>
                <th style={styles.th}>Clasificación</th>
              </tr>
            </thead>

            <tbody>
              {animalesBloqueados.map((animal) => (
                <tr key={animal.id}>
                  <td style={styles.td}>{animal.identificador_unico}</td>
                  <td style={styles.td}>{animal.estado}</td>
                  <td style={styles.td}>{animal.etapa_actual || "N/A"}</td>
                  <td style={styles.td}>{animal.clasificacion || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Regla activa</h2>
        <p style={{ color: "#475569", lineHeight: 1.7 }}>
          Los movimientos se validan en backend. Si intentas mover un animal a un
          tipo de corral incompatible, vendido, muerto, descartado, dado de baja o
          a un corral lleno, el sistema debe bloquearlo.
        </p>
      </div>
    </div>
  );
}