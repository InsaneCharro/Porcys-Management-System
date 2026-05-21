import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api';

export default function Alimentacion() {
  const [tab, setTab] = useState('dietas');
  const [loading, setLoading] = useState(false);

  const [dietas, setDietas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const [dietaForm, setDietaForm] = useState({
    nombre: '',
    etapa_objetivo: '',
    descripcion: '',
    costo_estimado: '',
    activa: true,
  });

  const [editingDietaId, setEditingDietaId] = useState(null);

  const [ingredienteForm, setIngredienteForm] = useState({
    dieta_id: '',
    inventario_id: '',
    porcentaje: '',
    costo_unitario: '',
  });

  const [consumoForm, setConsumoForm] = useState({
    corral_id: '',
    dieta_id: '',
    cantidad_kg: '',
    fecha: '',
    observaciones: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [dietasRes, inventarioRes, corralesRes, consumosRes, alertasRes] = await Promise.all([
        axios.get(`${API}/alimentacion/dietas`),
        axios.get(`${API}/inventario`),
        axios.get(`${API}/corrales`),
        axios.get(`${API}/alimentacion/consumos`),
        axios.get(`${API}/alimentacion/alertas`),
      ]);

      setDietas(dietasRes.data || []);
      setInventario(inventarioRes.data || []);
      setCorrales(corralesRes.data || []);
      setConsumos(consumosRes.data || []);
      setAlertas(alertasRes.data || []);
    } catch (error) {
      console.error(error);
      alert('Error cargando módulo de alimentación');
    } finally {
      setLoading(false);
    }
  };

  const limpiarDietaForm = () => {
    setDietaForm({
      nombre: '',
      etapa_objetivo: '',
      descripcion: '',
      costo_estimado: '',
      activa: true,
    });
    setEditingDietaId(null);
  };

  const guardarDieta = async () => {
    if (!dietaForm.nombre.trim()) {
      alert('Escribe el nombre de la dieta');
      return;
    }

    try {
      const payload = {
        ...dietaForm,
        costo_estimado: dietaForm.costo_estimado || 0,
      };

      if (editingDietaId) {
        await axios.put(`${API}/alimentacion/dietas/${editingDietaId}`, payload);
        alert('Dieta actualizada');
      } else {
        await axios.post(`${API}/alimentacion/dietas`, payload);
        alert('Dieta registrada');
      }

      limpiarDietaForm();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error guardando dieta');
    }
  };

  const editarDieta = (dieta) => {
    setEditingDietaId(dieta.id);
    setDietaForm({
      nombre: dieta.nombre || '',
      etapa_objetivo: dieta.etapa_objetivo || '',
      descripcion: dieta.descripcion || '',
      costo_estimado: dieta.costo_estimado || '',
      activa: !!dieta.activa,
    });
    setTab('dietas');
  };

  const eliminarDieta = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta dieta?')) return;

    try {
      await axios.delete(`${API}/alimentacion/dietas/${id}`);
      cargarDatos();
      alert('Dieta eliminada');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error eliminando dieta');
    }
  };

  const guardarIngrediente = async () => {
    if (!ingredienteForm.dieta_id || !ingredienteForm.inventario_id || !ingredienteForm.porcentaje) {
      alert('Selecciona dieta, ingrediente y porcentaje');
      return;
    }

    try {
      await axios.post(`${API}/alimentacion/dietas/${ingredienteForm.dieta_id}/ingredientes`, {
        inventario_id: ingredienteForm.inventario_id,
        porcentaje: ingredienteForm.porcentaje,
        costo_unitario: ingredienteForm.costo_unitario || 0,
      });

      setIngredienteForm({
        ...ingredienteForm,
        inventario_id: '',
        porcentaje: '',
        costo_unitario: '',
      });

      cargarDatos();
      alert('Ingrediente agregado');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error agregando ingrediente');
    }
  };

  const eliminarIngrediente = async (id) => {
    if (!window.confirm('¿Eliminar este ingrediente de la formulación?')) return;

    try {
      await axios.delete(`${API}/alimentacion/ingredientes/${id}`);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error eliminando ingrediente');
    }
  };

  const registrarConsumo = async () => {
    if (!consumoForm.corral_id || !consumoForm.dieta_id || !consumoForm.cantidad_kg || !consumoForm.fecha) {
    alert('Selecciona corral, dieta, cantidad consumida y fecha');
    return;
  }
  
  

    try {
      const response = await axios.post(`${API}/alimentacion/consumos`, consumoForm);

      setConsumoForm({
        corral_id: '',
        dieta_id: '',
        cantidad_kg: '',
        fecha: '',
        observaciones: '',
      });

      cargarDatos();
      alert(response.data?.message || 'Consumo registrado');
    } catch (error) {
      console.error(error);

      if (error.response?.data?.faltantes) {
        const detalle = error.response.data.faltantes
          .map((f) => `${f.producto}: requiere ${f.cantidad_requerida} kg, disponible ${f.stock_actual} kg`)
          .join('\n');

        alert(`Stock insuficiente:\n\n${detalle}`);
        return;
      }

      alert(error.response?.data?.message || 'Error registrando consumo');
    }
  };

  const dietaSeleccionada = useMemo(() => {
    return dietas.find((d) => String(d.id) === String(ingredienteForm.dieta_id));
  }, [dietas, ingredienteForm.dieta_id]);

  const dietaConsumoSeleccionada = useMemo(() => {
    return dietas.find((d) => String(d.id) === String(consumoForm.dieta_id));
  }, [dietas, consumoForm.dieta_id]);

  const porcentajeDietaSeleccionada = useMemo(() => {
    return (dietaSeleccionada?.ingredientes || []).reduce(
      (total, item) => total + Number(item.porcentaje || 0),
      0
    );
  }, [dietaSeleccionada]);

  const dietaEjecutable = Math.abs(porcentajeDietaSeleccionada - 100) < 0.01;

  const calcularDetallePrevio = () => {
    if (!dietaConsumoSeleccionada || !consumoForm.cantidad_kg) return [];

    const cantidad = Number(consumoForm.cantidad_kg);

    return (dietaConsumoSeleccionada.ingredientes || []).map((ingrediente) => ({
      nombre: ingrediente.inventario?.nombre_producto || 'Sin nombre',
      porcentaje: ingrediente.porcentaje,
      cantidad: ((cantidad * Number(ingrediente.porcentaje || 0)) / 100).toFixed(2),
    }));
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
    subtitle: {
      color: '#475569',
      marginTop: '-8px',
      marginBottom: '22px',
      fontSize: '15px',
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
    formRow: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: '16px',
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
      boxSizing: 'border-box',
    },
    textarea: {
      padding: '10px 14px',
      minHeight: '44px',
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      minWidth: '260px',
      fontSize: '15px',
      boxSizing: 'border-box',
    },
    button: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#2563eb',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '600',
      minHeight: '44px',
    },
    secondaryButton: {
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#e2e8f0',
      color: '#0f172a',
      cursor: 'pointer',
      fontWeight: '600',
      minHeight: '44px',
    },
    dangerButton: {
      padding: '8px 12px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#dc2626',
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
      verticalAlign: 'top',
    },
    badge: (type) => ({
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: '999px',
      backgroundColor: type === 'ok' ? '#dcfce7' : '#fee2e2',
      color: type === 'ok' ? '#166534' : '#991b1b',
      fontWeight: '700',
      fontSize: '13px',
    }),
    warningBox: {
      padding: '14px',
      borderRadius: '12px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      marginBottom: '16px',
      fontWeight: '600',
    },
  };

  const tabs = [
    { key: 'dietas', label: 'DIETAS' },
    { key: 'formulacion', label: 'FORMULACIÓN' },
    { key: 'consumo', label: 'CONSUMO' },
    { key: 'historial', label: 'HISTORIAL' },
    { key: 'alertas', label: 'ALERTAS' },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Alimentación</h1>
      <p style={styles.subtitle}>
        Gestión zootécnica de dietas, formulación y consumo por corral integrado con Inventario.
      </p>

      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            style={styles.tabButton(tab === t.key)}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p>Cargando...</p>}

      {tab === 'dietas' && (
        <div style={styles.card}>
          <h2>{editingDietaId ? 'Editar dieta' : 'Registrar dieta'}</h2>

          <div style={styles.formRow}>
            <input
              style={styles.input}
              placeholder="Nombre de dieta"
              value={dietaForm.nombre}
              onChange={(e) => setDietaForm({ ...dietaForm, nombre: e.target.value })}
            />

            <select
              style={styles.input}
              value={dietaForm.etapa_objetivo}
              onChange={(e) => setDietaForm({ ...dietaForm, etapa_objetivo: e.target.value })}
            >
              <option value="">Etapa objetivo</option>
              <option value="lechon">Lechón iniciador</option>
              <option value="crecimiento">Crecimiento</option>
              <option value="engorda">Engorda</option>
              <option value="gestacion">Gestación</option>
              <option value="lactancia">Lactancia</option>
              <option value="reproductor">Reproductor</option>
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Costo estimado por kg"
              value={dietaForm.costo_estimado}
              onChange={(e) => setDietaForm({ ...dietaForm, costo_estimado: e.target.value })}
            />

            <select
              style={styles.input}
              value={dietaForm.activa ? '1' : '0'}
              onChange={(e) => setDietaForm({ ...dietaForm, activa: e.target.value === '1' })}
            >
              <option value="1">Activa</option>
              <option value="0">Inactiva</option>
            </select>

            <textarea
              style={styles.textarea}
              placeholder="Descripción"
              value={dietaForm.descripcion}
              onChange={(e) => setDietaForm({ ...dietaForm, descripcion: e.target.value })}
            />

            <button style={styles.button} onClick={guardarDieta}>
              {editingDietaId ? 'Actualizar' : 'Registrar'}
            </button>

            {editingDietaId && (
              <button style={styles.secondaryButton} onClick={limpiarDietaForm}>
                Cancelar edición
              </button>
            )}
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Dieta</th>
                <th style={styles.th}>Etapa</th>
                <th style={styles.th}>Costo estimado</th>
                <th style={styles.th}>Formulación</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dietas.map((dieta) => {
                const porcentaje = (dieta.ingredientes || []).reduce(
                  (total, item) => total + Number(item.porcentaje || 0),
                  0
                );

                return (
                  <tr key={dieta.id}>
                    <td style={styles.td}>
                      <strong>{dieta.nombre}</strong>
                      <br />
                      <small>{dieta.descripcion || 'Sin descripción'}</small>
                    </td>
                    <td style={styles.td}>{dieta.etapa_objetivo || 'Sin etapa'}</td>
                    <td style={styles.td}>${Number(dieta.costo_estimado || 0).toFixed(2)}</td>
                    <td style={styles.td}>
                      {porcentaje.toFixed(2)}%
                      <br />
                      <span style={styles.badge(Math.abs(porcentaje - 100) <= 0.01 ? 'ok' : 'bad')}>
                        {Math.abs(porcentaje - 100) <= 0.01 ? 'Ejecutable' : 'Incompleta'}
                      </span>
                    </td>
                    <td style={styles.td}>{dieta.activa ? 'Activa' : 'Inactiva'}</td>
                    <td style={styles.td}>
                      <button style={styles.secondaryButton} onClick={() => editarDieta(dieta)}>
                        Editar
                      </button>{' '}
                      <button style={styles.dangerButton} onClick={() => eliminarDieta(dieta.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {dietas.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="6">
                    No hay dietas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'formulacion' && (
        <div style={styles.card}>
          <h2>Formulación de dietas</h2>

          <div style={styles.formRow}>
            <select
              style={styles.input}
              value={ingredienteForm.dieta_id}
              onChange={(e) => setIngredienteForm({ ...ingredienteForm, dieta_id: e.target.value })}
            >
              <option value="">Selecciona dieta</option>
              {dietas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>

            <select
              style={styles.input}
              value={ingredienteForm.inventario_id}
              onChange={(e) => setIngredienteForm({ ...ingredienteForm, inventario_id: e.target.value })}
            >
              <option value="">Ingrediente de inventario</option>
              {inventario.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre_producto} - {item.stock_kg} kg
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Porcentaje"
              value={ingredienteForm.porcentaje}
              onChange={(e) => setIngredienteForm({ ...ingredienteForm, porcentaje: e.target.value })}
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Costo unitario opcional"
              value={ingredienteForm.costo_unitario}
              onChange={(e) => setIngredienteForm({ ...ingredienteForm, costo_unitario: e.target.value })}
            />

            <button style={styles.button} onClick={guardarIngrediente}>
              Agregar ingrediente
            </button>
          </div>
          

          {dietaSeleccionada && (
            <>
            
              <div
                style={{
                  background: dietaEjecutable ? "#dcfce7" : "#fef3c7",
                  color: dietaEjecutable ? "#166534" : "#92400e",
                  padding: "16px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Total formulado: {porcentajeDietaSeleccionada.toFixed(2)}%.{" "}
                {dietaEjecutable
                  ? "Dieta ejecutable."
                  : "La dieta solo será ejecutable cuando sume 100%."}
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Ingrediente</th>
                    <th style={styles.th}>Porcentaje</th>
                    <th style={styles.th}>Cantidad por kg</th>
                    <th style={styles.th}>Stock actual</th>
                    <th style={styles.th}>Costo unitario</th>
                    <th style={styles.th}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(dietaSeleccionada.ingredientes || []).map((ing) => (
                    <tr key={ing.id}>
                      <td style={styles.td}>{ing.inventario?.nombre_producto || 'Sin nombre'}</td>
                      <td style={styles.td}>{Number(ing.porcentaje || 0).toFixed(2)}%</td>
                      <td style={styles.td}>{Number(ing.cantidad_por_kg || 0).toFixed(4)} kg</td>
                      <td style={styles.td}>{ing.inventario?.stock_kg ?? 0} kg</td>
                      <td style={styles.td}>${Number(ing.costo_unitario || 0).toFixed(2)}</td>
                      <td style={styles.td}>
                        <button style={styles.dangerButton} onClick={() => eliminarIngrediente(ing.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'consumo' && (
        <div style={styles.card}>
          <h2>Registrar consumo por corral</h2>

          <div style={styles.formRow}>
            <select
              style={styles.input}
              value={consumoForm.corral_id}
              onChange={(e) => setConsumoForm({ ...consumoForm, corral_id: e.target.value })}
            >
              <option value="">Selecciona corral</option>
              {corrales.map((corral) => (
                <option key={corral.id} value={corral.id}>
                  {corral.nombre} - capacidad {corral.capacidad}
                </option>
              ))}
            </select>

            <select
              style={styles.input}
              value={consumoForm.dieta_id}
              onChange={(e) => setConsumoForm({ ...consumoForm, dieta_id: e.target.value })}
            >
              <option value="">Selecciona dieta</option>
              {dietas
                .filter((d) => d.activa)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Cantidad consumida kg"
              value={consumoForm.cantidad_kg}
              onChange={(e) => setConsumoForm({ ...consumoForm, cantidad_kg: e.target.value })}
            />

            <input
              style={styles.input}
              type="date"
              required
              value={consumoForm.fecha}
              onChange={(e) => setConsumoForm({ ...consumoForm, fecha: e.target.value })}
            />

            <textarea
              style={styles.textarea}
              placeholder="Observaciones"
              value={consumoForm.observaciones}
              onChange={(e) => setConsumoForm({ ...consumoForm, observaciones: e.target.value })}
            />

            <button style={styles.button} onClick={registrarConsumo}>
              Registrar consumo
            </button>
          </div>

          {dietaConsumoSeleccionada && consumoForm.cantidad_kg && (
            <div style={styles.warningBox}>
              <strong>Vista previa de descuento:</strong>
              <ul>
                {calcularDetallePrevio().map((item) => (
                  <li key={item.nombre}>
                    {item.nombre}: {item.cantidad} kg ({item.porcentaje}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div style={styles.card}>
          <h2>Historial de alimentación</h2>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Corral</th>
                <th style={styles.th}>Dieta</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Costo</th>
                <th style={styles.th}>Ingredientes descontados</th>
              </tr>
            </thead>
            <tbody>
              {consumos.map((consumo) => (
                <tr key={consumo.id}>
                  <td style={styles.td}>{String(consumo.fecha || '').substring(0, 10)}</td>
                  <td style={styles.td}>{consumo.corral?.nombre || `Corral #${consumo.corral_id}`}</td>
                  <td style={styles.td}>{consumo.dieta?.nombre || 'Sin dieta'}</td>
                  <td style={styles.td}>{Number(consumo.cantidad_kg || 0).toFixed(2)} kg</td>
                  <td style={styles.td}>${Number(consumo.costo_total || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    {(consumo.detalles || []).map((detalle) => (
                      <div key={detalle.id}>
                        {detalle.inventario?.nombre_producto || 'Ingrediente'}: {Number(detalle.cantidad_descontada || 0).toFixed(2)} kg
                      </div>
                    ))}
                  </td>
                </tr>
              ))}

              {consumos.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="6">
                    No hay consumos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'alertas' && (
        <div style={styles.card}>
          <h2>Alertas de alimentación</h2>

          {alertas.length === 0 && <p>No hay alertas activas.</p>}

          {alertas.map((alerta, index) => (
            <div
              key={`${alerta.tipo}-${index}`}
              style={{
                ...styles.warningBox,
                backgroundColor: alerta.severidad === 'alta' ? '#fee2e2' : '#fef3c7',
                color: alerta.severidad === 'alta' ? '#991b1b' : '#92400e',
              }}
            >
              <strong>{alerta.severidad?.toUpperCase() || 'ALERTA'}:</strong> {alerta.mensaje}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
