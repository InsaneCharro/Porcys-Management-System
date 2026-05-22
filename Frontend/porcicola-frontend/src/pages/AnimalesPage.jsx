import { useState } from "react";
import AnimalesTable from "../components/AnimalesTable";
import AnimalForm from "../components/AnimalForm";

export default function AnimalesPage() {
  const [reload, setReload] = useState(false);

  const recargar = () => setReload(!reload);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "24px 32px",
      }}
    >
      <h1
        style={{
          fontSize: "40px",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          margin: "0 0 6px",
          color: "#0f172a",
        }}
      >
        🐷 Gestión de Animales
      </h1>

      <p
        style={{
          margin: "0 0 22px",
          color: "#475569",
          fontSize: "15px",
        }}
      >
        Registro, edición y consulta de animales con trazabilidad individual.
      </p>

      <AnimalForm onCreated={recargar} />

      <AnimalesTable key={reload} />
    </div>
  );
}