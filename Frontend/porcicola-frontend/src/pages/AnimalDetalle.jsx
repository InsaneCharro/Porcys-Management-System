import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { registrarPeso } from "../services/pesoService";
import axios from "axios";

import {
  aplicarMedicamento,
  obtenerMedicamentos
} from "../services/sanidadService";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function AnimalDetalle() {

  const { id } = useParams();

  // =========================
  // ESTADOS
  // =========================

  const [animal, setAnimal] = useState(null);

  const [pesos, setPesos] = useState([]);

  const [nuevoPeso, setNuevoPeso] = useState("");

  const [fecha, setFecha] = useState("");

  // SANIDAD
  const [mostrarModal, setMostrarModal] = useState(false);

  const [medicamentos, setMedicamentos] = useState([]);

  const [medicamentoId, setMedicamentoId] = useState("");

  const [dosis, setDosis] = useState("");

  const [stock, setStock] = useState(0);

  const [eventosSanitarios, setEventosSanitarios] = useState([]);

  // CORRALES
  const [corrales, setCorrales] = useState([]);

  const [corralId, setCorralId] = useState("");

  const [mostrarModalMuerte, setMostrarModalMuerte] = useState(false);

  const [causaMuerte, setCausaMuerte] = useState("");

  const [observacionesMuerte, setObservacionesMuerte] = useState("");

  const [fechaMuerte, setFechaMuerte] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [pesoMuerte, setPesoMuerte] = useState("");

  const [historialMuertes, setHistorialMuertes] = useState([]);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {

    axios.get(`http://127.0.0.1:8000/api/animales/${id}`)
      .then(res => setAnimal(res.data))
      .catch(err => console.error(err));

    axios.get(`http://127.0.0.1:8000/api/pesos/${id}`)
      .then(res => setPesos(res.data))
      .catch(err => console.error(err));

    obtenerMedicamentos()
      .then(setMedicamentos);

    axios.get(`http://127.0.0.1:8000/api/medicamentos/historial/${id}`)
      .then(res => setEventosSanitarios(res.data))
      .catch(err => console.error(err));

    axios.get("http://127.0.0.1:8000/api/corrales")
      .then(res => setCorrales(res.data))
      .catch(err => console.error(err));

    axios.get(`http://127.0.0.1:8000/api/animales/${id}/muertes`)
      .then(res => setHistorialMuertes(res.data))
      .catch(err => console.error(err));

  }, [id]);

  // =========================
  // STOCK MEDICAMENTO
  // =========================

  useEffect(() => {

    const med = medicamentos.find(
      m => m.id == medicamentoId
    );

    setStock(
      med ? Number(med.stock) : 0
    );

  }, [medicamentoId, medicamentos]);

  if (!animal) {
    return <h2>Cargando...</h2>;
  }

  // =========================
  // HISTORIAL ORDENADO
  // =========================

  const ordenados = [...pesos].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  );

  // =========================
  // PREDICCIÓN
  // =========================

  let prediccion = [];

  if (ordenados.length >= 2) {

    const ultimo = ordenados[ordenados.length - 1];

    const penultimo = ordenados[ordenados.length - 2];

    const diferencia =
      ultimo.peso - penultimo.peso;

    for (let i = 1; i <= 4; i++) {

      prediccion.push(
        Number(ultimo.peso) + (diferencia * i)
      );

    }

  }

  // =========================
  // DATOS GRÁFICA
  // =========================

  const labels = [
    ...ordenados.map(p => p.fecha),
    ...prediccion.map((_, i) => `Pred ${i + 1}`)
  ];

  const dataPeso = [
    ...ordenados.map(p => p.peso),
    ...prediccion
  ];

  const colores = [
    ...ordenados.map(() => "blue"),
    ...prediccion.map(() => "orange")
  ];

  const dataIdeal = ordenados.map(
    (_, i) => 8 + (i * 3)
  );

  const ultimoIdeal =
    dataIdeal[dataIdeal.length - 1] || 0;

  const dataIdealExtendido = [
    ...dataIdeal,
    ...prediccion.map(
      (_, i) => ultimoIdeal + ((i + 1) * 3)
    )
  ];

  // =========================
  // CUMPLIMIENTO
  // =========================

  let cumplimiento = 0;

  if (ordenados.length > 0) {

    const total = ordenados.reduce(
      (acc, p, index) => {

        const ideal = 8 + (index * 3);

        return acc + (p.peso / ideal);

      },
      0
    );

    cumplimiento =
      (total / ordenados.length) * 100;

  }

  let estadoCrecimiento = "Sin datos";

  if (ordenados.length > 0) {

    if (cumplimiento >= 90) {
      estadoCrecimiento = "Excelente";
    }
    else if (cumplimiento >= 70) {
      estadoCrecimiento = "Regular";
    }
    else {
      estadoCrecimiento = "Bajo crecimiento";
    }

  }

  // =========================
  // CHART
  // =========================

  const chartData = {

    labels,

    datasets: [

      {
        label: "Peso real",
        data: dataPeso,
        tension: 0.3,
        borderColor: "blue",
        pointBackgroundColor: colores
      },

      {
        label: "Peso ideal",
        data: dataIdealExtendido,
        borderColor: "green"
      }

    ]

  };

  // =========================
  // REGISTRAR PESO
  // =========================

  const handleRegistrarPeso = () => {

    if (!nuevoPeso || !fecha) {
      return alert("Completa todos los campos");
    }

    registrarPeso({
      animal_id: id,
      peso: nuevoPeso,
      fecha
    })

    .then(() => {

      alert("Peso registrado");

      setNuevoPeso("");

      setFecha("");

      axios.get(`http://127.0.0.1:8000/api/pesos/${id}`)
        .then(res => setPesos(res.data));

    });

  };

  // =========================
  // SANIDAD
  // =========================

  const enviarSanidad = async () => {

    try {

      await aplicarMedicamento({

        animal_id: animal.id,

        medicamento_id: medicamentoId,

        dosis: Number(dosis),

        fecha: new Date()
          .toISOString()
          .split("T")[0]

      });

      alert("✅ Medicamento aplicado");

      setMostrarModal(false);

      setDosis("");

      setMedicamentoId("");

      axios.get(`http://127.0.0.1:8000/api/medicamentos/historial/${id}`)
        .then(res => setEventosSanitarios(res.data));

      obtenerMedicamentos()
        .then(setMedicamentos);

    }

    catch (err) {
      console.error(err);

      console.log(err.response?.data);

      alert(
        JSON.stringify(err.response?.data) ||
        "Error al aplicar medicamento"
      );
    }

  };

  const registrarMuerte = async () => {

    try {

      const res = await fetch(
        `http://127.0.0.1:8000/api/animales/${animal.id}/muerte`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            fecha: fechaMuerte,
            causa: causaMuerte,
            observaciones: observacionesMuerte,
            peso: pesoMuerte || null
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Error al registrar baja"
        );
      }

      alert("☠️ Baja registrada correctamente");

      setMostrarModalMuerte(false);

      axios
        .get(`http://127.0.0.1:8000/api/animales/${id}/muertes`)
        .then(res => setHistorialMuertes(res.data));

      axios
        .get(`http://127.0.0.1:8000/api/animales/${id}`)
        .then(res => setAnimal(res.data));

    } catch (err) {

      console.error(err);

      alert(err.message);

    }

  };

  // =========================
  // EVENTOS ORDENADOS
  // =========================

  const eventosOrdenados = [...eventosSanitarios].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  // =========================
  // RETURN
  // =========================

  return (

    <div className="container">

      {/* ALERTA STOCK */}
      {medicamentos.some(m => m.stock <= 10) && (

        <div
          style={{
            background: "#3a0000",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px"
          }}
        >
          ⚠️ Hay medicamentos con stock bajo
        </div>

      )}

      {/* HEADER */}
      <h1>
        🐷 Detalle del Animal #{animal.id}
      </h1>

      {animal.estado === "muerto" && (
        <div
          style={{
            background: "#4a0000",
            border: "2px solid crimson",
            color: "white",
            padding: "18px",
            borderRadius: "14px",
            marginBottom: "25px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "20px",
            boxShadow: "0 0 15px rgba(220,20,60,0.3)"
          }}
        >
          ☠️ ANIMAL DADO DE BAJA

          <div
            style={{
              fontSize: "14px",
              marginTop: "8px",
              color: "#ffb3b3"
            }}
          >
            No se permiten operaciones productivas sobre este animal
          </div>
        </div>
      )}

      {/* INFO */}
      <div className="card">

        <p>
          <strong>Identificador:</strong>{" "}
          {animal.identificador_unico}
        </p>

        <p>
          <strong>Sexo:</strong>{" "}
          {animal.sexo}
        </p>

        <p>
          <strong>Etapa:</strong>{" "}
          {animal.etapa_actual}
        </p>

        <p>
          <strong>Estado:</strong>{" "}
          {animal.estado}
        </p>

        <p>
          <strong>Corral:</strong>{" "}
          {animal.corral_id || "Sin asignar"}
        </p>

        <p>
          <strong>Crecimiento:</strong>{" "}
          {estadoCrecimiento}
        </p>

      </div>

      {/* PESOS */}
      <div className="section">

        <h2>
          📊 Historial de peso
        </h2>

        <table className="tabla">

          <tbody>

            {pesos.map(p => (

              <tr key={p.id}>

                <td>{p.fecha}</td>

                <td>{p.peso} kg</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* SANIDAD */}
      <div className="section">

        <h2>
          💊 Historial sanitario
        </h2>

        <p
          style={{
            fontSize: "12px",
            color: "#aaa"
          }}
        >
          Total de eventos: {eventosSanitarios.length}
        </p>

        {eventosSanitarios.length > 5 && (

          <div
            style={{
              background: "#332200",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px"
            }}
          >
            ⚠️ Alta carga sanitaria
          </div>

        )}

        {eventosSanitarios.length === 0 ? (

          <p>No hay registros</p>

        ) : (

          eventosOrdenados.map(ev => (

            <div
              key={ev.id}
              style={{
                background: "#1e1e1e",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                borderLeft: "5px solid orange"
              }}
            >

              <div
                style={{
                  fontWeight: "bold"
                }}
              >
                💊 MEDICAMENTO
              </div>

              <div>
                {ev.medicamento}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#aaa"
                }}
              >
                Dosis: {ev.dosis}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#aaa"
                }}
              >
                Fecha: {ev.fecha}
              </div>

            </div>

          ))

        )}

      </div>

      {/* NUEVO BLOQUE */}
