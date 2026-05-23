import { useEffect, useMemo, useState } from "react";
import { obtenerResumenPredicciones } from "../services/prediccionesService";

function formatearNumero(valor, decimales = 1) {
  const numero = Number(valor ?? 0);

  return numero.toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function etiquetaNivel(nivel) {
  const normalizado = String(nivel || "normal").toLowerCase();

  const estilos = {
    normal: {
      texto: "Normal",
      bg: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    },
    bajo: {
      texto: "Bajo",
      bg: "#dbeafe",
      color: "#1d4ed8",
      border: "#bfdbfe",
    },
    medio: {
      texto: "Medio",
      bg: "#fef9c3",
      color: "#854d0e",
      border: "#fde68a",
    },
    alto: {
      texto: "Alto",
      bg: "#ffedd5",
      color: "#9a3412",
      border: "#fed7aa",
    },
    critico: {
      texto: "Crítico",
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
    },
    saturado: {
      texto: "Saturado",
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
    },
    sin_capacidad: {
      texto: "Sin capacidad",
      bg: "#f1f5f9",
      color: "#475569",
      border: "#cbd5e1",
    },
  };

  return estilos[normalizado] || estilos.normal;
}

function Badge({ nivel }) {
  const estilo = etiquetaNivel(nivel);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: "999px",
        background: estilo.bg,
        color: estilo.color,
        border: `1px solid ${estilo.border}`,
        fontSize: "12px",
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {estilo.texto}
    </span>
  );
}

