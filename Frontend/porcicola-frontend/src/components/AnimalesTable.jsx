import { useEffect, useState } from "react";
import axios from "axios";
import { actualizarAnimal, eliminarAnimal } from "../services/animalService";
import { useNavigate } from "react-router-dom";

export default function AnimalesTable() {
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  const navigate = useNavigate();

  const [filtros, setFiltros] = useState({
    identificador: "",
    sexo: "",
    etapa: "",
    estado: "",
  });

  useEffect(() => {
    obtenerAnimales();
  }, [filtros]);

  const obtenerAnimales = async () => {
    setLoading(true);

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/animales", {
        params: filtros,
      });

      setAnimales(res.data || []);
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Error al cargar animales.");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltro = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      identificador: "",
      sexo: "",
      etapa: "",
      estado: "",
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar este animal?")) return;

    eliminarAnimal(id)
      .then(() => {
        alert("Animal eliminado.");
        obtenerAnimales();
      })
      .catch((err) => {
        console.error(err.response?.data || err);
        alert("Error al eliminar animal.");
      });
  };

  const handleEdit = (animal) => {
    setEditandoId(animal.id);
    setFormEdit({
      sexo: animal.sexo || "",
      etapa_actual: animal.etapa_actual || "",
      estado: animal.estado || "activo",
      madre_id: animal.madre_id || "",
      padre_id: animal.padre_id || "",
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdit({});
  };

  const handleSave = async (id) => {
    try {
      await actualizarAnimal(id, {
        sexo: formEdit.sexo,
        etapa_actual: formEdit.etapa_actual,
        estado: formEdit.estado,
        madre_id: formEdit.madre_id || null,
        padre_id: formEdit.padre_id || null,
      });

      alert("Animal actualizado correctamente.");

      setEditandoId(null);
      setFormEdit({});
      obtenerAnimales();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(
        error.response?.data?.mensaje ||
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al actualizar animal."
      );
    }
  };

  const normalizarTexto = (valor) => {
    return String(valor ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  const esHembra = (animal) => {
    const sexo = normalizarTexto(animal?.sexo);
    return sexo === "hembra" || sexo === "f" || sexo === "female";
  };

  const esMacho = (animal) => {
    const sexo = normalizarTexto(animal?.sexo);
    return sexo === "macho" || sexo === "m" || sexo === "male";
  };

  const etiquetaAnimal = (animal) => {
    if (!animal) return "Sin registro";

    const identificador = animal.identificador_unico || `Animal #${animal.id}`;
    const sexo = animal.sexo || "sin sexo";
    const etapa = animal.etapa_actual || "sin etapa";
    const estado = animal.estado || "sin estado";

    return `${identificador} · ${sexo} · ${etapa} · ${estado}`;
  };

  const obtenerAnimalPorId = (id) => {
    if (!id) return null;
    return animales.find((animal) => Number(animal.id) === Number(id)) || null;
  };

  const madresDisponibles = (animalActualId) => {
    return animales.filter(
      (animal) => Number(animal.id) !== Number(animalActualId) && esHembra(animal)
    );
  };

  const padresDisponibles = (animalActualId) => {
    return animales.filter(
      (animal) => Number(animal.id) !== Number(animalActualId) && esMacho(animal)
    );
  };

  const estadoVisual = (estado) => {
    const normalizado = normalizarTexto(estado);

    if (normalizado.includes("muert") || normalizado.includes("baja") || normalizado.includes("descart")) {
      return {
        bg: "#fee2e2",
        color: "#991b1b",
        border: "#fecaca",
        label: estado || "N/A",
      };
    }

    if (normalizado.includes("vendid")) {
      return {
        bg: "#ffedd5",
        color: "#9a3412",
        border: "#fed7aa",
        label: estado || "N/A",
      };
    }

    if (normalizado.includes("activo")) {
      return {
        bg: "#dcfce7",
        color: "#166534",
        border: "#bbf7d0",
        label: estado || "activo",
      };
    }

    return {
      bg: "#dbeafe",
      color: "#1d4ed8",
      border: "#bfdbfe",
      label: estado || "N/A",
    };
  };

  const styles = {
    wrapper: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      padding: "20px",
      color: "#0f172a",
    },
    title: {
      margin: "0 0 16px",
      color: "#0f172a",
      fontSize: "26px",
      fontWeight: 900,
      letterSpacing: "-0.03em",
    },
    filtros: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "18px",
      alignItems: "center",
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      minWidth: "160px",
      outline: "none",
      fontSize: "14px",
    },
    button: {
      padding: "9px 12px",
      border: "none",
      borderRadius: "12px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    secondaryButton: {
      padding: "9px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: 800,
      cursor: "pointer",
    },
    dangerButton: {
      padding: "9px 12px",
      border: "none",
      borderRadius: "12px",
      background: "#dc2626",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
    },
    tableWrap: {
      overflowX: "auto",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#ffffff",
      color: "#0f172a",
      minWidth: "1120px",
    },
    th: {
      background: "#e2e8f0",
      color: "#0f172a",
      padding: "14px",
      textAlign: "left",
      fontWeight: 900,
      borderBottom: "1px solid #cbd5e1",
      fontSize: "14px",
    },
    td: {
      padding: "14px",
      color: "#475569",
      borderBottom: "1px solid #e2e8f0",
      fontWeight: 700,
      fontSize: "14px",
      verticalAlign: "middle",
    },
    badge: (visual) => ({
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: "999px",
      background: visual.bg,
      color: visual.color,
      border: `1px solid ${visual.border}`,
      fontWeight: 900,
      fontSize: "13px",
      textTransform: "capitalize",
    }),
    empty: {
      padding: "22px",
      textAlign: "center",
      color: "#64748b",
      fontWeight: 800,
    },
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>🐷 Lista de Animales</h2>

      <div style={styles.filtros}>
        <input
          style={styles.input}
          type="text"
          name="identificador"
          placeholder="Buscar ID..."
          value={filtros.identificador}
          onChange={handleFiltro}
        />

        <select
          style={styles.input}
          name="sexo"
          value={filtros.sexo}
          onChange={handleFiltro}
        >
          <option value="">Sexo</option>
          <option value="macho">Macho</option>
          <option value="hembra">Hembra</option>
        </select>

        <select
          style={styles.input}
          name="etapa"
          value={filtros.etapa}
          onChange={handleFiltro}
        >
          <option value="">Etapa</option>
          <option value="lechon">Lechón</option>
          <option value="destete">Destete</option>
          <option value="crecimiento">Crecimiento</option>
          <option value="engorda">Engorda</option>
          <option value="reproduccion">Reproducción</option>
          <option value="gestacion">Gestación</option>
          <option value="maternidad">Maternidad</option>
          <option value="enfermeria">Enfermería</option>
        </select>

        <select
          style={styles.input}
          name="estado"
          value={filtros.estado}
          onChange={handleFiltro}
        >
          <option value="">Estado</option>
          <option value="activo">Activo</option>
          <option value="vendido">Vendido</option>
          <option value="muerto">Muerto</option>
          <option value="descartado">Descartado</option>
          <option value="baja">Baja</option>
        </select>

        <button style={styles.secondaryButton} onClick={limpiarFiltros}>
          Limpiar filtros
        </button>

        <button style={styles.button} onClick={obtenerAnimales}>
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Cargando animales...</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Identificador</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Etapa</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Madre</th>
                <th style={styles.th}>Padre</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {animales.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="8">
                    No hay animales con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                animales.map((animal) => {
                  const visual = estadoVisual(animal.estado);

                  return (
                    <tr
                      key={animal.id}
                      onClick={() => navigate(`/animales/${animal.id}`)}
                      style={{
                        cursor: "pointer",
                        background: editandoId === animal.id ? "#eff6ff" : "#ffffff",
                      }}
                    >
                      <td style={styles.td}>{animal.id}</td>

                      <td style={{ ...styles.td, color: "#0f172a", fontWeight: 900 }}>
                        {animal.identificador_unico || "N/A"}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        {editandoId === animal.id ? (
                          <select
                            style={styles.input}
                            value={formEdit.estado}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                estado: e.target.value,
                              })
                            }
                          >
                            <option value="activo">Activo</option>
                            <option value="vendido">Vendido</option>
                            <option value="muerto">Muerto</option>
                            <option value="descartado">Descartado</option>
                            <option value="baja">Baja</option>
                          </select>
                        ) : (
                          <span style={styles.badge(visual)}>{visual.label}</span>
                        )}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        {editandoId === animal.id ? (
                          <select
                            style={styles.input}
                            value={formEdit.madre_id}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                madre_id: e.target.value,
                              })
                            }
                          >
                            <option value="">Sin madre</option>
                            {madresDisponibles(animal.id).map((madre) => (
                              <option key={madre.id} value={madre.id}>
                                {etiquetaAnimal(madre)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          etiquetaAnimal(obtenerAnimalPorId(animal.madre_id))
                        )}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        {editandoId === animal.id ? (
                          <select
                            style={styles.input}
                            value={formEdit.padre_id}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                padre_id: e.target.value,
                              })
                            }
                          >
                            <option value="">Sin padre</option>
                            {padresDisponibles(animal.id).map((padre) => (
                              <option key={padre.id} value={padre.id}>
                                {etiquetaAnimal(padre)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          etiquetaAnimal(obtenerAnimalPorId(animal.padre_id))
                        )}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        {editandoId === animal.id ? (
                          <select
                            style={styles.input}
                            value={formEdit.etapa_actual}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                etapa_actual: e.target.value,
                              })
                            }
                          >
                            <option value="">Etapa</option>
                            <option value="lechon">Lechón</option>
                            <option value="destete">Destete</option>
                            <option value="crecimiento">Crecimiento</option>
                            <option value="engorda">Engorda</option>
                            <option value="reproduccion">Reproducción</option>
                            <option value="gestacion">Gestación</option>
                            <option value="maternidad">Maternidad</option>
                            <option value="enfermeria">Enfermería</option>
                          </select>
                        ) : (
                          animal.etapa_actual || "N/A"
                        )}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        {editandoId === animal.id ? (
                          <select
                            style={styles.input}
                            value={formEdit.estado}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                estado: e.target.value,
                              })
                            }
                          >
                            <option value="activo">Activo</option>
                            <option value="vendido">Vendido</option>
                            <option value="muerto">Muerto</option>
                            <option value="descartado">Descartado</option>
                            <option value="baja">Baja</option>
                          </select>
                        ) : (
                          <span style={styles.badge(visual)}>{visual.label}</span>
                        )}
                      </td>

                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {editandoId === animal.id ? (
                            <>
                              <button
                                style={styles.button}
                                onClick={() => handleSave(animal.id)}
                              >
                                💾 Guardar
                              </button>

                              <button
                                style={styles.secondaryButton}
                                onClick={cancelarEdicion}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              style={styles.secondaryButton}
                              onClick={() => handleEdit(animal)}
                            >
                              ✏️ Editar
                            </button>
                          )}

                          <button
                            style={styles.dangerButton}
                            onClick={() => handleDelete(animal.id)}
                          >
                            ❌ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}