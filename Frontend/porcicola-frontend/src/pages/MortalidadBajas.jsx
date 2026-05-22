import { useEffect, useState } from "react";
import { getAnimales } from "../services/animalService";
const API_URL = "http://127.0.0.1:8000/api";

export default function MortalidadBajas() {
  const [resumen, setResumen] = useState(null);
  const [bajas, setBajas] = useState([]);
  const [causas, setCausas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

    const [animales, setAnimales] = useState([]);

    const [formulario, setFormulario] = useState({
    animal_id: "",
    tipo_baja: "muerte",
    fecha: "",
    hora_aproximada: "",
    causa: "",
    observaciones: "",
    costo_estimado_perdida: "",
    });

  const [filtros, setFiltros] = useState({
    tipo_baja: "",
    causa: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

    const [resResumen, resBajas, resCausas, resAlertas, resAnimales] = await Promise.all([        fetch(`${API_URL}/mortalidad-bajas/resumen`),
        fetch(`${API_URL}/mortalidad-bajas?${params.toString()}`),
        fetch(`${API_URL}/mortalidad-bajas/causas`),
        fetch(`${API_URL}/mortalidad-bajas/alertas`),
        getAnimales(),
        ]);

      setResumen(await resResumen.json());
      setBajas(await resBajas.json());
      setCausas(await resCausas.json());
      setAlertas(await resAlertas.json());
      setAnimales(resAnimales.data || []);
    } catch (error) {
      console.error("Error cargando mortalidad/bajas:", error);
      alert("Error al cargar Mortalidad / Bajas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrarBaja = async (e) => {
    e.preventDefault();

    try {
        if (!formulario.animal_id) {
        alert("Selecciona un animal");
        return;
        }

        if (!formulario.fecha) {
        alert("La fecha es obligatoria");
        return;
        }

        if (!formulario.causa) {
        alert("Selecciona una causa");
        return;
        }

        const response = await fetch(
        `${API_URL}/animales/${formulario.animal_id}/muerte`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(formulario),
        }
        );

        const data = await response.json();

        if (!response.ok) {
        alert(data.message || "Error registrando baja");
        return;
        }

        alert(data.message);

        setFormulario({
        animal_id: "",
        tipo_baja: "muerte",
        fecha: "",
        hora_aproximada: "",
        causa: "",
        observaciones: "",
        costo_estimado_perdida: "",
        });

        cargarDatos();
    } catch (error) {
        console.error(error);
        alert("Error registrando baja");
    }
    };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      tipo_baja: "",
      causa: "",
      fecha_inicio: "",
      fecha_fin: "",
    };

    setFiltros(filtrosLimpios);

    setTimeout(() => {
      cargarDatos();
    }, 0);
  };

  const formatoCausa = (causa) => {
    if (!causa) return "Sin causa";
    return causa.replaceAll("_", " ");
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mortalidad / Bajas</h1>
      <p style={styles.subtitle}>
        Control de muertes, descartes y trazabilidad de animales dados de baja.
      </p>

      {loading && <p>Cargando información...</p>}

      {!loading && (
        <>
          <div style={styles.cardsGrid}>
            <div style={styles.card}>
              <p style={styles.cardLabel}>Total bajas</p>
              <h2 style={styles.cardNumber}>{resumen?.total ?? 0}</h2>
            </div>

            <div style={styles.card}>
              <p style={styles.cardLabel}>Muertes</p>
              <h2 style={styles.cardNumber}>{resumen?.muertes ?? 0}</h2>
            </div>

            <div style={styles.card}>
              <p style={styles.cardLabel}>Descartes</p>
              <h2 style={styles.cardNumber}>{resumen?.descartes ?? 0}</h2>
            </div>

            <div style={styles.card}>
              <p style={styles.cardLabel}>Últimos 30 días</p>
              <h2 style={styles.cardNumber}>{resumen?.ultimos_30_dias ?? 0}</h2>
            </div>
          </div>

          <div style={styles.formCard}>
            <h3 style={styles.sectionTitle}>Registrar baja</h3>

            <form onSubmit={registrarBaja} style={styles.formGrid}>
                <div>
                <label style={styles.label}>Animal</label>

                <select
                    value={formulario.animal_id}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        animal_id: e.target.value,
                    })
                    }
                    style={styles.input}
                >
                    <option value="">Seleccionar animal</option>

                    {animales
                    .filter((animal) => {
                        const estado = (animal.estado || "").toLowerCase();

                        return (
                            !estado.includes("muert") &&
                            !estado.includes("descart") &&
                            !estado.includes("baja")
                        );
                        })
                    .map((animal) => (
                        <option key={animal.id} value={animal.id}>
                        {animal.identificador ||
                            animal.codigo ||
                            animal.nombre ||
                            `Animal #${animal.id}`}
                        </option>
                    ))}
                </select>
                </div>

                <div>
                <label style={styles.label}>Tipo de baja</label>

                <select
                    value={formulario.tipo_baja}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        tipo_baja: e.target.value,
                    })
                    }
                    style={styles.input}
                >
                    <option value="muerte">Muerte</option>
                    <option value="descarte">Descarte</option>
                </select>
                </div>

                <div>
                <label style={styles.label}>Fecha</label>

                <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        fecha: e.target.value,
                    })
                    }
                    style={styles.input}
                />
                </div>

                <div>
                <label style={styles.label}>Hora aproximada</label>

                <input
                    type="time"
                    value={formulario.hora_aproximada}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        hora_aproximada: e.target.value,
                    })
                    }
                    style={styles.input}
                />
                </div>

                <div>
                <label style={styles.label}>Causa</label>

                <select
                    value={formulario.causa}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        causa: e.target.value,
                    })
                    }
                    style={styles.input}
                >
                    <option value="">Seleccionar causa</option>

                    {causas.map((causa) => (
                    <option key={causa} value={causa}>
                        {formatoCausa(causa)}
                    </option>
                    ))}
                </select>
                </div>

                <div>
                <label style={styles.label}>Pérdida estimada</label>

                <input
                    type="number"
                    min="0"
                    value={formulario.costo_estimado_perdida}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        costo_estimado_perdida: e.target.value,
                    })
                    }
                    style={styles.input}
                />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Observaciones</label>

                <textarea
                    value={formulario.observaciones}
                    onChange={(e) =>
                    setFormulario({
                        ...formulario,
                        observaciones: e.target.value,
                    })
                    }
                    style={styles.textarea}
                />
                </div>

                <div>
                <button type="submit" style={styles.dangerButton}>
                    Registrar baja
                </button>
                </div>
            </form>
            </div>

          {alertas.length > 0 && (
            <div style={styles.alertBox}>
              <h3 style={styles.sectionTitle}>Alertas sanitarias</h3>
              {alertas.map((alerta, index) => (
                <div key={index} style={styles.alertItem}>
                  <strong>{alerta.nivel?.toUpperCase()}:</strong> {alerta.mensaje}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={aplicarFiltros} style={styles.filters}>
            <div>
              <label style={styles.label}>Tipo de baja</label>
              <select
                value={filtros.tipo_baja}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipo_baja: e.target.value })
                }
                style={styles.input}
              >
                <option value="">Todas</option>
                <option value="muerte">Muerte</option>
                <option value="descarte">Descarte</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Causa</label>
              <select
                value={filtros.causa}
                onChange={(e) =>
                  setFiltros({ ...filtros, causa: e.target.value })
                }
                style={styles.input}
              >
                <option value="">Todas</option>
                {causas.map((causa) => (
                  <option key={causa} value={causa}>
                    {formatoCausa(causa)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Fecha inicio</label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Fecha fin</label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.filterButtons}>
              <button type="submit" style={styles.primaryButton}>
                Filtrar
              </button>
              <button type="button" onClick={limpiarFiltros} style={styles.secondaryButton}>
                Limpiar
              </button>
            </div>
          </form>

          <div style={styles.columns}>
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Bajas por causa</h3>
              {resumen?.por_causa?.length > 0 ? (
                resumen.por_causa.map((item) => (
                  <div key={item.causa} style={styles.statRow}>
                    <span>{formatoCausa(item.causa)}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>Sin datos por causa.</p>
              )}
            </div>

            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Bajas por etapa</h3>
              {resumen?.por_etapa?.length > 0 ? (
                resumen.por_etapa.map((item, index) => (
                  <div key={index} style={styles.statRow}>
                    <span>{item.etapa}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>Sin datos por etapa.</p>
              )}
            </div>
          </div>

          <div style={styles.tableCard}>
            <h3 style={styles.sectionTitle}>Historial de bajas</h3>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Animal</th>
                  <th style={styles.th}>Causa</th>
                  <th style={styles.th}>Etapa</th>
                  <th style={styles.th}>Corral</th>
                  <th style={styles.th}>Estado previo</th>
                  <th style={styles.th}>Pérdida estimada</th>
                </tr>
              </thead>

              <tbody>
                {bajas.length > 0 ? (
                  bajas.map((baja) => (
                    <tr key={baja.id}>
                      <td style={styles.td}>{baja.fecha}</td>
                      <td style={styles.td}>
                        {baja.tipo_baja === "descarte" ? "Descarte" : "Muerte"}
                      </td>
                      <td style={styles.td}>
                        {baja.animal?.identificador ||
                          baja.animal?.codigo ||
                          baja.animal?.nombre ||
                          `Animal #${baja.animal_id}`}
                      </td>
                      <td style={styles.td}>{formatoCausa(baja.causa)}</td>
                      <td style={styles.td}>
                        {baja.etapa_animal_snapshot || "Sin etapa"}
                      </td>
                    <td style={styles.td}>
                    {baja.corral?.nombre || baja.corral?.codigo || "Sin corral"}
                    </td>

                    <td style={styles.td}>
                    {baja.estado_anterior_animal || "Sin estado"}
                    </td>

                    <td style={styles.td}>
                    ${Number(baja.costo_estimado_perdida || 0).toFixed(2)}
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={styles.tdEmpty} colSpan="8">
                      No hay bajas registradas con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    background: "#f4f6f8",
    minHeight: "100vh",
  },
  title: {
    margin: 0,
    color: "#1f2937",
  },
  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  cardNumber: {
    margin: "8px 0 0",
    color: "#111827",
  },
  alertBox: {
    marginTop: "24px",
    background: "#fff7ed",
    border: "1px solid #fdba74",
    borderRadius: "12px",
    padding: "18px",
  },
  alertItem: {
    marginTop: "8px",
    color: "#9a3412",
  },
  filters: {
    marginTop: "24px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
  },
  filterButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "end",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#1f2937",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 0",
    color: "#374151",
    textTransform: "capitalize",
  },
  emptyText: {
    color: "#6b7280",
  },
  formCard: {
    marginTop: "24px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },

    formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    },

    textarea: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    padding: "10px",
    resize: "vertical",
    },

    dangerButton: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "600",
    },
  tableCard: {
    marginTop: "24px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    color: "#374151",
    borderBottom: "1px solid #d1d5db",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
  },
  tdEmpty: {
    padding: "18px",
    textAlign: "center",
    color: "#6b7280",
  },
};