import React, { useEffect, useState } from "react";
import {
  getGestaciones,
  crearGestacion,
  confirmarGestacion,
  marcarFallida,
  registrarParto,
  getAlertasGestacion,
  getAnimales,
} from "../services/gestacionService";

export default function Gestaciones() {
  const [gestaciones, setGestaciones] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    animal_id: "",
    fecha_inicio: "",
    tipo_servicio: "natural",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [g, a, al] = await Promise.all([
        getGestaciones(),
        getAnimales(),
        getAlertasGestacion(),
      ]);

      setGestaciones(g.data || []);

      const elegibles = (a.data || []).filter(
        (animal) =>
          animal.sexo === "hembra" &&
          animal.estado === "activo"
      );

      setHembras(elegibles);
      setAlertas(al.data.alertas || []);
    } catch (error) {
      console.error(error);
      alert("Error cargando gestaciones");
    } finally {
      setLoading(false);
    }
  };

  const registrar = async () => {
    try {
      await crearGestacion(form);

      setForm({
        animal_id: "",
        fecha_inicio: "",
        tipo_servicio: "natural",
      });

      cargarDatos();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Error registrando gestación"
      );
    }
  };

  const confirmar = async (id) => {
    try {
      await confirmarGestacion(id);
      cargarDatos();
    } catch {
      alert("Error confirmando gestación");
    }
  };

  const fallida = async (id) => {
    try {
      await marcarFallida(id);
      cargarDatos();
    } catch {
      alert("Error marcando fallida");
    }
  };

  const parto = async (id) => {
    const machos = parseInt(prompt("Machos vivos"));
    const hembras = parseInt(prompt("Hembras vivas"));
    const muertos = parseInt(prompt("Muertos") || 0);

    if (isNaN(machos) || isNaN(hembras)) {
      alert("Datos inválidos");
      return;
    }

    const vivos = machos + hembras;
    const pesos = [];

    for (let i = 0; i < vivos; i++) {
      const peso = parseFloat(prompt(`Peso lechón ${i + 1}`));

      if (isNaN(peso)) {
        alert("Peso inválido");
        return;
      }

      pesos.push(peso);
    }

    try {
      await registrarParto(id, {
        machos,
        hembras,
        muertos,
        pesos,
      });

      cargarDatos();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Error registrando parto"
      );
    }
  };

  const styles = {
    container: {
      padding: "30px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    title: {
      fontSize: "36px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "25px",
    },
    card: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 6px 24px rgba(15, 23, 42, 0.08)",
      marginBottom: "20px",
      boxSizing: "border-box",
    },
    input: {
      padding: "10px 14px",
      height: "44px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#1e293b",
      minWidth: "220px",
      fontSize: "15px",
    },
    button: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    dangerButton: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#dc2626",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    successButton: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#16a34a",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    warningButton: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#f59e0b",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
    },
    th: {
      textAlign: "left",
      padding: "12px",
      backgroundColor: "#e2e8f0",
      color: "#1e293b",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #e2e8f0",
      color: "#334155",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestiones de Gestación</h1>

      {loading && <p>Cargando...</p>}

      <div style={styles.card}>
        <h2
          style={{
            color: "#1e293b",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Alertas Inteligentes
        </h2>

        {alertas.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            Sin alertas activas.
          </p>
        ) : (
          alertas.map((a, i) => (
            <div
              key={i}
              style={{
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "10px",
                backgroundColor:
                  a.tipo === "parto_atrasado"
                    ? "#fee2e2"
                    : "#fef3c7",
              }}
            >
              {a.tipo === "proximo_parto" && (
                <strong>
                  ⚠️ {a.identificador} parirá en{" "}
                  {a.dias_restantes} días
                </strong>
              )}

              {a.tipo === "parto_atrasado" && (
                <strong>
                  🔴 {a.identificador} tiene atraso de{" "}
                  {a.dias_atraso} días
                </strong>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.card}>
        <h2
          style={{
            color: "#1e293b",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Registrar nueva gestación
        </h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <select
            style={styles.input}
            value={form.animal_id}
            onChange={(e) =>
              setForm({
                ...form,
                animal_id: e.target.value,
              })
            }
          >
            <option value="">Selecciona hembra</option>

            {hembras.map((h) => (
              <option key={h.id} value={h.id}>
                {h.identificador_unico}
              </option>
            ))}
          </select>

          <input
            style={styles.input}
            type="date"
            value={form.fecha_inicio}
            onChange={(e) =>
              setForm({
                ...form,
                fecha_inicio: e.target.value,
              })
            }
          />

          <select
            style={styles.input}
            value={form.tipo_servicio}
            onChange={(e) =>
              setForm({
                ...form,
                tipo_servicio: e.target.value,
              })
            }
          >
            <option value="natural">Natural</option>
            <option value="inseminacion">
              Inseminación
            </option>
          </select>

          <button
            style={styles.button}
            onClick={registrar}
          >
            Registrar gestación
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2
          style={{
            color: "#1e293b",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          Historial de gestaciones
        </h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Hembra</th>
              <th style={styles.th}>Inicio</th>
              <th style={styles.th}>Parto probable</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {gestaciones.map((g) => (
              <tr key={g.id}>
                <td style={styles.td}>{g.id}</td>
                <td style={styles.td}>
                  {g.animal?.identificador_unico || "N/A"}
                </td>
                <td style={styles.td}>{g.fecha_inicio}</td>
                <td style={styles.td}>
                  {g.fecha_probable_parto}
                </td>
                <td style={styles.td}>{g.estado}</td>

                <td style={styles.td}>
                  {g.estado === "activa" && (
                    <>
                      <button
                        style={styles.button}
                        onClick={() =>
                          confirmar(g.id)
                        }
                      >
                        Confirmar
                      </button>

                      <button
                        style={{
                          ...styles.dangerButton,
                          marginLeft: "8px",
                        }}
                        onClick={() =>
                          fallida(g.id)
                        }
                      >
                        Fallida
                      </button>
                    </>
                  )}

                  {g.estado === "confirmada" && (
                    <button
                      style={styles.warningButton}
                      onClick={() => parto(g.id)}
                    >
                      Registrar parto
                    </button>
                  )}

                  {g.estado === "parida" && (
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: "700",
                      }}
                    >
                      ✔ Finalizada
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}