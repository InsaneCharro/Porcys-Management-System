import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { registrarPeso } from "../services/pesoService";
import { getPedigreeAnimal } from "../services/animalService";
import axios from "axios";

import {
  aplicarMedicamento,
  obtenerMedicamentos,
} from "../services/sanidadService";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
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

const API = "http://127.0.0.1:8000/api";

export default function AnimalDetalle() {
  const { id } = useParams();

  const [animal, setAnimal] = useState(null);
  const [pedigree, setPedigree] = useState(null);
  const [pesos, setPesos] = useState([]);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [fecha, setFecha] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [medicamentoId, setMedicamentoId] = useState("");
  const [dosis, setDosis] = useState("");
  const [stock, setStock] = useState(0);
  const [eventosSanitarios, setEventosSanitarios] = useState([]);

  const [corrales, setCorrales] = useState([]);
  const [corralId, setCorralId] = useState("");

  const [mostrarModalMuerte, setMostrarModalMuerte] = useState(false);
  const [causaMuerte, setCausaMuerte] = useState("enfermedad");
  const [observacionesMuerte, setObservacionesMuerte] = useState("");
  const [fechaMuerte, setFechaMuerte] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [pesoMuerte, setPesoMuerte] = useState("");
  const [historialMuertes, setHistorialMuertes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  useEffect(() => {
    const med = medicamentos.find((m) => m.id == medicamentoId);
    setStock(med ? Number(med.stock) : 0);
  }, [medicamentoId, medicamentos]);

  const cargarDatos = async () => {
    try {
        const [
          animalRes,
          pesosRes,
          eventosRes,
          corralesRes,
          muertesRes,
          pedigreeRes,
        ] = await Promise.all([
          axios.get(`${API}/animales/${id}`),
          axios.get(`${API}/pesos/${id}`),
          axios.get(`${API}/medicamentos/historial/${id}`),
          axios.get(`${API}/corrales`),
          axios.get(`${API}/animales/${id}/muertes`),
          getPedigreeAnimal(id),
        ]);

        setAnimal(animalRes.data);
        setPesos(pesosRes.data || []);
        setEventosSanitarios(eventosRes.data || []);
        setCorrales(corralesRes.data || []);
        setHistorialMuertes(muertesRes.data || []);
        setPedigree(pedigreeRes.data || null);

      obtenerMedicamentos().then(setMedicamentos);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Error cargando detalle del animal.");
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

  const animalBloqueado = () => {
    const estado = normalizarTexto(animal?.estado);

    return [
      "muerto",
      "muerta",
      "vendido",
      "vendida",
      "descartado",
      "descartada",
      "baja",
      "baja sanitaria",
      "sacrificado",
      "sacrificada",
    ].includes(estado);
  };

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const ordenados = [...pesos].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  );

  let prediccion = [];

  if (ordenados.length >= 2) {
    const ultimo = ordenados[ordenados.length - 1];
    const penultimo = ordenados[ordenados.length - 2];
    const diferencia = Number(ultimo.peso) - Number(penultimo.peso);

    for (let i = 1; i <= 4; i++) {
      prediccion.push(Number(ultimo.peso) + diferencia * i);
    }
  }

  const labels = [
    ...ordenados.map((p) => p.fecha),
    ...prediccion.map((_, i) => `Pred ${i + 1}`),
  ];

  const dataPeso = [...ordenados.map((p) => p.peso), ...prediccion];

  const dataIdeal = ordenados.map((_, i) => 8 + i * 3);
  const ultimoIdeal = dataIdeal[dataIdeal.length - 1] || 0;

  const dataIdealExtendido = [
    ...dataIdeal,
    ...prediccion.map((_, i) => ultimoIdeal + (i + 1) * 3),
  ];

  let cumplimiento = 0;

  if (ordenados.length > 0) {
    const total = ordenados.reduce((acc, p, index) => {
      const ideal = 8 + index * 3;
      return acc + Number(p.peso) / ideal;
    }, 0);

    cumplimiento = (total / ordenados.length) * 100;
  }

  let estadoCrecimiento = "Sin datos";

  if (ordenados.length > 0) {
    if (cumplimiento >= 90) {
      estadoCrecimiento = "Excelente";
    } else if (cumplimiento >= 70) {
      estadoCrecimiento = "Regular";
    } else {
      estadoCrecimiento = "Bajo crecimiento";
    }
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: "Peso real",
        data: dataPeso,
        tension: 0.3,
        borderColor: "#2563eb",
        pointBackgroundColor: [
          ...ordenados.map(() => "#2563eb"),
          ...prediccion.map(() => "#f97316"),
        ],
      },
      {
        label: "Peso ideal",
        data: dataIdealExtendido,
        borderColor: "#16a34a",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#0f172a",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#475569",
        },
        grid: {
          color: "#e2e8f0",
        },
      },
      y: {
        ticks: {
          color: "#475569",
        },
        grid: {
          color: "#e2e8f0",
        },
      },
    },
  };

  const handleRegistrarPeso = async () => {
    if (!nuevoPeso || !fecha) {
      return alert("Completa todos los campos.");
    }

    try {
      await registrarPeso({
        animal_id: id,
        peso: nuevoPeso,
        fecha,
      });

      alert("Peso registrado.");

      setNuevoPeso("");
      setFecha("");

      const res = await axios.get(`${API}/pesos/${id}`);
      setPesos(res.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Error registrando peso.");
    }
  };

  const enviarSanidad = async () => {
    try {
      await aplicarMedicamento({
        animal_id: animal.id,
        medicamento_id: Number(medicamentoId),
        dosis: String(dosis),
        fecha: new Date().toISOString().split("T")[0],
      });

      alert("Medicamento aplicado.");

      setMostrarModal(false);
      setDosis("");
      setMedicamentoId("");

      const eventosRes = await axios.get(`${API}/medicamentos/historial/${id}`);
      setEventosSanitarios(eventosRes.data || []);

      obtenerMedicamentos().then(setMedicamentos);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.message || "Error al aplicar medicamento.");
    }
  };

  const registrarMuerte = async () => {
    try {
      const res = await fetch(`${API}/animales/${animal.id}/muerte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaMuerte,
          causa: causaMuerte,
          observaciones: observacionesMuerte,
          peso: pesoMuerte || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al registrar baja.");
      }

      alert("Baja registrada correctamente.");

      setMostrarModalMuerte(false);
      setObservacionesMuerte("");
      setPesoMuerte("");
      setCausaMuerte("enfermedad");

      cargarDatos();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const asignarCorral = async () => {
    if (!corralId) {
      alert("Selecciona un corral.");
      return;
    }

    try {
      const res = await fetch(`${API}/animales/${animal.id}/asignar-corral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          corral_id: corralId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo asignar el corral.");
      }

      alert("Animal asignado al corral.");
      setCorralId("");
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const valorSeguro = (valor, fallback = "No registrado") => {
    if (valor === null || valor === undefined || valor === "") {
      return fallback;
    }

    return valor;
  };

  const formatoFecha = (valor) => {
    if (!valor) return "No registrada";
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

  const limpiarHtml = (valor) => {
    return String(valorSeguro(valor))
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const renderAnimalGenealogia = (titulo, dato) => {
    return (
      <div style={styles.genealogyNode}>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 900 }}>
          {titulo}
        </div>

        {dato ? (
          <>
            <div style={{ fontSize: "18px", color: "#0f172a", fontWeight: 900 }}>
              {dato.identificador_unico || `Animal #${dato.id}`}
            </div>

            <div style={styles.text}>
              Sexo: {valorSeguro(dato.sexo)} · Raza: {valorSeguro(dato.raza)}
            </div>

            <div style={{ ...styles.text, fontSize: "13px" }}>
              Etapa: {valorSeguro(dato.etapa_actual)} · Estado:{" "}
              {valorSeguro(dato.estado)}
            </div>
          </>
        ) : (
          <div style={{ ...styles.text, fontWeight: 800 }}>
            Sin registro en el sistema
          </div>
        )}
      </div>
    );
  };

  const renderPesoRelevante = (titulo, dato) => {
    return (
      <tr>
        <td style={styles.td}>{titulo}</td>
        <td style={styles.td}>{formatoPeso(dato?.peso)}</td>
        <td style={styles.td}>{formatoFecha(dato?.fecha)}</td>
        <td style={styles.td}>
          {dato?.edad_dias !== null && dato?.edad_dias !== undefined
            ? `${dato.edad_dias} días`
            : "No calculado"}
        </td>
      </tr>
    );
  };

  const imprimirCertificado = () => {
    if (!pedigree) {
      alert("El pedigree aún no está cargado.");
      return;
    }

    const certificado = pedigree.certificado || {};
    const clasificacion = pedigree.clasificacion || {};
    const animalCert = pedigree.animal || {};

    const madre = pedigree.genealogia?.madre;
    const padre = pedigree.genealogia?.padre;
    const pesosCert = pedigree.pesos_relevantes || {};

    const ventana = window.open("", "_blank", "width=950,height=720");

    if (!ventana) {
      alert("El navegador bloqueó la ventana de impresión.");
      return;
    }

    ventana.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Certificado de pie de cría</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f8fafc;
              color: #0f172a;
              padding: 32px;
            }

            .certificado {
              background: white;
              border: 2px solid #0f172a;
              border-radius: 18px;
              padding: 28px;
              max-width: 900px;
              margin: 0 auto;
            }

            h1 {
              margin: 0;
              font-size: 30px;
              text-align: center;
            }

            .subtitulo {
              text-align: center;
              color: #475569;
              margin-top: 8px;
              margin-bottom: 24px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
            }

            .card {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 14px;
              background: #f8fafc;
            }

            .label {
              font-size: 12px;
              color: #64748b;
              font-weight: bold;
              text-transform: uppercase;
            }

            .valor {
              font-size: 16px;
              font-weight: bold;
              margin-top: 4px;
            }

            .nota {
              margin-top: 24px;
              padding: 14px;
              background: #ecfdf5;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
              color: #166534;
              font-weight: bold;
            }

            .no-apto {
              background: #fff7ed;
              border-color: #fed7aa;
              color: #9a3412;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              .certificado {
                border-radius: 0;
                border: 2px solid #0f172a;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="certificado">
            <h1>Certificado de Pie de Cría</h1>
            <div class="subtitulo">
              PORCYS / Porcícola Tarsicio · ${limpiarHtml(certificado.folio)}
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">Animal</div>
                <div class="valor">${limpiarHtml(animalCert.identificador_unico)}</div>
              </div>

              <div class="card">
                <div class="label">Fecha de emisión</div>
                <div class="valor">${limpiarHtml(certificado.fecha_emision)}</div>
              </div>

              <div class="card">
                <div class="label">Sexo</div>
                <div class="valor">${limpiarHtml(animalCert.sexo)}</div>
              </div>

              <div class="card">
                <div class="label">Raza / genética</div>
                <div class="valor">${limpiarHtml(animalCert.raza)}</div>
              </div>

              <div class="card">
                <div class="label">Etapa</div>
                <div class="valor">${limpiarHtml(animalCert.etapa_actual)}</div>
              </div>

              <div class="card">
                <div class="label">Estado</div>
                <div class="valor">${limpiarHtml(animalCert.estado)}</div>
              </div>

              <div class="card">
                <div class="label">Madre</div>
                <div class="valor">${limpiarHtml(madre?.identificador_unico)}</div>
              </div>

              <div class="card">
                <div class="label">Padre</div>
                <div class="valor">${limpiarHtml(padre?.identificador_unico)}</div>
              </div>

              <div class="card">
                <div class="label">Peso nacimiento</div>
                <div class="valor">${limpiarHtml(formatoPeso(pesosCert.nacimiento?.peso))}</div>
              </div>

              <div class="card">
                <div class="label">Peso día 10</div>
                <div class="valor">${limpiarHtml(formatoPeso(pesosCert.dia_10?.peso))}</div>
              </div>

              <div class="card">
                <div class="label">Peso día 28</div>
                <div class="valor">${limpiarHtml(formatoPeso(pesosCert.dia_28?.peso))}</div>
              </div>

              <div class="card">
                <div class="label">Último peso</div>
                <div class="valor">${limpiarHtml(formatoPeso(pesosCert.ultimo?.peso))}</div>
              </div>

              <div class="card">
                <div class="label">Clasificación</div>
                <div class="valor">${limpiarHtml(clasificacion.etiqueta)}</div>
              </div>

              <div class="card">
                <div class="label">Resultado</div>
                <div class="valor">
                  ${certificado.apto_pie_cria ? "Apto para pie de cría" : "No apto / datos insuficientes"}
                </div>
              </div>
            </div>

            <div class="nota ${certificado.apto_pie_cria ? "" : "no-apto"}">
              ${limpiarHtml(clasificacion.motivo)}
              <br />
              ${limpiarHtml(certificado.nota)}
            </div>

            <div style="margin-top: 24px; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 18px; font-weight: bold;">
                Imprimir / Guardar como PDF
              </button>
            </div>
          </div>
        </body>
      </html>
    `);

    ventana.document.close();
  };

  const eventosOrdenados = [...eventosSanitarios].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      padding: "24px 32px",
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      margin: "0 0 6px",
      color: "#0f172a",
    },
    subtitle: {
      margin: "0 0 22px",
      color: "#475569",
      fontSize: "15px",
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
      padding: "22px",
      marginBottom: "22px",
      color: "#0f172a",
    },
    sectionTitle: {
      margin: "0 0 16px",
      fontSize: "24px",
      fontWeight: 900,
      color: "#0f172a",
    },
    text: {
      margin: "9px 0",
      color: "#475569",
      fontSize: "15px",
    },
    strong: {
      color: "#0f172a",
      fontWeight: 900,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "12px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      overflow: "hidden",
    },
    th: {
      background: "#e2e8f0",
      color: "#0f172a",
      padding: "12px",
      textAlign: "left",
      fontWeight: 900,
    },
    td: {
      padding: "12px",
      color: "#475569",
      borderBottom: "1px solid #e2e8f0",
      fontWeight: 700,
    },
    input: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      minWidth: "180px",
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "12px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: 900,
      cursor: "pointer",
    },
    secondaryButton: {
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
    },
    dangerButton: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "12px",
      background: "#dc2626",
      color: "#ffffff",
      fontWeight: 900,
      cursor: "pointer",
    },
    alertDanger: {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      padding: "16px",
      borderRadius: "16px",
      marginBottom: "22px",
      fontWeight: 900,
    },
    alertWarning: {
      background: "#ffedd5",
      border: "1px solid #fed7aa",
      color: "#9a3412",
      padding: "12px 14px",
      borderRadius: "14px",
      marginBottom: "16px",
      fontWeight: 900,
    },
    eventCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderLeft: "5px solid #f97316",
      padding: "14px",
      borderRadius: "14px",
      marginBottom: "12px",
      color: "#0f172a",
    },
    bajaCard: {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      borderLeft: "5px solid #dc2626",
      padding: "14px",
      borderRadius: "14px",
      marginBottom: "12px",
      color: "#0f172a",
    },
    genealogyNode: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "16px",
      color: "#0f172a",
    },
    badgeSuccess: {
      display: "inline-block",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "#dcfce7",
      color: "#166534",
      fontWeight: 900,
      fontSize: "13px",
    },
    badgeWarning: {
      display: "inline-block",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "#ffedd5",
      color: "#9a3412",
      fontWeight: 900,
      fontSize: "13px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(15, 23, 42, 0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
    },
    modal: {
      background: "#ffffff",
      padding: "26px",
      borderRadius: "20px",
      width: "520px",
      maxWidth: "95%",
      boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
      border: "1px solid #e2e8f0",
      color: "#0f172a",
    },
  };

  if (!animal) {
    return (
      <div style={styles.page}>
        <h2 style={{ color: "#0f172a" }}>Cargando detalle del animal...</h2>
        <p style={{ color: "#64748b" }}>Consultando trazabilidad individual.</p>
      </div>
    );
  }

  const bloqueado = animalBloqueado();

  return (
    <div style={styles.page}>
      {medicamentos.some((m) => Number(m.stock || 0) <= 10) && (
        <div style={styles.alertWarning}>
          ⚠️ Hay medicamentos con stock bajo.
        </div>
      )}

      <h1 style={styles.title}>🐷 Detalle del Animal #{animal.id}</h1>
      <p style={styles.subtitle}>
        Trazabilidad individual: datos generales, peso, sanidad, bajas y ubicación.
      </p>

      {bloqueado && (
        <div style={styles.alertDanger}>
          ☠️ ANIMAL BLOQUEADO OPERATIVAMENTE
          <div style={{ fontSize: "14px", marginTop: "6px", color: "#991b1b" }}>
            No se permiten operaciones productivas sobre animales vendidos, muertos,
            descartados o dados de baja.
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Información general</h2>

        <div style={styles.grid}>
          <p style={styles.text}>
            <strong style={styles.strong}>Identificador:</strong>{" "}
            {animal.identificador_unico || "N/A"}
          </p>

          <p style={styles.text}>
            <strong style={styles.strong}>Sexo:</strong> {animal.sexo || "N/A"}
          </p>

          <p style={styles.text}>
            <strong style={styles.strong}>Etapa:</strong>{" "}
            {animal.etapa_actual || "N/A"}
          </p>

          <p style={styles.text}>
            <strong style={styles.strong}>Estado:</strong>{" "}
            {animal.estado || "N/A"}
          </p>

          <p style={styles.text}>
            <strong style={styles.strong}>Corral:</strong>{" "}
            {animal.corral_id || "Sin asignar"}
          </p>

          <p style={styles.text}>
            <strong style={styles.strong}>Crecimiento:</strong>{" "}
            {estadoCrecimiento}
          </p>
        </div>
            </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🌳 Pedigree y trazabilidad genética</h2>

        {!pedigree ? (
          <p style={styles.text}>Cargando información genealógica...</p>
        ) : (
          <>
            <div style={styles.grid}>
              {renderAnimalGenealogia("Animal evaluado", pedigree.animal)}
              {renderAnimalGenealogia("Madre", pedigree.genealogia?.madre)}
              {renderAnimalGenealogia("Padre", pedigree.genealogia?.padre)}
              {renderAnimalGenealogia(
                "Abuela materna",
                pedigree.genealogia?.abuelos_maternos?.abuela
              )}
              {renderAnimalGenealogia(
                "Abuelo materno",
                pedigree.genealogia?.abuelos_maternos?.abuelo
              )}
              {renderAnimalGenealogia(
                "Abuela paterna",
                pedigree.genealogia?.abuelos_paternos?.abuela
              )}
              {renderAnimalGenealogia(
                "Abuelo paterno",
                pedigree.genealogia?.abuelos_paternos?.abuelo
              )}
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3 style={{ ...styles.sectionTitle, fontSize: "20px" }}>
                ⚖️ Pesos relevantes
              </h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Momento</th>
                    <th style={styles.th}>Peso</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Edad</th>
                  </tr>
                </thead>

                <tbody>
                  {renderPesoRelevante(
                    "Nacimiento / día 0",
                    pedigree.pesos_relevantes?.nacimiento
                  )}
                  {renderPesoRelevante(
                    "Día 10",
                    pedigree.pesos_relevantes?.dia_10
                  )}
                  {renderPesoRelevante(
                    "Día 28",
                    pedigree.pesos_relevantes?.dia_28
                  )}
                  {renderPesoRelevante(
                    "Último peso",
                    pedigree.pesos_relevantes?.ultimo
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3 style={{ ...styles.sectionTitle, fontSize: "20px" }}>
                🧬 Clasificación productiva
              </h3>

              <span
                style={
                  pedigree.certificado?.apto_pie_cria
                    ? styles.badgeSuccess
                    : styles.badgeWarning
                }
              >
                {pedigree.clasificacion?.etiqueta || "Sin clasificación"}
              </span>

              <p style={styles.text}>
                <strong style={styles.strong}>Motivo:</strong>{" "}
                {pedigree.clasificacion?.motivo || "No registrado"}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Estado para certificado:</strong>{" "}
                {pedigree.certificado?.apto_pie_cria
                  ? "Apto para pie de cría"
                  : "No apto o con datos insuficientes"}
              </p>
            </div>

            {pedigree.camada && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ ...styles.sectionTitle, fontSize: "20px" }}>
                  🍼 Camada relacionada
                </h3>

                <div style={styles.grid}>
                  <p style={styles.text}>
                    <strong style={styles.strong}>Fecha parto:</strong>{" "}
                    {pedigree.camada.fecha_parto || "No registrada"}
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Fecha destete:</strong>{" "}
                    {pedigree.camada.fecha_destete || "No registrada"}
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Total crías:</strong>{" "}
                    {pedigree.camada.total_crias ?? "N/A"}
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Machos / Hembras:</strong>{" "}
                    {pedigree.camada.machos ?? "N/A"} /{" "}
                    {pedigree.camada.hembras ?? "N/A"}
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Vivos / Muertos:</strong>{" "}
                    {pedigree.camada.vivos ?? "N/A"} /{" "}
                    {pedigree.camada.muertos ?? "N/A"}
                  </p>

                  <p style={styles.text}>
                    <strong style={styles.strong}>Peso prom. nacimiento:</strong>{" "}
                    {formatoPeso(pedigree.camada.peso_promedio_nacimiento)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📄 Certificado de pie de cría</h2>

        {!pedigree ? (
          <p style={styles.text}>Cargando certificado...</p>
        ) : (
          <>
            <div style={styles.grid}>
              <p style={styles.text}>
                <strong style={styles.strong}>Folio:</strong>{" "}
                {pedigree.certificado?.folio || "No generado"}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Fecha emisión:</strong>{" "}
                {pedigree.certificado?.fecha_emision || "No registrada"}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Resultado:</strong>{" "}
                {pedigree.certificado?.apto_pie_cria
                  ? "Apto para pie de cría"
                  : "No apto o datos insuficientes"}
              </p>
            </div>

            <p style={styles.text}>
              {pedigree.certificado?.nota ||
                "Este certificado solo consulta información existente."}
            </p>

            <button style={styles.button} onClick={imprimirCertificado}>
              🖨️ Imprimir / Guardar como PDF
            </button>
          </>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📊 Historial de peso</h2>

        {pesos.length === 0 ? (
          <p style={styles.text}>No hay registros de peso.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Peso</th>
              </tr>
            </thead>
            <tbody>
              {pesos.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.fecha}</td>
                  <td style={styles.td}>{p.peso} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>💊 Historial sanitario</h2>

        <p style={{ ...styles.text, fontSize: "13px" }}>
          Total de eventos: {eventosSanitarios.length}
        </p>

        {eventosSanitarios.length > 5 && (
          <div style={styles.alertWarning}>⚠️ Alta carga sanitaria</div>
        )}

        {eventosSanitarios.length === 0 ? (
          <p style={styles.text}>No hay registros.</p>
        ) : (
          eventosOrdenados.map((ev) => (
            <div key={ev.id} style={styles.eventCard}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>
                💊 MEDICAMENTO
              </div>

              <div style={styles.text}>{ev.medicamento}</div>

              <div style={{ ...styles.text, fontSize: "13px" }}>
                Dosis: {ev.dosis}
              </div>

              <div style={{ ...styles.text, fontSize: "13px" }}>
                Fecha: {ev.fecha}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>☠️ Historial de bajas</h2>

        {historialMuertes.length === 0 ? (
          <p style={styles.text}>No hay registros de bajas.</p>
        ) : (
          historialMuertes.map((muerte) => (
            <div key={muerte.id} style={styles.bajaCard}>
              <p style={styles.text}>
                <strong style={styles.strong}>Fecha:</strong> {muerte.fecha}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Causa:</strong> {muerte.causa}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Peso:</strong>{" "}
                {muerte.peso || "N/A"} kg
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Costo estimado:</strong>{" "}
                {formatoMoneda(
                  muerte.costo_estimado_perdida ?? muerte.costo_estimado ?? 0
                )}
              </p>

              <p style={styles.text}>
                <strong style={styles.strong}>Observaciones:</strong>{" "}
                {muerte.observaciones || "Sin observaciones"}
              </p>
            </div>
          ))
        )}
      </div>

      {!bloqueado && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📊 Registrar peso</h3>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              style={styles.input}
              type="number"
              placeholder="Peso"
              value={nuevoPeso}
              onChange={(e) => setNuevoPeso(e.target.value)}
            />

            <input
              style={styles.input}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />

            <button style={styles.button} onClick={handleRegistrarPeso}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {!bloqueado && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <button style={styles.secondaryButton} onClick={() => setMostrarModal(true)}>
            💊 Aplicar medicamento
          </button>

          <button
            style={styles.dangerButton}
            onClick={() => setMostrarModalMuerte(true)}
          >
            ☠️ Registrar baja
          </button>
        </div>
      )}

      {!bloqueado && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>🐖 Asignar a corral</h3>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              style={styles.input}
              value={corralId}
              onChange={(e) => setCorralId(e.target.value)}
            >
              <option value="">Seleccionar</option>

              {corrales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.tipo_corral || "general"} (
                  {c.animales_count ?? c.ocupados ?? 0}/{c.capacidad})
                </option>
              ))}
            </select>

            <button style={styles.button} onClick={asignarCorral}>
              Asignar
            </button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📈 Gráfica de crecimiento</h2>

        {ordenados.length === 0 ? (
          <p style={styles.text}>Sin datos suficientes para graficar.</p>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.sectionTitle}>💊 Aplicar medicamento</h3>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                style={styles.input}
                value={medicamentoId}
                onChange={(e) => {
                  const med = medicamentos.find((m) => m.id == e.target.value);
                  setMedicamentoId(e.target.value);
                  setStock(med ? Number(med.stock) : 0);
                }}
              >
                <option value="">Seleccionar medicamento</option>

                {medicamentos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} (Stock: {m.stock})
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                type="number"
                placeholder="Dosis"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
              />
            </div>

            <div
              style={{
                marginTop: "15px",
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              {stock <= 10 && medicamentoId && (
                <span style={{ color: "#f97316", fontWeight: 900 }}>
                  ⚠️ Stock bajo
                </span>
              )}

              {Number(dosis) > Number(stock) && (
                <span style={{ color: "#dc2626", fontWeight: 900 }}>
                  ❌ Stock insuficiente
                </span>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                style={{
                  ...styles.button,
                  background:
                    Number(dosis) > Number(stock) ? "#94a3b8" : "#16a34a",
                }}
                onClick={enviarSanidad}
                disabled={
                  !medicamentoId || !dosis || Number(dosis) > Number(stock)
                }
              >
                Guardar
              </button>

              <button
                style={styles.dangerButton}
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalMuerte && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.sectionTitle}>☠️ Registrar baja</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <input
                style={styles.input}
                type="date"
                value={fechaMuerte}
                onChange={(e) => setFechaMuerte(e.target.value)}
              />

              <select
                style={styles.input}
                value={causaMuerte}
                onChange={(e) => setCausaMuerte(e.target.value)}
              >
                <option value="enfermedad">Enfermedad</option>
                <option value="aplastamiento">Aplastamiento</option>
                <option value="bajo_peso">Bajo peso</option>
                <option value="problema_respiratorio">Problema respiratorio</option>
                <option value="problema_digestivo">Problema digestivo</option>
                <option value="lesion">Lesión</option>
                <option value="sacrificio_sanitario">Sacrificio sanitario</option>
                <option value="descarte_reproductivo">Descarte reproductivo</option>
                <option value="baja_productividad">Baja productividad</option>
                <option value="edad_avanzada">Edad avanzada</option>
                <option value="otra_controlada">Otra controlada</option>
              </select>

              <input
                style={styles.input}
                type="number"
                placeholder="Peso"
                value={pesoMuerte}
                onChange={(e) => setPesoMuerte(e.target.value)}
              />

              <textarea
                style={{
                  ...styles.input,
                  minHeight: "90px",
                  resize: "vertical",
                }}
                placeholder="Observaciones"
                value={observacionesMuerte}
                onChange={(e) => setObservacionesMuerte(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button style={styles.dangerButton} onClick={registrarMuerte}>
                Confirmar baja
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => setMostrarModalMuerte(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}