function KpiCard({ titulo, valor, detalle, icono }) {
  return (
    <div className="porcys-card">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            minWidth: "52px",
            borderRadius: "16px",
            background: "#dbeafe",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
          }}
        >
          {icono}
        </div>

        <div>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            {titulo}
          </p>

          <h2
            style={{
              margin: "6px 0 4px",
              fontSize: "27px",
              color: "#0f172a",
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            {valor}
          </h2>

          {detalle && (
            <small style={{ color: "#64748b", fontWeight: 700 }}>
              {detalle}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

function TablaVacia({ mensaje }) {
  return (
    <div
      style={{
        padding: "18px",
        border: "1px dashed #cbd5e1",
        borderRadius: "16px",
        background: "#f8fafc",
        color: "#64748b",
        fontWeight: 700,
      }}
    >
      {mensaje}
    </div>
  );
}

function Tabla({ children }) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#ffffff",
          minWidth: "760px",
        }}
      >
        {children}
      </table>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        padding: "13px 14px",
        textAlign: "left",
        background: "#f1f5f9",
        color: "#0f172a",
        fontSize: "13px",
        fontWeight: 900,
        borderBottom: "1px solid #e2e8f0",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        padding: "13px 14px",
        color: "#475569",
        fontSize: "14px",
        fontWeight: 650,
        borderBottom: "1px solid #e2e8f0",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

export default function Predicciones() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarPredicciones() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await obtenerResumenPredicciones();
      setDatos(respuesta);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las predicciones.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPredicciones();
  }, []);

  const resumen = datos?.resumen_ejecutivo || {};
  const alimento = datos?.alimento || {};
  const partos = datos?.partos || {};
  const corrales = datos?.corrales || {};
  const riesgos = datos?.riesgos || {};

  const riesgoAlimento = alimento?.inventario?.riesgo || "normal";

  const corralesOrdenados = useMemo(() => {
    return [...(corrales?.corrales || [])].sort((a, b) => {
      return Number(b.porcentaje_ocupacion || 0) - Number(a.porcentaje_ocupacion || 0);
    });
  }, [corrales]);

  if (cargando) {
    return (
      <div className="porcys-page">
        <div className="porcys-page-header">
          <h1 className="porcys-page-title">Predicciones operativas</h1>
          <p className="porcys-page-subtitle">
            Calculando consumo, partos próximos, ocupación de corrales y riesgos.
          </p>
        </div>

        <div className="porcys-card">
          <p style={{ margin: 0, color: "#64748b", fontWeight: 800 }}>
            Cargando predicciones...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="porcys-page">
        <div className="porcys-page-header">
          <h1 className="porcys-page-title">Predicciones operativas</h1>
          <p className="porcys-page-subtitle">
            No se pudo consultar el backend.
          </p>
        </div>

        <div
          className="porcys-card"
          style={{
            borderColor: "#fecaca",
            background: "#fff7f7",
          }}
        >
          <h2 style={{ color: "#991b1b" }}>Error al cargar predicciones</h2>
          <p style={{ color: "#7f1d1d", fontWeight: 700 }}>{error}</p>

          <button className="porcys-btn" onClick={cargarPredicciones}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="porcys-page">
      <div className="porcys-page-header">
        <h1 className="porcys-page-title">Predicciones operativas</h1>
        <p className="porcys-page-subtitle">
          Estimaciones de alimento, partos, ocupación y riesgos calculadas sin modificar datos reales.
        </p>
      </div>

      <div
        className="porcys-card"
        style={{
          marginBottom: "20px",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                color: "#0f172a",
                fontWeight: 900,
              }}
            >
              Último cálculo: {datos?.fecha_calculo || "Sin fecha"}
            </p>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {datos?.mensaje || "Predicciones calculadas en modo consulta."}
            </p>
          </div>

          <button className="porcys-btn" onClick={cargarPredicciones}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="porcys-kpi-grid" style={{ marginBottom: "22px" }}>
        <KpiCard
          icono="🌽"
          titulo="Consumo diario estimado"
          valor={`${formatearNumero(resumen.consumo_diario_kg)} kg`}
          detalle={`${formatearNumero(resumen.consumo_30_dias_kg, 0)} kg proyectados a 30 días`}
        />

        <KpiCard
          icono="📦"
          titulo="Cobertura de alimento"
          valor={`${formatearNumero(resumen.cobertura_alimento_dias, 0)} días`}
          detalle={`Riesgo: ${riesgoAlimento}`}
        />

        <KpiCard
          icono="🤰"
          titulo="Partos próximos"
          valor={`${Number(resumen.partos_30_dias || 0)}`}
          detalle="Próximos 30 días"
        />

        <KpiCard
          icono="🏠"
          titulo="Corrales en riesgo"
          valor={`${Number(resumen.corrales_en_riesgo || 0)}`}
          detalle={`${Number(corrales?.totales?.corrales || 0)} corrales evaluados`}
        />

        <KpiCard
          icono="🚨"
          titulo="Riesgos altos/críticos"
          valor={`${Number(resumen.riesgos_altos || 0)} / ${Number(resumen.riesgos_criticos || 0)}`}
          detalle="Altos / críticos"
        />
      </div>

      <section className="porcys-card" style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "4px" }}>Predicción de alimento</h2>
            <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
              {alimento?.nota || "Estimación de consumo por etapa."}
            </p>
          </div>

          <Badge nivel={riesgoAlimento} />
        </div>

        <div className="porcys-kpi-grid" style={{ marginBottom: "18px" }}>
          <KpiCard
            icono="🐖"
            titulo="Animales activos"
            valor={`${Number(alimento?.totales?.animales_activos || 0)}`}
            detalle="Considerados en el cálculo"
          />

          <KpiCard
            icono="📅"
            titulo="Consumo 90 días"
            valor={`${formatearNumero(alimento?.totales?.["90_dias_kg"], 0)} kg`}
            detalle="Proyección trimestral"
          />

          <KpiCard
            icono="📈"
            titulo="Consumo anual"
            valor={`${formatearNumero(alimento?.totales?.["365_dias_kg"], 0)} kg`}
            detalle="Estimación a 365 días"
          />

          <KpiCard
            icono="🏭"
            titulo="Stock disponible"
            valor={`${formatearNumero(alimento?.inventario?.stock_total_kg, 1)} kg`}
            detalle="Inventario considerado"
          />
        </div>

        {(alimento?.animales_por_etapa || []).length === 0 ? (
          <TablaVacia mensaje="No hay animales activos para calcular consumo." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Etapa</Th>
                <Th>Descripción</Th>
                <Th>Animales</Th>
                <Th>Tasa kg/día</Th>
                <Th>Diario</Th>
                <Th>30 días</Th>
                <Th>90 días</Th>
                <Th>365 días</Th>
              </tr>
            </thead>
            <tbody>
              {alimento.animales_por_etapa.map((fila) => (
                <tr key={fila.etapa}>
                  <Td>{fila.etapa}</Td>
                  <Td>{fila.descripcion}</Td>
                  <Td>{Number(fila.animales || 0)}</Td>
                  <Td>{formatearNumero(fila.tasa_kg_dia_por_animal)} kg</Td>
                  <Td>{formatearNumero(fila.consumo_diario_kg)} kg</Td>
                  <Td>{formatearNumero(fila.consumo_30_dias_kg, 0)} kg</Td>
                  <Td>{formatearNumero(fila.consumo_90_dias_kg, 0)} kg</Td>
                  <Td>{formatearNumero(fila.consumo_365_dias_kg, 0)} kg</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </section>

      <section className="porcys-card" style={{ marginBottom: "22px" }}>
        <h2 style={{ marginBottom: "4px" }}>Proyección de partos</h2>
        <p style={{ margin: "0 0 18px", color: "#64748b", fontWeight: 700 }}>
          Gestaciones con fecha probable de parto en los próximos 60 días.
        </p>

        <div className="porcys-kpi-grid" style={{ marginBottom: "18px" }}>
          <KpiCard
            icono="7"
            titulo="Próximos 7 días"
            valor={`${Number(partos?.rangos?.["7_dias"] || 0)}`}
            detalle="Urgencia crítica"
          />

          <KpiCard
            icono="15"
            titulo="Próximos 15 días"
            valor={`${Number(partos?.rangos?.["15_dias"] || 0)}`}
            detalle="Urgencia alta"
          />

          <KpiCard
            icono="30"
            titulo="Próximos 30 días"
            valor={`${Number(partos?.rangos?.["30_dias"] || 0)}`}
            detalle="Planeación mensual"
          />

          <KpiCard
            icono="60"
            titulo="Próximos 60 días"
            valor={`${Number(partos?.rangos?.["60_dias"] || 0)}`}
            detalle="Planeación bimestral"
          />
        </div>

        {(partos?.lista || []).length === 0 ? (
          <TablaVacia mensaje="No hay partos próximos registrados en los próximos 60 días." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Gestación</Th>
                <Th>Hembra</Th>
                <Th>Identificador</Th>
                <Th>Fecha probable</Th>
                <Th>Días restantes</Th>
                <Th>Urgencia</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {partos.lista.map((parto) => (
                <tr key={parto.gestacion_id}>
                  <Td>#{parto.gestacion_id}</Td>
                  <Td>{parto.hembra_id ? `#${parto.hembra_id}` : "Sin dato"}</Td>
                  <Td>{parto.identificador || "Sin identificador"}</Td>
                  <Td>{parto.fecha_probable_parto}</Td>
                  <Td>{parto.dias_restantes}</Td>
                  <Td>
                    <Badge nivel={parto.urgencia} />
                  </Td>
                  <Td>{parto.estado || "Sin estado"}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </section>

      <section className="porcys-card" style={{ marginBottom: "22px" }}>
        <h2 style={{ marginBottom: "4px" }}>Predicción de ocupación de corrales</h2>
        <p style={{ margin: "0 0 18px", color: "#64748b", fontWeight: 700 }}>
          Capacidad, ocupación y espacios disponibles por corral.
        </p>

        <div className="porcys-kpi-grid" style={{ marginBottom: "18px" }}>
          <KpiCard
            icono="🏠"
            titulo="Corrales"
            valor={`${Number(corrales?.totales?.corrales || 0)}`}
            detalle="Total registrado"
          />

          <KpiCard
            icono="📐"
            titulo="Capacidad total"
            valor={`${Number(corrales?.totales?.capacidad_total || 0)}`}
            detalle="Espacios disponibles en granja"
          />

          <KpiCard
            icono="🐖"
            titulo="Ocupados"
            valor={`${Number(corrales?.totales?.ocupados_total || 0)}`}
            detalle="Animales activos con corral"
          />

          <KpiCard
            icono="✅"
            titulo="Disponibles"
            valor={`${Number(corrales?.totales?.disponibles_total || 0)}`}
            detalle="Espacios libres calculados"
          />
        </div>

        {corrales?.riesgo_maternidad && (
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              border: corrales.riesgo_maternidad.hay_riesgo
                ? "1px solid #fed7aa"
                : "1px solid #bbf7d0",
              background: corrales.riesgo_maternidad.hay_riesgo
                ? "#ffedd5"
                : "#dcfce7",
              marginBottom: "18px",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "4px",
                color: corrales.riesgo_maternidad.hay_riesgo
                  ? "#9a3412"
                  : "#166534",
              }}
            >
              Riesgo de maternidad
            </strong>

            <p
              style={{
                margin: 0,
                color: corrales.riesgo_maternidad.hay_riesgo
                  ? "#9a3412"
                  : "#166534",
                fontWeight: 700,
              }}
            >
              {corrales.riesgo_maternidad.mensaje}
            </p>
          </div>
        )}

        {corralesOrdenados.length === 0 ? (
          <TablaVacia mensaje="No hay corrales registrados para calcular ocupación." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Corral</Th>
                <Th>Tipo</Th>
                <Th>Capacidad</Th>
                <Th>Ocupados</Th>
                <Th>Disponibles</Th>
                <Th>Ocupación</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {corralesOrdenados.map((corral) => (
                <tr key={corral.id}>
                  <Td>{corral.nombre}</Td>
                  <Td>{corral.tipo_corral}</Td>
                  <Td>{Number(corral.capacidad || 0)}</Td>
                  <Td>{Number(corral.ocupados || 0)}</Td>
                  <Td>{Number(corral.disponibles || 0)}</Td>
                  <Td>{formatearNumero(corral.porcentaje_ocupacion)}%</Td>
                  <Td>
                    <Badge nivel={corral.estado} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </section>

      <section className="porcys-card">
        <h2 style={{ marginBottom: "4px" }}>Riesgos operativos calculados</h2>
        <p style={{ margin: "0 0 18px", color: "#64748b", fontWeight: 700 }}>
          Riesgos derivados de alimento, partos, maternidad, corrales y medicamentos.
        </p>

        <div className="porcys-kpi-grid" style={{ marginBottom: "18px" }}>
          <KpiCard
            icono="🚨"
            titulo="Total riesgos"
            valor={`${Number(riesgos?.conteo?.total || 0)}`}
            detalle="Riesgos calculados"
          />

          <KpiCard
            icono="🔥"
            titulo="Críticos"
            valor={`${Number(riesgos?.conteo?.criticos || 0)}`}
            detalle="Atención inmediata"
          />

          <KpiCard
            icono="⚠️"
            titulo="Altos"
            valor={`${Number(riesgos?.conteo?.altos || 0)}`}
            detalle="Requieren planeación"
          />

          <KpiCard
            icono="📌"
            titulo="Medios"
            valor={`${Number(riesgos?.conteo?.medios || 0)}`}
            detalle="Monitoreo preventivo"
          />
        </div>

        {(riesgos?.lista || []).length === 0 ? (
          <TablaVacia mensaje="No se detectaron riesgos operativos relevantes." />
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {riesgos.lista.map((riesgo, index) => (
              <div
                key={`${riesgo.tipo}-${index}`}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 4px", color: "#0f172a" }}>
                    {riesgo.titulo}
                  </h3>

                  <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
                    {riesgo.mensaje}
                  </p>

                  <small style={{ color: "#94a3b8", fontWeight: 800 }}>
                    Tipo: {riesgo.tipo}
                  </small>
                </div>

                <Badge nivel={riesgo.nivel} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}