<div
  style={{
    background: "#1e1e1e",
    padding: "25px",
    borderRadius: "16px",
    marginTop: "25px"
  }}
>
  <h2 style={{ marginBottom: "20px" }}>
    ☠️ Historial de bajas
  </h2>

  {historialMuertes.length === 0 ? (
    <p>No hay registros de bajas</p>
  ) : (
    historialMuertes.map((muerte) => (
      <div
        key={muerte.id}
        style={{
          background: "#2a1111",
          padding: "15px",
          borderRadius: "12px",
          marginBottom: "15px",
          borderLeft: "5px solid crimson"
        }}
      >
        <p><strong>Fecha:</strong> {muerte.fecha}</p>
        <p><strong>Causa:</strong> {muerte.causa}</p>
        <p><strong>Peso:</strong> {muerte.peso} kg</p>
        <p><strong>Costo estimado:</strong> ${new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(muerte.costo_estimado)} MXN</p>
        <p>
          <strong>Observaciones:</strong>{" "}
          {muerte.observaciones || "Sin observaciones"}
        </p>
      </div>
    ))
  )}
</div>

      {/* REGISTRAR PESO */}
      {animal.estado !== "muerto" && (

        <div className="section">

        <h3>
          📊 Registrar peso
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >

          <input
            type="number"
            placeholder="Peso"

            value={nuevoPeso}

            onChange={(e) =>
              setNuevoPeso(e.target.value)
            }
          />

          <input
            type="date"

            value={fecha}

            onChange={(e) =>
              setFecha(e.target.value)
            }
          />

          <button onClick={handleRegistrarPeso}>
            Guardar
          </button>

        </div>

      </div>

      )}

      {/* BOTÓN MODAL */}
      {animal.estado !== "muerto" && (
        <>
          <button
            onClick={() => setMostrarModal(true)}
          >
            💊 Aplicar medicamento
          </button>

          <button
            onClick={() => setMostrarModalMuerte(true)}
            style={{
              marginLeft: "10px",
              background: "#8b0000",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ☠️ Registrar baja
          </button>
        </>
      )}

      {/* CORRALES */}
      {animal.estado !== "muerto" && (

        <div
        className="section"
        style={{ marginTop: "25px" }}
      >

        <h3>
          🐖 Asignar a corral
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >

          <select
            value={corralId}
            onChange={e => setCorralId(e.target.value)}
          >

            <option value="">
              Seleccionar
            </option>

            {corrales.map(c => (

              <option
                key={c.id}
                value={c.id}
              >
                {c.nombre} ({c.animales_count}/{c.capacidad})
              </option>

            ))}

          </select>

          <button

            onClick={async () => {

              try {

                const res = await fetch(
                  `http://127.0.0.1:8000/api/animales/${animal.id}/asignar-corral`,
                  {
                    method: "POST",

                    headers: {
                      "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                      corral_id: corralId
                    })
                  }
                );

                const data = await res.json();

                if (!res.ok) {
                  throw new Error(data.error);
                }

                alert("✅ Asignado");

                window.location.reload();

              }

              catch (err) {

                alert(err.message);

              }

            }}

          >
            Asignar
          </button>

        </div>

      </div>

      )}

      {/* MODAL */}
      {mostrarModal && (

  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}
  >

    <div
      style={{
        background: "#1e1e1e",
        padding: "30px",
        borderRadius: "16px",
        width: "500px",
        maxWidth: "90%",
        boxShadow: "0 0 30px rgba(0,0,0,0.5)"
      }}
    >

      <h3 style={{ marginBottom: "20px" }}>
        💊 Aplicar medicamento
      </h3>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >

        <select
          value={medicamentoId}
          onChange={(e) => {
            const med = medicamentos.find(
              m => m.id == e.target.value
            );

            setMedicamentoId(e.target.value);
            setStock(med ? Number(med.stock) : 0);
          }}
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: "#121212",
            color: "white",
            border: "1px solid #333",
            minWidth: "220px"
          }}
        >
          <option value="">
            Seleccionar medicamento
          </option>

          {medicamentos.map(m => (
            <option key={m.id} value={m.id}>
              {m.nombre} (Stock: {m.stock})
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Dosis"
          value={dosis}
          onChange={(e) => setDosis(e.target.value)}
          style={{
            width: "120px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#121212",
            color: "white"
          }}
        />

      </div>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap"
        }}
      >

        {stock <= 10 && medicamentoId && (
          <span style={{ color: "#ff9800" }}>
            ⚠️ Stock bajo
          </span>
        )}

        {Number(dosis) > Number(stock) && (
          <span style={{ color: "#f44336" }}>
            ❌ Stock insuficiente
          </span>
        )}

      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px"
        }}
      >

        <button
          onClick={enviarSanidad}
          disabled={
            !medicamentoId ||
            !dosis ||
            Number(dosis) > Number(stock)
          }
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background:
              Number(dosis) > Number(stock)
                ? "#555"
                : "#4CAF50",
            color: "white",
            fontWeight: "bold"
          }}
        >
          Guardar
        </button>

        <button
          onClick={() => setMostrarModal(false)}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: "#b71c1c",
            color: "white",
            fontWeight: "bold"
          }}
        >
          Cancelar
        </button>

      </div>

    </div>

  </div>
)}

