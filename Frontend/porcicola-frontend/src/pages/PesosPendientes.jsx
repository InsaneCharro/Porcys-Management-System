import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPesosPendientes,
  registrarPeso,
} from "../services/pesoService";

const ESTADOS_PENDIENTES = ["pendiente_en_ventana", "pendiente_atrasado"];

const normalizarTexto = (valor) => {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const obtenerLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.animales)) return payload.animales;
  if (Array.isArray(payload?.pendientes)) return payload.pendientes;

  return [];
};

const obtenerAnimalId = (item) => {
  return item?.animal_id ?? item?.id ?? item?.animal?.id ?? "";
};

const obtenerIdentificador = (item) => {
  return (
    item?.identificador_unico ||
    item?.identificador ||
    item?.codigo ||
    item?.animal?.identificador_unico ||
    item?.animal?.identificador ||
    `Animal #${obtenerAnimalId(item)}`
  );
};

const obtenerSexo = (item) => {
  return item?.sexo || item?.animal?.sexo || "No registrado";
};

const obtenerEtapa = (item) => {
  return (
    item?.etapa_actual ||
    item?.etapa ||
    item?.animal?.etapa_actual ||
    item?.animal?.etapa ||
    "No registrada"
  );
};

const obtenerControl = (item, clave) => {
  return (
    item?.pesos?.[clave] ||
    item?.[clave] ||
    item?.[`peso_${clave}`] ||
    null
  );
};

const obtenerEstadoControl = (control) => {
  if (!control) return "no_calculado";
  if (control.registrado) return "registrado";

  return control.estado || "no_calculado";
};

const esPendiente = (control) => {
  return ESTADOS_PENDIENTES.includes(obtenerEstadoControl(control));
};

const esRegistrado = (control) => {
  return obtenerEstadoControl(control) === "registrado";
};

const etiquetaDia = (clave) => {
  if (clave === "dia_10") return "día 10";
  if (clave === "dia_28") return "día 28";

  return clave;
};

const etiquetaEstado = (estado) => {
  const mapa = {
    registrado: "Registrado",
    pendiente_en_ventana: "Pendiente en ventana",
    pendiente_atrasado: "Pendiente atrasado",
    aun_no_corresponde: "Aún no corresponde",
    no_calculado: "No calculado",
  };

  return mapa[estado] || estado;
};

const formatoFecha = (valor) => {
  if (!valor) return "No calculada";
  return valor;
};

const formatoPeso = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return "No registrado";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return `${valor} kg`;
  }

  return `${numero.toFixed(2)} kg`;
};

