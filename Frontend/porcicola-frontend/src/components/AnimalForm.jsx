import { useState } from "react";
import { crearAnimal } from "../services/animalService";

export default function AnimalForm({ onCreated }) {
  const [form, setForm] = useState({
    sexo: "",
    etapa_actual: "lechon",
    estado: "activo",
    raza: "Yorkshire",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.sexo) {
      alert("Selecciona el sexo del animal.");
      return;
    }

    crearAnimal(form)
      .then(() => {
        alert("Animal creado.");
        setForm({
          sexo: "",
          etapa_actual: "lechon",
          estado: "activo",
          raza: "Yorkshire",
        });

        if (onCreated) {
          onCreated();
        }
      })
      .catch((err) => {
        console.error(err.response?.data || err);
        alert(err.response?.data?.message || "Error al crear animal.");
      });
  };

  const styles = {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      padding: "20px",
      marginBottom: "22px",
      color: "#0f172a",
    },
    title: {
      margin: "0 0 16px",
      color: "#0f172a",
      fontSize: "26px",
      fontWeight: 900,
      letterSpacing: "-0.03em",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
      alignItems: "end",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      color: "#334155",
      fontWeight: 900,
      fontSize: "14px",
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      outline: "none",
      fontSize: "14px",
      width: "100%",
    },
    button: {
      padding: "11px 14px",
      border: "none",
      borderRadius: "12px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 900,
      cursor: "pointer",
      minHeight: "42px",
    },
    note: {
      margin: "14px 0 0",
      color: "#64748b",
      fontSize: "14px",
      lineHeight: 1.5,
    },
  };

  return (
    <form style={styles.card} onSubmit={handleSubmit}>
      <h3 style={styles.title}>➕ Nuevo Animal</h3>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>Sexo</label>
          <select
            style={styles.input}
            value={form.sexo}
            onChange={(e) =>
              setForm({
                ...form,
                sexo: e.target.value,
              })
            }
          >
            <option value="">Seleccionar sexo</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Etapa inicial</label>
          <select
            style={styles.input}
            value={form.etapa_actual}
            onChange={(e) =>
              setForm({
                ...form,
                etapa_actual: e.target.value,
              })
            }
          >
            <option value="lechon">Lechón</option>
            <option value="destete">Destete</option>
            <option value="crecimiento">Crecimiento</option>
            <option value="engorda">Engorda</option>
            <option value="reproduccion">Reproducción</option>
            <option value="gestacion">Gestación</option>
            <option value="maternidad">Maternidad</option>
            <option value="enfermeria">Enfermería</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Estado</label>
          <select
            style={styles.input}
            value={form.estado}
            onChange={(e) =>
              setForm({
                ...form,
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
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Raza</label>
          <input
            style={styles.input}
            value={form.raza}
            onChange={(e) =>
              setForm({
                ...form,
                raza: e.target.value,
              })
            }
            placeholder="Ej. Yorkshire"
          />
        </div>

        <button type="submit" style={styles.button}>
          Guardar animal
        </button>
      </div>

      <p style={styles.note}>
        Nota: este formulario respeta la lógica actual del backend. Los campos avanzados
        como corral, clasificación o trazabilidad pueden editarse desde el detalle del animal
        o módulos especializados.
      </p>
    </form>
  );
}