{mostrarModalMuerte && (

  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}
  >

    <div
      style={{
        background: "#1e1e1e",
        padding: "30px",
        borderRadius: "16px",
        width: "500px",
        maxWidth: "90%"
      }}
    >

      <h2>
        ☠️ Registrar baja
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "20px"
        }}
      >

        <input
          type="date"
          value={fechaMuerte}
          onChange={(e) =>
            setFechaMuerte(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Causa de muerte"
          value={causaMuerte}
          onChange={(e) =>
            setCausaMuerte(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Peso"
          value={pesoMuerte}
          onChange={(e) =>
            setPesoMuerte(e.target.value)
          }
        />

        <textarea
          placeholder="Observaciones"
          value={observacionesMuerte}
          onChange={(e) =>
            setObservacionesMuerte(e.target.value)
          }
        />

      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px"
        }}
      >

        <button
          onClick={registrarMuerte}
          style={{
            background: "#8b0000",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Confirmar baja
        </button>

        <button
          onClick={() =>
            setMostrarModalMuerte(false)
          }
          style={{
            background: "#555",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Cancelar
        </button>

      </div>

    </div>

  </div>

)}

      {/* GRÁFICA */}
      <div
        style={{
          marginTop: "30px"
        }}
      >

        <Line data={chartData} />

      </div>

    </div>

  );

}