export default function PesosPendientes() {
  const [animales, setAnimales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("pendientes");
  const [diaFiltro, setDiaFiltro] = useState("todos");

  const [pesosCaptura, setPesosCaptura] = useState({});
  const [guardando, setGuardando] = useState("");

  useEffect(() => {
    cargarListado();
  }, []);

  const cargarListado = async () => {
    try {
      setCargando(true);
      setError("");

      const res = await getPesosPendientes({ todos: 1 });
      const lista = obtenerLista(res.data);

      setAnimales(lista);
    } catch (err) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.message ||
          "No se pudo cargar el listado de pesos pendientes."
      );
    } finally {
      setCargando(false);
    }
  };

  const resumen = useMemo(() => {
    const total = animales.length;

    const pendientesVentana = animales.filter((item) => {
      const dia10 = obtenerControl(item, "dia_10");
      const dia28 = obtenerControl(item, "dia_28");

      return (
        obtenerEstadoControl(dia10) === "pendiente_en_ventana" ||
        obtenerEstadoControl(dia28) === "pendiente_en_ventana"
      );
    }).length;

    const pendientesAtrasados = animales.filter((item) => {
      const dia10 = obtenerControl(item, "dia_10");
      const dia28 = obtenerControl(item, "dia_28");

      return (
        obtenerEstadoControl(dia10) === "pendiente_atrasado" ||
        obtenerEstadoControl(dia28) === "pendiente_atrasado"
      );
    }).length;

    const completos = animales.filter((item) => {
      const dia10 = obtenerControl(item, "dia_10");
      const dia28 = obtenerControl(item, "dia_28");

      return esRegistrado(dia10) && esRegistrado(dia28);
    }).length;

    return {
      total,
      pendientesVentana,
      pendientesAtrasados,
      completos,
    };
  }, [animales]);

  const animalesFiltrados = useMemo(() => {
    return animales.filter((item) => {
      const dia10 = obtenerControl(item, "dia_10");
      const dia28 = obtenerControl(item, "dia_28");

      const controlesParaFiltro =
        diaFiltro === "todos"
          ? [dia10, dia28]
          : [obtenerControl(item, diaFiltro)];

      const textoBusqueda = normalizarTexto(
        [
          obtenerIdentificador(item),
          obtenerAnimalId(item),
          obtenerSexo(item),
          obtenerEtapa(item),
        ].join(" ")
      );

      const coincideBusqueda =
        !busqueda.trim() ||
        textoBusqueda.includes(normalizarTexto(busqueda));

      let coincideEstado = true;

      if (estadoFiltro === "pendientes") {
        coincideEstado = controlesParaFiltro.some((control) =>
          esPendiente(control)
        );
      } else if (estadoFiltro === "pendiente_en_ventana") {
        coincideEstado = controlesParaFiltro.some(
          (control) => obtenerEstadoControl(control) === "pendiente_en_ventana"
        );
      } else if (estadoFiltro === "pendiente_atrasado") {
        coincideEstado = controlesParaFiltro.some(
          (control) => obtenerEstadoControl(control) === "pendiente_atrasado"
        );
      } else if (estadoFiltro === "aun_no_corresponde") {
        coincideEstado = controlesParaFiltro.some(
          (control) => obtenerEstadoControl(control) === "aun_no_corresponde"
        );
      } else if (estadoFiltro === "registrados") {
        if (diaFiltro === "todos") {
          coincideEstado = esRegistrado(dia10) && esRegistrado(dia28);
        } else {
          coincideEstado = controlesParaFiltro.some((control) =>
            esRegistrado(control)
          );
        }
      }

      return coincideBusqueda && coincideEstado;
    });
  }, [animales, busqueda, estadoFiltro, diaFiltro]);

  const claveCaptura = (item, clave) => {
    return `${obtenerAnimalId(item)}-${clave}`;
  };

  const cambiarPesoCaptura = (item, clave, valor) => {
    const key = claveCaptura(item, clave);

    setPesosCaptura((prev) => ({
      ...prev,
      [key]: valor,
    }));
  };

  const guardarPeso = async (item, clave) => {
    const animalId = obtenerAnimalId(item);
    const control = obtenerControl(item, clave);
    const key = claveCaptura(item, clave);
    const peso = pesosCaptura[key];

    if (!animalId) {
      alert("No se encontró el ID del animal.");
      return;
    }

    if (!control?.fecha_objetivo) {
      alert("No se puede registrar porque falta la fecha objetivo.");
      return;
    }

    if (!peso || Number(peso) <= 0) {
      alert("Captura un peso válido mayor a cero.");
      return;
    }

    try {
      setGuardando(key);
      setMensaje(null);

      await registrarPeso({
        animal_id: animalId,
        peso,
        fecha: control.fecha_objetivo,
      });

      setPesosCaptura((prev) => ({
        ...prev,
        [key]: "",
      }));

      setMensaje({
        tipo: "success",
        texto: `Peso ${etiquetaDia(clave)} registrado para ${obtenerIdentificador(
          item
        )}.`,
      });

      await cargarListado();
    } catch (err) {
      console.error(err.response?.data || err);

      setMensaje({
        tipo: "error",
        texto:
          err.response?.data?.message ||
          "No se pudo registrar el peso. El backend pudo haber bloqueado un duplicado o una fecha inválida.",
      });
    } finally {
      setGuardando("");
    }
  };

  const renderEstado = (control) => {
    const estado = obtenerEstadoControl(control);

    return (
      <span style={{ ...styles.badge, ...styles.badges[estado] }}>
        {control?.mensaje || etiquetaEstado(estado)}
      </span>
    );
  };

  const renderDetallePeso = (control) => {
    if (!control) {
      return (
        <div style={styles.smallMuted}>
          No se pudo calcular este control.
        </div>
      );
    }

    if (control.registrado && control.peso) {
      return (
        <div style={styles.smallMuted}>
          {formatoPeso(control.peso.peso)} · {formatoFecha(control.peso.fecha)}
          {control.peso.edad_dias !== null &&
          control.peso.edad_dias !== undefined
            ? ` · ${control.peso.edad_dias} días`
            : ""}
        </div>
      );
    }

    return (
      <div style={styles.smallMuted}>
        Objetivo: {formatoFecha(control.fecha_objetivo)}
      </div>
    );
  };

  const renderFechaObjetivo = (item) => {
    const dia10 = obtenerControl(item, "dia_10");
    const dia28 = obtenerControl(item, "dia_28");

    if (diaFiltro === "dia_10") {
      return formatoFecha(dia10?.fecha_objetivo);
    }

    if (diaFiltro === "dia_28") {
      return formatoFecha(dia28?.fecha_objetivo);
    }

    return (
      <>
        <div>Día 10: {formatoFecha(dia10?.fecha_objetivo)}</div>
        <div>Día 28: {formatoFecha(dia28?.fecha_objetivo)}</div>
      </>
    );
  };

  const renderAcciones = (item) => {
    const claves =
      diaFiltro === "todos" ? ["dia_10", "dia_28"] : [diaFiltro];

    const acciones = claves.filter((clave) => {
      const control = obtenerControl(item, clave);

      return esPendiente(control) && !control?.registrado;
    });

    if (acciones.length === 0) {
      return <span style={styles.smallMuted}>Sin captura pendiente</span>;
    }

    return (
      <div style={styles.actionsStack}>
        {acciones.map((clave) => {
          const control = obtenerControl(item, clave);
          const key = claveCaptura(item, clave);

          return (
            <div key={key} style={styles.quickCapture}>
              <div style={styles.quickCaptureLabel}>
                Capturar {etiquetaDia(clave)}
              </div>

              <div style={styles.quickCaptureControls}>
                <input
                  style={styles.inputSmall}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="kg"
                  value={pesosCaptura[key] || ""}
                  onChange={(e) =>
                    cambiarPesoCaptura(item, clave, e.target.value)
                  }
                />

                <button
                  style={styles.primaryButtonSmall}
                  disabled={guardando === key}
                  onClick={() => guardarPeso(item, clave)}
                >
                  {guardando === key ? "Guardando..." : "Guardar"}
                </button>
              </div>

              <div style={styles.smallMuted}>
                Fecha: {formatoFecha(control?.fecha_objetivo)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>⚖️ Pesos pendientes</h1>
          <p style={styles.subtitle}>
            Control operativo de pesos obligatorios día 10 y día 28.
          </p>
        </div>

        <button
          style={styles.secondaryButton}
          onClick={cargarListado}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {mensaje && (
        <div
          style={{
            ...styles.message,
            ...(mensaje.tipo === "error"
              ? styles.messageError
              : styles.messageSuccess),
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {error && (
        <div style={{ ...styles.message, ...styles.messageError }}>
          {error}
        </div>
      )}

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Animales revisados</span>
          <strong style={styles.kpiValue}>{resumen.total}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Pendientes en ventana</span>
          <strong style={styles.kpiValue}>{resumen.pendientesVentana}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Pendientes atrasados</span>
          <strong style={styles.kpiValue}>{resumen.pendientesAtrasados}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Completos</span>
          <strong style={styles.kpiValue}>{resumen.completos}</strong>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros operativos</h2>

        <div style={styles.filtersGrid}>
          <label style={styles.label}>
            Buscar por identificador
            <input
              style={styles.input}
              type="text"
              placeholder="Ej. L-001, 40, hembra..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          <label style={styles.label}>
            Estado
            <select
              style={styles.input}
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendientes">Solo pendientes</option>
              <option value="pendiente_en_ventana">Pendientes en ventana</option>
              <option value="pendiente_atrasado">Pendientes atrasados</option>
              <option value="aun_no_corresponde">Aún no corresponde</option>
              <option value="registrados">Registrados / completos</option>
            </select>
          </label>

          <label style={styles.label}>
            Día objetivo
            <select
              style={styles.input}
              value={diaFiltro}
              onChange={(e) => setDiaFiltro(e.target.value)}
            >
              <option value="todos">Día 10 y día 28</option>
              <option value="dia_10">Solo día 10</option>
              <option value="dia_28">Solo día 28</option>
            </select>
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <h2 style={styles.sectionTitle}>Listado operativo</h2>

          <span style={styles.smallMuted}>
            Mostrando {animalesFiltrados.length} de {animales.length}
          </span>
        </div>

        {cargando ? (
          <p style={styles.text}>Cargando pesos pendientes...</p>
        ) : animalesFiltrados.length === 0 ? (
          <p style={styles.text}>
            No hay animales que coincidan con los filtros actuales.
          </p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Animal</th>
                  <th style={styles.th}>Sexo</th>
                  <th style={styles.th}>Edad</th>
                  <th style={styles.th}>Etapa</th>
                  <th style={styles.th}>Peso día 10</th>
                  <th style={styles.th}>Peso día 28</th>
                  <th style={styles.th}>Fecha objetivo</th>
                  <th style={styles.th}>Acción rápida</th>
                </tr>
              </thead>

              <tbody>
                {animalesFiltrados.map((item) => {
                  const animalId = obtenerAnimalId(item);
                  const dia10 = obtenerControl(item, "dia_10");
                  const dia28 = obtenerControl(item, "dia_28");

                  return (
                    <tr key={animalId || obtenerIdentificador(item)}>
                      <td style={styles.td}>
                        <strong style={styles.animalName}>
                          {obtenerIdentificador(item)}
                        </strong>

                        {animalId && (
                          <div>
                            <Link
                              style={styles.detailLink}
                              to={`/animales/${animalId}`}
                            >
                              Ver detalle
                            </Link>
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>{obtenerSexo(item)}</td>

                      <td style={styles.td}>
                        {item?.edad_actual_dias !== null &&
                        item?.edad_actual_dias !== undefined
                          ? `${item.edad_actual_dias} días`
                          : "No calculada"}
                      </td>

                      <td style={styles.td}>{obtenerEtapa(item)}</td>

                      <td style={styles.td}>
                        {renderEstado(dia10)}
                        {renderDetallePeso(dia10)}
                      </td>

                      <td style={styles.td}>
                        {renderEstado(dia28)}
                        {renderDetallePeso(dia28)}
                      </td>

                      <td style={styles.td}>{renderFechaObjetivo(item)}</td>

                      <td style={styles.td}>{renderAcciones(item)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 32px",
    background: "#f8fafc",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "clamp(30px, 4vw, 42px)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  kpiCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
    padding: "18px",
  },
  kpiLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  kpiValue: {
    color: "#0f172a",
    fontSize: "30px",
    fontWeight: 900,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
    padding: "20px",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 900,
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#334155",
    fontWeight: 800,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    minHeight: "42px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1150px",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 900,
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
    color: "#475569",
    fontSize: "14px",
  },
  animalName: {
    display: "block",
    color: "#0f172a",
    marginBottom: "4px",
  },
  detailLink: {
    color: "#2563eb",
    fontWeight: 800,
    fontSize: "13px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 900,
    marginBottom: "6px",
  },
  badges: {
    registrado: {
      background: "#dcfce7",
      color: "#166534",
    },
    pendiente_en_ventana: {
      background: "#dbeafe",
      color: "#1d4ed8",
    },
    pendiente_atrasado: {
      background: "#ffedd5",
      color: "#9a3412",
    },
    aun_no_corresponde: {
      background: "#f1f5f9",
      color: "#475569",
    },
    no_calculado: {
      background: "#fee2e2",
      color: "#991b1b",
    },
  },
  smallMuted: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
  },
  text: {
    color: "#475569",
    margin: 0,
  },
  actionsStack: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  quickCapture: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "10px",
    background: "#f8fafc",
  },
  quickCaptureLabel: {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "8px",
  },
  quickCaptureControls: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "6px",
  },
  inputSmall: {
    width: "90px",
    minHeight: "38px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "8px 10px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
  },
  primaryButtonSmall: {
    minHeight: "38px",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  },
  message: {
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "16px",
    fontWeight: 800,
  },
  messageSuccess: {
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  messageError: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },
};