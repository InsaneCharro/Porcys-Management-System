import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import { useNavigate } from "react-router-dom";
import { getPesosPendientes } from "../services/pesoService";

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

const API_URL = "http://127.0.0.1:8000/api";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [];
};

const n = (value) => Number(value ?? 0);

const formatNumber = (value, decimals = 0) =>
  n(value).toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

const money = (value) =>
  n(value).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

const kg = (value) => `${formatNumber(value, 2)} kg`;

const readable = (value) => {
  if (!value) return "Sin dato";
  return String(value).replaceAll("_", " ");
};

const obtenerListaPesosObligatorios = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.animales)) return payload.animales;
  if (Array.isArray(payload?.pendientes)) return payload.pendientes;

  return [];
};

const obtenerControlPeso = (item, clave) => {
  return (
    item?.pesos?.[clave] ||
    item?.[clave] ||
    item?.[`peso_${clave}`] ||
    null
  );
};

const obtenerEstadoControlPeso = (control) => {
  if (!control) return "no_calculado";
  if (control.registrado) return "registrado";

  return control.estado || "no_calculado";
};

const esControlPesoPendiente = (estado) => {
  return estado === "pendiente_en_ventana" || estado === "pendiente_atrasado";
};

function KpiCard({ icon, title, value, subtitle, onClick, danger = false }) {
  return (
    <div
      className={`card kpi-card ${danger ? "alert-card" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="kpi-icon">{icon}</div>

      <div>
        <h4>{title}</h4>
        <h2>{value}</h2>
        {subtitle ? (
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "13px" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ text = "Sin datos disponibles" }) {
  return <p style={{ color: "#64748b", margin: 0 }}>{text}</p>;
}

function AlertItem({ alerta, index }) {
  const nivel = alerta?.nivel || "informativa";

  const background =
    nivel === "critica"
      ? "rgba(244,67,54,0.14)"
      : nivel === "importante"
      ? "rgba(255,152,0,0.14)"
      : "rgba(33,150,243,0.12)";

  const border =
    nivel === "critica"
      ? "rgba(244,67,54,0.65)"
      : nivel === "importante"
      ? "rgba(255,152,0,0.65)"
      : "rgba(33,150,243,0.55)";

  return (
    <div
      key={`${alerta?.tipo || "alerta"}-${index}`}
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "10px"
      }}
    >
      <strong style={{ textTransform: "capitalize" }}>{readable(nivel)}</strong>
      <p style={{ margin: "6px 0 0", color: "#475569" }}>
        {alerta?.mensaje || "Alerta sin descripción"}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [pesosEvolucion, setPesosEvolucion] = useState([]);
  const [ventasDia, setVentasDia] = useState([]);
  const [ventasClientes, setVentasClientes] = useState([]);
  const [ventasTipos, setVentasTipos] = useState([]);
  const [pesosObligatorios, setPesosObligatorios] = useState([]);
  const [pesosObligatoriosError, setPesosObligatoriosError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const optionalGet = async (path, fallback) => {
      try {
        const response = await axios.get(`${API_URL}${path}`);
        return response.data;
      } catch (err) {
        console.warn(`No se pudo cargar ${path}`, err);
        return fallback;
      }
    };

    const optionalPesosPendientes = async () => {
      try {
        const response = await getPesosPendientes({ todos: 1 });
        return response.data;
      } catch (err) {
        console.warn("No se pudo cargar /pesos/pendientes", err);
        return null;
      }
    };

    const cargarDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const dashboardResponse = await axios.get(`${API_URL}/dashboard`);

        const [pesos, ventas, clientes, tipos, pesosPendientesPayload] = await Promise.all([
          optionalGet("/dashboard/pesos-evolucion", []),
          optionalGet("/ventas/grafica", []),
          optionalGet("/ventas/clientes", []),
          optionalGet("/ventas/tipos", []),
          optionalPesosPendientes()
        ]);

        if (!mounted) return;

        setData(dashboardResponse.data);
        setPesosEvolucion(toArray(pesos));
        setVentasDia(toArray(ventas));
        setVentasClientes(toArray(clientes));
        setVentasTipos(toArray(tipos));
        setPesosObligatorios(obtenerListaPesosObligatorios(pesosPendientesPayload));
        setPesosObligatoriosError(
          pesosPendientesPayload === null
            ? "No se pudieron cargar las alertas de pesos obligatorios."
            : ""
        );
      } catch (err) {
        console.error(err);

        if (!mounted) return;

        setError(
          err?.response?.data?.detalle ||
            err?.response?.data?.error ||
            "No se pudo cargar el dashboard gerencial."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const animales = data?.animales || {};
  const mortalidad = data?.mortalidad_bajas || {};
  const corralesResumen = data?.corrales_resumen || {};
  const reproduccion = data?.reproduccion || {};
  const alimentacion = data?.alimentacion_inventario || {};
  const sanidad = data?.sanidad || {};
  const finanzas = data?.finanzas || {};
  const alertasGenerales = data?.alertas_generales || {};

  const porEtapa = toArray(animales.por_etapa || data?.por_etapa);
  const porSexo = toArray(animales.por_sexo);
  const corrales = toArray(corralesResumen.corrales || data?.corrales);
  const alertas = toArray(alertasGenerales.ultimas);
  const stockCritico = toArray(alimentacion.stock_critico);
  const medicamentosCriticos = toArray(sanidad.medicamentos_criticos);
  const eventosSanitarios = toArray(sanidad.eventos_recientes);
  const consumosRecientes = toArray(alimentacion.consumos_recientes);
  const bajasRecientes = toArray(mortalidad.recientes);
  const alertasParto = toArray(reproduccion.alertas_parto || data?.alertas_parto);

  const resumenPesosObligatorios = useMemo(() => {
    const resumen = {
      totalAnimales: pesosObligatorios.length,
      pendientesVentana: 0,
      pendientesAtrasados: 0,
      pendientesDia10: 0,
      pendientesDia28: 0,
      pendientesTotal: 0
    };

    pesosObligatorios.forEach((item) => {
      ["dia_10", "dia_28"].forEach((clave) => {
        const control = obtenerControlPeso(item, clave);
        const estado = obtenerEstadoControlPeso(control);

        if (!esControlPesoPendiente(estado)) return;

        resumen.pendientesTotal += 1;

        if (estado === "pendiente_en_ventana") {
          resumen.pendientesVentana += 1;
        }

        if (estado === "pendiente_atrasado") {
          resumen.pendientesAtrasados += 1;
        }

        if (clave === "dia_10") {
          resumen.pendientesDia10 += 1;
        }

        if (clave === "dia_28") {
          resumen.pendientesDia28 += 1;
        }
      });
    });

    return resumen;
  }, [pesosObligatorios]);

  const estadoVisualPesosObligatorios =
    resumenPesosObligatorios.pendientesAtrasados > 0
      ? "critico"
      : resumenPesosObligatorios.pendientesVentana > 0
      ? "moderado"
      : "correcto";

  const mensajePesosObligatorios =
    estadoVisualPesosObligatorios === "critico"
      ? "Hay pesos obligatorios atrasados. Requieren atención inmediata."
      : estadoVisualPesosObligatorios === "moderado"
      ? "Hay lechones dentro de ventana válida para captura."
      : "Pesos obligatorios al día.";

  const claseAlertaPesos =
    estadoVisualPesosObligatorios === "critico"
      ? "medicamento-alert"
      : estadoVisualPesosObligatorios === "moderado"
      ? "parto-alert"
      : "destete-alert";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#ddd"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#bbb" },
        grid: { color: "rgba(255,255,255,0.08)" }
      },
      y: {
        ticks: { color: "#bbb" },
        grid: { color: "rgba(255,255,255,0.08)" }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#ddd"
        }
      }
    }
  };

  const etapaData = useMemo(
    () => ({
      labels: porEtapa.map((item) => readable(item.etapa_actual || item.etapa)),
      datasets: [
        {
          data: porEtapa.map((item) => n(item.total)),
          backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0", "#00BCD4"],
          borderWidth: 0
        }
      ]
    }),
    [porEtapa]
  );

  const sexoData = useMemo(
    () => ({
      labels: porSexo.map((item) => readable(item.sexo)),
      datasets: [
        {
          data: porSexo.map((item) => n(item.total)),
          backgroundColor: ["#2196F3", "#E91E63", "#9C27B0", "#00BCD4"],
          borderWidth: 0
        }
      ]
    }),
    [porSexo]
  );

  const causasData = useMemo(
    () => ({
      labels: toArray(mortalidad.por_causa).map((item) => readable(item.causa)),
      datasets: [
        {
          label: "Bajas por causa",
          data: toArray(mortalidad.por_causa).map((item) => n(item.total)),
          backgroundColor: "rgba(244,67,54,0.5)"
        }
      ]
    }),
    [mortalidad.por_causa]
  );

  const ventasData = useMemo(
    () => ({
      labels: ventasDia.map((venta) => venta.fecha || venta.dia || "Sin fecha"),
      datasets: [
        {
          label: "Ventas por día",
          data: ventasDia.map((venta) => n(venta.total)),
          backgroundColor: "rgba(33,150,243,0.5)"
        }
      ]
    }),
    [ventasDia]
  );

  const clientesData = useMemo(
    () => ({
      labels: ventasClientes.map((cliente) => cliente.cliente || "Sin cliente"),
      datasets: [
        {
          label: "Ingresos por cliente",
          data: ventasClientes.map((cliente) => n(cliente.total)),
          backgroundColor: "rgba(255,152,0,0.55)"
        }
      ]
    }),
    [ventasClientes]
  );

  const tiposData = useMemo(
    () => ({
      labels: ventasTipos.map((tipo) => tipo.tipo || "General"),
      datasets: [
        {
          data: ventasTipos.map((tipo) => n(tipo.total)),
          backgroundColor: ["#00BCD4", "#8BC34A", "#FFC107", "#E91E63", "#9C27B0"],
          borderWidth: 0
        }
      ]
    }),
    [ventasTipos]
  );

  const pesosData = useMemo(
    () => ({
      labels: pesosEvolucion.map((peso) => peso.edad_dias),
      datasets: [
        {
          label: "Peso promedio",
          data: pesosEvolucion.map((peso) => n(peso.promedio)),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76,175,80,0.2)",
          tension: 0.3,
          fill: true
        }
      ]
    }),
    [pesosEvolucion]
  );

  if (loading) {
    return (
      <div className="dashboard-page container">
        <h2>Cargando dashboard gerencial...</h2>
        <p style={{ color: "#64748b" }}>Consultando operación porcícola en tiempo real.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page container">
        <h2 style={{ color: "#dc2626" }}>No se pudo cargar el Dashboard</h2>
        <p style={{ color: "#475569" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page container">
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
          <h1 className="title">🐷 Centro de Control ERP Porcícola</h1>
          <p style={{ color: "#aaa", marginTop: "6px" }}>
            Dashboard gerencial integrado de producción, inventario, sanidad, reproducción, finanzas y alertas.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "12px 18px",
            borderRadius: "14px",
            color: "#475569",
            border: "1px solid #e2e8f0",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)",
            fontWeight: 800
          }}
        >
          📅 {new Date().toLocaleDateString("es-MX")}
        </div>
      </div>

      <div className="cards">
        <KpiCard
          icon="🐖"
          title="Animales activos"
          value={formatNumber(animales.activos)}
          subtitle={`Total registrados: ${formatNumber(animales.total)}`}
          onClick={() => navigate("/animales")}
        />

        <KpiCard
          icon="⚖️"
          title="Pesos obligatorios"
          value={formatNumber(resumenPesosObligatorios.pendientesTotal)}
          subtitle={`Atrasados: ${formatNumber(resumenPesosObligatorios.pendientesAtrasados)} · En ventana: ${formatNumber(resumenPesosObligatorios.pendientesVentana)}`}
          onClick={() => navigate("/pesos-pendientes")}
          danger={resumenPesosObligatorios.pendientesAtrasados > 0}
        />

        <KpiCard
          icon="☠️"
          title="Bajas 30 días"
          value={formatNumber(mortalidad.ultimos_30_dias)}
          subtitle={`Muertes: ${formatNumber(mortalidad.muertes_recientes)} · Descartes: ${formatNumber(mortalidad.descartes_recientes)}`}
          onClick={() => navigate("/mortalidad-bajas")}
          danger={n(mortalidad.ultimos_30_dias) > 0}
        />

        <KpiCard
          icon="💸"
          title="Pérdida por bajas"
          value={money(mortalidad.perdida_estimada_total)}
          subtitle="Acumulado registrado"
        />

        <KpiCard
          icon="🏠"
          title="Espacios disponibles"
          value={formatNumber(corralesResumen.espacios_disponibles)}
          subtitle={`${formatNumber(corralesResumen.corrales_saturados)} corrales saturados`}
          onClick={() => navigate("/corrales")}
          danger={n(corralesResumen.corrales_saturados) > 0}
        />

        <KpiCard
          icon="🤰"
          title="Hembras gestantes"
          value={formatNumber(reproduccion.hembras_gestantes)}
          subtitle={`${formatNumber(reproduccion.proximos_partos)} partos próximos`}
          onClick={() => navigate("/gestaciones")}
        />

        <KpiCard
          icon="🧬"
          title="Servicios pendientes"
          value={formatNumber(reproduccion.servicios_pendientes)}
          subtitle={`Éxito reproductivo: ${formatNumber(reproduccion.tasa_exito_reproductivo, 2)}%`}
          onClick={() => navigate("/gestaciones")}
        />

        <KpiCard
          icon="🌽"
          title="Stock crítico"
          value={formatNumber(alimentacion.stock_critico_count)}
          subtitle={`Stock total: ${kg(alimentacion.stock_total_kg)}`}
          onClick={() => navigate("/inventario")}
          danger={n(alimentacion.stock_critico_count) > 0}
        />

        <KpiCard
          icon="💊"
          title="Medicamentos bajos"
          value={formatNumber(sanidad.medicamentos_bajos)}
          subtitle={`${formatNumber(sanidad.eventos_sanitarios_recientes)} eventos sanitarios recientes`}
          onClick={() => navigate("/medicamentos")}
          danger={n(sanidad.medicamentos_bajos) > 0}
        />

        <KpiCard
          icon="💰"
          title="Balance básico"
          value={money(finanzas.balance_basico)}
          subtitle={`Ventas: ${money(finanzas.ventas_totales)} · Compras: ${money(finanzas.compras_totales)}`}
          onClick={() => navigate("/finanzas")}
        />

        <KpiCard
          icon="🚨"
          title="Alertas generales"
          value={formatNumber(alertasGenerales.total)}
          subtitle={`Críticas: ${formatNumber(alertasGenerales.criticas)} · Importantes: ${formatNumber(alertasGenerales.importantes)}`}
          onClick={() => navigate("/alertas")}
          danger={n(alertasGenerales.criticas) > 0}
        />
      </div>

      <div className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <h2 style={{ marginBottom: "8px" }}>⚖️ Pesos obligatorios</h2>
            <p style={{ color: "#475569", margin: 0 }}>
              Seguimiento operativo de pesos día 10 y día 28.
            </p>
          </div>

          <button
            onClick={() => navigate("/pesos-pendientes")}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "11px 16px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(37, 99, 235, 0.22)"
            }}
          >
            Ver pesos pendientes
          </button>
        </div>

        {pesosObligatoriosError ? (
          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              borderRadius: "14px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontWeight: 800
            }}
          >
            {pesosObligatoriosError}
          </div>
        ) : null}

        <div className="alerts-grid">
          <div className={`alert-box ${claseAlertaPesos}`}>
            <h3>Estado operativo</h3>
            <h1>{formatNumber(resumenPesosObligatorios.pendientesTotal)}</h1>
            <p>{mensajePesosObligatorios}</p>
          </div>

          <div className="alert-box parto-alert">
            <h3>Pendientes en ventana</h3>
            <h1>{formatNumber(resumenPesosObligatorios.pendientesVentana)}</h1>
            <p>Capturas que todavía están dentro del rango válido.</p>
          </div>

          <div className="alert-box medicamento-alert">
            <h3>Pendientes atrasados</h3>
            <h1>{formatNumber(resumenPesosObligatorios.pendientesAtrasados)}</h1>
            <p>Capturas vencidas que ya pasaron su ventana ideal.</p>
          </div>

          <div className="alert-box crecimiento-alert">
            <h3>Pendientes día 10</h3>
            <h1>{formatNumber(resumenPesosObligatorios.pendientesDia10)}</h1>
            <p>Controles obligatorios correspondientes al día 10.</p>
          </div>

          <div className="alert-box destete-alert">
            <h3>Pendientes día 28</h3>
            <h1>{formatNumber(resumenPesosObligatorios.pendientesDia28)}</h1>
            <p>Controles obligatorios correspondientes al día 28.</p>
          </div>

          <div className="alert-box">
            <h3>Animales revisados</h3>
            <h1>{formatNumber(resumenPesosObligatorios.totalAnimales)}</h1>
            <p>Animales devueltos por el control operativo de pesos.</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>🚨 Alertas generales</h2>

        <div className="alerts-grid">
          <div className="alert-box parto-alert">
            <h3>Críticas</h3>
            <h1>{formatNumber(alertasGenerales.criticas)}</h1>
            <p>Riesgo operativo que requiere atención inmediata.</p>
          </div>

          <div className="alert-box medicamento-alert">
            <h3>Importantes</h3>
            <h1>{formatNumber(alertasGenerales.importantes)}</h1>
            <p>Situaciones que deben revisarse durante la operación.</p>
          </div>

          <div className="alert-box destete-alert">
            <h3>Informativas</h3>
            <h1>{formatNumber(alertasGenerales.informativas)}</h1>
            <p>Recordatorios y eventos próximos.</p>
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          {alertas.length > 0 ? (
            alertas.map((alerta, index) => <AlertItem key={`${alerta?.tipo || "a"}-${index}`} alerta={alerta} index={index} />)
          ) : (
            <EmptyState text="No hay alertas generales activas." />
          )}
        </div>
      </div>

      <div className="section">
        <h2>🐖 Animales</h2>

        <div className="cards">
          <KpiCard icon="✅" title="Activos" value={formatNumber(animales.activos)} />
          <KpiCard icon="☠️" title="Muertos" value={formatNumber(animales.muertos)} />
          <KpiCard icon="🚪" title="Descartados" value={formatNumber(animales.descartados)} />
          <KpiCard icon="🍼" title="Lechones vivos" value={formatNumber(animales.lechones_vivos)} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Distribución por etapa</h3>
            {porEtapa.length > 0 ? <Pie data={etapaData} options={pieOptions} /> : <EmptyState />}
          </div>

          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Distribución por sexo</h3>
            {porSexo.length > 0 ? <Pie data={sexoData} options={pieOptions} /> : <EmptyState />}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>☠️ Mortalidad / Bajas</h2>

        <div className="cards">
          <KpiCard icon="📌" title="Total bajas" value={formatNumber(mortalidad.total)} />
          <KpiCard icon="☠️" title="Muertes" value={formatNumber(mortalidad.muertes)} />
          <KpiCard icon="🚪" title="Descartes" value={formatNumber(mortalidad.descartes)} />
          <KpiCard
            icon="⚠️"
            title="Causa principal"
            value={readable(mortalidad.principal_causa?.causa)}
            subtitle={`${formatNumber(mortalidad.principal_causa?.total)} casos`}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Bajas por causa</h3>
            {toArray(mortalidad.por_causa).length > 0 ? <Bar data={causasData} options={chartOptions} /> : <EmptyState />}
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Bajas recientes</h3>
            {bajasRecientes.length > 0 ? (
              bajasRecientes.map((baja, index) => (
                <div key={`baja-${baja.id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                  <strong>{readable(baja.tipo_baja || "baja")}</strong>
                  <p style={{ margin: "4px 0", color: "#ccc" }}>
                    {readable(baja.causa)} · {readable(baja.etapa_animal_snapshot)}
                  </p>
                  <small style={{ color: "#aaa" }}>
                    {baja.fecha || "Sin fecha"} · Pérdida: {money(baja.costo_estimado_perdida)}
                  </small>
                </div>
              ))
            ) : (
              <EmptyState text="Sin bajas recientes." />
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>🏠 Corrales</h2>

        <div className="cards">
          <KpiCard icon="🏠" title="Corrales" value={formatNumber(corralesResumen.total)} />
          <KpiCard icon="📦" title="Capacidad total" value={formatNumber(corralesResumen.capacidad_total)} />
          <KpiCard icon="🐖" title="Ocupados" value={formatNumber(corralesResumen.ocupados)} />
          <KpiCard icon="🚨" title="Saturados" value={formatNumber(corralesResumen.corrales_saturados)} danger={n(corralesResumen.corrales_saturados) > 0} />
        </div>

        <div className="corrales-grid" style={{ marginTop: "20px" }}>
          {corrales.length > 0 ? (
            corrales.map((corral) => (
              <div key={corral.id} className="corral-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h3>{corral.nombre}</h3>
                  <strong>{formatNumber(corral.ocupacion, 1)}%</strong>
                </div>

                <p>{formatNumber(corral.ocupados)} / {formatNumber(corral.capacidad)} animales</p>
                <p style={{ color: "#aaa" }}>Disponibles: {formatNumber(corral.disponibles)}</p>

                <div className="ocupacion-bar">
                  <div
                    className={`ocupacion-fill ${n(corral.ocupacion) >= 90 ? "danger" : n(corral.ocupacion) >= 70 ? "warning" : "safe"}`}
                    style={{ width: `${Math.min(n(corral.ocupacion), 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="Sin corrales registrados." />
          )}
        </div>
      </div>

      <div className="section">
        <h2>🤰 Gestaciones / Reproducción</h2>

        <div className="cards">
          <KpiCard icon="🤰" title="Gestantes" value={formatNumber(reproduccion.hembras_gestantes)} />
          <KpiCard icon="⏰" title="Partos próximos" value={formatNumber(reproduccion.proximos_partos)} />
          <KpiCard icon="🚨" title="Partos atrasados" value={formatNumber(reproduccion.partos_atrasados)} danger={n(reproduccion.partos_atrasados) > 0} />
          <KpiCard icon="📈" title="Tasa de éxito" value={`${formatNumber(reproduccion.tasa_exito_reproductivo, 2)}%`} />
        </div>

        <div className="card" style={{ padding: "18px", marginTop: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Alertas de parto</h3>
          {alertasParto.length > 0 ? (
            alertasParto.map((parto, index) => (
              <div key={`parto-${parto.gestacion_id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                <strong>{parto.animal || "Hembra sin identificador"}</strong>
                <p style={{ color: "#ccc", margin: "4px 0" }}>
                  Fecha probable: {parto.fecha_probable_parto || "Sin fecha"} · Días: {formatNumber(parto.dias)}
                </p>
              </div>
            ))
          ) : (
            <EmptyState text="Sin partos próximos registrados." />
          )}
        </div>
      </div>

      <div className="section">
        <h2>🌽 Alimentación / Inventario</h2>

        <div className="cards">
          <KpiCard icon="📦" title="Stock total" value={kg(alimentacion.stock_total_kg)} />
          <KpiCard icon="⚠️" title="Ingredientes bajos" value={formatNumber(alimentacion.ingredientes_bajos)} danger={n(alimentacion.ingredientes_bajos) > 0} />
          <KpiCard icon="🍽️" title="Consumo 30 días" value={kg(alimentacion.consumo_ultimos_30_dias_kg)} />
          <KpiCard icon="🚨" title="Stock crítico" value={formatNumber(alimentacion.stock_critico_count)} danger={n(alimentacion.stock_critico_count) > 0} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Stock crítico</h3>
            {stockCritico.length > 0 ? (
              stockCritico.map((producto, index) => (
                <div key={`stock-${producto.id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                  <strong>{producto.nombre_producto || producto.nombre || `Inventario #${producto.id}`}</strong>
                  <p style={{ color: "#ccc", margin: "4px 0" }}>Stock: {kg(producto.stock_kg)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="No hay ingredientes en stock crítico." />
            )}
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Consumos recientes</h3>
            {consumosRecientes.length > 0 ? (
              consumosRecientes.map((consumo, index) => (
                <div key={`consumo-${consumo.id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                  <strong>{consumo.fecha || consumo.created_at || "Sin fecha"}</strong>
                  <p style={{ color: "#ccc", margin: "4px 0" }}>
                    Corral #{consumo.corral_id || "N/A"} · Dieta #{consumo.dieta_id || "N/A"}
                  </p>
                  <small style={{ color: "#aaa" }}>Cantidad: {kg(consumo.cantidad_kg)}</small>
                </div>
              ))
            ) : (
              <EmptyState text="Sin consumos recientes." />
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>💊 Sanidad</h2>

        <div className="cards">
          <KpiCard icon="🩺" title="Eventos recientes" value={formatNumber(sanidad.eventos_sanitarios_recientes)} />
          <KpiCard icon="💊" title="Medicamentos bajos" value={formatNumber(sanidad.medicamentos_bajos)} danger={n(sanidad.medicamentos_bajos) > 0} />
          <KpiCard icon="🚨" title="Alertas sanitarias" value={formatNumber(sanidad.alertas_sanitarias_count)} danger={n(sanidad.alertas_sanitarias_count) > 0} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Medicamentos críticos</h3>
            {medicamentosCriticos.length > 0 ? (
              medicamentosCriticos.map((medicamento, index) => (
                <div key={`med-${medicamento.id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                  <strong>{medicamento.nombre || `Medicamento #${medicamento.id}`}</strong>
                  <p style={{ color: "#ccc", margin: "4px 0" }}>Stock: {formatNumber(medicamento.stock, 2)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="No hay medicamentos en estado crítico." />
            )}
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <h3 style={{ marginTop: 0 }}>Eventos sanitarios recientes</h3>
            {eventosSanitarios.length > 0 ? (
              eventosSanitarios.map((evento, index) => (
                <div key={`evento-${evento.id || index}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
                  <strong>{readable(evento.tipo_evento || evento.tipo || evento.categoria || "Evento sanitario")}</strong>
                  <p style={{ color: "#ccc", margin: "4px 0" }}>{evento.descripcion || evento.observaciones || "Sin descripción"}</p>
                  <small style={{ color: "#aaa" }}>{evento.fecha || evento.created_at || "Sin fecha"}</small>
                </div>
              ))
            ) : (
              <EmptyState text="Sin eventos sanitarios recientes." />
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>💰 Finanzas básicas</h2>

        <div className="cards">
          <KpiCard icon="💵" title="Ventas totales" value={money(finanzas.ventas_totales)} />
          <KpiCard icon="📅" title="Ventas del mes" value={money(finanzas.ventas_mes)} />
          <KpiCard icon="🧾" title="Compras" value={money(finanzas.compras_totales)} />
          <KpiCard icon="📉" title="Pérdidas por bajas" value={money(finanzas.perdidas_por_bajas)} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px"
          }}
        >
          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Ventas por día</h3>
            {ventasDia.length > 0 ? <Bar data={ventasData} options={chartOptions} /> : <EmptyState text="Sin ventas por día registradas." />}
          </div>

          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Clientes más rentables</h3>
            {ventasClientes.length > 0 ? <Bar data={clientesData} options={chartOptions} /> : <EmptyState text="Sin ventas por cliente registradas." />}
          </div>

          <div className="chart-container">
            <h3 style={{ marginTop: 0 }}>Ventas por clasificación</h3>
            {ventasTipos.length > 0 ? <Pie data={tiposData} options={pieOptions} /> : <EmptyState text="Sin ventas por clasificación registradas." />}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>📈 Evolución promedio de pesos</h2>
        <div className="chart-container">
          {pesosEvolucion.length > 0 ? <Line data={pesosData} options={chartOptions} /> : <EmptyState text="Sin registros de pesos suficientes para graficar." />}
        </div>
      </div>
    </div>
  );
}
