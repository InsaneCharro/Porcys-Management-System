import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

export default function Medicamentos() {
  const [tab, setTab] = useState('inventario');
  const [medicamentos, setMedicamentos] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [medicamentoForm, setMedicamentoForm] = useState({
    nombre: '',
    descripcion: '',
    stock: '',
    precio_unitario: '',
  });

  const [entradaForm, setEntradaForm] = useState({
    medicamento_id: '',
    cantidad: '',
    motivo: '',
  });

    const [mermaForm, setMermaForm] = useState({
    medicamento_id: '',
    cantidad: '',
    motivo: '',
  });

  const fechaHoy = new Date().toISOString().split('T')[0];

  const [aplicacionForm, setAplicacionForm] = useState({
    animal_id: '',
    medicamento_id: '',
    dosis: '',
    fecha: fechaHoy,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (tab === 'movimientos') {
      cargarDatos();
    }
  }, [tab]);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [medRes, movRes, alertRes, animalesRes] = await Promise.all([
        axios.get(`${API}/medicamentos`),
        axios.get(`${API}/medicamentos/movimientos`),
        axios.get(`${API}/medicamentos/alertas`),
        axios.get(`${API}/animales`),
        ]);

      setMedicamentos(medRes.data || []);
      setAnimales(
        (animalesRes.data || []).filter(
            (animal) => animal.estado === 'activo'
        )
        );
      setMovimientos(movRes.data || []);
      setAlertas(alertRes.data || []);
    } catch (error) {
      console.error(error);
      alert('Error cargando módulo de medicamentos');
    } finally {
      setLoading(false);
    }
  };

  const crearMedicamento = async () => {
    try {
      await axios.post(`${API}/medicamentos`, medicamentoForm);

      setMedicamentoForm({
        nombre: '',
        descripcion: '',
        stock: '',
        precio_unitario: '',
      });

      cargarDatos();
      alert('Medicamento registrado');
    } catch (error) {
      console.error(error);
      alert('Error creando medicamento');
    }
  };

  const registrarEntrada = async () => {
    if (!entradaForm.medicamento_id) {
      alert('Selecciona un medicamento');
      return;
    }

    try {
      await axios.post(
        `${API}/medicamentos/${entradaForm.medicamento_id}/entrada`,
        {
          cantidad: entradaForm.cantidad,
          motivo: entradaForm.motivo,
        }
      );

      setEntradaForm({
        medicamento_id: '',
        cantidad: '',
        motivo: '',
      });

      cargarDatos();
      alert('Entrada registrada');
    } catch (error) {
      console.error(error);
      alert('Error registrando entrada');
    }
  };

  const registrarMerma = async () => {
    if (!mermaForm.medicamento_id || !mermaForm.cantidad || !mermaForm.motivo.trim()) {
      alert('Selecciona medicamento, cantidad y motivo de merma');
      return;
    }

    const medicamento = medicamentos.find(
      (item) => String(item.id) === String(mermaForm.medicamento_id)
    );

    const confirmar = window.confirm(
      `Vas a registrar una merma de ${mermaForm.cantidad} unidad(es) para ${
        medicamento?.nombre || 'el medicamento seleccionado'
      }.\n\nMotivo: ${mermaForm.motivo}\n\nEsta acción descontará stock y quedará registrada como ajuste. ¿Continuar?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await axios.post(`${API}/medicamentos/${mermaForm.medicamento_id}/merma`, {
        cantidad: mermaForm.cantidad,
        motivo: mermaForm.motivo,
      });

      setMermaForm({
        medicamento_id: '',
        cantidad: '',
        motivo: '',
      });

      cargarDatos();
      alert('Merma de medicamento registrada');
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Error registrando merma de medicamento'
      );
    }
  };

  const aplicarMedicamento = async () => {
    try {
      await axios.post(`${API}/medicamentos/aplicar`, aplicacionForm);

      setAplicacionForm({
        animal_id: '',
        medicamento_id: '',
        dosis: '',
        fecha: fechaHoy,
      });

      cargarDatos();
      alert('Medicamento aplicado');
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        'Error aplicando medicamento'
      );
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return String(fecha);
    }

    return fechaObj.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const textoNivelStock = (nivel) => {
    switch (nivel) {
      case 'sin_stock':
        return 'Sin stock';
      case 'critico':
        return 'Crítico';
      case 'bajo':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  const estiloNivelStock = (nivel) => {
    if (nivel === 'sin_stock' || nivel === 'critico') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      };
    }

    if (nivel === 'bajo') {
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

  const alertasCriticas = alertas.filter(
    (alerta) => alerta.prioridad === 'critica' || alerta.nivel === 'sin_stock' || alerta.nivel === 'critico'
  );

  const alertasHierro = alertas.filter((alerta) => alerta.es_hierro);

  const medicamentosSinStock = medicamentos.filter(
    (medicamento) => Number(medicamento.stock || 0) <= 0
  );

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
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Medicamentos</h1>

      <div style={styles.tabs}>
          {['inventario', 'entradas', 'mermas', 'aplicaciones', 'movimientos', 'alertas'].map((t) => (
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

      {tab === 'inventario' && (
        <div style={styles.card}>
          <h2>Inventario de medicamentos</h2>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              style={styles.input}
              placeholder='Nombre'
              value={medicamentoForm.nombre}
              onChange={(e) =>
                setMedicamentoForm({
                  ...medicamentoForm,
                  nombre: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Descripción'
              value={medicamentoForm.descripcion}
              onChange={(e) =>
                setMedicamentoForm({
                  ...medicamentoForm,
                  descripcion: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Stock'
              value={medicamentoForm.stock}
              onChange={(e) =>
                setMedicamentoForm({
                  ...medicamentoForm,
                  stock: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Precio unitario'
              value={medicamentoForm.precio_unitario}
              onChange={(e) =>
                setMedicamentoForm({
                  ...medicamentoForm,
                  precio_unitario: e.target.value,
                })
              }
            />

            <button style={styles.button} onClick={crearMedicamento}>
              Registrar
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {medicamentos.map((m) => (
                <tr key={m.id}>
                  <td style={styles.td}>{m.nombre}</td>
                  <td style={styles.td}>{m.descripcion}</td>
                  <td style={styles.td}>{m.stock}</td>
                  <td style={styles.td}>${m.precio_unitario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'entradas' && (
        <div style={styles.card}>
          <h2>Entradas de stock</h2>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              style={styles.input}
              value={entradaForm.medicamento_id}
              onChange={(e) =>
                setEntradaForm({
                  ...entradaForm,
                  medicamento_id: e.target.value,
                })
              }
            >
              <option value=''>Selecciona medicamento</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              placeholder='Cantidad'
              value={entradaForm.cantidad}
              onChange={(e) =>
                setEntradaForm({
                  ...entradaForm,
                  cantidad: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Motivo'
              value={entradaForm.motivo}
              onChange={(e) =>
                setEntradaForm({
                  ...entradaForm,
                  motivo: e.target.value,
                })
              }
            />

            <button style={styles.button} onClick={registrarEntrada}>
              Registrar entrada
            </button>
          </div>
        </div>
      )}

      {tab === 'mermas' && (
        <div style={styles.card}>
          <h2>Registrar merma de medicamento</h2>

          <p style={{ color: '#64748b', marginTop: 0 }}>
            Registra pérdidas, caducidad, daño, derrame o ajuste operativo de medicamentos.
            La merma descuenta stock y queda registrada en movimientos como ajuste trazable.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              style={styles.input}
              value={mermaForm.medicamento_id}
              onChange={(e) =>
                setMermaForm({
                  ...mermaForm,
                  medicamento_id: e.target.value,
                })
              }
            >
              <option value=''>Selecciona medicamento</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} — stock: {m.stock}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type='number'
              min='1'
              placeholder='Cantidad perdida'
              value={mermaForm.cantidad}
              onChange={(e) =>
                setMermaForm({
                  ...mermaForm,
                  cantidad: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder='Motivo de merma'
              value={mermaForm.motivo}
              onChange={(e) =>
                setMermaForm({
                  ...mermaForm,
                  motivo: e.target.value,
                })
              }
            />

            <button
              style={{ ...styles.button, backgroundColor: '#9333ea' }}
              onClick={registrarMerma}
            >
              Registrar merma
            </button>
          </div>
        </div>
      )}

      {tab === 'aplicaciones' && (
        <div style={styles.card}>
          <h2>Aplicar medicamento</h2>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
                style={styles.input}
                value={aplicacionForm.animal_id}
                onChange={(e) =>
                    setAplicacionForm({
                    ...aplicacionForm,
                    animal_id: e.target.value,
                    })
                }
                >
                <option value=''>Selecciona animal</option>

                {animales.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                        {animal.identificador_unico} — {animal.estado} — {animal.etapa_actual || 'sin etapa'}
                    </option>
                ))}
                </select>

            <select
              style={styles.input}
              value={aplicacionForm.medicamento_id}
              onChange={(e) =>
                setAplicacionForm({
                  ...aplicacionForm,
                  medicamento_id: e.target.value,
                })
              }
            >
              <option value=''>Medicamento</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              placeholder='Dosis'
              value={aplicacionForm.dosis}
              onChange={(e) =>
                setAplicacionForm({
                  ...aplicacionForm,
                  dosis: e.target.value,
                })
              }
            />

            <input
              type='date'
              style={styles.input}
              value={aplicacionForm.fecha}
              onChange={(e) =>
                setAplicacionForm({
                  ...aplicacionForm,
                  fecha: e.target.value,
                })
              }
            />

            <button style={styles.button} onClick={aplicarMedicamento}>
              Aplicar
            </button>
          </div>
        </div>
      )}

      {tab === 'movimientos' && (
        <div style={styles.card}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2>Movimientos de medicamentos</h2>

              <p style={{ color: '#64748b', marginTop: 0 }}>
                Trazabilidad de entradas, salidas y ajustes registrados en el inventario de medicamentos.
              </p>
            </div>

            <button style={styles.button} onClick={cargarDatos}>
              Actualizar movimientos
            </button>
          </div>

          {movimientos.length === 0 ? (
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                marginTop: '18px',
              }}
            >
              No hay movimientos registrados.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Medicamento</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Cantidad</th>
                  <th style={styles.th}>Stock actual</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td style={styles.td}>
                      {formatearFecha(m.fecha_movimiento || m.created_at)}
                    </td>
                    <td style={styles.td}>
                      {m.medicamento?.nombre || 'Medicamento no encontrado'}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: '5px 9px',
                          borderRadius: '999px',
                          fontWeight: '700',
                          fontSize: '12px',
                          backgroundColor:
                            String(m.motivo || '').toLowerCase().includes('merma')
                              ? '#fee2e2'
                              : m.tipo === 'entrada'
                              ? '#dcfce7'
                              : m.tipo === 'salida'
                              ? '#fee2e2'
                              : '#e0f2fe',
                          color:
                            String(m.motivo || '').toLowerCase().includes('merma')
                              ? '#991b1b'
                              : m.tipo === 'entrada'
                              ? '#166534'
                              : m.tipo === 'salida'
                              ? '#991b1b'
                              : '#075985',
                        }}
                      >
                        {String(m.motivo || '').toLowerCase().includes('merma')
                          ? 'MERMA'
                          : String(m.tipo || 'sin tipo').toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>{m.cantidad}</td>
                    <td style={styles.td}>{m.medicamento?.stock ?? 'Sin dato'}</td>
                    <td style={styles.td}>{m.usuario || 'Sin usuario'}</td>
                    <td style={styles.td}>{m.motivo || 'Sin motivo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'alertas' && (
        <div style={styles.card}>
          <h2>Alertas de stock bajo</h2>

          <p style={{ color: '#64748b', marginTop: 0 }}>
            Control operativo para detectar medicamentos bajos, críticos o sin stock.
            El hierro se vigila con prioridad porque afecta el control obligatorio de lechones.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginTop: '18px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <strong>Total alertas</strong>
              <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '6px' }}>
                {alertas.length}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
              }}
            >
              <strong>Críticas</strong>
              <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '6px', color: '#991b1b' }}>
                {alertasCriticas.length}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
              }}
            >
              <strong>Alertas de hierro</strong>
              <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '6px', color: '#92400e' }}>
                {alertasHierro.length}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#e0f2fe',
                border: '1px solid #bae6fd',
              }}
            >
              <strong>Sin stock</strong>
              <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '6px', color: '#075985' }}>
                {medicamentosSinStock.length}
              </div>
            </div>
          </div>

          {alertas.length === 0 ? (
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontWeight: '700',
              }}
            >
              No hay medicamentos con stock bajo. El inventario sanitario está dentro de umbrales aceptables.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Medicamento</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Nivel</th>
                  <th style={styles.th}>Prioridad</th>
                  <th style={styles.th}>Mensaje</th>
                  <th style={styles.th}>Acción sugerida</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((a) => (
                  <tr key={a.id}>
                    <td style={styles.td}>
                      <strong>{a.nombre}</strong>
                      {a.es_hierro ? (
                        <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                          Insumo crítico para hierro obligatorio
                        </div>
                      ) : null}
                    </td>
                    <td style={styles.td}>{a.stock}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...estiloNivelStock(a.nivel),
                          padding: '5px 9px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '800',
                        }}
                      >
                        {textoNivelStock(a.nivel)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {a.prioridad ? String(a.prioridad).toUpperCase() : 'SIN PRIORIDAD'}
                    </td>
                    <td style={styles.td}>{a.mensaje || 'Sin mensaje'}</td>
                    <td style={styles.td}>{a.accion_sugerida || 'Revisar inventario'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}