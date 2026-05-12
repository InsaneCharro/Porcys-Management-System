import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

export default function EventosSanitarios() {
  const [tab, setTab] = useState('aplicar');
  const [animales, setAnimales] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [eventoForm, setEventoForm] = useState({
    animal_id: '',
    tipo: 'vacuna',
    medicamento_id: '',
    dosis: '',
    fecha: '',
    observaciones: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [animalesRes, medicamentosRes, eventosRes, alertasRes] =
        await Promise.all([
          axios.get(`${API}/animales`),
          axios.get(`${API}/medicamentos`),
          axios.get(`${API}/sanidad`),
          axios.get(`${API}/sanidad/alertas`),
        ]);

      setAnimales(
        (animalesRes.data || []).filter(
          (animal) => animal.estado === 'activo'
        )
      );

      setMedicamentos(medicamentosRes.data || []);
      setEventos(eventosRes.data || []);
      setAlertas(alertasRes.data || []);
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
        fecha: '',
        observaciones: '',
      });

      cargarDatos();
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

  const aplicarRapido = (tipoEvento, nombreMedicamento, dosisDefault) => {
    const medicamentoEncontrado = medicamentos.find(
      (m) => m.nombre.toLowerCase() === nombreMedicamento.toLowerCase()
    );

    if (!medicamentoEncontrado) {
      alert(`Medicamento "${nombreMedicamento}" no encontrado`);
      return;
    }

    setTab('aplicar');

    setEventoForm({
      ...eventoForm,
      tipo: tipoEvento,
      medicamento_id: medicamentoEncontrado.id,
      dosis: dosisDefault,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: `Aplicación rápida: ${nombreMedicamento}`,
    });
  };

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
    quickButton: {
      padding: '12px 18px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#0ea5e9',
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
        {['protocolos', 'aplicar', 'historial', 'alertas'].map((t) => (
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

      {tab === 'protocolos' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Protocolos rápidos</h2>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              style={styles.quickButton}
              onClick={() =>
                aplicarRapido('tratamiento', 'Hierro dextrán', '1')
              }
            >
              Hierro Dextran
            </button>

            <button
              style={styles.quickButton}
              onClick={() =>
                aplicarRapido('vacuna', 'Hierro', '1')
              }
            >
              Vacuna básica
            </button>

            <button
              style={styles.quickButton}
              onClick={() =>
                aplicarRapido('tratamiento', 'Hierro dextrán', '2')
              }
            >
              Tratamiento general
            </button>
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