import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';
const fechaHoy = new Date().toISOString().split('T')[0];
export default function EventosSanitarios() {
  const [tab, setTab] = useState('aplicar');
  const [animales, setAnimales] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [pendientesLechones, setPendientesLechones] = useState([]);
  const [resumenPendientesLechones, setResumenPendientesLechones] = useState(null);
  const [loading, setLoading] = useState(false);

  const fechaHoy = new Date().toISOString().split('T')[0];

  const [eventoForm, setEventoForm] = useState({
    animal_id: '',
    tipo: 'vacuna',
    medicamento_id: '',
    dosis: '',
    fecha: fechaHoy,
    observaciones: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [
        animalesRes,
        medicamentosRes,
        eventosRes,
        alertasRes,
        pendientesLechonesRes,
      ] = await Promise.all([
        axios.get(`${API}/animales`),
        axios.get(`${API}/medicamentos`),
        axios.get(`${API}/sanidad`),
        axios.get(`${API}/sanidad/alertas`),
        axios.get(`${API}/sanidad/pendientes-lechones?todos=1`),
      ]);

      setAnimales(
        (animalesRes.data || []).filter(
          (animal) => animal.estado === 'activo'
        )
      );

      setMedicamentos(medicamentosRes.data || []);
      setEventos(eventosRes.data || []);
      setAlertas(alertasRes.data || []);
      setPendientesLechones(pendientesLechonesRes.data?.data || []);
      setResumenPendientesLechones(pendientesLechonesRes.data?.resumen || null);
    } catch (error) {
      console.error(error);
      alert('Error cargando módulo sanitario');
    } finally {
      setLoading(false);
    }
  };

  const registrarEvento = async () => {
    try {
      await axios.post(`${API}/sanidad`, eventoForm);

      setEventoForm({
        animal_id: '',
        tipo: 'vacuna',
        medicamento_id: '',
        dosis: '',
        fecha: fechaHoy,
        observaciones: '',
      });

      await cargarDatos();
      setTab('historial');

      alert('Evento sanitario registrado correctamente');
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error registrando evento sanitario'
      );
    }
  };


  const prepararHierroObligatorio = (control) => {
    const medicamentosHierroDisponibles = medicamentos.filter((med) => {
      const nombre = String(med.nombre || '').toLowerCase();

      return nombre.includes('hierro') || nombre.includes('dextr');
    });

    const medicamentoHierro =
      medicamentosHierroDisponibles
        .filter((med) => Number(med.stock || 0) > 0)
        .sort((a, b) => {
          const aEsDextr = String(a.nombre || '').toLowerCase().includes('dextr') ? 1 : 0;
          const bEsDextr = String(b.nombre || '').toLowerCase().includes('dextr') ? 1 : 0;

          if (aEsDextr !== bEsDextr) {
            return bEsDextr - aEsDextr;
          }

          return Number(b.stock || 0) - Number(a.stock || 0);
        })[0] || medicamentosHierroDisponibles[0];

    if (!medicamentoHierro) {
      alert('No se encontró medicamento de hierro registrado. Primero registra Hierro o Hierro dextrán en Medicamentos.');
      return;
    }

    if (Number(medicamentoHierro.stock || 0) <= 0) {
      alert('No hay stock disponible de hierro. Registra una entrada antes de preparar el control obligatorio.');
      return;
    }

    if (Number(medicamentoHierro.stock || 0) <= 5) {
      const continuar = window.confirm(
        `El stock de ${medicamentoHierro.nombre} está crítico (${medicamentoHierro.stock} disponibles). ¿Deseas preparar la aplicación de todos modos?`
      );

      if (!continuar) {
        return;
      }
    }

    setTab('aplicar');

    setEventoForm({
      animal_id: control.animal_id || '',
      tipo: 'tratamiento',
      medicamento_id: medicamentoHierro.id,
      dosis: '1',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: `Hierro obligatorio día 3. Estado previo: ${control.estado}. Edad: ${control.edad_dias} días. Stock previo: ${medicamentoHierro.stock}.`,
    });
  };

  const obtenerMedicamentoTratamiento = () => {
    const medicamentosConStock = medicamentos.filter(
      (medicamento) => Number(medicamento.stock || 0) > 0
    );

    const medicamentoPreferido = medicamentosConStock.find((medicamento) => {
      const nombre = String(medicamento.nombre || '').toLowerCase();

      return (
        nombre.includes('antibi') ||
        nombre.includes('desparasit') ||
        nombre.includes('tratamiento') ||
        nombre.includes('iverm') ||
        nombre.includes('general')
      );
    });

    return medicamentoPreferido || medicamentosConStock[0];
  };

  const prepararTratamientoEnfermeria = (animal) => {
    const medicamentoTratamiento = obtenerMedicamentoTratamiento();

    if (!medicamentoTratamiento) {
      alert(
        'No hay medicamentos con stock disponible. Primero registra una entrada en Medicamentos.'
      );
      return;
    }

    setTab('aplicar');

    setEventoForm({
      animal_id: animal.id,
      tipo: 'tratamiento',
      medicamento_id: medicamentoTratamiento.id,
      dosis: '1',
      fecha: fechaHoy,
      observaciones:
        `Animal en corral de enfermería. Requiere revisión sanitaria y tratamiento. ` +
        `Etapa previa registrada: ${animal.etapa_actual || 'sin etapa'}.`,
    });
  };

  const textoEstadoHierro = (estado) => {
    switch (estado) {
      case 'registrado':
        return 'Registrado';
      case 'aun_no_corresponde':
        return 'Aún no corresponde';
      case 'pendiente_en_ventana':
        return 'Pendiente en ventana';
      case 'pendiente_atrasado':
        return 'Pendiente atrasado';
      default:
        return 'Sin estado';
    }
  };

  const estiloEstadoHierro = (estado) => {
    if (estado === 'registrado') {
      return {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
      };
    }

    if (estado === 'aun_no_corresponde') {
      return {
        backgroundColor: '#e0f2fe',
        color: '#075985',
        border: '1px solid #bae6fd',
      };
    }

    if (estado === 'pendiente_en_ventana') {
      return {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a',
      };
    }

    if (estado === 'pendiente_atrasado') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      };
    }

    return {
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
    };
  };

    const medicamentosHierro = medicamentos.filter((med) => {
    const nombre = String(med.nombre || '').toLowerCase();

    return nombre.includes('hierro') || nombre.includes('dextr');
  });

  const stockTotalHierro = medicamentosHierro.reduce(
    (total, med) => total + Number(med.stock || 0),
    0
  );

  const presentacionesHierroDisponibles = medicamentosHierro.filter(
    (med) => Number(med.stock || 0) > 0
  ).length;

  const controlesHierroPendientes = pendientesLechones.filter(
    (control) =>
      control.estado === 'pendiente_en_ventana' ||
      control.estado === 'pendiente_atrasado'
  );

  const controlesHierroVisibles = pendientesLechones.filter(
    (control) => control.estado !== 'registrado'
  );

  const animalesEnfermeria = animales.filter((animal) => {
    return (
      animal.estado === 'activo' &&
      String(animal.etapa_actual || '').toLowerCase() === 'enfermeria'
    );
  });

  const tieneTratamientoRegistrado = (animalId) => {
    return eventos.some((evento) => {
      return (
        Number(evento.animal_id) === Number(animalId) &&
        String(evento.tipo || '').toLowerCase() === 'tratamiento'
      );
    });
  };

  const animalesEnfermeriaPendientes = animalesEnfermeria.filter(
    (animal) => !tieneTratamientoRegistrado(animal.id)
  );

  const estadoStockHierro = (() => {
    if (medicamentosHierro.length === 0) {
      return 'sin_registro';
    }

    if (stockTotalHierro <= 0) {
      return 'sin_stock';
    }

    if (stockTotalHierro <= 5) {
      return 'critico';
    }

    if (stockTotalHierro <= 20) {
      return 'bajo';
    }

    return 'suficiente';
  })();

  const textoEstadoStockHierro = (estado) => {
    switch (estado) {
      case 'sin_registro':
        return 'Sin registro de hierro';
      case 'sin_stock':
        return 'Sin stock de hierro';
      case 'critico':
        return 'Stock crítico';
      case 'bajo':
        return 'Stock bajo';
      case 'suficiente':
        return 'Stock suficiente';
      default:
        return 'Sin estado';
    }
  };

  const estiloEstadoStockHierro = (estado) => {
    if (estado === 'sin_registro' || estado === 'sin_stock' || estado === 'critico') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      };
    }

    if (estado === 'bajo') {
      return {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a',
      };
    }

    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0',
    };
  };

  const mensajeStockHierro = (() => {
    if (estadoStockHierro === 'sin_registro') {
      return 'No hay hierro registrado en Medicamentos. No se puede garantizar el control obligatorio día 3.';
    }

    if (estadoStockHierro === 'sin_stock') {
      return 'No hay stock disponible de hierro. Registra una entrada antes de aplicar controles obligatorios.';
    }

    if (estadoStockHierro === 'critico') {
      return 'El stock de hierro está crítico. Puede no alcanzar para los lechones pendientes.';
    }

    if (estadoStockHierro === 'bajo') {
      return 'El stock de hierro está bajo. Conviene programar reabastecimiento.';
    }

    return 'El stock de hierro es suficiente para continuar con los controles obligatorios.';
  })();

  const styles = {
    container: {
      padding: '20px 30px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      color: '#1e293b',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    },
    title: {
      fontSize: '36px',
      fontWeight: '700',
      marginBottom: '18px',
      color: '#0f172a',
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '25px',
      flexWrap: 'wrap',
    },
    tabButton: (active) => ({
      padding: '12px 22px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? '#2563eb' : '#dbeafe',
      color: active ? '#ffffff' : '#1e3a8a',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    }),
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
      marginTop: '20px',
      marginBottom: '20px',
      boxSizing: 'border-box',
    },
    input: {
      padding: '10px 14px',
      height: '44px',
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      minWidth: '200px',
      fontSize: '15px',
    },
    button: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#2563eb',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '600',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: '#e2e8f0',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e2e8f0',
    },
    alertCard: {
      padding: '15px',
      backgroundColor: '#fef3c7',
      borderRadius: '12px',
      marginBottom: '10px',
    },
    resumenGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '14px',
      marginBottom: '22px',
    },
    resumenBox: {
      padding: '16px',
      borderRadius: '14px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
    },
    resumenNumero: {
      fontSize: '30px',
      fontWeight: '800',
      margin: '4px 0',
      color: '#0f172a',
    },
    badge: {
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: '999px',
      fontWeight: '800',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    },
    smallButton: {
      padding: '8px 12px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#16a34a',
      color: '#ffffff',
      cursor: 'pointer',
      fontWeight: '700',
    },
    sectionTitle: {
    color: '#0f172a',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '20px',
    },

  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Eventos Sanitarios</h1>

      <div style={styles.tabs}>
                {['obligatorios', 'aplicar', 'historial', 'alertas'].map((t) => (
          <button
            key={t}
            style={styles.tabButton(tab === t)}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <p>Cargando...</p>}


      {tab === 'obligatorios' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Controles sanitarios obligatorios</h2>

          <p style={{ color: '#475569', marginTop: '-10px', marginBottom: '22px' }}>
            Control operativo de hierro obligatorio en lechones y seguimiento de animales enviados a enfermería.
          </p>

          <div
            style={{
              ...estiloEstadoStockHierro(estadoStockHierro),
              padding: '16px',
              borderRadius: '14px',
              marginBottom: '22px',
            }}
          >
            <strong>Stock de hierro para controles obligatorios</strong>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              <div>
                <small>Estado</small>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {textoEstadoStockHierro(estadoStockHierro)}
                </div>
              </div>

              <div>
                <small>Stock total de hierro</small>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {stockTotalHierro}
                </div>
              </div>

              <div>
                <small>Presentaciones disponibles</small>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {presentacionesHierroDisponibles}
                </div>
              </div>

              <div>
                <small>Lechones pendientes</small>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>
                  {controlesHierroPendientes.length}
                </div>
              </div>
            </div>

            <p style={{ marginBottom: 0, marginTop: '12px', fontWeight: '700' }}>
              {mensajeStockHierro}
            </p>
          </div>

          <div style={styles.resumenGrid}>
            <div style={styles.resumenBox}>
              <span>Total revisados</span>
              <div style={styles.resumenNumero}>
                {resumenPendientesLechones?.total_revisados ?? pendientesLechones.length}
              </div>
              <small>Lechones activos con fecha de nacimiento.</small>
            </div>

            <div style={styles.resumenBox}>
              <span>En ventana</span>
              <div style={styles.resumenNumero}>
                {resumenPendientesLechones?.pendientes_en_ventana ?? 0}
              </div>
              <small>Requieren aplicación dentro del rango válido.</small>
            </div>

            <div style={styles.resumenBox}>
              <span>Atrasados</span>
              <div style={styles.resumenNumero}>
                {resumenPendientesLechones?.pendientes_atrasados ?? 0}
              </div>
              <small>Ya superaron la ventana ideal.</small>
            </div>

            <div style={styles.resumenBox}>
              <span>Registrados</span>
              <div style={styles.resumenNumero}>
                {resumenPendientesLechones?.registrados ?? 0}
              </div>
              <small>Ya tienen hierro detectado.</small>
            </div>

            <div style={styles.resumenBox}>
              <span>Enfermería</span>
              <div style={styles.resumenNumero}>
                {animalesEnfermeriaPendientes.length}
              </div>
              <small>Animales en enfermería pendientes de tratamiento.</small>
            </div>
          </div>

          {controlesHierroVisibles.length === 0 && (
            <p>No hay controles de hierro pendientes por revisar.</p>
          )}

          {controlesHierroVisibles.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Animal</th>
                  <th style={styles.th}>Edad</th>
                  <th style={styles.th}>Evento</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Registro detectado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>

              <tbody>
                {controlesHierroVisibles.map((control) => (
                  <tr key={`${control.animal_id}-${control.evento_obligatorio}`}>
                    <td style={styles.td}>
                      <strong>{control.identificador_unico || `ID ${control.animal_id}`}</strong>
                      <br />
                      <small>Nacimiento: {control.fecha_nacimiento || 'Sin fecha'}</small>
                    </td>

                    <td style={styles.td}>
                      {control.edad_dias} días
                    </td>

                    <td style={styles.td}>
                      {control.nombre_evento || 'Hierro obligatorio día 3'}
                      <br />
                      <small>Día objetivo: {control.dia_objetivo ?? 3}</small>
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...estiloEstadoHierro(control.estado),
                        }}
                      >
                        {textoEstadoHierro(control.estado)}
                      </span>
                      <br />
                      <small>{control.mensaje}</small>
                    </td>

                    <td style={styles.td}>
                      {control.fecha_registro ? (
                        <>
                          <strong>{control.medicamento_detectado || 'Hierro'}</strong>
                          <br />
                          <small>
                            {control.fecha_registro} · {control.fuente_registro}
                          </small>
                        </>
                      ) : (
                        <span>Sin registro</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {(() => {
                        const estadoPermitePreparar =
                          control.estado === 'pendiente_en_ventana' ||
                          control.estado === 'pendiente_atrasado';

                        const sinHierroDisponible =
                          estadoStockHierro === 'sin_registro' ||
                          estadoStockHierro === 'sin_stock';

                        const deshabilitado = !estadoPermitePreparar || sinHierroDisponible;

                        let motivoDeshabilitado = '';

                        if (control.estado === 'registrado') {
                          motivoDeshabilitado = 'Este lechón ya tiene hierro registrado.';
                        } else if (control.estado === 'aun_no_corresponde') {
                          motivoDeshabilitado = 'Aún no corresponde aplicar hierro. Ventana sugerida: día 2 a día 4.';
                        } else if (sinHierroDisponible) {
                          motivoDeshabilitado = 'Primero registra o reabastece hierro en Medicamentos.';
                        } else {
                          motivoDeshabilitado = 'Preparar aplicación de hierro.';
                        }

                        return (
                          <button
                            style={{
                              ...styles.smallButton,
                              backgroundColor: deshabilitado ? '#e5e7eb' : styles.smallButton.backgroundColor,
                              color: deshabilitado ? '#6b7280' : styles.smallButton.color,
                              border: deshabilitado ? '1px solid #d1d5db' : styles.smallButton.border,
                              opacity: deshabilitado ? 1 : 1,
                              cursor: deshabilitado ? 'not-allowed' : 'pointer',
                            }}
                            disabled={deshabilitado}
                            onClick={() => prepararHierroObligatorio(control)}
                            title={motivoDeshabilitado}
                          >
                            Preparar hierro
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
          <div style={{ marginTop: '32px' }}>
  <h3 style={{ marginBottom: '8px', color: '#0f172a' }}>
    Animales en enfermería
  </h3>

  <p style={{ color: '#475569', marginTop: 0 }}>
    Animales activos enviados a enfermería para revisión sanitaria.
    Desde aquí puedes preparar el tratamiento sin buscarlos manualmente.
  </p>

  {animalesEnfermeriaPendientes.length === 0 ? (
    <p>No hay animales de enfermería pendientes de tratamiento.</p>
  ) : (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Animal</th>
          <th style={styles.th}>Sexo</th>
          <th style={styles.th}>Etapa</th>
          <th style={styles.th}>Estado sanitario</th>
          <th style={styles.th}>Acción</th>
        </tr>
      </thead>

      <tbody>
        {animalesEnfermeriaPendientes.map((animal) => {
          const yaTieneTratamiento = tieneTratamientoRegistrado(animal.id);

          return (
            <tr key={`enfermeria-${animal.id}`}>
              <td style={styles.td}>
                <strong>
                  {animal.identificador_unico || `Animal #${animal.id}`}
                </strong>
                <br />
                <small>ID interno: {animal.id}</small>
              </td>

              <td style={styles.td}>
                {animal.sexo || 'Sin sexo'}
              </td>

              <td style={styles.td}>
                {animal.etapa_actual || 'Sin etapa'}
              </td>

              <td style={styles.td}>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '12px',
                    backgroundColor: yaTieneTratamiento ? '#dcfce7' : '#fee2e2',
                    color: yaTieneTratamiento ? '#166534' : '#991b1b',
                    border: yaTieneTratamiento
                      ? '1px solid #bbf7d0'
                      : '1px solid #fecaca',
                  }}
                >
                  {yaTieneTratamiento
                    ? 'Tratamiento registrado'
                    : 'Pendiente de tratamiento'}
                </span>
              </td>

              <td style={styles.td}>
                <button
                  style={styles.smallButton}
                  onClick={() => prepararTratamientoEnfermeria(animal)}
                >
                  Preparar tratamiento
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</div>
        </div>
      )}

      {tab === 'aplicar' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Registrar Evento Sanitario</h2>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <select
              style={styles.input}
              value={eventoForm.animal_id}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  animal_id: e.target.value,
                })
              }
            >
              <option value=''>Selecciona animal</option>
              {animales.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.identificador_unico} — {animal.etapa_actual}
                </option>
              ))}
            </select>

            <select
              style={styles.input}
              value={eventoForm.tipo}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  tipo: e.target.value,
                })
              }
            >
              <option value='vacuna'>Vacuna</option>
              <option value='tratamiento'>Tratamiento</option>
            </select>

            <select
              style={styles.input}
              value={eventoForm.medicamento_id}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  medicamento_id: e.target.value,
                })
              }
            >
              <option value=''>Selecciona medicamento</option>
              {medicamentos.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.nombre} (Stock: {med.stock})
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              placeholder='Dosis'
              value={eventoForm.dosis}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  dosis: e.target.value,
                })
              }
            />

            <input
              type='date'
              style={styles.input}
              value={eventoForm.fecha}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  fecha: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Observaciones'
              value={eventoForm.observaciones}
              onChange={(e) =>
                setEventoForm({
                  ...eventoForm,
                  observaciones: e.target.value,
                })
              }
            />

            <button
              style={styles.button}
              onClick={registrarEvento}
            >
              Registrar
            </button>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Historial Sanitario</h2>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Animal</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Medicamento</th>
                <th style={styles.th}>Dosis</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td style={styles.td}>
                    {evento.animal?.identificador_unico || 'LEGACY'}
                  </td>
                  <td style={styles.td}>{evento.tipo}</td>
                  <td style={styles.td}>
                    {evento.medicamento?.nombre}
                  </td>
                  <td style={styles.td}>{evento.dosis}</td>
                  <td style={styles.td}>
                    {new Date(evento.fecha).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    {evento.observaciones}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'alertas' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Alertas Sanitarias</h2>

          {alertas.length === 0 && (
            <p>No hay alertas sanitarias.</p>
          )}

          {alertas.map((alerta, index) => (
            <div key={index} style={styles.alertCard}>
              <strong>{alerta.animal}</strong> — {alerta.tipo}
              <br />
              Edad: {alerta.edad} días
            </div>
          ))}
        </div>
      )}
    </div>
  );
}