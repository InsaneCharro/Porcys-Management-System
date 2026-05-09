import { useState } from "react";
import { crearAnimal } from "../services/animalService";

export default function AnimalForm({ onCreated }) {
  const [form, setForm] = useState({
    sexo: "",
    etapa_actual: "lechon",
    estado: "activo",
    raza: "Yorkshire"
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    crearAnimal(form)
      .then(() => {
        alert("Animal creado");
        onCreated();
      })
      .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>➕ Nuevo Animal</h3>

      <select onChange={e => setForm({...form, sexo: e.target.value})}>
        <option value="">Sexo</option>
        <option value="macho">Macho</option>
        <option value="hembra">Hembra</option>
      </select>

      <button type="submit">Guardar</button>
    </form>
  );
}