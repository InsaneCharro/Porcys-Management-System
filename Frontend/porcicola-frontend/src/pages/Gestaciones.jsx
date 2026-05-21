import React, { useEffect, useState } from "react";
import {
  getGestaciones,
  crearGestacion,
  confirmarGestacion,
  marcarFallida,
  registrarParto,
  getAlertasGestacion,
  getAnimales,
  getServiciosReproductivos,
  crearServicioReproductivo,
  actualizarResultadoServicio,
  getHistorialReproductivo,
  getIndicadoresReproductivos,
} from "../services/gestacionService";

export default function Gestaciones() {
  const [activeTab, setActiveTab] = useState("gestaciones");

  const [gestaciones, setGestaciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [hembras, setHembras] = useState([]);
  const [sementales, setSementales] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    animal_id: "",
    fecha_inicio: "",
    tipo_servicio: "natural",
  });

  const [servicioForm, setServicioForm] = useState({
    hembra_id: "",
    semental_id: "",
    tipo_servicio: "natural",
    fecha_servicio: "",
    observaciones: "",
  });

  const [hembraHistorialId, setHembraHistorialId] = useState("");
  const [historialReproductivo, setHistorialReproductivo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [g, a, al, s, ind] = await Promise.all([
        getGestaciones(),
        getAnimales(),
        getAlertasGestacion(),
        getServiciosReproductivos(),
        getIndicadoresReproductivos(),
      ]);

      setGestaciones(g.data || []);
      setServicios(s.data || []);
      setIndicadores(ind.data || null);

      const animales = a.data || [];

      const hembrasElegibles = animales.filter(
        (animal) =>
          animal.sexo === "hembra" &&
          animal.estado === "activo"
      );

      const machosElegibles = animales.filter(
        (animal) =>
          animal.sexo === "macho" &&
          animal.estado === "activo"
      );

      setHembras(hembrasElegibles);
      setSementales(machosElegibles);
      setAlertas(al.data.alertas || []);
    } catch (error) {
      console.error(error);
      alert("Error cargando reproducción y gestaciones");
    } finally {
      setLoading(false);
    }
  };

  const registrar = async () => {
    if (!form.animal_id || !form.fecha_inicio) {
      alert("Selecciona hembra y fecha de inicio");
      return;
    }

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

  const registrarServicio = async () => {
    if (!servicioForm.hembra_id || !servicioForm.fecha_servicio) {
      alert("Selecciona hembra y fecha de servicio");
      return;
    }

    try {
      await crearServicioReproductivo({
        ...servicioForm,
        semental_id: servicioForm.semental_id || null,
      });

      setServicioForm({
        hembra_id: "",
        semental_id: "",
        tipo_servicio: "natural",
        fecha_servicio: "",
        observaciones: "",
      });

      cargarDatos();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Error registrando servicio reproductivo"
      );
    }
  };

  const confirmarResultadoServicio = async (id, resultado) => {
    const texto = resultado === "preñada"
      ? "marcar este servicio como PREÑADA y crear una gestación"
      : "marcar este servicio como NO PREÑADA";

    if (!window.confirm(`¿Confirmas ${texto}?`)) {
      return;
    }

    try {
      await actualizarResultadoServicio(id, {
        resultado,
        fecha_confirmacion: new Date().toISOString().split("T")[0],
      });

      cargarDatos();

      if (hembraHistorialId) {
        consultarHistorial(hembraHistorialId);
      }
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Error actualizando resultado del servicio"
      );
    }
  };

  const consultarHistorial = async (hembraId = hembraHistorialId) => {
    if (!hembraId) {
      alert("Selecciona una hembra");
      return;
    }

    try {
      const response = await getHistorialReproductivo(hembraId);
      setHistorialReproductivo(response.data);
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Error consultando historial reproductivo"
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
    const hembrasVivas = parseInt(prompt("Hembras vivas"));
    const muertos = parseInt(prompt("Muertos") || 0);

    if (isNaN(machos) || isNaN(hembrasVivas)) {
      alert("Datos inválidos");
      return;
    }

    const vivos = machos + hembrasVivas;
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
        hembras: hembrasVivas,
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

  const estadoBadge = (estado) => {
    const colors = {
      activa: ["#dbeafe", "#1d4ed8"],
      confirmada: ["#dcfce7", "#166534"],
      parida: ["#ede9fe", "#6d28d9"],
      fallida: ["#fee2e2", "#991b1b"],
      pendiente: ["#fef3c7", "#92400e"],
      preñada: ["#dcfce7", "#166534"],
      no_preñada: ["#fee2e2", "#991b1b"],
    };

    const [bg, color] = colors[estado] || ["#e2e8f0", "#334155"];

    return (
      <span style={{
        padding: "6px 10px",
        borderRadius: "999px",
        backgroundColor: bg,
        color,
        fontWeight: "700",
        fontSize: "13px",
      }}>
        {estado}
      </span>
    );
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
    tabs: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "20px",
    },
    tab: {
      padding: "10px 16px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#334155",
      cursor: "pointer",
      fontWeight: "700",
    },
    activeTab: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      border: "1px solid #2563eb",
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
    textarea: {
      padding: "10px 14px",
      minHeight: "90px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#1e293b",
      minWidth: "320px",
      fontSize: "15px",
      resize: "vertical",
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
      verticalAlign: "top",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "16px",
      marginBottom: "20px",
    },
    metric: {
      background: "#f8fafc",
      borderRadius: "14px",
      padding: "18px",
      border: "1px solid #e2e8f0",
      color: "#1e293b",
    },
    metricLabel: {
      display: "block",
      color: "#334155",
      fontWeight: "700",
      marginBottom: "8px",
    },
    metricValue: {
      color: "#1e293b",
      fontSize: "28px",
      fontWeight: "800",
      margin: 0,
    },
  };

  const TabButton = ({ id, label }) => (
    <button
      style={{
        ...styles.tab,
        ...(activeTab === id ? styles.activeTab : {}),
      }}
      onClick={() => setActiveTab(id)}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestiones de Gestación</h1>

      {loading && <p>Cargando...</p>}

      <div style={styles.tabs}>
        <TabButton id="gestaciones" label="Gestaciones" />
        <TabButton id="servicios" label="Servicios reproductivos" />
        <TabButton id="historial" label="Historial reproductivo" />
        <TabButton id="indicadores" label="Indicadores" />
        <TabButton id="alertas" label="Alertas" />
      </div>

      {activeTab === "gestaciones" && (
        <>
          <div style={styles.card}>
            <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
              Registrar nueva gestación
            </h2>

            <p style={{ color: "#64748b", marginTop: 0 }}>
              Este formulario se conserva por compatibilidad. Para reproducción avanzada, usa la pestaña Servicios reproductivos.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                style={styles.input}
                value={form.animal_id}
                onChange={(e) => setForm({ ...form, animal_id: e.target.value })}
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
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />

              <select
                style={styles.input}
                value={form.tipo_servicio}
                onChange={(e) => setForm({ ...form, tipo_servicio: e.target.value })}
              >
                <option value="natural">Natural</option>
                <option value="inseminacion">Inseminación</option>
              </select>

              <button style={styles.button} onClick={registrar}>
                Registrar gestación
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
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
                    <td style={styles.td}>{g.animal?.identificador_unico || "N/A"}</td>
                    <td style={styles.td}>{g.fecha_inicio || g.fecha_servicio}</td>
                    <td style={styles.td}>{g.fecha_probable_parto}</td>
                    <td style={styles.td}>{estadoBadge(g.estado)}</td>

                    <td style={styles.td}>
                      {g.estado === "activa" && (
                        <>
                          <button style={styles.button} onClick={() => confirmar(g.id)}>
                            Confirmar
                          </button>

                          <button
                            style={{ ...styles.dangerButton, marginLeft: "8px" }}
                            onClick={() => fallida(g.id)}
                          >
                            Fallida
                          </button>
                        </>
                      )}

                      {g.estado === "confirmada" && (
                        <button style={styles.warningButton} onClick={() => parto(g.id)}>
                          Registrar parto
                        </button>
                      )}

                      {g.estado === "parida" && (
                        <span style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          fontWeight: "700",
                        }}>
                          ✔ Finalizada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "servicios" && (
        <>
          <div style={styles.card}>
            <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
              Registrar servicio reproductivo
            </h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <select
                style={styles.input}
                value={servicioForm.hembra_id}
                onChange={(e) => setServicioForm({ ...servicioForm, hembra_id: e.target.value })}
              >
                <option value="">Selecciona hembra</option>
                {hembras.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.identificador_unico}
                  </option>
                ))}
              </select>

              <select
                style={styles.input}
                value={servicioForm.semental_id}
                onChange={(e) => setServicioForm({ ...servicioForm, semental_id: e.target.value })}
              >
                <option value="">Semental opcional</option>
                {sementales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.identificador_unico}
                  </option>
                ))}
              </select>

              <select
                style={styles.input}
                value={servicioForm.tipo_servicio}
                onChange={(e) => setServicioForm({ ...servicioForm, tipo_servicio: e.target.value })}
              >
                <option value="natural">Natural</option>
                <option value="inseminacion">Inseminación</option>
              </select>

              <input
                style={styles.input}
                type="date"
                value={servicioForm.fecha_servicio}
                onChange={(e) => setServicioForm({ ...servicioForm, fecha_servicio: e.target.value })}
              />

              <textarea
                style={styles.textarea}
                placeholder="Observaciones"
                value={servicioForm.observaciones}
                onChange={(e) => setServicioForm({ ...servicioForm, observaciones: e.target.value })}
              />

              <button style={styles.button} onClick={registrarServicio}>
                Registrar servicio
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
              Servicios registrados
            </h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Hembra</th>
                  <th style={styles.th}>Semental</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Intento</th>
                  <th style={styles.th}>Resultado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.id}</td>
                    <td style={styles.td}>{s.hembra?.identificador_unico || "N/A"}</td>
                    <td style={styles.td}>{s.semental?.identificador_unico || "Sin semental"}</td>
                    <td style={styles.td}>{s.tipo_servicio}</td>
                    <td style={styles.td}>{s.fecha_servicio}</td>
                    <td style={styles.td}>{s.numero_intento}</td>
                    <td style={styles.td}>{estadoBadge(s.resultado)}</td>
                    <td style={styles.td}>
                      {s.resultado === "pendiente" ? (
                        <>
                          <button
                            style={styles.successButton}
                            onClick={() => confirmarResultadoServicio(s.id, "preñada")}
                          >
                            Preñada
                          </button>

                          <button
                            style={{ ...styles.dangerButton, marginLeft: "8px" }}
                            onClick={() => confirmarResultadoServicio(s.id, "no_preñada")}
                          >
                            No preñada
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#64748b" }}>
                          Confirmado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "historial" && (
        <div style={styles.card}>
          <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
            Historial reproductivo por hembra
          </h2>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
            <select
              style={styles.input}
              value={hembraHistorialId}
              onChange={(e) => {
                setHembraHistorialId(e.target.value);
                setHistorialReproductivo(null);
              }}
            >
              <option value="">Selecciona hembra</option>
              {hembras.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.identificador_unico}
                </option>
              ))}
            </select>

            <button style={styles.button} onClick={() => consultarHistorial()}>
              Consultar historial
            </button>
          </div>

          {historialReproductivo && (
            <>
              <div style={styles.grid}>
                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Total servicios</strong>
                  <h2 style={styles.metricValue}>
                    {historialReproductivo.resumen.total_servicios}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Exitosos</strong>
                  <h2 style={styles.metricValue}>
                    {historialReproductivo.resumen.exitosos}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Fallidos</strong>
                  <h2 style={styles.metricValue}>
                    {historialReproductivo.resumen.fallidos}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Tasa de éxito</strong>
                  <h2 style={styles.metricValue}>
                    {historialReproductivo.resumen.tasa_exito}%
                  </h2>
                </div>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Semental</th>
                    <th style={styles.th}>Intento</th>
                    <th style={styles.th}>Resultado</th>
                    <th style={styles.th}>Gestación</th>
                  </tr>
                </thead>

                <tbody>
                  {historialReproductivo.servicios.map((s) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{s.fecha_servicio}</td>
                      <td style={styles.td}>{s.tipo_servicio}</td>
                      <td style={styles.td}>{s.semental?.identificador_unico || "Sin semental"}</td>
                      <td style={styles.td}>{s.numero_intento}</td>
                      <td style={styles.td}>{estadoBadge(s.resultado)}</td>
                      <td style={styles.td}>{s.gestacion_id ? `#${s.gestacion_id}` : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {activeTab === "indicadores" && (
        <div style={styles.card}>
          <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
            Indicadores reproductivos
          </h2>

          {indicadores ? (
            <>
              <div style={styles.grid}>
                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Total servicios</strong>
                  <h2 style={styles.metricValue}>
                    {indicadores.total_servicios}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Pendientes</strong>
                  <h2 style={styles.metricValue}>
                    {indicadores.pendientes}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Exitosos</strong>
                  <h2 style={styles.metricValue}>
                    {indicadores.exitosos}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Fallidos</strong>
                  <h2 style={styles.metricValue}>
                    {indicadores.fallidos}
                  </h2>
                </div>

                <div style={styles.metric}>
                  <strong style={styles.metricLabel}>Tasa de éxito</strong>
                  <h2 style={styles.metricValue}>
                    {indicadores.tasa_exito}%
                  </h2>
                </div>
              </div>

              <h3 style={{ color: "#1e293b" }}>
                Hembras con 2 o más fallos
              </h3>

              {(indicadores.hembras_con_fallos || []).length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  No hay hembras con repetición crítica.
                </p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Hembra</th>
                      <th style={styles.th}>Fallos</th>
                    </tr>
                  </thead>

                  <tbody>
                    {indicadores.hembras_con_fallos.map((item) => (
                      <tr key={item.hembra_id}>
                        <td style={styles.td}>
                          {item.hembra?.identificador_unico || item.hembra_id}
                        </td>
                        <td style={styles.td}>{item.fallos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <p style={{ color: "#64748b" }}>
              Sin indicadores disponibles.
            </p>
          )}
        </div>
      )}

      {activeTab === "alertas" && (
        <div style={styles.card}>
          <h2 style={{ color: "#1e293b", fontWeight: 700, marginBottom: "20px" }}>
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
                    ⚠️ {a.identificador} parirá en {a.dias_restantes} días
                  </strong>
                )}

                {a.tipo === "parto_atrasado" && (
                  <strong>
                    🔴 {a.identificador} tiene atraso de {a.dias_atraso} días
                  </strong>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
