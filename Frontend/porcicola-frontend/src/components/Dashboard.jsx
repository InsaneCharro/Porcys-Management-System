import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import { useNavigate } from "react-router-dom";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

export default function Dashboard() {

  const [data, setData] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [pesosEvolucion, setPesosEvolucion] = useState([]);
  const [resumenVentas, setResumenVentas] = useState({
    total_ventas: 0,
    ingresos_totales: 0,
    promedio_por_venta: 0
  });

  const [ventasClientes, setVentasClientes] = useState([]);
  const [ventasTipos, setVentasTipos] = useState([]);

  const navigate = useNavigate();

  // =========================
  // DASHBOARD
  // =========================
  useEffect(() => {

    axios.get("http://127.0.0.1:8000/api/dashboard")
      .then(res => setData(res.data))
      .catch(err => console.error(err));

  }, []);

  // =========================
  // VENTAS
  // =========================
  useEffect(() => {

    axios.get("http://127.0.0.1:8000/api/ventas/grafica")
      .then(res => setVentas(res.data))
      .catch(err => console.error(err));

  }, []);

  // =========================
  // EVOLUCIÓN PESOS
  // =========================
  useEffect(() => {

    axios.get("http://127.0.0.1:8000/api/dashboard/pesos-evolucion")
      .then(res => setPesosEvolucion(res.data))
      .catch(err => console.error(err));

  }, []);

  // =========================
// RESUMEN FINANCIERO
// =========================
useEffect(() => {

  axios.get("http://127.0.0.1:8000/api/ventas/resumen")
    .then(res => setResumenVentas(res.data))
    .catch(err => console.error(err));

}, []);

// =========================
// TOP CLIENTES
// =========================
useEffect(() => {

  axios.get("http://127.0.0.1:8000/api/ventas/clientes")
    .then(res => setVentasClientes(res.data))
    .catch(err => console.error(err));

}, []);

// =========================
// VENTAS POR TIPO
// =========================
useEffect(() => {

  axios.get("http://127.0.0.1:8000/api/ventas/tipos")
    .then(res => setVentasTipos(res.data))
    .catch(err => console.error(err));

}, []);

  if (!data) {
    return <h2>Cargando dashboard...</h2>;
  }

  // =========================
  // PIE
  // =========================
  const etapas = data.por_etapa.map(e => e.etapa_actual);

  const cantidades = data.por_etapa.map(e => e.total);

  const pieData = {
    labels: etapas,

    datasets: [
      {
        data: cantidades,

        backgroundColor: [
          "#4CAF50",
          "#2196F3",
          "#FF9800",
          "#E91E63",
          "#9C27B0"
        ],

        borderWidth: 0
      }
    ]
  };

  // =========================
  // BAR
  // =========================
  const fechas = ventas.map(v => v.fecha);

  const totales = ventas.map(v => v.total);

  const barData = {
    labels: fechas,

    datasets: [
      {
        label: "Ventas por día",
        data: totales,
        backgroundColor: "rgba(33,150,243,0.5)"
      }
    ]
  };

  // =========================
  // LINE
  // =========================
  const edades = pesosEvolucion.map(p => p.edad_dias);

  const promedios = pesosEvolucion.map(p => p.promedio);

  const lineData = {

    labels: edades,

    datasets: [
      {
        label: "Peso promedio",

        data: promedios,

        borderColor: "#4CAF50",

        backgroundColor: "rgba(76,175,80,0.2)",

        tension: 0.3,

        fill: true
      }
    ]
  };

  const clientesData = {
    labels: ventasClientes.map(c => c.cliente || "Sin cliente"),

    datasets: [
      {
        label: "Ingresos por cliente",
        data: ventasClientes.map(c => c.total),
        backgroundColor: "rgba(255,152,0,0.6)"
      }
    ]
  };

  const tiposData = {
    labels: ventasTipos.map(t => t.tipo || "General"),

    datasets: [
      {
        data: ventasTipos.map(t => t.total),

        backgroundColor: [
          "#00BCD4",
          "#8BC34A",
          "#FFC107",
          "#E91E63",
          "#9C27B0"
        ],

        borderWidth: 0
      }
    ]
  };

  return (

    <div className="container">

      {/* 🔥 HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >

        <div>

          <h1 className="title">
            🐷 Dashboard Porcícola
          </h1>

          <p style={{ color: "#aaa" }}>
            Panel general de producción y operación
          </p>

        </div>

        <div
          style={{
            background: "#1e1e1e",
            padding: "12px 18px",
            borderRadius: "10px",
            color: "#ccc"
          }}
        >
          📅 {new Date().toLocaleDateString()}
        </div>

      </div>

      {/* 🧱 KPIs */}
      <div className="cards">

        {/* 🐖 ANIMALES */}
        <div className="card kpi-card">

          <div className="kpi-icon">🐖</div>

          <div>
            <h4>Animales</h4>
            <h2>{data.total_animales}</h2>
          </div>

        </div>

        {/* 🚨 ALERTAS */}
        <div
          className="card kpi-card alert-card"
          onClick={() => navigate("/alertas")}
          style={{ cursor: "pointer" }}
        >

          <div className="kpi-icon">🚨</div>

          <div>

            <h4>Alertas</h4>

            <h2>
              {data.bajo_crecimiento > 0 ? (
                <span style={{ color: "#ff4d4d" }}>
                  {data.bajo_crecimiento}
                </span>
              ) : (
                <span style={{ color: "#4CAF50" }}>
                  0
                </span>
              )}
            </h2>

          </div>

        </div>

        {/* ☠️ MUERTES */}
        <div className="card kpi-card">

          <div className="kpi-icon">☠️</div>

          <div>
            <h4>Muertes</h4>
            <h2>{data.muertes}</h2>
          </div>

        </div>

        {/* 💰 VENTAS */}
        <div className="card kpi-card">

          <div className="kpi-icon">💰</div>

          <div>
            <h4>Ventas</h4>
            <h2>${data.ventas_totales}</h2>
          </div>

        </div>

        {/* 📦 STOCK */}
        <div className="card kpi-card">

          <div className="kpi-icon">📦</div>

          <div>
            <h4>Alimento</h4>
            <h2>{data.stock_total} kg</h2>
          </div>

        </div>

        {/* 🤰 GESTACIONES */}
        <div className="card kpi-card">

          <div className="kpi-icon">🤰</div>

          <div>
            <h4>Gestaciones</h4>
            <h2>{data.gestaciones_activas}</h2>
          </div>

        </div>

        {/* 🐷 CAMADAS */}
        <div className="card kpi-card">

          <div className="kpi-icon">🐷</div>

          <div>
            <h4>Camadas activas</h4>
            <h2>{data.camadas_activas}</h2>
          </div>

        </div>

        {/* 🍼 LECHONES */}
        <div className="card kpi-card">

          <div className="kpi-icon">🍼</div>

          <div>
            <h4>Lechones vivos</h4>
            <h2>{data.lechones_vivos}</h2>
          </div>

        </div>

        {/* ⏰ PARTOS */}
        <div className="card kpi-card">

          <div className="kpi-icon">⏰</div>

          <div>
            <h4>Partos próximos</h4>
            <h2>{data.partos_proximos}</h2>
          </div>

        </div>

        {/* 🍼 DESTETES */}
        <div className="card kpi-card">

          <div className="kpi-icon">🍼</div>

          <div>
            <h4>Destetes pendientes</h4>
            <h2>{data.destetes_pendientes}</h2>
          </div>

        </div>

      </div>

      {/* 📈 EVOLUCIÓN PESOS */}
      <div className="section">

        <h2>📈 Evolución promedio de pesos</h2>

        <div className="chart-container">

          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false
            }}
          />

        </div>

      </div>

      <div className="section">

  <h2>
    🏆 Clientes más rentables
  </h2>

  <div className="chart-container">

    {ventasClientes.length > 0 ? (

      <Bar
        data={clientesData}
        options={{
          responsive: true,
          maintainAspectRatio: false
        }}
      />

    ) : (

      <p style={{ color: "#aaa" }}>
        Sin ventas registradas aún
      </p>

    )}

  </div>

