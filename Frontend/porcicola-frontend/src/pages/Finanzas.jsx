import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api/finanzas/resumen";

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const numberFormatter = new Intl.NumberFormat("es-MX");

function formatMoney(value) {
  const number = Number(value || 0);
  return moneyFormatter.format(number);
}

function formatNumber(value) {
  const number = Number(value || 0);
  return numberFormatter.format(number);
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)}%`;
}

function getBalanceColor(value) {
  const number = Number(value || 0);

  if (number > 0) return "#15803d";
  if (number < 0) return "#b91c1c";
  return "#374151";
}

export default function Finanzas() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarResumen = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();
      setResumen(data);
    } catch (err) {
      console.error("Error al cargar resumen financiero:", err);
      setError(
        "No se pudo cargar el resumen financiero. Revisa que Laravel esté corriendo y que /api/finanzas/resumen responda correctamente."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const balanceEstimado = Number(resumen?.balance?.balance_estimado || 0);
  const balanceOperativo = Number(resumen?.balance?.balance_operativo || 0);
  const margenEstimado = Number(resumen?.balance?.margen_estimado_porcentaje || 0);

  const maxTendencia = useMemo(() => {
    const tendencia = resumen?.tendencia_mensual || [];

    const valores = tendencia.flatMap((item) => [
      Number(item.ingresos || 0),
      Number(item.egresos || 0),
      Number(item.perdidas || 0),
      Math.abs(Number(item.balance_estimado || 0)),
    ]);

    return Math.max(...valores, 1);
  }, [resumen]);

  if (cargando) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>💰 Finanzas / Rentabilidad real</h1>
          <p style={styles.subtitle}>Cargando información financiera...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>💰 Finanzas / Rentabilidad real</h1>
          <p style={styles.subtitle}>No se pudo cargar el módulo.</p>
        </div>

        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>

        <button style={styles.primaryButton} onClick={cargarResumen}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💰 Finanzas / Rentabilidad real</h1>
          <p style={styles.subtitle}>
            Balance estimado usando ventas completadas, compras recibidas y pérdidas por mortalidad o descartes.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={cargarResumen}>
          Actualizar
        </button>
      </div>

      <div style={styles.warningBox}>
        <strong>Confiabilidad del cálculo: </strong>
        <span style={styles.badgeWarning}>
          {resumen?.confiabilidad?.nivel || "sin clasificar"}
        </span>

        <ul style={styles.warningList}>
          {(resumen?.confiabilidad?.advertencias || []).map((advertencia, index) => (
            <li key={index}>{advertencia}</li>
          ))}
        </ul>
      </div>

      <section style={styles.kpiGrid}>
        <KpiCard
          title="Ingresos totales"
          value={formatMoney(resumen?.ingresos?.ingresos_totales)}
          detail={`${formatNumber(resumen?.ingresos?.ventas_totales)} ventas completadas`}
          icon="📈"
        />

        <KpiCard
          title="Compras recibidas"
          value={formatMoney(resumen?.egresos?.compras_recibidas_total)}
          detail={`${formatNumber(resumen?.egresos?.compras_recibidas_cantidad)} órdenes recibidas`}
          icon="📦"
        />

        <KpiCard
          title="Pérdidas estimadas"
          value={formatMoney(resumen?.perdidas?.perdidas_totales)}
          detail={`${formatNumber(resumen?.perdidas?.total_bajas)} bajas registradas`}
          icon="☠️"
        />

        <KpiCard
          title="Balance estimado"
          value={formatMoney(balanceEstimado)}
          detail={`Margen estimado: ${formatPercent(margenEstimado)}`}
          icon={balanceEstimado >= 0 ? "✅" : "⚠️"}
          valueColor={getBalanceColor(balanceEstimado)}
        />
      </section>

      <section style={styles.balancePanel}>
        <h2 style={styles.sectionTitle}>Resumen de rentabilidad</h2>

        <div style={styles.balanceGrid}>
          <div style={styles.balanceItem}>
            <span style={styles.label}>Balance operativo</span>
            <strong style={{ ...styles.balanceValue, color: getBalanceColor(balanceOperativo) }}>
              {formatMoney(balanceOperativo)}
            </strong>
            <small style={styles.smallText}>
              {resumen?.balance?.formula_operativa || "ingresos - compras recibidas"}
            </small>
          </div>

          <div style={styles.balanceItem}>
            <span style={styles.label}>Balance estimado</span>
            <strong style={{ ...styles.balanceValue, color: getBalanceColor(balanceEstimado) }}>
              {formatMoney(balanceEstimado)}
            </strong>
            <small style={styles.smallText}>
              {resumen?.balance?.formula_estimada || "ingresos - compras recibidas - pérdidas estimadas"}
            </small>
          </div>

          <div style={styles.balanceItem}>
            <span style={styles.label}>Ingresos últimos 30 días</span>
            <strong style={styles.balanceValue}>
              {formatMoney(resumen?.ingresos?.ingresos_ultimos_30_dias)}
            </strong>
            <small style={styles.smallText}>
              {formatNumber(resumen?.ingresos?.ventas_ultimos_30_dias)} ventas recientes
            </small>
          </div>

          <div style={styles.balanceItem}>
            <span style={styles.label}>Compras últimos 30 días</span>
            <strong style={styles.balanceValue}>
              {formatMoney(resumen?.egresos?.compras_ultimos_30_dias)}
            </strong>
            <small style={styles.smallText}>
              Compras recibidas recientemente
            </small>
          </div>
        </div>
      </section>

      <section style={styles.twoColumns}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Ingresos por tipo de venta</h2>

          <Table
            emptyText="No hay ventas completadas por tipo."
            columns={["Tipo", "Cantidad", "Total"]}
            rows={(resumen?.ingresos?.ventas_por_tipo || []).map((item) => [
              item.tipo_venta || "sin tipo",
              formatNumber(item.cantidad),
              formatMoney(item.total),
            ])}
          />
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Compras por categoría</h2>

          <Table
            emptyText="No hay compras recibidas por categoría."
            columns={["Categoría", "Partidas", "Total"]}
            rows={(resumen?.egresos?.compras_por_categoria || []).map((item) => [
              item.categoria || "sin categoría",
              formatNumber(item.partidas),
              formatMoney(item.total),
            ])}
          />
        </div>
      </section>

      <section style={styles.twoColumns}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Pérdidas por tipo de baja</h2>

          <Table
            emptyText="No hay bajas registradas."
            columns={["Tipo", "Cantidad", "Pérdida"]}
            rows={(resumen?.perdidas?.perdidas_por_tipo || []).map((item) => [
              item.tipo_baja || "sin tipo",
              formatNumber(item.cantidad),
              formatMoney(item.total),
            ])}
          />
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Pérdidas por causa</h2>

          <Table
            emptyText="No hay causas de baja registradas."
            columns={["Causa", "Cantidad", "Pérdida"]}
            rows={(resumen?.perdidas?.perdidas_por_causa || []).map((item) => [
              item.causa || "sin causa",
              formatNumber(item.cantidad),
              formatMoney(item.total),
            ])}
          />
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Clientes con mayores ingresos</h2>

        <Table
          emptyText="No hay clientes con ventas completadas."
          columns={["Cliente", "Tipo", "Ventas", "Ingresos"]}
          rows={(resumen?.clientes?.top_clientes || []).map((cliente) => [
            cliente.nombre || "sin nombre",
            cliente.tipo_cliente || "sin tipo",
            formatNumber(cliente.total_ventas),
            formatMoney(cliente.ingresos_totales),
          ])}
        />
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Tendencia mensual</h2>

        {(resumen?.tendencia_mensual || []).length === 0 ? (
          <p style={styles.emptyText}>No hay datos suficientes para mostrar tendencia mensual.</p>
        ) : (
          <div style={styles.trendList}>
            {(resumen?.tendencia_mensual || []).map((item) => (
              <div key={item.periodo} style={styles.trendItem}>
                <div style={styles.trendHeader}>
                  <strong>{item.periodo}</strong>
                  <span style={{ color: getBalanceColor(item.balance_estimado), fontWeight: 800 }}>
                    {formatMoney(item.balance_estimado)}
                  </span>
                </div>

                <TrendBar
                  label="Ingresos"
                  value={item.ingresos}
                  max={maxTendencia}
                />

                <TrendBar
                  label="Egresos"
                  value={item.egresos}
                  max={maxTendencia}
                />

                <TrendBar
                  label="Pérdidas"
                  value={item.perdidas}
                  max={maxTendencia}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.footerNote}>
        <strong>Lectura gerencial:</strong> este módulo no inventa utilidad neta. Calcula una rentabilidad estimada con los datos existentes:
        ventas completadas, compras recibidas y pérdidas por bajas. Para utilidad neta real faltaría registrar gastos operativos como nómina,
        servicios, mantenimiento, renta, combustible u otros costos generales.
      </section>
    </div>
  );
}

function KpiCard({ title, value, detail, icon, valueColor }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiIcon}>{icon}</div>
      <div>
        <p style={styles.kpiTitle}>{title}</p>
        <strong style={{ ...styles.kpiValue, color: valueColor || "#111827" }}>
          {value}
        </strong>
        <p style={styles.kpiDetail}>{detail}</p>
      </div>
    </div>
  );
}

function Table({ columns, rows, emptyText }) {
  if (!rows || rows.length === 0) {
    return <p style={styles.emptyText}>{emptyText}</p>;
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={styles.th}>
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={styles.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendBar({ label, value, max }) {
  const numericValue = Number(value || 0);
  const width = Math.max((Math.abs(numericValue) / max) * 100, numericValue === 0 ? 0 : 4);

  return (
    <div style={styles.trendRow}>
      <span style={styles.trendLabel}>{label}</span>

      <div style={styles.trendTrack}>
        <div style={{ ...styles.trendBar, width: `${width}%` }} />
      </div>

      <span style={styles.trendValue}>{formatMoney(numericValue)}</span>
    </div>
  );
}

const styles = {
  page: {
    padding: "28px",
    background: "#f3f4f6",
    minHeight: "100vh",
    color: "#111827",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "22px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 900,
    color: "#111827",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  primaryButton: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(17, 24, 39, 0.18)",
  },
  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fbbf24",
    borderRadius: "16px",
    padding: "16px 18px",
    marginBottom: "22px",
    color: "#78350f",
  },
  badgeWarning: {
    display: "inline-block",
    marginLeft: "8px",
    background: "#f59e0b",
    color: "#111827",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  warningList: {
    margin: "10px 0 0",
    paddingLeft: "22px",
    lineHeight: 1.5,
  },
  errorBox: {
    background: "#fee2e2",
    border: "1px solid #ef4444",
    color: "#7f1d1d",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "18px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  kpiCard: {
    background: "white",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },
  kpiIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },
  kpiTitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  kpiValue: {
    display: "block",
    marginTop: "6px",
    fontSize: "24px",
    fontWeight: 900,
  },
  kpiDetail: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },
  balancePanel: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "22px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "20px",
    fontWeight: 900,
    color: "#111827",
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  },
  balanceItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
  },
  label: {
    display: "block",
    color: "#6b7280",
    fontWeight: 800,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  balanceValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "24px",
    fontWeight: 900,
  },
  smallText: {
    display: "block",
    marginTop: "7px",
    color: "#6b7280",
    lineHeight: 1.4,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "22px",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    color: "#374151",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: "14px",
  },
  emptyText: {
    color: "#6b7280",
    background: "#f9fafb",
    padding: "14px",
    borderRadius: "12px",
    border: "1px dashed #d1d5db",
  },
  trendList: {
    display: "grid",
    gap: "16px",
  },
  trendItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
  },
  trendHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "12px",
  },
  trendRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 130px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "9px",
  },
  trendLabel: {
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: 800,
  },
  trendTrack: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  trendBar: {
    height: "100%",
    background: "#111827",
    borderRadius: "999px",
  },
  trendValue: {
    textAlign: "right",
    color: "#374151",
    fontSize: "13px",
    fontWeight: 800,
  },
  footerNote: {
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    borderRadius: "16px",
    padding: "16px 18px",
    color: "#1e3a8a",
    lineHeight: 1.6,
  },
};