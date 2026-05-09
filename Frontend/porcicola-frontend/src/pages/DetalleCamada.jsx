import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function DetalleCamada() {

  const { id } = useParams();

  const [camada, setCamada] = useState(null);

  useEffect(() => {

    axios.get(`http://127.0.0.1:8000/api/camadas/${id}`)
      .then(res => setCamada(res.data))
      .catch(err => console.error(err));

  }, [id]);

  if (!camada) {
    return <h2>Cargando camada...</h2>;
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#121212",
        minHeight: "100vh",
        color: "white"
      }}
    >

      {/* 🔙 VOLVER */}
      <Link
        to="/maternidad"
        style={{
          color: "hotpink",
          textDecoration: "none",
          fontWeight: "bold"
        }}
      >
        ← Volver a maternidad
      </Link>

      {/* 🐷 HEADER */}
      <div
        style={{
          background: "#1e1e1e",
          padding: "25px",
          borderRadius: "14px",
          marginTop: "20px",
          marginBottom: "25px",
          boxShadow: "0 0 15px rgba(0,0,0,0.3)"
        }}
      >

        <h1>
          🐷 Camada #{camada.id}
        </h1>

        <p>
          <strong>Madre:</strong>{" "}
          {camada.madre?.identificador_unico}
        </p>

        <p>
          <strong>Fecha de parto:</strong>{" "}
          {camada.fecha_parto}
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            marginTop: "20px"
          }}
        >

          <div style={kpiStyle}>
            🐖 Total<br />
            <strong>{camada.total_crias}</strong>
          </div>

          <div style={kpiStyle}>
            ✅ Vivos<br />
            <strong>{camada.vivos}</strong>
          </div>

          <div style={kpiStyle}>
            ☠️ Muertos<br />
            <strong>{camada.muertos}</strong>
          </div>

          <div style={kpiStyle}>
            ⚖️ Peso promedio<br />
            <strong>
              {camada.peso_promedio_nacimiento ?? 0} kg
            </strong>
          </div>

        </div>

      </div>

      {/* 🐖 LECHONES */}
      <h2 style={{ marginBottom: "20px" }}>
        🐖 Lechones
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "18px"
        }}
      >

        {camada.lechones.map(lechon => (

          <Link
            key={lechon.id}
            to={`/animales/${lechon.id}`}
            style={{
              textDecoration: "none",
              color: "white"
            }}
          >

            <div
              style={{
                background: "#1e1e1e",
                padding: "18px",
                borderRadius: "12px",
                borderLeft:
                  lechon.sexo === "macho"
                    ? "6px solid cyan"
                    : "6px solid violet",
                boxShadow: "0 0 10px rgba(0,0,0,0.25)",
                transition: "0.2s",
                cursor: "pointer"
              }}
            >

              <h3>
                {lechon.identificador_unico}
              </h3>

              <p>
                <strong>Sexo:</strong>{" "}
                {lechon.sexo}
              </p>

              <p>
                <strong>Peso:</strong>{" "}
                {lechon.peso ?? 0} kg
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {lechon.estado}
              </p>

              <p>
                <strong>Etapa:</strong>{" "}
                {lechon.etapa_actual}
              </p>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#aaa"
                }}
              >
                Click para ver detalle →
              </div>

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}

const kpiStyle = {
  background: "#252525",
  padding: "15px",
  borderRadius: "10px",
  minWidth: "140px",
  textAlign: "center",
  fontSize: "15px"
};