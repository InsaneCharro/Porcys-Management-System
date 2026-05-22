import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

export default function Corrales() {
  const [corrales, setCorrales] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [draggedAnimal, setDraggedAnimal] = useState(null);
  const [corralHover, setCorralHover] = useState(null);

  const [nuevoCorral, setNuevoCorral] = useState({
    nombre: "",
    capacidad: "",
    tipo_corral: "general",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const tiposCorral = [
    { value: "maternidad", label: "Maternidad", icon: "🍼" },
    { value: "gestacion", label: "Gestación", icon: "🤰" },
    { value: "reproduccion", label: "Reproducción", icon: "🐗" },
    { value: "engorda", label: "Engorda", icon: "🍖" },
    { value: "destete", label: "Destete", icon: "🐖" },
    { value: "enfermeria", label: "Enfermería", icon: "💊" },
    { value: "cuarentena", label: "Cuarentena", icon: "🧪" },
    { value: "sementales", label: "Sementales", icon: "🐗" },
    { value: "general", label: "General", icon: "📦" },
  ];

  const normalizarTexto = (valor) => {
    return String(valor ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  const etiquetaTipoCorral = (tipo) => {
    const normalizado = normalizarTexto(tipo);

    const encontrado = tiposCorral.find(
      (item) => normalizarTexto(item.value) === normalizado
    );

    return encontrado ? `${encontrado.icon} ${encontrado.label}` : "📦 General";
  };

  const cargarDatos = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const [corralesRes, resumenRes] = await Promise.all([
        axios.get(`${API}/corrales`),
        axios.get(`${API}/corrales/resumen`),
      ]);

      setCorrales(corralesRes.data || []);
      setResumen(resumenRes.data || null);
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Error cargando corrales.");
    } finally {
      setLoading(false);
    }
  };

  const corralesPorTipo = useMemo(() => {
    return corrales.reduce((acc, corral) => {
      const tipo = corral.tipo_corral || "general";

      if (!acc[tipo]) {
        acc[tipo] = [];
      }

      acc[tipo].push(corral);
      return acc;
    }, {});
  }, [corrales]);

  const obtenerEstadoVisual = (corral) => {
    const estado = corral.estado_ocupacion;

    if (estado === "lleno") {
      return {
        label: "Lleno",
        bg: "#fee2e2",
        border: "#dc2626",
        text: "#991b1b",
      };
    }

    if (estado === "casi_lleno") {
      return {
        label: "Casi lleno",
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

  const crearCorral = async () => {
    if (!nuevoCorral.nombre.trim()) {
      alert("El nombre del corral es obligatorio.");
      return;
    }

    if (!nuevoCorral.capacidad || Number(nuevoCorral.capacidad) <= 0) {
      alert("La capacidad debe ser mayor a 0.");
      return;
    }

    try {
      await axios.post(`${API}/corrales`, {
        nombre: nuevoCorral.nombre.trim(),
        capacidad: Number(nuevoCorral.capacidad),
        tipo_corral: nuevoCorral.tipo_corral,
      });

      setNuevoCorral({
        nombre: "",
        capacidad: "",
        tipo_corral: "general",
      });

      setMensaje("Corral creado correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || error.response?.data?.message || "Error creando corral.");
    }
  };

  const eliminarCorral = async (corral) => {
    if (!window.confirm(`¿Eliminar ${corral.nombre}? Solo se permite si está vacío.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/corrales/${corral.id}`);
      setMensaje("Corral eliminado correctamente.");
      cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || "Error eliminando corral.");
    }
  };

  const iniciarArrastre = (animal, corral) => {
    setDraggedAnimal({
      ...animal,
      corral_origen_id: corral.id,
      corral_origen_nombre: corral.nombre,
    });
  };

  const moverAnimal = async (corralDestino) => {
    if (!draggedAnimal) {
      return;
    }

    if (Number(draggedAnimal.corral_origen_id) === Number(corralDestino.id)) {
      setDraggedAnimal(null);
      setCorralHover(null);
      return;
    }

    try {
      await axios.post(`${API}/animales/${draggedAnimal.id}/mover-corral`, {
        corral_id: corralDestino.id,
      });

      try {
        await axios.post(`${API}/movimientos`, {
          animal_id: draggedAnimal.id,
          corral_origen_id: draggedAnimal.corral_origen_id,
          corral_destino_id: corralDestino.id,
        });
      } catch (errorHistorial) {
        console.warn("Movimiento registrado en corral, pero no se pudo guardar historial:", errorHistorial.response?.data || errorHistorial);
      }

      setMensaje(
        `${draggedAnimal.identificador_unico} movido de ${draggedAnimal.corral_origen_nombre} a ${corralDestino.nombre}.`
      );

      await cargarDatos();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(error.response?.data?.error || "Error moviendo animal.");
    } finally {
      setDraggedAnimal(null);
      setCorralHover(null);
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
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      minWidth: "180px",
      background: "#ffffff",
      color: "#0f172a",
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "10px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 700,
      cursor: "pointer",
    },
    dangerButton: {
      padding: "8px 10px",
      border: "none",
      borderRadius: "10px",
      background: "#dc2626",
      color: "#ffffff",
      fontWeight: 700,
      cursor: "pointer",
    },
    subtleButton: {
      padding: "8px 10px",
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      background: "#f8fafc",
      color: "#0f172a",
      fontWeight: 700,
      cursor: "pointer",
      textDecoration: "none",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2>Cargando corrales...</h2>
      </div>
    );
  }

  return (
    <div className="corrales-page" style={styles.container}>
            <style>
              {`
                .corrales-page h1,
                .corrales-page h2,
                .corrales-page h3 {
                  color: #0f172a !important;
                }

                .corrales-page p {
                  color: #475569 !important;
                }

                .corrales-page li {
                  color: #334155 !important;
                }

                .corrales-page input,
                .corrales-page select {
                  color: #0f172a !important;
                  background-color: #ffffff !important;
                }
              `}
            </style>
      <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "6px" }}>
        🏠 Corrales / Ocupación / Rotación
      </h1>

      <p style={{ color: "#475569", marginTop: 0, marginBottom: "18px" }}>
        Control de espacios por tipo de corral. Ahora Corrales usa animales reales, no lechones como entidad principal.
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

      {resumen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Corrales</h3>
            <p style={{ fontSize: "30px", fontWeight: 900 }}>{resumen.total_corrales}</p>
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Capacidad total</h3>
            <p style={{ fontSize: "30px", fontWeight: 900 }}>{resumen.capacidad_total}</p>
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Ocupados</h3>
            <p style={{ fontSize: "30px", fontWeight: 900 }}>{resumen.ocupados}</p>
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Disponibles</h3>
            <p style={{ fontSize: "30px", fontWeight: 900 }}>{resumen.disponibles}</p>
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Ocupación</h3>
            <p style={{ fontSize: "30px", fontWeight: 900 }}>{resumen.porcentaje_ocupacion}%</p>
          </div>
        </div>
      )}

      <div style={{ ...styles.card, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Crear corral</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            style={styles.input}
            placeholder="Nombre del corral"
            value={nuevoCorral.nombre}
            onChange={(e) =>
              setNuevoCorral({ ...nuevoCorral, nombre: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="number"
            min="1"
            placeholder="Capacidad"
            value={nuevoCorral.capacidad}
            onChange={(e) =>
              setNuevoCorral({ ...nuevoCorral, capacidad: e.target.value })
            }
          />

          <select
            style={styles.input}
            value={nuevoCorral.tipo_corral}
            onChange={(e) =>
              setNuevoCorral({ ...nuevoCorral, tipo_corral: e.target.value })
            }
          >
            {tiposCorral.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.icon} {tipo.label}
              </option>
            ))}
          </select>

          <button style={styles.button} onClick={crearCorral}>
            Crear corral
          </button>

          <button
            style={{ ...styles.button, background: "#0f766e" }}
            onClick={cargarDatos}
          >
            Actualizar
          </button>
        </div>
      </div>

      {tiposCorral.map((tipo) => {
        const lista = corralesPorTipo[tipo.value] || [];

        if (lista.length === 0) {
          return null;
        }

        return (
          <section key={tipo.value} style={{ marginBottom: "28px" }}>
            <h2 style={{ marginBottom: "12px" }}>
              {tipo.icon} {tipo.label}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                gap: "16px",
              }}
            >
              {lista.map((corral) => {
                const visual = obtenerEstadoVisual(corral);
                const porcentaje = Number(corral.porcentaje_ocupacion || 0);

                return (
                  <div
                    key={corral.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCorralHover(corral.id);
                    }}
                    onDragLeave={() => setCorralHover(null)}
                    onDrop={() => moverAnimal(corral)}
                    style={{
                      ...styles.card,
                      border:
                        corralHover === corral.id
                          ? `3px solid ${visual.border}`
                          : `1px solid #e2e8f0`,
                      transform:
                        corralHover === corral.id ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: "22px" }}>
                          {corral.nombre}
                        </h3>
                        <p style={{ margin: "6px 0", color: "#475569" }}>
                          {etiquetaTipoCorral(corral.tipo_corral)}
                        </p>
                      </div>

                      <span
                        style={{
                          background: visual.bg,
                          color: visual.text,
                          border: `1px solid ${visual.border}`,
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontWeight: 800,
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {visual.label}
                      </span>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 800,
                          marginBottom: "6px",
                        }}
                      >
                        <span>
                          Ocupación: {corral.ocupados}/{corral.capacidad}
                        </span>
                        <span>{porcentaje}%</span>
                      </div>

                      <div
                        style={{
                          height: "10px",
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

                      <p style={{ color: "#475569", marginTop: "8px" }}>
                        Disponibles: <strong>{corral.disponibles}</strong>
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        minHeight: "40px",
                      }}
                    >
                      {!corral.animales || corral.animales.length === 0 ? (
                        <span style={{ color: "#64748b" }}>
                          Sin animales activos asignados.
                        </span>
                      ) : (
                        corral.animales.map((animal) => (
                          <span
                            key={animal.id}
                            draggable
                            onDragStart={() => iniciarArrastre(animal, corral)}
                            title={`Arrastra para mover a otro corral. Estado: ${animal.estado || "N/A"}`}
                            style={{
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              padding: "7px 10px",
                              borderRadius: "10px",
                              fontSize: "13px",
                              cursor: "grab",
                              fontWeight: 800,
                            }}
                          >
                            🐖 {animal.identificador_unico}
                          </span>
                        ))
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "16px",
                      }}
                    >
                      <Link
                        to={`/corrales/${corral.id}`}
                        style={styles.subtleButton}
                      >
                        Ver detalle
                      </Link>

                      <button
                        style={styles.dangerButton}
                        onClick={() => eliminarCorral(corral)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div style={{ ...styles.card, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Reglas activas</h2>
        <p style={{ color: "#475569" }}>
          El backend bloquea animales vendidos, muertos, descartados o dados de baja. También bloquea sobrecapacidad y movimientos incompatibles con el tipo de corral.
        </p>

        <ul style={{ color: "#334155", lineHeight: 1.8 }}>
          <li>Maternidad: hembras gestantes/reproductivas, lactancia y lechones.</li>
          <li>Gestación: hembras gestantes o reproductivas.</li>
          <li>Reproducción: animales reproductivos o pie de cría.</li>
          <li>Engorda: animales de abasto, crecimiento, finalización o engorda.</li>
          <li>Enfermería y cuarentena: uso flexible controlado.</li>
          <li>Sementales: machos reproductores.</li>
        </ul>
      </div>
    </div>
  );
}