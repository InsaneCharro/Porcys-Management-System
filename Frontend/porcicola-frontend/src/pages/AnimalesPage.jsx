import { useState } from "react";
import AnimalesTable from "../components/AnimalesTable";
import AnimalForm from "../components/AnimalForm";

export default function AnimalesPage() {
  const [reload, setReload] = useState(false);

  const recargar = () => setReload(!reload);

  return (
    <div style={{ marginLeft: "220px", padding: "20px" }}>
      <h1>🐷 Gestión de Animales</h1>

      <AnimalForm onCreated={recargar} />

      <AnimalesTable key={reload} />
    </div>
  );
}