</div>

  <div className="section">

  <h2>
    🥩 Ventas por clasificación
  </h2>

  <div className="chart-container">

    {ventasTipos.length > 0 ? (

      <Pie data={tiposData} />

    ) : (

      <p style={{ color: "#aaa" }}>
        Sin datos disponibles
      </p>

    )}

  </div>

</div>

      {/* 🏠 CORRALES */}
      <div className="section">

        <h2>🏠 Estado de Corrales</h2>

        <div className="corrales-grid">

          {data.corrales.map(corral => (

            <div
              key={corral.id}
              className="corral-card"
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px"
                }}
              >

                <h3>{corral.nombre}</h3>

                <strong>
                  {corral.ocupacion}%
                </strong>

              </div>

              <p>
                {corral.ocupados} / {corral.capacidad} animales
              </p>

              <div className="ocupacion-bar">

                <div
                  className={`ocupacion-fill ${
                    corral.ocupacion >= 90
                      ? "danger"
                      : corral.ocupacion >= 70
                      ? "warning"
                      : "safe"
                  }`}
                  style={{
                    width: `${corral.ocupacion}%`
                  }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* 🚨 ALERTAS */}
      <div className="section">

        <h2>🚨 Alertas Inteligentes</h2>

        <div className="alerts-grid">

          {/* ⏰ PARTOS */}
          <div className="alert-box parto-alert">

            <h3>⏰ Partos próximos</h3>

            <h1>{data.partos_proximos}</h1>

            <p>
              Gestaciones próximas a parir
            </p>

          </div>

          {/* 🍼 DESTETES */}
          <div className="alert-box destete-alert">

            <h3>🍼 Destetes pendientes</h3>

            <h1>{data.destetes_pendientes}</h1>

            <p>
              Camadas listas para destete
            </p>

          </div>

          {/* 💊 MEDICAMENTOS */}
          <div className="alert-box medicamento-alert">

            <h3>💊 Stock bajo</h3>

            <h1>{data.stock_bajo_medicamentos}</h1>

            <p>
              Medicamentos con poco stock
            </p>

          </div>

          {/* 📉 CRECIMIENTO */}
          <div className="alert-box crecimiento-alert">

            <h3>📉 Bajo crecimiento</h3>

            <h1>{data.bajo_crecimiento}</h1>

            <p>
              Animales bajo el peso ideal
            </p>

          </div>

          

        </div>

      </div>

      {/* 📊 DISTRIBUCIÓN */}
      <div className="section">

        <h2>📊 Distribución por etapa</h2>

        <div className="chart-container">

          <Pie
            data={pieData}
            options={{
              responsive: true,
              maintainAspectRatio: false
            }}
          />

        </div>

      </div>

      {/* 💰 VENTAS */}
      <div className="section">

        <h2>💰 Ventas por día</h2>

        <div className="chart-container">

          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false
            }}
          />

        </div>
      </div>

      {/* 💰 FINANZAS */}
<div className="cards">

  <div className="card kpi-card">
    <div className="kpi-icon">🧾</div>

    <div>
      <h4>Total ventas</h4>
      <h2>{resumenVentas.total_ventas}</h2>
    </div>
  </div>

  <div className="card kpi-card">
    <div className="kpi-icon">💵</div>

    <div>
      <h4>Ingresos</h4>
      <h2>
        MXN ${Number(resumenVentas.ingresos_totales).toFixed(2)}
      </h2>
    </div>
  </div>

  <div className="card kpi-card">
    <div className="kpi-icon">📈</div>

    <div>
      <h4>Promedio venta</h4>
      <h2>
        MXN ${Number(resumenVentas.promedio_por_venta).toFixed(2)}
      </h2>
    </div>
  </div>

</div>

    </div>
  );
}