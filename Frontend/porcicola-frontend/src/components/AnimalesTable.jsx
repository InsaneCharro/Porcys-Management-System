import { useEffect, useState } from "react";
import axios from "axios";
import { eliminarAnimal, actualizarAnimal } from "../services/animalService";
import "../styles/animales.css";
import { useNavigate } from "react-router-dom";
export default function AnimalesTable() {

  const [animales, setAnimales] = useState([]);
  const navigate = useNavigate();
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  // 🔥 FILTROS
  const [filtros, setFiltros] = useState({
    identificador: "",
    sexo: "",
    etapa: "",
    estado: ""
  });

  const handleFiltro = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  // 🔥 OBTENER ANIMALES CON FILTROS
  const obtenerAnimales = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/animales", {
        params: filtros
      });

      setAnimales(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  // 🔥 useEffect conectado a filtros
  useEffect(() => {
    obtenerAnimales();
  }, [filtros]);

  // 🗑️ ELIMINAR
  const handleDelete = (id) => {
    if (!confirm("¿Eliminar este animal?")) return;

    eliminarAnimal(id)
      .then(() => {
        alert("Eliminado");
        obtenerAnimales();
      })
      .catch(err => console.error(err));
  };

  // ✏️ EDITAR
  const handleEdit = (animal) => {
    setEditandoId(animal.id);
    setFormEdit(animal);
  };

  // 💾 GUARDAR
  const handleSave = async (id) => {
  try {
    await axios.put(`http://127.0.0.1:8000/api/animales/${id}`, {
      sexo: formEdit.sexo,
      etapa_actual: formEdit.etapa_actual,
      estado: formEdit.estado
    });

    alert("Animal actualizado correctamente");

    setEditandoId(null);
    obtenerAnimales();

  } catch (error) {
    console.error(error);
    alert("Error al actualizar animal");
  }
};
   
  <button onClick={() => setFiltros({
  identificador: "",
  sexo: "",
  etapa: "",
  estado: ""
})}>
  Limpiar filtros
</button>

  return (
    <div>
      <h2>🐷 Lista de Animales</h2>

      {/* 🔍 FILTROS */}
      <div className="filtros">

        <input
          type="text"
          name="identificador"
          placeholder="Buscar ID..."
          onChange={handleFiltro}
        />

        <select name="sexo" onChange={handleFiltro}>
          <option value="">Sexo</option>
          <option value="macho">Macho</option>
          <option value="hembra">Hembra</option>
        </select>

        <select name="etapa" onChange={handleFiltro}>
          <option value="">Etapa</option>
          <option value="lechon">Lechón</option>
          <option value="crecimiento">Crecimiento</option>
          <option value="engorda">Engorda</option>
        </select>

        <select name="estado" onChange={handleFiltro}>
          <option value="">Estado</option>
          <option value="activo">Activo</option>
          <option value="vendido">Vendido</option>
          <option value="muerto">Muerto</option>
        </select>

      </div>

      {/* 🐖 TABLA */}
      <table className="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Identificador</th>
            <th>Sexo</th>
            <th>Etapa</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {animales.map(a => (
            <tr 
  key={a.id} 
  onClick={() => navigate(`/animales/${a.id}`)}
  style={{ cursor: "pointer" }}
>
              <td>{a.id}</td>
              <td>{a.identificador_unico}</td>

              <td>
                {editandoId === a.id ? (
                  <select
  value={formEdit.sexo}
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
  onChange={(e => setFormEdit({
    ...formEdit,
    sexo: e.target.value
  }))}
>
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                  </select>
                ) : (
                  a.sexo
                )}
              </td>

              <td onClick={(e) => e.stopPropagation()}>
  {editandoId === a.id ? (
    <select
      value={formEdit.etapa_actual}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setFormEdit({
          ...formEdit,
          etapa_actual: e.target.value
        })
      }
    >
      <option value="lechon">Lechón</option>
      <option value="crecimiento">Crecimiento</option>
      <option value="engorda">Engorda</option>
      <option value="reproductor">Reproductor</option>
    </select>
  ) : (
    a.etapa_actual
  )}
</td>
            <td onClick={(e) => e.stopPropagation()}>
  {editandoId === a.id ? (
    <select
      value={formEdit.estado}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setFormEdit({
          ...formEdit,
          estado: e.target.value
        })
      }
    >
      <option value="activo">Activo</option>
      <option value="vendido">Vendido</option>
      <option value="muerto">Muerto</option>
    </select>
  ) : (
    <span className={`estado ${a.estado}`}>
      {a.estado}
    </span>
  )}
</td>

              <td>

  {editandoId === a.id ? (
    <button onClick={(e) => {
      e.stopPropagation();
      handleSave(a.id);
    }}>
      💾
    </button>
  ) : (
    <button onClick={(e) => {
      e.stopPropagation();
      handleEdit(a);
    }}>
      ✏️
    </button>
  )}

  <button onClick={(e) => {
    e.stopPropagation();
    handleDelete(a.id);
  }}>
    ❌
  </button>

</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}